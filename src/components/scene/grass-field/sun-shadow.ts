// 📖 Docs: obsidian/frontend/components/scene.md

/**
 * Baked sun-visibility map for the terrain.
 *
 * With the sun low, the crest the television stands on throws a long shadow
 * back over everything in front of it — which is exactly the look the brief
 * asks for, and which no amount of per-blade shading can fake: shading depends
 * only on which way a surface points, and a slope in shadow points the same way
 * as a slope in sunlight.
 *
 * Marched on a grid rather than per blade. Per-blade would be ~420,000 marches
 * against a three-octave height field, several seconds of it; the terrain is
 * smooth at this scale, so a grid the shaders sample bilinearly is
 * indistinguishable and costs a fraction.
 *
 * **Marched off the main thread.** A fraction is still ~9 M noise samples
 * (320² texels × 29 steps × 3 octaves): 1.5 s in one task on a phone at 4× CPU,
 * which was the load's longest task and most of its blocking time. The march
 * runs in a Worker (`sun-shadow.worker.ts`) while the television and textures
 * download; the texture is created in full sun and filled in when the bytes
 * arrive, and the scene counts the map as one of its pending assets — so the
 * preloader does not lift before the shadows are in. Where a Worker cannot
 * start, the same march runs on the main thread a task later, as before.
 */

import * as THREE from "three";

import {
  computeSunShadow,
  type SunShadowOptions,
  type SunVector,
} from "./sun-shadow-compute";
import { createHeightSampler, type TerrainOctave } from "./terrain";

export type { SunShadowOptions } from "./sun-shadow-compute";

/** What the worker needs to rebuild the terrain and march it. */
export interface SunShadowJob {
  seed: number;
  octaves: readonly TerrainOctave[];
  sun: SunVector;
  options: SunShadowOptions;
}

export interface SunShadowMap {
  texture: THREE.DataTexture;
  /** Bottom-left corner of the covered square. */
  origin: THREE.Vector2;
  size: number;
  dispose: () => void;
}

export const createSunShadowMap = (
  terrain: { seed: number; octaves: readonly TerrainOctave[] },
  sunDirection: THREE.Vector3,
  options: SunShadowOptions,
  /** Called once, when the map holds the marched shadows. */
  onSettled: () => void,
): SunShadowMap => {
  const { centerX, centerZ, size, resolution } = options;
  const data = new Uint8Array(resolution * resolution).fill(255);

  const texture = new THREE.DataTexture(
    data,
    resolution,
    resolution,
    THREE.RedFormat,
    THREE.UnsignedByteType,
  );
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  // Outside the baked square there is nothing to cast a shadow worth having, so
  // the edge texel repeats rather than wrapping a shadow round to the far side.
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;

  let disposed = false;
  let worker: Worker | null = null;
  let fallback: ReturnType<typeof setTimeout> | undefined;
  const fill = (marched: Uint8Array) => {
    if (disposed) return;
    data.set(marched);
    texture.needsUpdate = true;
    onSettled();
  };
  const job: SunShadowJob = {
    seed: terrain.seed,
    octaves: terrain.octaves,
    sun: { x: sunDirection.x, y: sunDirection.y, z: sunDirection.z },
    options,
  };
  const marchHere = () => {
    worker?.terminate();
    worker = null;
    fallback = setTimeout(() => {
      fill(
        computeSunShadow(
          createHeightSampler(job.seed, job.octaves),
          job.sun,
          job.options,
        ),
      );
    }, 0);
  };

  try {
    worker = new Worker(new URL("./sun-shadow.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (event: MessageEvent<Uint8Array>) => {
      worker?.terminate();
      worker = null;
      fill(event.data);
    };
    worker.onerror = marchHere;
    worker.postMessage(job);
  } catch {
    marchHere();
  }

  return {
    texture,
    origin: new THREE.Vector2(centerX - size / 2, centerZ - size / 2),
    size,
    dispose: () => {
      disposed = true;
      worker?.terminate();
      clearTimeout(fallback);
      texture.dispose();
    },
  };
};

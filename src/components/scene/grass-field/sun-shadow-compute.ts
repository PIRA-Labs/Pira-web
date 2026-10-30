// 📖 Docs: obsidian/frontend/components/scene.md

/**
 * The sun-visibility march itself — plain arithmetic, no three.js — so it can
 * run in a Worker (`sun-shadow.worker.ts`) as well as on the main thread.
 * See `sun-shadow.ts` for what the map is and why it is marched on a grid.
 */

import type { HeightSampler } from "./terrain";

export interface SunShadowOptions {
  /** World-space centre of the covered square. */
  centerX: number;
  centerZ: number;
  /** Side length of the covered square, in world units. */
  size: number;
  /** Texels per side. */
  resolution: number;
  /** How far to march toward the sun, in world units. */
  reach: number;
  /** Marching steps. More is smoother along the shadow's length, not its edge. */
  steps: number;
  /**
   * Softness of the terminator, in world units of height. The march records how
   * close it came to being blocked rather than a hard yes/no, so the edge has a
   * penumbra instead of a staircase.
   */
  softness: number;
}

/** A direction toward the sun; it need not be normalised. */
export interface SunVector {
  x: number;
  y: number;
  z: number;
}

/** One byte per texel: 255 in full sun, 0 in full shadow. */
export const computeSunShadow = (
  getYPosition: HeightSampler,
  sunDirection: SunVector,
  options: SunShadowOptions,
): Uint8Array => {
  const { centerX, centerZ, size, resolution, reach, steps, softness } =
    options;

  const originX = centerX - size / 2;
  const originZ = centerZ - size / 2;
  const step = size / (resolution - 1);

  // Horizontal march direction, and how fast the ray to the sun climbs per
  // world unit travelled along it.
  const horizontal = Math.hypot(sunDirection.x, sunDirection.z);
  const dirX = horizontal > 1e-6 ? sunDirection.x / horizontal : 1;
  const dirZ = horizontal > 1e-6 ? sunDirection.z / horizontal : 0;
  const climb = horizontal > 1e-6 ? sunDirection.y / horizontal : 1e6;

  const data = new Uint8Array(resolution * resolution);
  const marchStep = reach / steps;

  for (let row = 0; row < resolution; row++) {
    const z = originZ + row * step;
    for (let column = 0; column < resolution; column++) {
      const x = originX + column * step;
      const height = getYPosition(x, z);

      // Deepest intrusion of the terrain above the ray, over the whole march.
      let blocked = 0;
      for (let s = 1; s <= steps; s++) {
        const travelled = s * marchStep;
        const rayHeight = height + travelled * climb;
        const terrain = getYPosition(
          x + dirX * travelled,
          z + dirZ * travelled,
        );
        const intrusion = terrain - rayHeight;
        if (intrusion > blocked) blocked = intrusion;
      }

      const shadow = Math.min(Math.max(blocked / softness, 0), 1);
      data[row * resolution + column] = Math.round((1 - shadow) * 255);
    }
  }

  return data;
};

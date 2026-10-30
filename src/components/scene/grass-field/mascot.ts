// 📖 Docs: obsidian/frontend/components/scene.md

/**
 * The floating Pirophone mascot.
 *
 * A glTF model (`public/pirophone.glb`) that loads asynchronously and
 * drops into a group placed up front — the scene does not wait for it, because
 * the group's position is what the camera frames and what the crest search
 * decided, neither of which depends on the geometry arriving.
 *
 * It is also a light source. Its screen lights the grass beneath it, and that is
 * done by handing the field's shaders a position, a facing and a colour (see
 * `MascotHandle.light`) — not by adding a `THREE.Light`, which nothing in this scene
 * reads (ADR-0030).
 */

import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { GRASS_FIELD_CONFIG as CONFIG } from "./grass-field.config";

/** What the field's shaders need to know about the screen each frame. */
export interface MascotLightState {
  position: THREE.Vector3;
  /** Unit vector the screen faces. */
  direction: THREE.Vector3;
  /** Flicker multiplier on the screen's output, around 1. */
  flicker: number;
}

export interface MascotHandle {
  object: THREE.Object3D;
  light: MascotLightState;
  /** Exposed so the control panel can retune the screen live. */
  screenUniforms: {
    uCore: THREE.IUniform<THREE.Color>;
    uEdge: THREE.IUniform<THREE.Color>;
    uIntensity: THREE.IUniform<number>;
    uEdgeStart: THREE.IUniform<number>;
    uCentreLift: THREE.IUniform<number>;
  };
  /**
   * Advance the float, the flicker and the turn.
   *
   * `pointer` is the cursor in normalised device coordinates — x and y both in
   * [-1, 1], y up — or `null` when it has left, which returns the set to rest.
   */
  update: (
    elapsed: number,
    pointer: { x: number; y: number } | null,
    cameraPosition: THREE.Vector3,
  ) => void;
  dispose: () => void;
}

export interface FloatingMascotOptions {
  /** Shared loading manager, so the model's requests count toward scene progress. */
  manager?: THREE.LoadingManager;
  /** Called once the model has landed, or failed to — either way it is settled. */
  onSettled?: () => void;
  /**
   * Largest texture edge to upload. Offline variants contain three maps at
   * 1024² / 512². This cap remains as a guard for future replacement models.
   */
  maxTextureSize?: number;
}

export const createFloatingMascot = (
  restPosition: THREE.Vector3,
  { manager, onSettled, maxTextureSize = Infinity }: FloatingMascotOptions = {},
): MascotHandle => {
  const { tv } = CONFIG;

  let disposed = false;
  const group = new THREE.Group();
  group.position.copy(restPosition);

  /* ------------------------------------------------------------ the screen */

  const screenUniforms = {
    uCore: { value: new THREE.Color(tv.screen.coreColor) },
    uEdge: { value: new THREE.Color(tv.screen.edgeColor) },
    uIntensity: { value: tv.screen.intensity } as THREE.IUniform<number>,
    uEdgeStart: { value: tv.screen.edgeStart } as THREE.IUniform<number>,
    uCentreLift: { value: tv.screen.centreLift } as THREE.IUniform<number>,
  };

  /* -------------------------------------------------------------- the model */

  // Screen centre and facing in the group's own space. Defaults are replaced by
  // measurements once the model lands; until then the light sits at the group
  // origin, which is within a metre of where it ends up.
  const screenLocal = new THREE.Vector3(0, 0, 0);
  const facingLocal = new THREE.Vector3(0, 0, 1);

  // The model's meshes are Draco-compressed, so the loader needs a decoder. It
  // is vendored into `public/draco/` from the `three` package rather than
  // fetched from a CDN — same reasoning as the blade textures: a decoder that
  // fails to load means no Pirophone mascot at all, and nothing here should depend on
  // a third-party host being up.
  const dracoLoader = new DRACOLoader(manager);
  dracoLoader.setDecoderPath(tv.dracoDecoderPath);
  const loader = new GLTFLoader(manager);
  loader.setDRACOLoader(dracoLoader);

  /** Redraw any map larger than `maxTextureSize` into a smaller canvas. */
  const capTextureSizes = (root: THREE.Object3D): void => {
    if (!Number.isFinite(maxTextureSize)) return;
    const seen = new Set<THREE.Texture>();
    root.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        for (const value of Object.values(material)) {
          if (!(value instanceof THREE.Texture) || seen.has(value)) continue;
          seen.add(value);
          const image = value.image as { width?: number; height?: number } | undefined;
          const width = image?.width ?? 0;
          const height = image?.height ?? 0;
          if (Math.max(width, height) <= maxTextureSize) continue;
          const scale = maxTextureSize / Math.max(width, height);
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(width * scale));
          canvas.height = Math.max(1, Math.round(height * scale));
          const context = canvas.getContext("2d");
          if (!context) continue;
          context.drawImage(value.image as CanvasImageSource, 0, 0, canvas.width, canvas.height);
          const previous = value.image as { close?: () => void };
          value.image = canvas;
          value.needsUpdate = true;
          previous.close?.();
        }
      }
    });
  };

  /** Also used when a navigation finishes before the asynchronous load. */
  const disposeModel = (root: THREE.Object3D): void => {
    const textures = new Set<THREE.Texture>();
    root.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.geometry.dispose();
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        for (const value of Object.values(material)) {
          if (value instanceof THREE.Texture) textures.add(value);
        }
        material.dispose();
      }
    });
    for (const texture of textures) texture.dispose();
  };

  const handleModel = (gltf: { scene: THREE.Group }): void => {
    const model = gltf.scene;
    capTextureSizes(model);
    model.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        if (!(material instanceof THREE.MeshStandardMaterial)) continue;
        material.emissive.set(tv.materialFill.color);
        material.emissiveMap = material.map;
        material.emissiveIntensity = tv.materialFill.intensity;
      }
    });

    // Pirophone is Y-up; the configurable yaw aligns its face with local +Z.
    model.rotation.y = THREE.MathUtils.degToRad(tv.modelYawDegrees);
    model.updateMatrixWorld(true);

    // Normalise: scale so the cabinet is `tv.width` across, then sit the model's
    // centre on the group origin, so the float and the turn pivot through it.
    const bounds = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    bounds.getSize(size);
    bounds.getCenter(center);
    const scale = size.x > 0 ? tv.width / size.x : 1;
    model.scale.setScalar(scale);
    model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
    group.add(model);
    group.updateMatrixWorld(true);

    // Pirophone has one textured material: retain its illustrated face instead
    // of replacing the entire mesh with the former screen shader.

  };

  // A failed load still settles: the scene renders without its Pirophone mascot
  // rather than holding the page behind a preloader forever.
  loader.load(
    maxTextureSize <= 512 ? tv.modelUrlSmall : tv.modelUrl,
    (gltf) => {
      if (disposed) {
        disposeModel(gltf.scene);
        return;
      }
      handleModel(gltf);
      onSettled?.();
    },
    undefined,
    () => onSettled?.(),
  );

  /* ------------------------------------------------------------- animation */

  const restTilt = THREE.MathUtils.degToRad(tv.tiltDegrees);
  const restYaw = THREE.MathUtils.degToRad(tv.yawDegrees);
  const sway = THREE.MathUtils.degToRad(tv.swayDegrees);

  // YXZ: yaw about world up first, then pitch about the set's own side axis,
  // then roll. With the default XYZ the pitch is applied before the yaw, so a
  // turned set tips sideways instead of tipping back.
  group.rotation.order = "YXZ";
  group.rotation.set(restTilt, restYaw, 0);

  let currentYaw = restYaw;
  let currentPitch = restTilt;
  let currentRoll = 0;

  /** Shortest signed representation of an angle, in (-π, π]. */
  const wrapAngle = (angle: number): number => {
    let wrapped = angle % (Math.PI * 2);
    if (wrapped > Math.PI) wrapped -= Math.PI * 2;
    if (wrapped < -Math.PI) wrapped += Math.PI * 2;
    return wrapped;
  };

  const approachAngle = (from: number, to: number, rate: number): number =>
    from + wrapAngle(to - from) * rate;

  const light: MascotLightState = {
    position: new THREE.Vector3(),
    direction: new THREE.Vector3(),
    flicker: 1,
  };

  const update = (
    elapsed: number,
    pointer: { x: number; y: number } | null,
    cameraPosition: THREE.Vector3,
  ): void => {
    // Rest attitude is "facing the camera", plus the configured offsets. The
    // cursor then nudges it from there, a little on each axis. Because the nudge
    // is bounded by its own range there is no clamping to do and no way for the
    // set to turn its back — the constraint is the amplitude, not a cage.
    const toCameraX = cameraPosition.x - group.position.x;
    const toCameraZ = cameraPosition.z - group.position.z;
    const toCameraY = cameraPosition.y - group.position.y;
    const cameraYaw = Math.atan2(toCameraX, toCameraZ);
    const cameraPitch = -Math.atan2(toCameraY, Math.hypot(toCameraX, toCameraZ));

    const nudgeX = pointer ? pointer.x : 0;
    const nudgeY = pointer ? pointer.y : 0;

    const targetYaw =
      cameraYaw + restYaw + nudgeX * THREE.MathUtils.degToRad(tv.follow.yaw);
    // Rotating by θ about X sends local +Z to (0, -sinθ, cosθ): to look *up* at
    // a cursor near the top of the frame, θ has to go negative.
    const targetPitch =
      cameraPitch +
      restTilt -
      nudgeY * THREE.MathUtils.degToRad(tv.follow.pitch);
    const targetRoll = -nudgeX * THREE.MathUtils.degToRad(tv.follow.roll);

    currentYaw = approachAngle(currentYaw, targetYaw, tv.followRate);
    currentPitch += (targetPitch - currentPitch) * tv.followRate;
    currentRoll += (targetRoll - currentRoll) * tv.followRate;

    group.position.y =
      restPosition.y + Math.sin(elapsed * tv.bobSpeed) * tv.bobAmplitude;
    group.rotation.y = currentYaw;
    group.rotation.z = currentRoll + Math.sin(elapsed * tv.swaySpeed) * sway;
    group.rotation.x =
      currentPitch + Math.sin(elapsed * tv.swaySpeed * 0.7) * sway * 0.4;
    group.updateMatrixWorld();

    // Two offset sines rather than a random: a CRT's unsteadiness drifts, and
    // per-frame noise reads as a strobe at 60fps.
    const flicker =
      1 +
      (Math.sin(elapsed * 11.3) * 0.6 + Math.sin(elapsed * 27.1) * 0.4) *
        tv.screen.flicker;
    light.flicker = flicker;

    light.position.copy(screenLocal).applyMatrix4(group.matrixWorld);
    light.direction
      .copy(facingLocal)
      .transformDirection(group.matrixWorld)
      .normalize();
  };

  update(0, null, new THREE.Vector3(0, 0, 1));

  return {
    object: group,
    light,
    screenUniforms: {
      uCore: screenUniforms.uCore,
      uEdge: screenUniforms.uEdge,
      uIntensity: screenUniforms.uIntensity,
      uEdgeStart: screenUniforms.uEdgeStart,
      uCentreLift: screenUniforms.uCentreLift,
    },
    update,
    dispose: () => {
      disposed = true;
      dracoLoader.dispose();
      disposeModel(group);
    },
  };
};

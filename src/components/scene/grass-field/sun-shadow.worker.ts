// 📖 Docs: obsidian/frontend/components/scene.md

/**
 * The sun-shadow march, off the main thread (see `sun-shadow.ts`). Rebuilds the
 * same seeded height field — the terrain is deterministic — marches it, and
 * hands the bytes back (transferred, not copied).
 */

import { computeSunShadow } from "./sun-shadow-compute";
import type { SunShadowJob } from "./sun-shadow";
import { createHeightSampler } from "./terrain";

self.onmessage = (event: MessageEvent<SunShadowJob>) => {
  const { seed, octaves, sun, options } = event.data;
  const data = computeSunShadow(
    createHeightSampler(seed, octaves),
    sun,
    options,
  );
  (self as unknown as Worker).postMessage(data, [data.buffer]);
};

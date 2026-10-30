import Image from "next/image";

import { Reveal } from "@/components/common/preloader";

const CORNER_SRC = "/assets/hero/corner-bracket.svg";

/** Entrance choreography, ms after the preloader starts leaving. */
const TIMING = {
  horizontal: 150,
  vertical: 450,
  corners: 1050,
  cornerStagger: 70,
} as const;

// The exported bracket is the top-right corner; the other three are mirrors of
// it, exactly as Figma places the same vector (3260:920–923). The mirror lives
// on the <img>, the entrance scale on its wrapper, so the two never fight over
// the transform.
const CORNERS = [
  { position: "top-0 right-0 origin-top-right", flip: "" },
  { position: "top-0 left-0 origin-top-left", flip: "-scale-x-100" },
  { position: "bottom-0 right-0 origin-bottom-right", flip: "-scale-y-100" },
  { position: "bottom-0 left-0 origin-bottom-left", flip: "-scale-100" },
] as const;

/**
 * The thin viewfinder frame drawn over the scene: hairlines 65 design-px from
 * the top and 62 from the bottom, verticals 24 in from each side, and a white
 * bracket on every corner. Decorative only. Each hairline is its own element so
 * it can draw itself in.
 */
export const HeroFrame = () => {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <Reveal
        tag="span"
        preset="drawX"
        delay={TIMING.horizontal}
        className="absolute inset-x-0 top-0 block h-px bg-overlay-hairline"
      />
      <Reveal
        tag="span"
        preset="drawX"
        delay={TIMING.horizontal}
        className="absolute inset-x-0 bottom-0 block h-px bg-overlay-hairline"
      />

      <div className="absolute inset-y-0 right-5.75 left-6">
        <Reveal
          tag="span"
          preset="drawY"
          delay={TIMING.vertical}
          className="absolute inset-y-0 left-0 block w-px origin-top bg-overlay-hairline"
        />
        <Reveal
          tag="span"
          preset="drawY"
          delay={TIMING.vertical}
          className="absolute inset-y-0 right-0 block w-px origin-top bg-overlay-hairline"
        />

        {CORNERS.map(({ position, flip }, index) => (
          <Reveal
            key={position}
            tag="span"
            preset="bracket"
            delay={TIMING.corners + index * TIMING.cornerStagger}
            className={`absolute block size-4.5 ${position}`}
          >
            <Image
              src={CORNER_SRC}
              alt=""
              width={18}
              height={18}
              unoptimized
              className={`block size-4.5 ${flip}`}
            />
          </Reveal>
        ))}
      </div>
    </div>
  );
};

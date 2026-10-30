import { Reveal } from "@/components/common/preloader";

/**
 * Decorative viewfinder telemetry — PIRA's own cinematic interface detail.
 *
 * A pair of restrained, device/agent-inspired HUD accents layered over the
 * scene: a small reticle with a "tracking" tag near where Pirophone floats, and
 * a short status readout in the opposite corner. They give the frame the
 * character of a camera locked onto the mascot — part of PIRA's physical-agent
 * story — without pretending to be a dashboard.
 *
 * Hard constraints honoured:
 * - **Purely decorative.** The whole block is `aria-hidden` and
 *   `pointer-events-none`; the labels are static strings, never live telemetry,
 *   so nothing here can mislead a reader into thinking a real signal is shown.
 * - **No looping motion.** Entrances use the existing `Reveal` springs; there
 *   are no CSS keyframes and no perpetual animation (hard rule #1). The marks
 *   simply settle in with the frame and then hold.
 * - **Tokens only.** Colour and timing come from the overlay tokens; no raw
 *   values (hard rule #4).
 *
 * Reveals land just after the corner brackets so the HUD reads as the last
 * layer of the frame drawing itself in.
 */
const TIMING = {
  reticle: 1250,
  reticleStagger: 90,
  status: 1500,
} as const;

/** Small ticked labels shared by both accents. */
const Dot = () => (
  <span
    aria-hidden="true"
    className="block size-1 rounded-full bg-overlay-text"
  />
);

export const HeroTelemetry = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 hidden sm:block"
    >
      {/* Reticle + tracking tag, upper-left of the framed area, reading toward
          where Pirophone sits over the near crest. */}
      <div className="absolute top-24 left-16 flex items-center gap-2.5">
        <Reveal
          tag="span"
          preset="bracket"
          delay={TIMING.reticle}
          className="relative block size-6"
        >
          {/* A thin ring with a centre tick — a camera reticle, not a spinner. */}
          <span className="absolute inset-0 block rounded-full ring-1 ring-overlay-hairline" />
          <span className="absolute top-1/2 left-1/2 block size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-overlay-text" />
          <span className="absolute top-1/2 left-0 block h-px w-1.5 -translate-y-1/2 bg-overlay-hairline" />
          <span className="absolute top-1/2 right-0 block h-px w-1.5 -translate-y-1/2 bg-overlay-hairline" />
        </Reveal>
        <Reveal
          tag="span"
          preset="focus"
          delay={TIMING.reticle + TIMING.reticleStagger}
          className="flex items-center gap-1.5 font-ui text-label tracking-wide text-overlay-text-muted uppercase"
        >
          <Dot />
          Pirophone
        </Reveal>
      </div>

      {/* Short status readout, lower-right, mirroring the reticle corner. */}
      <Reveal
        tag="span"
        preset="focus"
        delay={TIMING.status}
        className="absolute right-16 bottom-28 flex items-center gap-1.5 font-ui text-label tracking-wide text-overlay-text-muted uppercase"
      >
        Runtime
        <Dot />
      </Reveal>
    </div>
  );
};

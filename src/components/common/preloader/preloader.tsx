"use client";

// 📖 Docs: obsidian/frontend/components/common.md

import { useEffect, useRef, useState } from "react";

import { Spring } from "@/components/common/robot-spring";
import { usePreloader } from "@/hooks/use-preloader";
import { subscribeToTicker } from "@/lib/animation/ticker";

export interface PreloaderContent {
  /** Accessible name of the progress bar. */
  label: string;
}

export interface PreloaderProps {
  content: PreloaderContent;
  /** Shortest time on screen, ms — a loader that flashes reads as a glitch. */
  minDuration?: number;
  /** Lift regardless after this long, ms — a stalled request must not trap the page. */
  timeout?: number;
}

/** Seconds for the shown progress to close ~63 % of the gap to the real one. */
const FOLLOW_SECONDS = 0.3;
/**
 * Fastest the counter may climb, in progress per second. A fast load would
 * otherwise jump 0 → 100 in a few frames; the count is the show, so it always
 * takes at least ~1.6 s.
 */
const MAX_RATE = 0.62;
/** Before anything reports, the counter creeps to this, so it never looks frozen. */
const CREEP_LIMIT = 0.18;
const CREEP_MS = 2400;
/** Real progress below `ready` is scaled into this, so 100 % means done. */
const PRE_READY_CEILING = 0.92;
/** A beat at 100 % before the curtain lifts. */
const HOLD_MS = 260;
/** Unmount after the curtain has cleared the viewport. */
const EXIT_UNMOUNT_MS = 1700;

/** Overdamped and unhurried — the curtain accelerates away with no bounce. */
const CURTAIN_CONFIG = { tension: 58, friction: 22 };

/**
 * Full-screen white curtain with a large script counter. The count is drawn
 * twice: a pale ghost, and on top of it a gradient copy clipped from the bottom
 * up to the current progress — the "fill". The gradient is sized to the filled
 * part, so its blue edge always rides the fill line. When everything is ready
 * the curtain, counter and all, slides up out of the viewport and flips
 * `revealed`, which starts the page's entrance animations.
 *
 * The count, clip and gradient update through the shared ticker and write to
 * the DOM directly — per-frame numbers are not React state.
 */
export const Preloader = ({
  content,
  minDuration = 1800,
  timeout = 12000,
}: PreloaderProps) => {
  const [exiting, setExiting] = useState(false);
  const [mounted, setMounted] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLSpanElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const startedAt = performance.now();
    let lastFrame = startedAt;
    let shown = 0;
    let completedAt: number | null = null;
    let left = false;
    let lastPercent = -1;

    const unsubscribe = subscribeToTicker(() => {
      const now = performance.now();
      const delta = Math.min((now - lastFrame) / 1000, 0.1);
      lastFrame = now;
      const elapsed = now - startedAt;

      const store = usePreloader.getState();
      if (!store.ready && elapsed > timeout) store.markReady();

      const creep = Math.min(elapsed / CREEP_MS, 1) * CREEP_LIMIT;
      const target = store.ready
        ? 1
        : Math.max(store.progress * PRE_READY_CEILING, creep);
      const eased = (target - shown) * (1 - Math.exp(-delta / FOLLOW_SECONDS));
      shown += Math.min(eased, MAX_RATE * delta);
      if (store.ready && shown > 0.995) shown = 1;

      const percent = Math.round(shown * 100);
      if (percent !== lastPercent) {
        lastPercent = percent;
        const label = `${percent}%`;
        if (ghostRef.current) ghostRef.current.textContent = label;
        if (fillRef.current) fillRef.current.textContent = label;
        rootRef.current?.setAttribute("aria-valuenow", percent.toString());
      }
      if (fillRef.current) {
        const filled = shown * 100;
        fillRef.current.style.clipPath = `inset(${100 - filled}% 0 0 0)`;
        // The gradient spans only the filled part, anchored to the bottom, so
        // the fill line is always its first colour.
        fillRef.current.style.backgroundSize = `100% ${Math.max(filled, 0.01)}%`;
      }

      if (shown === 1 && completedAt === null) completedAt = now;
      if (
        !left &&
        completedAt !== null &&
        now - completedAt >= HOLD_MS &&
        elapsed >= minDuration
      ) {
        left = true;
        setExiting(true);
        store.reveal();
      }
    }, () => 0);

    return unsubscribe;
  }, [minDuration, timeout]);

  useEffect(() => {
    if (!exiting) return;
    const id = window.setTimeout(() => setMounted(false), EXIT_UNMOUNT_MS);
    return () => window.clearTimeout(id);
  }, [exiting]);

  if (!mounted) return null;

  return (
    <Spring
      enabled={exiting}
      mode="once"
      from={{ y: "0%" }}
      to={{ y: "-100%" }}
      config={CURTAIN_CONFIG}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-preloader-surface ${exiting ? "pointer-events-none" : ""}`}
    >
      <div
        ref={rootRef}
        data-preloader=""
        role="progressbar"
        aria-label={content.label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={0}
        className="relative font-display text-counter-compact leading-none font-bold tracking-display whitespace-nowrap select-none sm:text-counter"
      >
        {/* Reserves the widest label, so the centred count does not shuffle
            sideways as proportional script digits change width. The padding
            gives the script's ascenders and swashes room inside the box the
            fill's clip-path is measured against — otherwise 100 % still shaves
            their tops. */}
        <span aria-hidden="true" className="invisible block px-[0.12em] py-[0.14em]">
          100%
        </span>
        <span
          ref={ghostRef}
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center text-preloader-counter"
        >
          0%
        </span>
        <span
          ref={fillRef}
          aria-hidden="true"
          style={{ clipPath: "inset(100% 0 0 0)", backgroundSize: "100% 0.01%" }}
          className="absolute inset-0 flex items-center justify-center bg-linear-to-b from-preloader-fill-start to-preloader-fill-end bg-bottom bg-no-repeat bg-clip-text text-transparent"
        >
          0%
        </span>
      </div>
    </Spring>
  );
};

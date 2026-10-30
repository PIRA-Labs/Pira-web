"use client";

// 📖 Docs: obsidian/frontend/components/common.md

import { easings, useSpring } from "@react-spring/web";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { RobotText as TextEngine } from "@/components/common/robot-text";

import { Spring } from "@/components/common/robot-spring";
import { useMotionOff } from "@/hooks/animation/use-motion-off";
import { usePreloader } from "@/hooks/use-preloader";
import type { Tags } from "@/types/springs";

/**
 * Entrance animations for the hero, held until the preloader lifts.
 *
 * Every value here is deliberately slow and overdamped (no bounce): the brief is
 * "super smooth", so springs settle over ~1.2 s and blur resolves together with
 * opacity. Timings live at the call sites as `delay`, so the choreography reads
 * top-to-bottom in one place (`hero-content.tsx`, `site-header.tsx`).
 */

/** Soft, slightly overdamped — settles in ~1.2 s without overshoot. */
const SMOOTH = { tension: 64, friction: 22 };
/** For long thin lines, which read better a little slower. */
const DRAW = { tension: 36, friction: 18 };

const PRESETS = {
  /** Default content entrance: rise, unblur, fade. */
  rise: {
    from: { opacity: 0, y: 18, filter: "blur(12px)" },
    to: { opacity: 1, y: 0, filter: "blur(0px)" },
    config: SMOOTH,
  },
  /** Same without travel — for things pinned to an edge. */
  focus: {
    from: { opacity: 0, filter: "blur(10px)" },
    to: { opacity: 1, filter: "blur(0px)" },
    config: SMOOTH,
  },
  /** Opacity only — for full-bleed frosted panels, where scale or blur would show. */
  fade: {
    from: { opacity: 0 },
    to: { opacity: 1 },
    config: SMOOTH,
  },
  /**
   * Glass surfaces. No `filter` on purpose: a filtered element (or ancestor)
   * becomes a backdrop root, and the frosted `backdrop-blur` would stop
   * sampling the scene behind it.
   */
  surface: {
    from: { opacity: 0, scale: 0.92 },
    to: { opacity: 1, scale: 1 },
    config: SMOOTH,
  },
  /** Horizontal hairline drawing out from its centre. */
  drawX: {
    from: { opacity: 0, scaleX: 0 },
    to: { opacity: 1, scaleX: 1 },
    config: DRAW,
  },
  /** Vertical hairline drawing down from the top. */
  drawY: {
    from: { opacity: 0, scaleY: 0 },
    to: { opacity: 1, scaleY: 1 },
    config: DRAW,
  },
  /** Corner brackets: settle in from slightly larger. */
  bracket: {
    from: { opacity: 0, scale: 1.6, filter: "blur(6px)" },
    to: { opacity: 1, scale: 1, filter: "blur(0px)" },
    config: SMOOTH,
  },
} as const;

export type RevealPreset = keyof typeof PRESETS;

/**
 * How long before its own entrance an element is switched on, ms. Every
 * entrance waits its `delay` after the preloader starts leaving anyway;
 * switching each on `REVEAL_LEAD` ms before that — with the delay that is left
 * — keeps every entrance on the same clock but gives each its own task. When
 * every reveal subscribed to `revealed`, the flip re-rendered the whole hero
 * and mounted its three text engines in one sync render inside the
 * preloader's ticker frame: a 54–73 ms frame at the start of the phone's cold
 * pass, 3/3 runs (the curtain-lift split from dringle and creative-studio).
 */
const REVEAL_LEAD = 120;

interface RevealCue {
  on: boolean;
  /** The delay left when the entrance switched on, ms. */
  delay: number;
}

/**
 * The entrance's switch, flipped in a task of its own `REVEAL_LEAD` ms before
 * it plays. Listens to the store without rendering, so the flip itself costs
 * the hero nothing. Already revealed at mount, it arms at once (the robot form
 * renders every reveal at rest regardless).
 */
const useRevealCue = (delay: number): RevealCue => {
  // Off on the first render, like the server's markup; an already-revealed
  // store arms at once below.
  const [cue, setCue] = useState<RevealCue>({ on: false, delay });

  useEffect(() => {
    if (cue.on) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const arm = (revealedAt: number) => {
      const wait = Math.max(0, revealedAt + delay - REVEAL_LEAD - performance.now());
      timer = setTimeout(() => {
        setCue({ on: true, delay: Math.max(0, revealedAt + delay - performance.now()) });
      }, wait);
    };
    const state = usePreloader.getState();
    if (state.revealed) {
      arm(state.revealedAt ?? performance.now());
      return () => clearTimeout(timer);
    }
    const unsubscribe = usePreloader.subscribe((next) => {
      if (!next.revealed || timer !== undefined) return;
      arm(next.revealedAt ?? performance.now());
    });
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [cue.on, delay]);

  return cue;
};

export interface RevealProps {
  children?: ReactNode;
  tag?: Tags;
  preset?: RevealPreset;
  /** Milliseconds after the preloader starts leaving. */
  delay?: number;
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
}

export const Reveal = ({
  children,
  tag,
  preset = "rise",
  delay = 0,
  className,
  "aria-hidden": ariaHidden,
}: RevealProps) => {
  const cue = useRevealCue(delay);
  const { from, to, config } = PRESETS[preset];

  return (
    <Spring
      tag={tag}
      enabled={cue.on}
      mode="once"
      from={from}
      to={to}
      config={config}
      delayIn={cue.delay}
      className={className}
      aria-hidden={ariaHidden}
    >
      {children}
    </Spring>
  );
};

export interface RevealTextProps {
  children: string;
  tag?: "span" | "p";
  delay?: number;
  /** Milliseconds between words. */
  stagger?: number;
  className?: string;
}

/** How far out of focus a line of hero copy starts, in px. */
const LINE_BLUR = 12;
/**
 * How long one word's `SMOOTH` spring takes to bring a 12 px blur under half a
 * pixel — the span of the line's blur is this plus the wave's length.
 */
const WORD_SETTLE_MS = 1100;

/**
 * Word-by-word reveal: each word rises and fades in on its own spring, the
 * **blur is once per line** — one `filter` on the engine's own box, sharpening
 * over the span the wave takes to cross the line. No `overflow`: the clip box
 * is what shaved the script's swashes and the sans descenders, and a blur
 * reveal needs no mask.
 *
 * The blur used to sit on every word: each one a filter layer of its own,
 * re-rastered every frame of the entrance, composited over the full-screen
 * grass canvas — the cold desktop pass dropped frames through the hero's
 * entrance (from vesper, where per-line blur took the overlays' scroll from
 * janky to ideal). The engine renders its own container, so the filter is
 * written to it by reference; `display: contents` keeps this wrapper out of
 * the layout, and at rest the filter is removed, so settled copy is not a
 * filter layer.
 */
export const RevealText = ({
  children,
  tag = "span",
  delay = 0,
  stagger = 60,
  className,
}: RevealTextProps) => {
  const cue = useRevealCue(delay);
  const motionOff = useMotionOff();
  const wrapper = useRef<HTMLSpanElement>(null);
  const words = children.split(" ").length;

  useSpring({
    blur: cue.on || motionOff ? 0 : LINE_BLUR,
    delay: cue.on ? cue.delay : 0,
    config: {
      duration: WORD_SETTLE_MS + stagger * (words - 1),
      easing: easings.easeOutCubic,
    },
    onChange: ({ value }) => {
      const line = wrapper.current?.firstElementChild as HTMLElement | null;
      if (line)
        line.style.filter = value.blur < 0.05 ? "" : `blur(${value.blur}px)`;
    },
  });

  return (
    <span ref={wrapper} className="contents">
      <TextEngine
        tag={tag}
        mode="once"
        enabled={cue.on}
        className={className}
        wordIn={{ opacity: 1, y: 0 }}
        wordOut={{ opacity: 0, y: 16 }}
        wordConfig={SMOOTH}
        wordStagger={stagger}
        delayIn={cue.delay}
      >
        {children}
      </TextEngine>
    </span>
  );
};

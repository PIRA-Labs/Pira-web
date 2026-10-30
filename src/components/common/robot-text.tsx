"use client";

import {
  useEffect,
  useState,
  type ComponentProps,
  type ComponentType,
  type CSSProperties,
} from "react";
import TextEngine from "spring-text-engine";

import { useRobot } from "./robot-view";

/**
 * spring-text-engine, except that on the robot form (D-016) the text is plain
 * text in the same tag — the engine starts its letters hidden in the served
 * HTML. Swap a first-screen import:
 * `import { RobotText as TextEngine } from "@/components/common/robot-text"`.
 *
 * The identity transform keeps the engine's paint order: its letters are
 * transformed, which paints them in the positioned layer — above an overlay
 * (a legibility scrim) that plain in-flow text would sit under (evolve).
 */
const PAINT_AS_ENGINE = {
  transform: "translate(0)",
  // The engine lays each instance out as a wrapping flex row — so two inline
  // `<span>` engines stack as two lines (voxelia's headline "Play the board" /
  // "in real time." ran together without this), and `justify-*` classes align.
  display: "flex",
  flexWrap: "wrap",
} as const;

/**
 * The engine sets each line as a flex row, so a `justify-*` class aligns its
 * lines; on plain text that class does nothing. Carry it over as `text-align`
 * (helion's centred hero line rendered left-aligned without this).
 */
const alignOf = (className = "") =>
  /(^|\s)justify-center(\s|$)/.test(className)
    ? "center"
    : /(^|\s)justify-end(\s|$)/.test(className)
      ? "right"
      : undefined;

type EngineProps = ComponentProps<typeof TextEngine>;

const SR_ONLY: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
  border: 0,
  pointerEvents: "none",
  userSelect: "none",
};
const WORD_BOX: CSSProperties = {
  overflow: "initial",
  display: "inline-block",
  userSelect: "auto",
};
const length = (value: unknown): string =>
  typeof value === "number" ? `${value}px` : String(value ?? 0);

/** The engine's `wordOut` pose as static CSS — what it serves before a reveal. */
const wordPose = (pose: Record<string, unknown> = {}): CSSProperties => {
  const out: Record<string, unknown> = {
    display: "inline-block",
    userSelect: "auto",
  };
  if (pose.opacity !== undefined) out.opacity = pose.opacity;
  if (pose.filter !== undefined) out.filter = pose.filter;
  if (pose.x !== undefined || pose.y !== undefined) {
    out.transform = `translate3d(${length(pose.x)},${length(pose.y)},0)`;
  }
  return out as CSSProperties;
};

/**
 * A `once` reveal that has **never been enabled**, as the engine's own served
 * markup — the same elements, classes and styles, word by word, hidden at
 * `wordOut` — with no springs behind it. The engine builds a spring per word
 * at hydration; on longplay's first screen (three reveals under the
 * preloader) that was a large part of the hydration task on a phone. The
 * engine mounts the first time the reveal is enabled and plays from `wordOut`
 * exactly as before; the boxes are identical, so nothing moves when it does.
 * Plain-string children only; anything else goes straight to the engine.
 */
const WaitingText = (props: EngineProps) => {
  const Tag = (props.tag ?? "div") as unknown as ComponentType<
    Record<string, unknown>
  >;
  const text = props.children as string;
  const gap = props.columnGap ?? 0.3;
  const pose = wordPose(props.wordOut as Record<string, unknown>);
  return (
    <Tag
      className={props.className}
      style={{
        position: "relative",
        columnGap: typeof gap === "number" ? `${gap}em` : gap,
        display: "flex",
        flexWrap: "wrap",
      }}
    >
      <span style={SR_ONLY}>{text}</span>
      <span aria-hidden="true" style={{ display: "contents" }}>
        {text.split(" ").map((word, i) => (
          <span key={i} style={WORD_BOX} className="line-word">
            <span style={pose} className="">
              {word}
            </span>
          </span>
        ))}
      </span>
    </Tag>
  );
};

/** True until a `once` reveal is first enabled (latched). */
const useWaiting = (props: EngineProps): boolean => {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (props.enabled !== false) setArmed(true);
  }, [props.enabled]);
  return (
    !armed &&
    props.enabled === false &&
    props.mode === "once" &&
    typeof props.children === "string" &&
    !props.children.includes("\n")
  );
};

export const RobotText = (props: EngineProps) => {
  const robot = useRobot();
  const waiting = useWaiting(props);
  if (!robot && waiting) return <WaitingText {...props} />;
  if (!robot) return <TextEngine {...props} />;
  // Through `ComponentType`, not `ElementType`: with @react-three/fiber's JSX
  // augmentation a dynamic intrinsic tag types its children as `never` and a
  // project that type-checks its build (vesper) fails on it.
  const Tag = (props.tag ?? "div") as unknown as ComponentType<
    Record<string, unknown>
  >;
  return (
    <Tag
      className={props.className}
      style={{
        ...PAINT_AS_ENGINE,
        textAlign: alignOf(props.className),
        // At rest a scroll-scrubbed line (`mode="progress"`) is at progress 0 —
        // the engine's out-state, hidden. Showing it stacked house's whole
        // hero sequence on the first screen. (The text is still in the DOM.)
        visibility: props.mode === "progress" ? "hidden" : undefined,
      }}
    >
      {props.children}
    </Tag>
  );
};

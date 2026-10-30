"use client";

// 📖 Docs: obsidian/frontend/components/common.md

import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";

import {
  LazyGrassField,
  type GrassFieldProps,
} from "@/components/scene/grass-field";
import { useRobot } from "@/components/common/robot-view";
import { usePreloader } from "@/hooks/use-preloader";
import { isBotUserAgent } from "@/utils/bot-user-agent";

/** Share of the preloader bar the scene's requests fill; the rest stands for its JS chunk. */
const ASSET_SHARE = 0.85;

export type PreloadedGrassFieldProps = Omit<
  GrassFieldProps,
  "onLoadProgress" | "onReady" | "onUnavailable" | "gust"
> & {
  /** Static frame of the scene, for crawlers and devices without WebGL. */
  poster: string;
  /** Portrait composition, so the mascot stays framed on narrow screens. */
  posterMobile?: string;
  /** Classes for the poster image. */
  posterClassName?: string;
};

const noopSubscribe = () => () => {};
/** `null` on the server and during hydration — the scene decision is client-only. */
const useIsBot = (): boolean | null =>
  useSyncExternalStore(
    noopSubscribe,
    () => isBotUserAgent(navigator.userAgent),
    () => null,
  );

/**
 * The grass field, reporting its load progress and first finished frame to the
 * preloader and firing the reveal gust.
 *
 * Crawlers and audit tools (skill §1) never mount the scene, so the `three`
 * chunk is never requested, parsed or evaluated for them; they get the poster.
 * The check is client-side on purpose: reading the request's user agent on the
 * server would opt `/` out of static prerendering. A device that cannot create
 * a WebGL context falls back to the same poster.
 */
export const PreloadedGrassField = ({
  poster,
  posterMobile,
  posterClassName,
  ...props
}: PreloadedGrassFieldProps) => {
  const setProgress = usePreloader((state) => state.setProgress);
  const markReady = usePreloader((state) => state.markReady);
  const revealed = usePreloader((state) => state.revealed);
  const robot = useRobot();
  const isBot = useIsBot();
  const [unavailable, setUnavailable] = useState(false);
  const showPoster = isBot === true || unavailable;

  useEffect(() => {
    if (isBot) markReady();
  }, [isBot, markReady]);

  // The robot and no-WebGL paths share the same responsive scene capture.
  if (robot || showPoster) {
    return (
      <picture>
        <source media="(max-width: 767px)" srcSet={posterMobile ?? poster} />
        <Image
          src={poster}
          alt=""
          fill
          sizes="100vw"
          unoptimized
          loading="eager"
          fetchPriority="high"
          className={posterClassName}
        />
      </picture>
    );
  }

  if (isBot === null) return null;

  return (
    <LazyGrassField
      {...props}
      onLoadProgress={(fraction) =>
        setProgress(1 - ASSET_SHARE + fraction * ASSET_SHARE)
      }
      onReady={markReady}
      onUnavailable={() => setUnavailable(true)}
      gust={revealed}
    />
  );
};

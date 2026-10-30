import Image from "next/image";

import { ActionLink } from "@/components/ui/action-link";
import { GlassPillLink } from "@/components/ui/glass-pill-link";
import type { HomeHeroContent } from "@/data/mocks/home";

import { HeroFrame } from "./hero-frame";
import { HeroTelemetry } from "./hero-telemetry";
import { Reveal, RevealText } from "@/components/common/preloader";

export interface HeroContentProps {
  content: HomeHeroContent;
}

/**
 * Entrance choreography, ms after the preloader starts leaving. The frame draws
 * first and the header lands with it; the headline follows, then the copy works
 * down the page and the band closes it.
 */
const TIMING = {
  title: 600,
  titleStagger: 110,
  subtitle: 1000,
  subtitleStagger: 70,
  body: 1450,
  bodyStagger: 18,
  action: 1750,
  actionLabel: 1900,
  actionIcon: 2000,
  band: 2150,
  trust: 2300,
} as const;

/**
 * Everything inside the hairline frame plus the bottom band: the <h1> (script
 * line + dimmed sans line), body copy, primary action and trust line.
 */
export const HeroContent = ({ content }: HeroContentProps) => {
  return (
    <>
      <div className="pointer-events-none relative flex min-h-0 w-full flex-1 flex-col items-center px-8 pt-5 pb-6 sm:pt-12 sm:pb-10">
        <HeroFrame />
        <HeroTelemetry />

        <h1 id="hero-title" className="flex flex-col items-center text-overlay-text">
          <RevealText
            delay={TIMING.title}
            stagger={TIMING.titleStagger}
            className="justify-center text-center font-display text-subtitle-compact leading-display font-bold tracking-display sm:text-display"
          >
            {content.title}
          </RevealText>
          <RevealText
            delay={TIMING.subtitle}
            stagger={TIMING.subtitleStagger}
            className="justify-center text-center font-display text-body leading-display font-medium tracking-subtitle text-overlay-text-muted sm:text-subtitle"
          >
            {content.subtitle}
          </RevealText>
        </h1>

        <div className="mt-auto hidden sm:block">
          <RevealText
            tag="p"
            delay={TIMING.body}
            stagger={TIMING.bodyStagger}
            className="w-153.5 max-w-full justify-center text-center font-body text-body leading-copy text-overlay-text"
          >
            {content.body}
          </RevealText>
        </div>

        <div className="pointer-events-auto mt-5 flex flex-wrap justify-center gap-3 sm:mt-8.25">
          <ActionLink
            href={content.action.href}
            label={content.action.label}
            icon={content.actionIcon}
            renderSurface={(surfaceClass) => (
              <Reveal
                tag="span"
                preset="surface"
                delay={TIMING.action}
                className={surfaceClass}
                aria-hidden="true"
              />
            )}
            renderLabel={(label) => (
              <Reveal tag="span" preset="focus" delay={TIMING.actionLabel} className="relative block">
                {label}
              </Reveal>
            )}
            renderIcon={(icon) => (
              <Reveal tag="span" preset="bracket" delay={TIMING.actionIcon} className="relative block shrink-0">
                {icon}
              </Reveal>
            )}
          />
          <GlassPillLink href={content.secondaryAction.href} className="min-h-touch-target px-4 text-overlay-text">
            {content.secondaryAction.label}
          </GlassPillLink>
        </div>
      </div>

      <div className="pointer-events-none relative flex h-12 w-full shrink-0 items-center justify-center px-4 sm:h-15.5">
        <Reveal
          tag="span"
          preset="fade"
          delay={TIMING.band}
          aria-hidden="true"
          className="absolute inset-0 block bg-overlay-band backdrop-blur-band"
        />
        <Reveal
          tag="p"
          preset="rise"
          delay={TIMING.trust}
          className="relative flex items-center gap-2 font-ui text-label leading-copy text-center text-overlay-text uppercase sm:text-body"
        >
          <Image
            src={content.trustIcon}
            alt=""
            width={30}
            height={30}
            unoptimized
            className="block size-7.5 shrink-0"
          />
          {content.trust}
        </Reveal>
      </div>
    </>
  );
};

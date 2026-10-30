import Link from "next/link";

import { GlassPillLink } from "@/components/ui/glass-pill-link";
import type { HomeHeaderContent } from "@/data/mocks/home";

import { Reveal } from "@/components/common/preloader";

export interface SiteHeaderProps {
  content: HomeHeaderContent;
}

/** Entrance choreography, ms after the preloader starts leaving. */
const TIMING = {
  logo: 350,
  nav: 450,
  navStagger: 90,
  action: 850,
  /** The label trails its own surface slightly, so the glass lands first. */
  labelLag: 120,
} as const;

/**
 * Header over the hero: wordmark, centred nav pills, action pill.
 * 65 design-px tall — the frame's top hairline starts where it ends.
 */
export const SiteHeader = ({ content }: SiteHeaderProps) => {
  const { logo, nav, navLabel, action } = content;

  return (
    <header className="pointer-events-none relative min-h-header h-16.25 w-full shrink-0">
      <Link
        href={logo.href}
        // The home link on the home page: nothing to prefetch.
        prefetch={false}
        className="group pointer-events-auto absolute top-3 left-6 flex min-h-touch-target items-center font-body text-body leading-none text-overlay-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-overlay-text"
      >
        <Reveal tag="span" preset="rise" delay={TIMING.logo} className="block">
          <span>{logo.primary}</span>
          <span className="text-overlay-text-muted transition-colors duration-[var(--duration-normal)] ease-entrance group-hover:text-overlay-text">
            {logo.secondary}
          </span>
        </Reveal>
      </Link>

      <details className="pointer-events-auto absolute top-3 right-6 z-20 sm:hidden">
        <summary className="flex min-h-touch-target cursor-pointer items-center rounded-pill bg-overlay-glass px-4 font-ui text-label text-overlay-text backdrop-blur-glass">{content.menuLabel}</summary>
        <nav aria-label={navLabel} className="absolute right-0 mt-2 w-48 rounded-pill border border-overlay-hairline bg-project-surface p-2">
          <ul className="flex flex-col gap-1">
            {nav.map((item) => <li key={item.href}><GlassPillLink href={item.href} className="min-h-touch-target">{item.label}</GlassPillLink></li>)}
          </ul>
        </nav>
      </details>

      <nav
        aria-label={navLabel}
        className="pointer-events-auto absolute top-3 left-1/2 -translate-x-1/2 max-sm:hidden"
      >
        <ul className="flex justify-between gap-1">
          {nav.map((item, index) => {
            const delay = TIMING.nav + index * TIMING.navStagger;
            return (
              <li key={item.href}>
                <GlassPillLink
                  href={item.href}
                  className="min-h-touch-target px-2 sm:px-3"
                  renderSurface={(surfaceClass) => (
                    <Reveal
                      tag="span"
                      preset="surface"
                      delay={delay}
                      className={surfaceClass}
                      aria-hidden="true"
                    />
                  )}
                  renderLabel={(label) => (
                    <Reveal
                      tag="span"
                      preset="focus"
                      delay={delay + TIMING.labelLag}
                      className="relative block"
                    >
                      {label}
                    </Reveal>
                  )}
                >
                  {item.label}
                </GlassPillLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <GlassPillLink
        href={action.href}
        className="pointer-events-auto absolute top-3 right-6 min-h-touch-target w-32.5 max-sm:hidden"
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
          <Reveal
            tag="span"
            preset="focus"
            delay={TIMING.action + TIMING.labelLag}
            className="relative block"
          >
            {label}
          </Reveal>
        )}
      >
        {action.label}
      </GlassPillLink>
    </header>
  );
};

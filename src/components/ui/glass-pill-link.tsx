import Link from "next/link";
import type { ReactNode } from "react";

export interface GlassPillLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  /**
   * Renders the frosted surface in place of the default span — pass through the
   * class string. It exists so a caller can animate the surface on its own: an
   * animated `filter` or `opacity` on an *ancestor* would make it a backdrop
   * root and switch the frosting off.
   */
  renderSurface?: (className: string) => ReactNode;
  /** Wraps the label, e.g. in an entrance animation. */
  renderLabel?: (label: ReactNode) => ReactNode;
}

// Hover brightens the glass one step (ADR-0014: a colour change on token
// timing). It lives on the surface, so the entrance spring on the same element
// — opacity and scale only — never fights it.
//
// PIRA art-direction pass: the pill surface was lightened to the understated
// `overlay-pill` tokens and given a faint hairline ring, so the nav reads as a
// quiet, technical viewfinder control rather than a heavy frosted button.
const SURFACE_CLASS =
  "pointer-events-none absolute inset-0 block rounded-pill bg-overlay-pill ring-1 ring-overlay-hairline ring-inset backdrop-blur-glass transition-colors duration-[var(--duration-normal)] ease-entrance group-hover:bg-overlay-pill-hover group-focus-visible:bg-overlay-pill-hover";

/**
 * The surface is absolutely positioned, so the link must be a containing block.
 * Add `relative` unless the caller already positions it: two position utilities
 * on one element resolve by stylesheet order, not by the order written.
 */
const positioning = (className: string): string =>
  /(^|\s)(absolute|fixed|sticky)(\s|$)/.test(className) ? "" : "relative";

/**
 * Frosted, translucent pill link — the header nav items and the header action
 * in Figma (Get Layers, 3255:880–883, 3255:890). Width is set by the caller;
 * the label is centred inside it.
 */
export const GlassPillLink = ({
  href,
  children,
  className = "",
  renderSurface,
  renderLabel,
}: GlassPillLinkProps) => {
  const label = <span className="relative block">{children}</span>;

  return (
    <Link
      href={href}
      // An in-page anchor never navigates in-app: nothing to prefetch, and
      // registering each link with the router was a load task on a phone.
      prefetch={href.startsWith("#") ? false : undefined}
      // Smaller padding and tracked, muted-at-rest labels (brightening on
      // hover/focus) make the pills lighter and more understated — PIRA
      // art-direction pass. Timing/easing stay token-backed (ADR-0014).
      className={`group ${positioning(className)} flex items-center justify-center rounded-pill px-2.5 py-1.5 font-ui text-label leading-copy tracking-wide whitespace-nowrap text-overlay-text-muted uppercase transition-colors duration-[var(--duration-normal)] ease-entrance hover:text-overlay-text focus-visible:text-overlay-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-overlay-text ${className}`}
    >
      {renderSurface ? (
        renderSurface(SURFACE_CLASS)
      ) : (
        <span aria-hidden="true" className={SURFACE_CLASS} />
      )}
      {renderLabel ? renderLabel(label) : label}
    </Link>
  );
};

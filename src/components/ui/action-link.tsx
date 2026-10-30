import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export interface ActionLinkProps {
  href: string;
  label: string;
  /** Path to a 24×24 decorative icon, shown in the black square on the right. */
  icon: string;
  className?: string;
  /**
   * Renders the frosted surface in place of the default span. See
   * `GlassPillLink` for why the surface is a separate element.
   */
  renderSurface?: (className: string) => ReactNode;
  /** Wraps the label, e.g. in an entrance animation. */
  renderLabel?: (label: ReactNode) => ReactNode;
  /** Wraps the icon tile, e.g. in an entrance animation. */
  renderIcon?: (icon: ReactNode) => ReactNode;
}

// Hover: the cream surface goes fully opaque and the icon grows a notch —
// a colour change and a small nudge on token timing (ADR-0014).
const SURFACE_CLASS =
  "pointer-events-none absolute inset-0 block rounded-action bg-overlay-action backdrop-blur-band transition-colors duration-[var(--duration-normal)] ease-entrance group-hover:bg-overlay-action-hover group-focus-visible:bg-overlay-action-hover";

/**
 * The surface is absolutely positioned, so the link must be a containing block.
 * Add `relative` unless the caller already positions it: two position utilities
 * on one element resolve by stylesheet order, not by the order written.
 */
const positioning = (className: string): string =>
  /(^|\s)(absolute|fixed|sticky)(\s|$)/.test(className) ? "" : "relative";

/**
 * Primary call to action — cream frosted capsule with a black icon tile
 * (Figma: Get Layers, 3255:893).
 */
export const ActionLink = ({
  href,
  label,
  icon,
  className = "",
  renderSurface,
  renderLabel,
  renderIcon,
}: ActionLinkProps) => {
  const labelNode = (
    <span className="relative block font-body text-body leading-copy whitespace-nowrap text-overlay-action-text">
      {label}
    </span>
  );
  const iconNode = (
    <span className="relative flex size-12 shrink-0 items-center justify-center overflow-clip rounded-action-icon bg-overlay-action-icon">
      <Image
        src={icon}
        alt=""
        width={24}
        height={24}
        unoptimized
        className="block size-6 transition-transform duration-[var(--duration-normal)] ease-entrance group-hover:scale-115"
      />
    </span>
  );

  return (
    <Link
      href={href}
      // An in-page anchor never navigates in-app: nothing to prefetch, and
      // registering each link with the router was a load task on a phone.
      prefetch={href.startsWith("#") ? false : undefined}
      className={`group ${positioning(className)} flex items-center gap-6 rounded-action py-0.5 pr-0.5 pl-8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-overlay-text ${className}`}
    >
      {renderSurface ? (
        renderSurface(SURFACE_CLASS)
      ) : (
        <span aria-hidden="true" className={SURFACE_CLASS} />
      )}
      {renderLabel ? renderLabel(labelNode) : labelNode}
      {renderIcon ? renderIcon(iconNode) : iconNode}
    </Link>
  );
};

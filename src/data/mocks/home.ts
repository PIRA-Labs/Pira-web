import { pira } from "@/data/pira";

export interface HomeLink {
  label: string;
  href: string;
}

export interface HomeLogo {
  src: string;
  alt: string;
  href: string;
}

export interface HomeHeaderContent {
  logo: HomeLogo;
  navLabel: string;
  menuLabel: string;
  nav: HomeLink[];
  action: HomeLink;
}

export interface HomeHeroContent {
  /** First line of the page's single <h1> — script face. */
  title: string;
  /** Second line of the <h1> — sans face, dimmed. */
  subtitle: string;
  body: string;
  action: HomeLink;
  secondaryAction: HomeLink;
  /** Icon inside the primary action — decorative. */
  actionIcon: string;
  trust: string;
  /** Icon beside the trust line — decorative. */
  trustIcon: string;
}

export interface HomePreloaderContent {
  /** Accessible name of the progress bar. */
  label: string;
}

export const homePreloader: HomePreloaderContent = {
  label: "Loading PIRA",
};

export const homeHeader: HomeHeaderContent = {
  logo: { src: "/assets/brand/pira-wordmark.png", alt: "PIRA", href: "/" },
  navLabel: "Primary",
  menuLabel: "Menu",
  nav: [
    { label: "How It Works", href: "/how-it-works" },
    { label: "Architecture", href: "/architecture" },
    { label: "Security", href: "/security" },
    { label: "Developers", href: "/download" },
    ...(pira.githubUrl ? [{ label: "GitHub", href: pira.githubUrl }] : []),
  ],
  action: { label: "Android status", href: pira.downloadHref },
};

export const homeHero: HomeHeroContent = {
  title: "Give AI access to reality.",
  subtitle: "Keep humans in control.",
  body: pira.description,
  action: { label: "See PIRA in Action", href: "/how-it-works" },
  secondaryAction: { label: "Explore the Architecture", href: "/architecture" },
  actionIcon: "/assets/hero/runtime.svg",
  trust: "Security-first runtime. Human-controlled Android access.",
  trustIcon: "/assets/hero/runtime.svg",
};

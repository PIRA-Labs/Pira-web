import { pira } from "@/data/pira";

export interface HomeLink {
  label: string;
  href: string;
}

export interface HomeLogo {
  /** Full-opacity part of the wordmark. */
  primary: string;
  /** Dimmed part of the wordmark. */
  secondary: string;
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
  logo: { primary: "PIRA", secondary: ".", href: "/" },
  navLabel: "Primary",
  menuLabel: "Menu",
  nav: [
    { label: "About", href: "/about" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "Architecture", href: "/architecture" },
    { label: "GitHub", href: pira.githubUrl },
  ],
  action: { label: "Android APK", href: pira.downloadHref },
};

export const homeHero: HomeHeroContent = {
  title: "AI has a brain.",
  subtitle: "Give it access to reality.",
  body: pira.description,
  action: { label: "Download for Android", href: pira.downloadHref },
  actionIcon: "/assets/hero/download.svg",
  trust: "Observe → Reason → Act → Verify",
  trustIcon: "/assets/hero/runtime.svg",
};

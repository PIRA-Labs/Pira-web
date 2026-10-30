import Link from "next/link";
import { GlassPillLink } from "@/components/ui/glass-pill-link";
import { ActionLink } from "@/components/ui/action-link";
import { homeHeader } from "@/data/mocks/home";
import { pira } from "@/data/pira";
import { projectPages } from "@/data/project-pages";
import { generateMetadata } from "@/utils/seo/generate-page-metadata";
import { SiteFooter } from "./home/site-footer";

type ProjectPage = keyof typeof projectPages;

export const projectMetadata = (page: ProjectPage) => generateMetadata({
  title: `${page === "how-it-works" ? "How It Works" : page.charAt(0).toUpperCase() + page.slice(1)} — PIRA`,
  description: projectPages[page].intro,
  url: `/${page}`,
});

export const ProjectView = ({ page }: { page: ProjectPage }) => {
  const content = projectPages[page];
  return (
    <div className="min-h-dvh bg-project-surface font-body text-overlay-text">
      <header className="mx-auto flex max-w-document flex-wrap items-center justify-between gap-6 border-b border-overlay-hairline px-6 py-6">
        <Link href="/" className="text-body">{homeHeader.logo.primary}{homeHeader.logo.secondary}</Link>
        <nav aria-label={homeHeader.navLabel}>
          <ul className="flex flex-wrap gap-2">
            {homeHeader.nav.map((item) => <li key={item.href}><GlassPillLink href={item.href} className="min-h-touch-target">{item.label}</GlassPillLink></li>)}
          </ul>
        </nav>
      </header>
      <main id="main" className="mx-auto max-w-document px-6 py-16 sm:py-24">
        <p className="font-ui text-label uppercase">{content.eyebrow}</p>
        <h1 className="mt-6 text-display-compact leading-display sm:text-subtitle">{content.title}</h1>
        <p className="mt-8 max-w-prose text-body leading-relaxed">{content.intro}</p>
        <div className="mt-16 grid gap-10 sm:grid-cols-2">
          {content.sections.map((section, index) => (
            <section key={section.heading} aria-labelledby={`section-${index}`} className="border-t border-overlay-hairline pt-6">
              <h2 id={`section-${index}`} className="text-subtitle-compact leading-display">{section.heading}</h2>
              <p className="mt-4 text-body leading-relaxed">{section.body}</p>
            </section>
          ))}
        </div>
        <div className="mt-16 flex flex-wrap gap-4">
          {(page !== "download" || pira.apkUrl) && <ActionLink href={pira.downloadHref} label="Download for Android" icon="/assets/hero/download.svg" />}
          <GlassPillLink href={pira.githubUrl} className="min-h-touch-target">GitHub ↗</GlassPillLink>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

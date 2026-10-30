import Link from "next/link";
import Image from "next/image";
import { GlassPillLink } from "@/components/ui/glass-pill-link";
import { ActionLink } from "@/components/ui/action-link";
import { homeHeader } from "@/data/mocks/home";
import { pira } from "@/data/pira";
import { projectPages, type ProjectPageContent } from "@/data/project-pages";
import { generateMetadata } from "@/utils/seo/generate-page-metadata";
import { SiteFooter } from "./home/site-footer";

type ProjectPage = keyof typeof projectPages;

export const projectMetadata = (page: ProjectPage) => generateMetadata({
  title: `${projectPages[page].metaTitle} — PIRA`,
  description: projectPages[page].intro,
  url: `/${page}`,
});

export const ProjectView = ({ page }: { page: ProjectPage }) => {
  const content: ProjectPageContent = projectPages[page];
  return (
    <div className="min-h-dvh bg-project-surface font-body text-overlay-text">
      <header className="mx-auto flex max-w-document flex-wrap items-center justify-between gap-6 border-b border-overlay-hairline px-6 py-6">
        <Link href="/" className="flex min-h-touch-target items-center">
          <Image src={homeHeader.logo.src} alt={homeHeader.logo.alt} width={1774} height={887} className="w-28 mix-blend-screen" />
        </Link>
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
        <ol className={`mt-16 grid gap-10 sm:grid-cols-2 ${content.sequence ? "lg:grid-cols-3" : ""}`}>
          {content.sections.map((section, index) => (
            <li key={section.heading} className="border-t border-overlay-hairline pt-6">
              {content.sequence && <p className="font-ui text-label text-overlay-text-muted">{String(index + 1).padStart(2, "0")}</p>}
              <section aria-labelledby={`section-${index}`}>
                <h2 id={`section-${index}`} className="text-subtitle-compact leading-display">{section.heading}</h2>
                <p className="mt-4 text-body leading-relaxed">{section.body}</p>
              </section>
            </li>
          ))}
        </ol>
        <div className="mt-16 flex flex-wrap gap-4">
          <ActionLink href={pira.downloadHref} label="Get the Android build" icon="/assets/hero/download.svg" />
          <GlassPillLink href={pira.githubUrl} className="min-h-touch-target">GitHub ↗</GlassPillLink>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

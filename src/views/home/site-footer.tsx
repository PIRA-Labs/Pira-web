import Link from "next/link";
import { pira } from "@/data/pira";

export const SiteFooter = () => (
  <footer className="flex flex-wrap items-center justify-between gap-4 bg-project-surface px-6 py-5 font-ui text-label text-overlay-text">
    <p>{pira.footer}</p>
    <Link href="/privacy-policy" className="flex min-h-touch-target items-center underline underline-offset-4">{pira.privacyLabel}</Link>
  </footer>
);

import { PreloadedGrassField, Preloader } from "@/components/common/preloader";
import { RobotReady } from "@/components/common/preloader/robot-ready";
import { RobotProvider, RobotView } from "@/components/common/robot-view";
import { homeHeader, homeHero, homePreloader } from "@/data/mocks/home";
import { capabilities } from "@/data/pira";

import { SiteFooter } from "./home/site-footer";

import { HeroContent } from "./home/hero-content";
import { Capabilities } from "./home/capabilities";
import { SiteHeader } from "./home/site-header";

interface HomeViewProps {
  /** The robot form (D-016): no preloader, the poster, the copy at rest. */
  robot?: boolean;
}

export const HomeView = ({ robot = false }: HomeViewProps) => {
  return (
    <RobotProvider robot={robot}>
      {robot && <RobotView />}
      {/* Layout is `dvh` (what is actually visible, so the band never hides
          behind a mobile URL bar); the canvas is `lvh` (the largest viewport,
          so the bar collapsing never re-allocates the framebuffer). The bleed
          is clipped. */}
      <div className="relative min-h-hero h-dvh w-full overflow-hidden bg-scene-backdrop">
        <PreloadedGrassField
          className="absolute inset-x-0 top-0 block min-h-hero h-lvh w-full transform-gpu backface-hidden"
          poster="/assets/grass-hero/poster.webp"
          posterMobile="/assets/grass-hero/poster-mobile.webp"
          posterClassName="object-cover"
        />

        {/* UI overlay — Figma: Get Layers, 3255:783. Pointer events pass through
          to the canvas (the grass and the mascot follow the cursor) except on the
          links, which opt back in. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col">
          <SiteHeader content={homeHeader} />
          <main id="main" className="flex min-h-0 w-full flex-1 flex-col">
            <section
              aria-labelledby="hero-title"
              className="flex min-h-0 w-full flex-1 flex-col"
            >
              <HeroContent content={homeHero} />
            </section>
          </main>
        </div>

        {robot ? <RobotReady /> : <Preloader content={homePreloader} />}
      </div>
      <Capabilities capabilities={capabilities} />
      <SiteFooter />
    </RobotProvider>
  );
};

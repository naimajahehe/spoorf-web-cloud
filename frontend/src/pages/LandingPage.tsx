import React, { useEffect } from 'react';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { HeroTopology } from '../components/landing/HeroTopology';
import { MissionLead } from '../components/landing/MissionLead';
import { InteractiveFeatureTabs } from '../components/landing/InteractiveFeatureTabs';
import { BentoFeatures } from '../components/landing/BentoFeatures';
import { FeatureMatrix } from '../components/landing/FeatureMatrix';
import { PricingTiers } from '../components/landing/PricingTiers';
import { LandingFooter } from '../components/landing/LandingFooter';

export const LandingPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Spoorf NetCut Sentinel · Autonomous Layer 2 Defense & Cloud Fleet';
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans bg-grid-paper selection:bg-brand selection:text-white relative overflow-x-hidden">
      {/* Floating Pill Navigation */}
      <LandingNavbar />

      {/* Main Landing Sections */}
      {/* Each component renders its own <section>; these wrappers only carry the anchor targets.
          scroll-mt keeps headings clear of the sticky floating navbar when jumping to an anchor. */}
      <main>
        <div id="hero" className="scroll-mt-24">
          <HeroTopology />
        </div>

        <div id="mission" className="scroll-mt-24">
          <MissionLead />
        </div>

        <div id="showcase" className="scroll-mt-24">
          <InteractiveFeatureTabs />
        </div>

        <div id="features" className="scroll-mt-24">
          <BentoFeatures />
        </div>

        <div id="architecture" className="scroll-mt-24">
          <FeatureMatrix />
        </div>

        <div id="pricing" className="scroll-mt-24">
          <PricingTiers />
        </div>
      </main>

      {/* Closing CTA & Footer */}
      <LandingFooter />
    </div>
  );
};

export default LandingPage;

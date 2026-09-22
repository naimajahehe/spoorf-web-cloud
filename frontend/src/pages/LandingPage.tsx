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
      <main>
        <section id="hero">
          <HeroTopology />
        </section>

        <section id="mission">
          <MissionLead />
        </section>

        <section id="showcase">
          <InteractiveFeatureTabs />
        </section>

        <section id="features">
          <BentoFeatures />
        </section>

        <section id="architecture">
          <FeatureMatrix />
        </section>

        <section id="pricing">
          <PricingTiers />
        </section>
      </main>

      {/* Closing CTA & Footer */}
      <LandingFooter />
    </div>
  );
};

export default LandingPage;

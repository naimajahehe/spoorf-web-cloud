import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Sparkles, Crown, ArrowRight, Shield } from 'lucide-react';

interface PricingTier {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  badge?: string;
  popular?: boolean;
  ctaText: string;
  ctaLink: string;
  features: string[];
}

export const PricingTiers: React.FC = () => {
  const tiers: PricingTier[] = [
    {
      id: 'free',
      name: 'Community Free',
      price: '$0',
      period: 'forever free',
      description: 'Essential Layer 2 network visibility and fundamental defense for solo operators.',
      ctaText: 'Get Started Free',
      ctaLink: '/register',
      features: [
        '1 Active Desktop Client Session',
        'Max 5 Concurrent Active Device Cuts',
        'Sub-Second L2 Subnet Discovery',
        'Hardcoded Invariant 1 (Gateway Router Immune)',
        'Hardcoded Invariant 2 (Controller Self-Cut Guard)',
        '30-Second Cloud Heartbeat Sync',
        'Standard Community Support',
      ],
    },
    {
      id: 'pro',
      name: 'Sentinel Pro',
      price: '$19',
      period: 'per month',
      description: 'Uncapped bandwidth control, captive portal redirection, and automated enforcement.',
      badge: 'Most Popular',
      popular: true,
      ctaText: 'Start Pro Console',
      ctaLink: '/register',
      features: [
        '2 Concurrent Active Desktop Sessions',
        'Unlimited Concurrent Device Cuts',
        'PWM Duty-Cycle Bandwidth Limiting (10%–90%)',
        'HTTP/HTTPS Captive Portal Redirection',
        'Automatic Periodic Re-blocking Engine',
        'Zero-HWID Cryptographic Identity',
        'Instant Remote Session Revocation (Kick)',
        'Priority Email & Community Support',
      ],
    },
    {
      id: 'vip',
      name: 'Enterprise VIP',
      price: '$49',
      period: 'per month',
      description: 'Advanced defensive arsenal, deep telemetry, and multi-seat security team orchestration.',
      badge: 'Full Arsenal',
      ctaText: 'Deploy VIP Fleet',
      ctaLink: '/register',
      features: [
        '5 Concurrent Active Desktop Sessions',
        'Unlimited Device Cuts & Fleet Nodes',
        'Full Bettercap Arsenal Integration',
        'Autonomous Leaf SSL Certificate Generator',
        'Deep Passive DHCP & NetBIOS OS Profiling',
        'Multi-Seat Session Audit Ledger',
        'Custom Webhook & Telemetry Alerts',
        'Dedicated SLA & 1-on-1 Architecture Support',
      ],
    },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 max-w-7xl mx-auto border-t border-border/80">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/5 border border-brand/15 text-brand text-xs font-mono tracking-wider uppercase mb-4">
          <Crown className="w-3.5 h-3.5" />
          <span>Predictable Pricing</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight text-foreground leading-[1.15] mb-5">
          Simple, transparent tiers for{' '}
          <span className="font-serif italic font-normal text-brand">every operator</span>.
        </h2>
        <p className="text-muted text-base sm:text-lg leading-relaxed">
          From solo network diagnostics to distributed multi-seat fleet administration.
          Zero hidden lock-ins, zero hardware tracking.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {tiers.map((tier) => {
          return (
            <div
              key={tier.id}
              className={`rounded-3xl p-8 sm:p-9 flex flex-col justify-between relative transition-all duration-300 ${
                tier.popular
                  ? 'bg-white border-2 border-brand shadow-brand-glow -translate-y-2'
                  : 'bg-white/70 backdrop-blur-sm border border-border/80 shadow-card hover:border-brand/40'
              }`}
            >
              {/* Most Popular Ribbon */}
              {tier.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-brand text-white text-[11px] font-mono font-bold tracking-wider uppercase shadow-md flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  <span>{tier.badge}</span>
                </div>
              )}

              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-sans font-bold text-foreground">
                    {tier.name}
                  </h3>
                  {!tier.popular && tier.badge && (
                    <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-border">
                      {tier.badge}
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted leading-relaxed mb-6 min-h-[36px]">
                  {tier.description}
                </p>

                {/* Price Display */}
                <div className="mb-6 pb-6 border-b border-border/60">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl sm:text-5xl font-sans font-bold tracking-tight text-foreground">
                      {tier.price}
                    </span>
                    <span className="text-xs font-mono text-muted">/{tier.period}</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-3.5 mb-8">
                  <div className="text-[11px] font-mono tracking-wider uppercase text-muted font-semibold">
                    INCLUDED CAPABILITIES
                  </div>
                  {tier.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          tier.popular
                            ? 'bg-brand/10 text-brand'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span className="text-xs text-foreground/90 leading-tight">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div>
                <Link
                  to={tier.ctaLink}
                  className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
                    tier.popular
                      ? 'bg-brand hover:bg-brand-hover text-white shadow-brand-glow'
                      : 'bg-slate-100 hover:bg-slate-200 text-foreground border border-border'
                  }`}
                >
                  <span>{tier.ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Assurance Footer */}
      <div className="mt-14 text-center">
        <div className="inline-flex items-center gap-2 text-xs text-muted">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>
            No credit card required for Community Free tier. Instant activation upon email verification.
          </span>
        </div>
      </div>
    </section>
  );
};

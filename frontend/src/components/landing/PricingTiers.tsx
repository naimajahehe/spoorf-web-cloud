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
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'See your whole network and cut off unwanted devices, on one machine.',
      ctaText: 'Get started free',
      ctaLink: '/register',
      features: [
        'One desktop device at a time',
        'Cut off up to 5 devices at once',
        'Full network scan with device details',
        'Router protected from mistakes',
        'Your own PC protected',
        'Sign out remotely within 30 seconds',
        'Community support',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$19',
      period: 'per month',
      description: 'Unlimited devices, bandwidth limiting, and two machines signed in at once.',
      badge: 'Most popular',
      popular: true,
      ctaText: 'Choose Pro',
      ctaLink: '/register',
      features: [
        'Two desktop devices at a time',
        'Cut off unlimited devices',
        'Limit any device to 10%–90% speed',
        'Captive portal redirection',
        'Re-blocks a device if it comes back',
        'No hardware tracking',
        'Sign out any device remotely',
        'Priority email support',
      ],
    },
    {
      id: 'vip',
      name: 'VIP',
      price: '$49',
      period: 'per month',
      description: 'Everything in Pro, plus advanced testing tools and support for a whole team.',
      badge: 'For teams',
      ctaText: 'Choose VIP',
      ctaLink: '/register',
      features: [
        'Five desktop devices at a time',
        'Unlimited devices',
        'Advanced lab-testing toolkit',
        'Certificate tooling for testing',
        'Detailed device and OS detection',
        'Team session audit log',
        'Custom alerts and webhooks',
        'Dedicated support with an SLA',
      ],
    },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 max-w-7xl mx-auto border-t border-border">
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
          From one machine to a whole team. No hidden fees, and no hardware tracking on any plan.
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
                  : 'bg-white/70 backdrop-blur-sm border border-border shadow-card hover:border-brand/40'
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
                <div className="mb-6 pb-6 border-b border-border">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl sm:text-5xl font-sans font-bold tracking-tight text-foreground">
                      {tier.price}
                    </span>
                    <span className="text-xs font-mono text-muted">/{tier.period}</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-3.5 mb-8">
                  <div className="text-xs text-muted font-semibold">What's included</div>
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
            No credit card needed for the Free plan. Your account is ready as soon as you sign up.
          </span>
        </div>
      </div>
    </section>
  );
};

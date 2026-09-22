import React from 'react';
import { Check, Shield, Cloud, Terminal, Cpu } from 'lucide-react';

interface FeatureItem {
  name: string;
  detail: string;
  badge?: string;
}

interface FeatureColumn {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  badge: string;
  items: FeatureItem[];
}

export const FeatureMatrix: React.FC = () => {
  const columns: FeatureColumn[] = [
    {
      title: 'Layer 2 Engine',
      subtitle: 'Microsecond packet injection & invariant defense',
      icon: Cpu,
      badge: 'L2 Core',
      items: [
        {
          name: 'Sub-Second ARP Scanning',
          detail: 'Raw socket frame injection discovers 254 subnet hosts in < 1.0s.',
          badge: 'Fast',
        },
        {
          name: 'Passive DHCP Fingerprinting',
          detail: 'Sniffs Option 55 parameter requests & Option 60 vendor class identifiers.',
        },
        {
          name: 'NetBIOS & OUI Resolution',
          detail: 'Resolves Windows workstation hostnames & 48,000+ IEEE hardware vendors.',
        },
        {
          name: 'PWM Duty-Cycle Throttling',
          detail: 'Smooth bandwidth choking (10%–90%) without dropping TCP handshakes.',
          badge: 'Patented',
        },
        {
          name: 'Hardcoded Invariant 1 (Gateway)',
          detail: 'Default router IP/MAC cannot be spoofed or severed (SpoofError).',
          badge: 'Immune',
        },
        {
          name: 'Hardcoded Invariant 2 (Controller)',
          detail: 'Operator host interface is mathematically immune from self-severing.',
          badge: 'Protected',
        },
        {
          name: 'RFC 1918 Private Scope Check',
          detail: 'Strict boundary check rejects 0.0.0.0, 255.255.255.255, and public IPs.',
        },
      ],
    },
    {
      title: 'Cloud Fleet Hub',
      subtitle: 'Centralized multi-seat governance & remote kill-switch',
      icon: Cloud,
      badge: 'SaaS Fleet',
      items: [
        {
          name: '30s Resilient Heartbeat',
          detail: 'Continuous health check between desktop client and cloud orchestrator.',
          badge: 'Real-time',
        },
        {
          name: 'Instant Session Kick',
          detail: 'Revoke rogue or shared login sessions remotely in under 30 seconds.',
          badge: 'Instant',
        },
        {
          name: 'Tier-Enforced Cut Quotas',
          detail: 'Real-time enforcement of active cut limits per subscription license.',
        },
        {
          name: 'Zero-HWID Privacy Architecture',
          detail: 'Zero disk serials, MAC addresses, or CPU hashes collected or stored.',
          badge: 'Privacy',
        },
        {
          name: 'Asymmetric RS256 Authentication',
          detail: 'Stateless cryptographically signed JWT tokens with rotation guards.',
        },
        {
          name: 'Multi-Device Session Management',
          detail: 'View client IP, browser user-agent, and last heartbeat timestamps.',
        },
        {
          name: 'Fail-Closed Network Guard',
          detail: 'Auto-reblocks or safely restores ARP tables upon session termination.',
        },
      ],
    },
    {
      title: 'Engineering Rigor',
      subtitle: 'Enterprise-grade code hygiene & full test coverage',
      icon: Terminal,
      badge: 'Standards',
      items: [
        {
          name: '562 Automated Test Suite',
          detail: 'Continuous integration running 434 Python + 128 Node.js unit tests.',
          badge: '100% Green',
        },
        {
          name: 'Strict TypeScript Everywhere',
          detail: 'Zero implicit any, full type safety across both frontend and backend.',
        },
        {
          name: 'Zod Runtime Schema Validation',
          detail: 'All incoming HTTP payloads, query params, and WebSocket events validated.',
        },
        {
          name: 'Pino ECS Structured Logging',
          detail: 'Standardized JSON logs with correlation IDs for seamless log shipping.',
        },
        {
          name: 'SQLite 3 WAL Concurrency',
          detail: 'Write-Ahead Logging prevents database locks during high-volume scans.',
        },
        {
          name: 'Tailwind Design System',
          detail: 'Strict design tokens adhering to Warm Editorial Paper aesthetics.',
        },
        {
          name: 'Docker & Compose Ready',
          detail: 'Containerized multi-stage builds ready for production Kubernetes or VPS.',
        },
      ],
    },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 max-w-7xl mx-auto border-t border-border/80">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/5 border border-brand/15 text-brand text-xs font-mono tracking-wider uppercase mb-4">
          <Shield className="w-3.5 h-3.5" />
          <span>Capability Matrix</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight text-foreground leading-[1.15] mb-5">
          Engineered to the most exacting{' '}
          <span className="font-serif italic font-normal text-brand">standards</span>.
        </h2>
        <p className="text-muted text-base sm:text-lg leading-relaxed">
          Compare the core capabilities powering the Spoorf Sentinel engine, cloud fleet coordination,
          and production security architecture.
        </p>
      </div>

      {/* 3-Column Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {columns.map((col, idx) => {
          const Icon = col.icon;
          return (
            <div
              key={idx}
              className="bg-white/70 backdrop-blur-sm border border-border/80 rounded-3xl p-7 sm:p-8 shadow-card flex flex-col justify-between hover:border-brand/30 transition-all duration-300"
            >
              <div>
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono tracking-wider uppercase font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-border">
                    {col.badge}
                  </span>
                </div>

                <h3 className="text-xl font-sans font-bold text-foreground mb-1">
                  {col.title}
                </h3>
                <p className="text-xs text-muted leading-relaxed mb-6">
                  {col.subtitle}
                </p>

                {/* Items List */}
                <div className="space-y-4 pt-4 border-t border-border/60">
                  {col.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shrink-0 mt-0.5">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-semibold text-foreground">
                            {item.name}
                          </span>
                          {item.badge && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-brand/5 text-brand border border-brand/15">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted mt-0.5 leading-normal">
                          {item.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

import React from 'react';
import { Gauge, ShieldCheck, Zap, RefreshCw } from 'lucide-react';

export const MissionLead: React.FC = () => {
  const metrics = [
    {
      value: '30s',
      label: 'Remote session control',
      detail: 'Revoke a device from the web portal and it drops on the next heartbeat.',
      icon: RefreshCw,
    },
    {
      value: '7 days',
      label: 'Works offline',
      detail: 'Your licence keeps working during the grace window when the cloud is unreachable.',
      icon: Gauge,
    },
    {
      value: 'RS256',
      label: 'Signed licences',
      detail: 'Every licence token is cryptographically signed and verified on your own machine.',
      icon: ShieldCheck,
    },
    {
      value: 'Zero',
      label: 'Hardware IDs stored',
      detail: 'No disk serials, MAC addresses, or CPU hashes are ever collected.',
      icon: Zap,
    },
  ];

  return (
    <section className="py-20 px-4 max-w-6xl mx-auto border-t border-border text-center">
      {/* Editorial Lead Quote with Instrument Serif Accent */}
      <h2 className="text-3xl sm:text-5xl font-sans font-bold tracking-[-0.025em] text-foreground max-w-3xl mx-auto leading-[1.15] text-balance">
        You cannot defend what you cannot{' '}
        <span className="font-serif italic font-normal text-brand px-1">see</span>.
      </h2>

      <p className="mt-6 text-sm sm:text-base text-ink/80 max-w-2xl mx-auto leading-relaxed text-balance font-sans">
        Unknown devices on your local network go unnoticed until they slow it down or misbehave.
        Sentinel shows you every device on the network, lets you limit or cut off the ones that
        shouldn't be there, and keeps your router and your own machine off-limits the whole time.
      </p>

      {/* 4-Column Proof Metric Ticker */}
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
        {metrics.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="bg-white/80 border border-border rounded-2xl p-6 shadow-card hover:shadow-panel transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-surface-muted flex items-center justify-center text-ink group-hover:text-brand group-hover:bg-brand/10 transition-colors mb-4">
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-3xl font-sans font-bold tracking-tight text-foreground font-mono">
                {item.value}
              </div>
              <h4 className="mt-2 text-xs font-semibold text-foreground tracking-tight">
                {item.label}
              </h4>
              <p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed">
                {item.detail}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default MissionLead;

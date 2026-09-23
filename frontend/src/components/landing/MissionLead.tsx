import React from 'react';
import { Gauge, ShieldCheck, Zap, RefreshCw } from 'lucide-react';

export const MissionLead: React.FC = () => {
  const metrics = [
    {
      value: '< 1.0s',
      label: 'Sub-Second Host Discovery',
      detail: 'Raw ARP sweeps & passive DHCP Option 55/60 identification',
      icon: Zap,
    },
    {
      value: '100k+',
      label: 'Packets / Sec Injected',
      detail: 'High-speed Scapy & Windows Npcap raw Ethernet injection',
      icon: Gauge,
    },
    {
      value: '0ms',
      label: 'Gateway Disruption',
      detail: 'Zero collateral damage with hardcoded Invariant 1 immunity',
      icon: ShieldCheck,
    },
    {
      value: '30s',
      label: 'Cloud Fleet Heartbeat',
      detail: 'Sub-minute remote session kick & sliding 7-day grace period',
      icon: RefreshCw,
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
        Unmonitored devices on Layer 2 are the blind spot of every private network: rogue
        occupants consuming bandwidth, spoofing attacks, and untracked sessions. Sentinel brings
        zero-collateral Layer 2 manipulation, real-time packet telemetry, and cloud fleet
        authorization under one neutral surface.
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

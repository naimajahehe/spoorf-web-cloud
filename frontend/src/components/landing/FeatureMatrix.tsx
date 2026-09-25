import React from 'react';
import { Check, Shield, Cloud, Cpu } from 'lucide-react';

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
      title: 'On your network',
      subtitle: 'What the desktop app does on your local network',
      icon: Cpu,
      badge: 'Desktop',
      items: [
        {
          name: 'Find devices in seconds',
          detail: 'Scan your network and list every device with its IP address, vendor, and hostname.',
        },
        {
          name: 'See what each device is',
          detail: 'Reads DHCP and NetBIOS hints to identify the operating system and device type.',
        },
        {
          name: 'Limit bandwidth, not just block',
          detail: 'Throttle a device between 10% and 90% of its speed instead of cutting it off entirely.',
        },
        {
          name: 'Your router stays a target-free zone',
          detail: 'The gateway is locked out, so you cannot knock the whole network offline by mistake.',
        },
        {
          name: 'Your own machine is protected',
          detail: 'Sentinel refuses to cut the connection it is running on.',
        },
        {
          name: 'Stays inside your network',
          detail: 'Only private-range addresses can be acted on; public IPs are rejected.',
        },
      ],
    },
    {
      title: 'From the cloud',
      subtitle: 'Manage your account and devices from anywhere',
      icon: Cloud,
      badge: 'Cloud',
      items: [
        {
          name: 'One account, every machine',
          detail: 'Sign in on any desktop and your licence and settings follow you.',
        },
        {
          name: 'Cut a device from anywhere',
          detail: 'Revoke a session from the web portal; the desktop drops it on the next 30-second check.',
        },
        {
          name: 'Device limits per plan',
          detail: 'Free covers one machine, Pro two, VIP five — enforced by the server, not the app.',
        },
        {
          name: 'See where you are signed in',
          detail: 'Review each session’s device, IP address, and last-seen time from the dashboard.',
        },
        {
          name: 'Keeps working offline',
          detail: 'Your licence stays valid for a 7-day grace window when the cloud is unreachable.',
        },
        {
          name: 'Restores the network on exit',
          detail: 'When a session ends, blocked devices are safely returned to normal.',
        },
      ],
    },
    {
      title: 'Built to trust',
      subtitle: 'How your privacy and security are handled',
      icon: Shield,
      badge: 'Security',
      items: [
        {
          name: 'No hardware tracking',
          detail: 'No disk serials, MAC addresses, or CPU IDs are ever collected or stored.',
        },
        {
          name: 'Signed licences',
          detail: 'Every licence is signed with RS256 and verified on your machine, even offline.',
        },
        {
          name: 'Your LAN data stays local',
          detail: 'The cloud never receives the device names, IP addresses, or traffic on your network.',
        },
        {
          name: 'Checked before it runs',
          detail: 'Every request to the server is validated, so malformed input is rejected safely.',
        },
        {
          name: 'Covered by tests',
          detail: '562 automated tests (430 Python, 132 Node) run on every change.',
        },
      ],
    },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 max-w-7xl mx-auto border-t border-border">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/5 border border-brand/15 text-brand text-xs font-mono tracking-wider uppercase mb-4">
          <Shield className="w-3.5 h-3.5" />
          <span>What you get</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight text-foreground leading-[1.15] mb-5">
          Everything Sentinel does, in{' '}
          <span className="font-serif italic font-normal text-brand">plain terms</span>.
        </h2>
        <p className="text-muted text-base sm:text-lg leading-relaxed">
          What runs on your machine, what the cloud adds, and how your data is kept private.
        </p>
      </div>

      {/* 3-Column Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {columns.map((col, idx) => {
          const Icon = col.icon;
          return (
            <div
              key={idx}
              className="bg-white/70 backdrop-blur-sm border border-border rounded-3xl p-7 sm:p-8 shadow-card flex flex-col justify-between hover:border-brand/30 transition-all duration-300"
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
                <div className="space-y-4 pt-4 border-t border-border">
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

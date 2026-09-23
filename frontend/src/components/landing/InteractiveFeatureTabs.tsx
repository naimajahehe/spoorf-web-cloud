import React, { useState, useEffect } from 'react';
import {
  Search,
  Gauge,
  ShieldCheck,
  CloudLightning,
  Laptop,
  Smartphone,
  Server,
  PowerOff,
  Radio,
} from 'lucide-react';

interface TabItem {
  id: string;
  title: string;
  badge: string;
  headline: string;
  description: string;
  icon: React.ElementType;
}

export const InteractiveFeatureTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Interactive slider state for Tab 2 (PWM)
  const [speedLimit, setSpeedLimit] = useState<number>(25);

  // Interactive kick state for Tab 4 (Cloud Kick)
  const [isKicked, setIsKicked] = useState<boolean>(false);

  const tabs: TabItem[] = [
    {
      id: 'discovery',
      title: 'See every device',
      badge: 'Discovery',
      headline: 'Know what is on your network',
      description:
        'Scans your network and lists each device with its IP address, vendor, operating system, and hostname — nothing to install on the other devices.',
      icon: Search,
    },
    {
      id: 'throttling',
      title: 'Limit bandwidth',
      badge: 'Bandwidth',
      headline: 'Slow a device without cutting it off',
      description:
        'Set any device between 10% and 90% of its normal speed, so you can ease off a bandwidth hog without kicking it off the network entirely.',
      icon: Gauge,
    },
    {
      id: 'invariants',
      title: 'Safe by design',
      badge: 'Safety',
      headline: 'Your router and your PC are off-limits',
      description:
        'The gateway and the machine you are running on can never be targeted, so a wrong click cannot take the whole network down.',
      icon: ShieldCheck,
    },
    {
      id: 'fleet',
      title: 'Manage from the web',
      badge: 'Cloud',
      headline: 'Cut access from anywhere',
      description:
        'Review the devices signed in to your account and revoke any of them from the web portal; the desktop drops the session within 30 seconds.',
      icon: CloudLightning,
    },
  ];

  // Auto-advance loop: 6000ms duration per tab
  useEffect(() => {
    if (isPaused) return;

    const intervalMs = 60;
    const totalDuration = 6000;
    const step = (intervalMs / totalDuration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveTab((curr) => (curr + 1) % tabs.length);
          return 0;
        }
        return prev + step;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPaused, tabs.length]);

  const handleSelectTab = (index: number) => {
    setActiveTab(index);
    setProgress(0);
  };

  return (
    <section className="py-24 px-4 max-w-6xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-[11px] font-mono uppercase tracking-widest text-brand font-bold px-3 py-1 rounded-full bg-brand/10 border border-brand/20">
          How it works
        </span>
        <h2 className="text-3xl sm:text-4xl font-sans font-bold tracking-tight text-foreground mt-4">
          Four things Sentinel does well.
        </h2>
        <p className="mt-3 text-sm text-ink/75 leading-relaxed">
          Pick a tab to see how each one works, from finding devices to managing them from the web.
        </p>
      </div>

      {/* Main Grid: Left Tabs List, Right Live Interactive Preview */}
      <div
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Left Column: 4 Selectable Tabs (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3.5 justify-center">
          {tabs.map((tab, idx) => {
            const isActive = idx === activeTab;
            const Icon = tab.icon;
            return (
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                key={tab.id}
                onClick={() => handleSelectTab(idx)}
                className={`w-full p-5 rounded-2xl border transition-all cursor-pointer select-none text-left relative overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                  isActive
                    ? 'bg-white border-brand/40 shadow-panel'
                    : 'bg-white/60 border-border hover:bg-white/90 shadow-sm'
                }`}
              >
                {/* Progress bar line for active tab */}
                {isActive && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-brand/10">
                    <div
                      className="h-full bg-brand transition-all duration-75"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}

                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-brand text-white shadow-sm'
                        : 'bg-surface-muted text-ink'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-foreground tracking-tight">
                    {tab.title}
                  </span>
                  <span className="ml-auto text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-surface-muted text-muted-foreground">
                    {tab.badge}
                  </span>
                </div>

                <p className="text-xs text-ink/70 leading-relaxed">{tab.description}</p>
              </button>
            );
          })}
        </div>

        {/* Right Column: Interactive Live Preview Card (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-border shadow-panel rounded-3xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative min-h-[420px]">
          {/* Subtle Ambient Background Wash */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand/5 rounded-full blur-3xl pointer-events-none" />

          {/* Header of Active Feature */}
          <div className="relative z-10">
            <span className="text-[10px] font-mono uppercase tracking-wider text-brand font-bold">
              {tabs[activeTab].badge}
            </span>
            <h3 className="text-xl font-sans font-bold text-foreground tracking-tight mt-1">
              {tabs[activeTab].headline}
            </h3>
            <p className="text-xs text-ink/70 mt-1">{tabs[activeTab].description}</p>
          </div>

          {/* Dynamic Interactive Body matching activeTab */}
          <div className="relative z-10 my-6 flex-1 flex flex-col justify-center">
            {/* Tab 0: L2 Discovery Interactive Table */}
            {activeTab === 0 && (
              <div className="border border-border rounded-xl bg-surface-muted p-4 space-y-2.5 font-sans">
                <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground pb-2 border-b border-border">
                  <span>DISCOVERED HOSTS (3 ACTIVE)</span>
                  <span className="text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 status-pulse" />
                    Scan Completed (742ms)
                  </span>
                </div>
                {[
                  {
                    name: "Naim's iPhone 16 Pro",
                    ip: '192.168.1.104',
                    mac: '3c:22:fb:88:12:09',
                    vendor: 'Apple, Inc.',
                    icon: Smartphone,
                    status: 'Normal',
                  },
                  {
                    name: 'Samsung Galaxy Tab S9',
                    ip: '192.168.1.155',
                    mac: '02:bb:cc:dd:ee:55',
                    vendor: 'Samsung Electronics',
                    icon: Smartphone,
                    status: 'Normal',
                  },
                  {
                    name: 'Ubuntu Home Media Server',
                    ip: '192.168.1.200',
                    mac: 'b8:27:eb:c4:d1:77',
                    vendor: 'Raspberry Pi / Linux',
                    icon: Server,
                    status: 'Protected',
                  },
                ].map((device) => {
                  const DeviceIcon = device.icon;
                  return (
                    <div
                      key={device.ip}
                      className="bg-white border border-border rounded-lg p-2.5 flex items-center justify-between text-xs shadow-sm hover:border-brand/30 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-md bg-surface-muted flex items-center justify-center text-ink">
                          <DeviceIcon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground text-[11px]">
                            {device.name}
                          </div>
                          <div className="text-[10px] font-mono text-muted-foreground">
                            {device.ip} · {device.mac}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {device.vendor}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab 1: Precision PWM Interactive Speed Slider */}
            {activeTab === 1 && (
              <div className="border border-border rounded-xl bg-surface-muted p-5 space-y-4">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                  <span>Target: 192.168.1.84 (Unknown Rogue Host)</span>
                  <span className="font-mono text-brand font-bold text-sm">
                    {speedLimit}% Bandwidth
                  </span>
                </div>

                <input
                  type="range"
                  min="10"
                  max="90"
                  step="5"
                  value={speedLimit}
                  onChange={(e) => setSpeedLimit(Number(e.target.value))}
                  className="w-full accent-[#5b34e8] cursor-pointer"
                />

                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="bg-white border border-border rounded-lg p-2.5 text-center shadow-sm">
                    <div className="text-[10px] uppercase font-mono text-muted-foreground">
                      Simulated Speed
                    </div>
                    <div className="text-base font-mono font-bold text-foreground mt-0.5">
                      {(speedLimit * 1.2).toFixed(1)} Mbps
                    </div>
                  </div>
                  <div className="bg-white border border-border rounded-lg p-2.5 text-center shadow-sm">
                    <div className="text-[10px] uppercase font-mono text-muted-foreground">
                      Speed limit
                    </div>
                    <div className="text-base font-mono font-bold text-brand mt-0.5">
                      {100 - speedLimit}0 μs
                    </div>
                  </div>
                  <div className="bg-white border border-border rounded-lg p-2.5 text-center shadow-sm">
                    <div className="text-[10px] uppercase font-mono text-muted-foreground">
                      TCP Packet Drops
                    </div>
                    <div className="text-base font-mono font-bold text-emerald-600 mt-0.5">
                      0.00%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Zero-Collateral Invariant Shield */}
            {activeTab === 2 && (
              <div className="border border-border rounded-xl bg-surface-muted p-5 space-y-3">
                <div className="bg-white border border-border rounded-xl p-3.5 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-700 flex items-center justify-center">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">
                        Your router (192.168.1.1)
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        Can never be targeted
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                    PROTECTED
                  </span>
                </div>

                <div className="bg-white border border-border rounded-xl p-3.5 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                      <Laptop className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">
                        This PC (the one you're on)
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        Can never cut its own connection
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                    PROTECTED
                  </span>
                </div>
              </div>
            )}

            {/* Tab 3: Cloud Fleet Remote Kick Simulation */}
            {activeTab === 3 && (
              <div className="border border-border rounded-xl bg-surface-muted p-4 space-y-3 font-sans">
                <div className="bg-white border border-border rounded-xl p-3.5 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <Laptop className="w-4 h-4 text-brand" />
                    <div>
                      <div className="text-xs font-bold text-foreground">
                        MacBook-Pro-M2 (Session: mac_b184)
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground">
                        Location: Jakarta, ID · Last seen: 12s ago
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsKicked(!isKicked)}
                    className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    {isKicked ? 'Access cut' : 'Cut access'}
                  </button>
                </div>

                {isKicked && (
                  <div className="p-3 bg-rose-950/10 border border-rose-200 rounded-lg text-left text-xs text-rose-800 flex items-start gap-2 animate-fadeIn">
                    <PowerOff className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">The desktop is notified:</span>
                      <p className="text-[11px] text-rose-700 mt-0.5">
                        A "session ended" message appears on that machine, then it returns to the
                        sign-in screen.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="relative z-10 pt-3 border-t border-border flex items-center justify-between text-[11px] font-mono text-muted-foreground">
            <span>Interactive demo</span>
            <span className="text-brand font-semibold">v2.41</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InteractiveFeatureTabs;

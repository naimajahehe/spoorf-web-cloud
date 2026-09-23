import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Laptop,
  Radio,
  Cloud,
  Download,
  ArrowRight,
  Activity,
  AlertTriangle,
  Zap,
  CheckCircle2,
} from 'lucide-react';

export const HeroTopology: React.FC = () => {
  return (
    <section className="relative pt-12 pb-20 px-4 max-w-6xl mx-auto flex flex-col items-center text-center">
      {/* Micro Announcement Pill */}
      <a
        href="#showcase"
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-border shadow-sm text-[11px] font-medium text-ink hover:border-brand/40 transition-colors mb-8 group"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-brand" />
        <span>Sentinel v2.41</span>
        <span className="text-ink/40">•</span>
        <span className="text-foreground">Cut a device from the web portal — it drops within 30 seconds</span>
        <ArrowRight className="w-3 h-3 text-brand group-hover:translate-x-0.5 transition-transform" />
      </a>

      {/* Main Editorial Headline with Instrument Serif Italic */}
      <h1 className="text-4xl sm:text-6xl lg:text-[72px] font-sans font-bold tracking-[-0.03em] text-foreground leading-[1.08] max-w-4xl text-balance">
        One console for every device on your{' '}
        <span className="font-serif italic font-normal text-brand px-1">network</span>.
      </h1>

      {/* Subheadline */}
      <p className="mt-6 text-sm sm:text-base text-ink/80 max-w-2xl leading-relaxed text-balance">
        Sentinel finds every device on your local network in seconds, and lets you slow down or cut
        off the ones that don't belong. Your router and your own connection stay untouched, and you
        can manage it all from one machine or from the web.
      </p>

      {/* CTA Button Group */}
      <div className="mt-9 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
        <Link
          to="/register"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-brand hover:bg-brand-hover text-white text-xs font-semibold tracking-wide shadow-brand-glow hover:shadow-panel transition-all active:scale-[0.98]"
        >
          <span>Get started free</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          to="/download"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-surface-muted border border-border text-foreground text-xs font-semibold tracking-wide shadow-sm hover:shadow-card transition-all"
        >
          <Download className="w-4 h-4 text-ink" />
          <span>Download the app</span>
        </Link>
      </div>

      {/* Micro Copy Guarantees */}
      <p className="mt-3.5 text-[11px] text-ink/50 font-mono">
        No hardware tracking · No credit card required · Free tier covers 5 devices
      </p>

      {/* Dynamic Sentinel Fleet Topology Showcase Canvas */}
      <div className="relative w-full max-w-5xl h-[480px] mt-14 bg-white/70 backdrop-blur-sm border border-border rounded-3xl shadow-panel overflow-hidden p-6 select-none">
        {/* Subtle Paper Grid Background inside Showcase */}
        <div className="absolute inset-0 bg-grid-paper opacity-70 pointer-events-none" />

        {/* Ambient Radial Glow behind Center Engine */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-brand/10 rounded-full blur-3xl pointer-events-none" />

        {/* SVG Bezier Connection Lines Overlay */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 960 480"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="grad-pulse" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5b34e8" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0d9488" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Curve 1: Operator Host (Top-Left) to Center Hub */}
          <path
            d="M 220 110 C 340 140, 400 180, 480 230"
            fill="none"
            stroke="url(#grad-pulse)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            className="animate-pulse"
          />

          {/* Curve 2: Gateway Router (Top-Right) to Center Hub */}
          <path
            d="M 740 110 C 620 140, 560 180, 480 230"
            fill="none"
            stroke="#5b34e8"
            strokeOpacity="0.35"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Curve 3: Target Device (Bottom-Left) to Center Hub */}
          <path
            d="M 220 370 C 340 340, 400 300, 480 250"
            fill="none"
            stroke="#b45309"
            strokeOpacity="0.4"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Curve 4: Cloud Fleet Manager (Bottom-Right) to Center Hub */}
          <path
            d="M 740 370 C 620 340, 560 300, 480 250"
            fill="none"
            stroke="#5b34e8"
            strokeOpacity="0.5"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        </svg>

        {/* Center Node: Core Sentinel Engine Hub */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-64 bg-foreground text-white rounded-2xl p-4 border border-white/10 shadow-2xl flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-xl bg-brand/20 border border-brand/40 flex items-center justify-center text-brand mb-2.5">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-brand font-semibold">
            Core Engine L2
          </span>
          <h4 className="text-sm font-bold text-white tracking-tight mt-0.5">
            NetCut Sentinel Daemon
          </h4>
          <div className="mt-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-mono text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 status-pulse" />
            <span>L2 engine active</span>
          </div>
        </div>

        {/* Node 1: Operator Host (Top Left) */}
        <div className="absolute top-8 left-6 md:left-14 z-10 w-52 bg-white/95 border border-border shadow-card rounded-xl p-3 text-left wander-x">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-semibold text-foreground">This PC</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-600 status-pulse" />
          </div>
          <p className="text-[11px] font-mono text-ink/70">192.168.1.5</p>
          <div className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-[9px] font-mono text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>Protected</span>
          </div>
        </div>

        {/* Node 2: Router Gateway (Top Right) */}
        <div className="absolute top-8 right-6 md:right-14 z-10 w-52 bg-white/95 border border-border shadow-card rounded-xl p-3 text-left wander-y">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-600" />
              <span className="text-xs font-semibold text-foreground">Fiber Gateway</span>
            </div>
            <Shield className="w-3 h-3 text-cyan-600" />
          </div>
          <p className="text-[11px] font-mono text-ink/70">192.168.1.1</p>
          <div className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-50 text-[9px] font-mono text-cyan-700 border border-cyan-200">
            <Shield className="w-2.5 h-2.5" />
            <span>Protected</span>
          </div>
        </div>

        {/* Node 3: Target Rogue Device (Bottom Left) */}
        <div className="absolute bottom-8 left-6 md:left-14 z-10 w-52 bg-white/95 border border-border shadow-card rounded-xl p-3 text-left wander-y">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-xs font-semibold text-foreground">Unknown Host</span>
            </div>
            <Zap className="w-3 h-3 text-amber-600" />
          </div>
          <p className="text-[11px] font-mono text-ink/70">192.168.1.84</p>
          <div className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-[9px] font-mono text-amber-700 border border-amber-200">
            <span>Throttled to 25%</span>
          </div>
        </div>

        {/* Node 4: Cloud Fleet Manager (Bottom Right) */}
        <div className="absolute bottom-8 right-6 md:right-14 z-10 w-52 bg-white/95 border border-border shadow-card rounded-xl p-3 text-left wander-x">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-brand" />
              <span className="text-xs font-semibold text-foreground">Cloud Fleet Hub</span>
            </div>
            <span className="text-[10px] font-mono text-brand font-bold">30s</span>
          </div>
          <p className="text-[11px] font-mono text-ink/70">api.spoorf.app</p>
          <div className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-brand/10 text-[9px] font-mono text-brand border border-brand/20">
            <span>Managed from cloud</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroTopology;

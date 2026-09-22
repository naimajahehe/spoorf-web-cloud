import React from 'react';
import {
  Layers,
  Fingerprint,
  Radio,
  Database,
  ShieldCheck,
  Zap,
  Lock,
  Terminal,
} from 'lucide-react';

export const BentoFeatures: React.FC = () => {
  return (
    <section className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/5 border border-brand/15 text-brand text-xs font-mono tracking-wider uppercase mb-4">
          <Layers className="w-3.5 h-3.5" />
          <span>System Architecture</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight text-foreground leading-[1.15] mb-5">
          Crafted for absolute Layer 2{' '}
          <span className="font-serif italic font-normal text-brand">supremacy</span>.
        </h2>
        <p className="text-muted text-base sm:text-lg leading-relaxed">
          Four decoupled layers engineered for sub-millisecond packet injection, zero memory leaks,
          and uncompromising zero-telemetry privacy.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
        {/* Card 1: Hybrid Microservices (Brand Gradient, 7 cols) */}
        <div className="lg:col-span-7 texture-wash-brand border border-border/80 rounded-3xl p-8 sm:p-10 shadow-card flex flex-col justify-between relative overflow-hidden group hover:border-brand/40 transition-all duration-300">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-mono tracking-wider uppercase text-brand font-semibold px-2.5 py-1 rounded-md bg-white/70 border border-brand/20">
                Hybrid Microservices
              </span>
              <div className="w-9 h-9 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                <Zap className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl sm:text-3xl font-sans font-bold text-foreground mb-3">
              Tri-Service Decoupled Engine
            </h3>
            <p className="text-muted text-sm sm:text-base leading-relaxed mb-8 max-w-xl">
              Python 3.11 Scapy microservice executes raw Layer 2 socket injection, Node.js 20
              orchestrates stateful Socket.IO telemetry, and React 18 renders responsive 60fps operational visuals.
            </p>
          </div>

          {/* Micro-architecture Flow Diagram */}
          <div className="relative z-10 bg-white/90 backdrop-blur-sm border border-border/70 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="text-[11px] font-mono text-muted mb-3 flex items-center justify-between">
              <span>INTER-PROCESS COMMUNICATION</span>
              <span className="text-emerald-600 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Zero Latency Bridge
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-brand/5 border border-brand/15">
                <div className="font-bold text-brand">Python 3.11</div>
                <div className="text-[10px] text-muted mt-0.5">Scapy :8001</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-100 border border-border">
                <div className="font-bold text-slate-800">Node.js 20</div>
                <div className="text-[10px] text-muted mt-0.5">Express :5000</div>
              </div>
              <div className="p-2.5 rounded-xl bg-brand/5 border border-brand/15">
                <div className="font-bold text-brand">React 18</div>
                <div className="text-[10px] text-muted mt-0.5">Vite :5173</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Zero-HWID Privacy (Mint Gradient, 5 cols) */}
        <div className="lg:col-span-5 texture-wash-mint border border-border/80 rounded-3xl p-8 sm:p-10 shadow-card flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-mono tracking-wider uppercase text-emerald-800 font-semibold px-2.5 py-1 rounded-md bg-white/70 border border-emerald-500/20">
                Zero-HWID Privacy
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700">
                <Fingerprint className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-sans font-bold text-foreground mb-3">
              Cryptographic Identity Over Hardware Tracking
            </h3>
            <p className="text-muted text-sm sm:text-base leading-relaxed mb-6">
              No hardware serials, MAC telemetry, or disk IDs ever leave your premises.
              Authentication uses asymmetric RS256 cryptographic signatures.
            </p>
          </div>

          <div className="relative z-10 bg-white/90 backdrop-blur-sm border border-border/70 rounded-2xl p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-sans font-medium text-foreground flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                Hardware Fingerprinting
              </span>
              <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                BLOCKED (0 bytes)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-sans font-medium text-foreground flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-brand" />
                Session Verification
              </span>
              <span className="font-mono text-[11px] text-brand bg-brand/5 px-2 py-0.5 rounded border border-brand/15">
                RS256 Signature
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Bettercap Arsenal & Captive Gateway (Dark Slate, 5 cols) */}
        <div className="lg:col-span-5 bg-slate-950 text-white border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-panel flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-mono tracking-wider uppercase text-amber-400 font-semibold px-2.5 py-1 rounded-md bg-amber-400/10 border border-amber-400/20">
                Offensive & Defensive
              </span>
              <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
                <Radio className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-sans font-bold text-white mb-3">
              Bettercap Arsenal & Captive Redirection
            </h3>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-6">
              Integrated DNS sinkholes, HTTP captive gateway rerouting, and autonomous leaf SSL certificate generation for controlled network testing.
            </p>
          </div>

          <div className="relative z-10 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
              <Terminal className="w-3.5 h-3.5 text-brand" />
              <span>SUBSYSTEM STATUS</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span>DNS Spoof / Sinkhole</span>
              <span className="text-emerald-400">READY (Port 53)</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span>Leaf SSL Certificate</span>
              <span className="text-emerald-400">GENERATED (ECDSA-P256)</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span>Captive Portal Reroute</span>
              <span className="text-brand">ARMED (HTTP/HTTPS)</span>
            </div>
          </div>
        </div>

        {/* Card 4: Dual-Tier Persistence (Paper Grid, 7 cols) */}
        <div className="lg:col-span-7 bg-white/80 border border-border/80 rounded-3xl p-8 sm:p-10 shadow-card bg-grid-paper flex flex-col justify-between relative overflow-hidden group hover:border-brand/40 transition-all duration-300">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-mono tracking-wider uppercase text-brand font-semibold px-2.5 py-1 rounded-md bg-white/70 border border-brand/20">
                Continuous Persistence
              </span>
              <div className="w-9 h-9 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                <Database className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl sm:text-3xl font-sans font-bold text-foreground mb-3">
              Dual-Tier Hybrid Persistence
            </h3>
            <p className="text-muted text-sm sm:text-base leading-relaxed mb-6 max-w-xl">
              Ultra-low latency local SQLite 3 in WAL mode guarantees sub-millisecond host cache lookups without locking.
              Cloud fleet state aggregates to PostgreSQL 17 for multi-seat governance.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white/90 border border-border/70 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-xs font-bold text-foreground">Local SQLite 3</span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  WAL Mode
                </span>
              </div>
              <p className="text-xs text-muted mb-2">Host discovery cache & telemetry buffer.</p>
              <div className="text-[11px] font-mono text-brand font-medium">
                &lt; 0.2ms read/write latency
              </div>
            </div>

            <div className="bg-white/90 border border-border/70 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-xs font-bold text-foreground">Cloud PostgreSQL 17</span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-brand/5 text-brand border border-brand/15">
                  Multi-Seat
                </span>
              </div>
              <p className="text-xs text-muted mb-2">Fleet session state & audit trail ledger.</p>
              <div className="text-[11px] font-mono text-brand font-medium">
                30s heartbeat reconciliation
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

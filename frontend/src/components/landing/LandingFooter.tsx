import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowRight, Download } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="pt-20 pb-12 px-4 sm:px-6 max-w-7xl mx-auto border-t border-border/80">
      {/* Closing CTA Card */}
      <div className="texture-wash-brand border border-border/80 rounded-3xl p-10 sm:p-14 text-center max-w-5xl mx-auto shadow-panel relative overflow-hidden mb-20">
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-brand/20 text-brand text-xs font-mono tracking-wider uppercase mb-5">
            <Shield className="w-3.5 h-3.5" />
            <span>Autonomous L2 Defense</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight text-foreground leading-[1.15] mb-5">
            Take full command of your Layer 2{' '}
            <span className="font-serif italic font-normal text-brand">perimeter</span>.
          </h2>

          <p className="text-muted text-sm sm:text-base leading-relaxed mb-8">
            Deploy the Spoorf Sentinel agent on your local machine or launch the Cloud Console
            to synchronize, monitor, and enforce access across your distributed fleet.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-brand hover:bg-brand-hover text-white text-xs sm:text-sm font-semibold shadow-brand-glow flex items-center justify-center gap-2 transition-all duration-200"
            >
              <span>Launch Cloud Console</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/download"
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-white hover:bg-slate-50 text-foreground border border-border text-xs sm:text-sm font-semibold shadow-sm flex items-center justify-center gap-2 transition-all duration-200"
            >
              <Download className="w-4 h-4 text-muted" />
              <span>Download Desktop Agent</span>
            </Link>
          </div>

          <div className="mt-5 text-[11px] font-mono text-muted">
            Zero-HWID architecture · 100% Free tier available · Instant setup
          </div>
        </div>
      </div>

      {/* Main Footer Links & Meta */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-border/70">
        {/* Brand Column (2 cols) */}
        <div className="col-span-2 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-mono font-bold tracking-wider text-base text-foreground">
              SPOORF
            </span>
          </div>

          <p className="text-xs text-muted leading-relaxed max-w-sm">
            Autonomous Layer 2 network defense and discovery platform. Zero collateral damage,
            mathematical gateway immunity, and sub-second discovery.
          </p>

          <div className="pt-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/20 text-emerald-700 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 status-pulse" />
              <span>All Systems Operational · Cloud Heartbeat Live</span>
            </div>
          </div>
        </div>

        {/* Links Column 1: Product */}
        <div className="space-y-3 text-xs">
          <div className="font-mono uppercase font-semibold text-foreground tracking-wider">
            Product
          </div>
          <ul className="space-y-2 text-muted">
            <li>
              <a href="#showcase" className="hover:text-brand transition-colors">
                Sub-Second Scanner
              </a>
            </li>
            <li>
              <a href="#showcase" className="hover:text-brand transition-colors">
                PWM Bandwidth Limiter
              </a>
            </li>
            <li>
              <a href="#features" className="hover:text-brand transition-colors">
                Captive Portal Redirection
              </a>
            </li>
            <li>
              <a href="#architecture" className="hover:text-brand transition-colors">
                Invariant Engine
              </a>
            </li>
            <li>
              <Link to="/download" className="hover:text-brand transition-colors">
                Desktop Agent
              </Link>
            </li>
          </ul>
        </div>

        {/* Links Column 2: Security */}
        <div className="space-y-3 text-xs">
          <div className="font-mono uppercase font-semibold text-foreground tracking-wider">
            Security
          </div>
          <ul className="space-y-2 text-muted">
            <li>
              <a href="#features" className="hover:text-brand transition-colors">
                Zero-HWID Guarantee
              </a>
            </li>
            <li>
              <a href="#architecture" className="hover:text-brand transition-colors">
                Invariant 1 (Gateway Immune)
              </a>
            </li>
            <li>
              <a href="#architecture" className="hover:text-brand transition-colors">
                Invariant 2 (Anti Self-Cut)
              </a>
            </li>
            <li>
              <a href="#features" className="hover:text-brand transition-colors">
                Asymmetric RS256 Auth
              </a>
            </li>
            <li>
              <span className="text-muted/60">Threat Model & Invariants</span>
            </li>
          </ul>
        </div>

        {/* Links Column 3: Platform */}
        <div className="space-y-3 text-xs">
          <div className="font-mono uppercase font-semibold text-foreground tracking-wider">
            Platform
          </div>
          <ul className="space-y-2 text-muted">
            <li>
              <Link to="/login" className="hover:text-brand transition-colors">
                Cloud Console Login
              </Link>
            </li>
            <li>
              <Link to="/register" className="hover:text-brand transition-colors">
                Create Free Account
              </Link>
            </li>
            <li>
              <a href="#pricing" className="hover:text-brand transition-colors">
                Pricing Tiers
              </a>
            </li>
            <li>
              <span className="text-muted/60">API Specifications</span>
            </li>
            <li>
              <span className="text-muted/60">Architecture Docs</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright & Disclaimer Bar */}
      <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
        <div>
          © 2026 Spoorf NetCut Sentinel. Built for autonomous Layer 2 defense.
        </div>
        <div className="font-mono text-[11px] text-muted flex items-center gap-4">
          <span>RFC 1918 Subnets Only</span>
          <span>·</span>
          <span>Zero Telemetry Leaks</span>
        </div>
      </div>
    </footer>
  );
};

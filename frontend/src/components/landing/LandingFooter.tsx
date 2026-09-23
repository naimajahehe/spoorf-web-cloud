import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowRight, Download } from 'lucide-react';
import { BrandMark } from '../ui/BrandMark';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="pt-20 pb-12 px-4 sm:px-6 max-w-7xl mx-auto border-t border-border">
      {/* Closing CTA Card */}
      <div className="texture-wash-brand rounded-3xl p-10 sm:p-14 text-center max-w-5xl mx-auto shadow-panel relative overflow-hidden mb-20">
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 text-brand text-xs font-mono tracking-wider uppercase mb-5">
            <Shield className="w-3.5 h-3.5" />
            <span>Ready in minutes</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight text-white leading-[1.15] mb-5">
            Take control of your{' '}
            <span className="font-serif italic font-normal text-white/85">network</span>.
          </h2>

          <p className="text-white/80 text-sm sm:text-base leading-relaxed mb-8">
            Install the desktop app to scan and manage your network, or sign in to the web portal
            to control your devices from anywhere. The Free plan is enough to get started.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold bg-white text-brand hover:bg-white/90 shadow-sm transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-hover"
            >
              <span>Get started free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/download"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold border border-white/40 text-white hover:bg-white/10 transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-hover"
            >
              <Download className="w-4 h-4" />
              <span>Download the app</span>
            </Link>
          </div>

          <div className="mt-5 text-[11px] font-mono text-white/70">
            No hardware tracking · Free plan available · Ready in minutes
          </div>
        </div>
      </div>

      {/* Main Footer Links & Meta */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-border">
        {/* Brand Column (2 cols) */}
        <div className="col-span-2 space-y-4">
          <BrandMark to="/" tag="Fleet" />

          <p className="text-xs text-muted leading-relaxed max-w-sm">
            See and manage every device on your local network, without ever putting your router
            or your own connection at risk.
          </p>

          <div className="pt-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/20 text-emerald-700 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 status-pulse" />
              <span>All systems operational</span>
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
                Network scanner
              </a>
            </li>
            <li>
              <a href="#showcase" className="hover:text-brand transition-colors">
                Bandwidth limiter
              </a>
            </li>
            <li>
              <a href="#features" className="hover:text-brand transition-colors">
                Captive portal (Pro)
              </a>
            </li>
            <li>
              <a href="#architecture" className="hover:text-brand transition-colors">
                Safety guards
              </a>
            </li>
            <li>
              <Link to="/download" className="hover:text-brand transition-colors">
                Desktop app
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
                No hardware tracking
              </a>
            </li>
            <li>
              <a href="#architecture" className="hover:text-brand transition-colors">
                Router protection
              </a>
            </li>
            <li>
              <a href="#architecture" className="hover:text-brand transition-colors">
                Self-cut protection
              </a>
            </li>
            <li>
              <a href="#features" className="hover:text-brand transition-colors">
                Signed licences (RS256)
              </a>
            </li>
            <li>
              <span className="text-ink/40">Security overview</span>
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
                Sign in
              </Link>
            </li>
            <li>
              <Link to="/register" className="hover:text-brand transition-colors">
                Create account
              </Link>
            </li>
            <li>
              <a href="#pricing" className="hover:text-brand transition-colors">
                Pricing
              </a>
            </li>
            <li>
              <span className="text-ink/40">API Specifications</span>
            </li>
            <li>
              <span className="text-ink/40">Architecture Docs</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright & Disclaimer Bar */}
      <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
        <div>
          © 2026 Spoorf NetCut Sentinel.
        </div>
        <div className="font-mono text-[11px] text-muted flex items-center gap-4">
          <span>Private networks only</span>
          <span>·</span>
          <span>No tracking</span>
        </div>
      </div>
    </footer>
  );
};

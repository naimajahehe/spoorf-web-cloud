import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, ArrowRight, Menu, X, Download, User } from 'lucide-react';

export const LandingNavbar: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Product', href: '#showcase' },
    { label: 'Features', href: '#features' },
    { label: 'Architecture', href: '#architecture' },
    { label: 'Pricing', href: '#pricing' },
  ];

  return (
    <header className="sticky top-4 z-50 max-w-6xl mx-auto px-4 w-full select-none">
      <div className="bg-white/85 backdrop-blur-md border border-border shadow-card rounded-full px-5 py-2.5 flex items-center justify-between transition-all">
        {/* Brand Monogram */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <Shield className="w-4 h-4 text-brand" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-sans font-bold tracking-tight text-foreground text-sm">
              SPOORF
            </span>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-brand/10 text-brand font-semibold tracking-wider">
              Fleet
            </span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-600 status-pulse ml-0.5" title="Cloud Fleet Active" />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-xs font-medium text-ink hover:text-foreground transition-colors cursor-pointer"
            >
              {item.label}
            </a>
          ))}
          <Link
            to="/download"
            className="text-xs font-medium text-ink hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5 text-brand" />
            <span>Download</span>
          </Link>
        </nav>

        {/* Right Auth / Action CTAs */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-ink">
                <User className="w-3.5 h-3.5 text-brand" />
                <span className="max-w-[120px] truncate">{user?.name || user?.email}</span>
              </div>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand hover:bg-brand-hover text-white text-xs font-medium transition-all shadow-brand-glow hover:shadow-panel"
              >
                <span>Buka Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs font-medium text-ink hover:text-foreground px-3 py-1.5 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-brand hover:bg-brand-hover text-white text-xs font-medium transition-all shadow-brand-glow hover:shadow-panel active:scale-[0.98]"
              >
                <span>Launch Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-1.5 text-ink hover:text-foreground rounded-lg focus:outline-none"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 p-4 bg-white/95 backdrop-blur-md border border-border shadow-panel rounded-2xl flex flex-col gap-3">
          {navLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-ink py-1 hover:text-foreground transition-colors"
            >
              {item.label}
            </a>
          ))}
          <Link
            to="/download"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-ink py-1 hover:text-foreground transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-brand" />
            <span>Download Desktop Agent</span>
          </Link>
          <div className="pt-2 border-t border-border flex flex-col gap-2">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 rounded-xl bg-brand text-white text-xs font-medium"
              >
                Buka Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 rounded-xl border border-border text-ink text-xs font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 rounded-xl bg-brand text-white text-xs font-medium shadow-brand-glow"
                >
                  Launch Console
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default LandingNavbar;

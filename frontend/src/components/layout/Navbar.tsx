import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BrandMark } from '../ui/BrandMark';
import { buttonClass } from '../ui/button';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-1.5 rounded-full text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 ${
    isActive ? 'bg-surface-muted text-foreground' : 'text-ink hover:text-foreground'
  }`;

const TIER_LABELS: Record<string, string> = { free: 'Free', pro: 'Pro', vip: 'VIP' };

/** Console navbar: same floating pill shell as the landing page navbar. */
export const Navbar: React.FC = () => {
  const { isAuthenticated, user, license, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tier = (license?.tier || 'free').toLowerCase();
  const isPaid = tier !== 'free';
  const closeMenu = () => setMobileMenuOpen(false);

  const handleLogout = () => {
    closeMenu();
    logout();
    navigate('/login');
  };

  const links = [
    ...(isAuthenticated ? [{ to: '/dashboard', label: 'Dashboard' }] : []),
    { to: '/download', label: 'Unduh aplikasi' },
  ];

  return (
    <header className="sticky top-4 z-40 max-w-6xl mx-auto px-4 w-full">
      <div className="bg-white/85 backdrop-blur-md border border-border shadow-card rounded-full px-4 sm:px-5 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <BrandMark to={isAuthenticated ? '/dashboard' : '/'} tag="Console" />
          <nav className="hidden md:flex items-center gap-1" aria-label="Navigasi utama">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} className={navLinkClass}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-2 text-xs text-ink">
                <span className="max-w-[160px] truncate">{user?.name || user?.email}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    isPaid ? 'bg-brand/10 text-brand' : 'bg-surface-muted text-ink'
                  }`}
                >
                  {TIER_LABELS[tier] || tier}
                </span>
              </div>
              <button type="button" onClick={handleLogout} className={buttonClass('secondary', 'sm')}>
                <LogOut className="w-3.5 h-3.5" />
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={buttonClass('ghost', 'sm')}>
                Masuk
              </Link>
              <Link to="/register" className={buttonClass('primary', 'sm')}>
                Daftar gratis
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="md:hidden p-1.5 text-ink hover:text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
          aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden mt-2 p-4 bg-white/95 backdrop-blur-md border border-border shadow-panel rounded-2xl flex flex-col gap-1">
          {isAuthenticated && (
            <div className="flex items-center justify-between pb-3 mb-1 border-b border-border text-sm">
              <span className="truncate text-foreground font-medium">{user?.name || user?.email}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  isPaid ? 'bg-brand/10 text-brand' : 'bg-surface-muted text-ink'
                }`}
              >
                {TIER_LABELS[tier] || tier}
              </span>
            </div>
          )}
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={closeMenu}
              className={({ isActive }) =>
                `px-3 py-2 rounded-xl text-sm font-medium ${isActive ? 'bg-surface-muted text-foreground' : 'text-ink'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <div className="pt-3 mt-2 border-t border-border flex flex-col gap-2">
            {isAuthenticated ? (
              <button type="button" onClick={handleLogout} className={buttonClass('secondary', 'md', { fullWidth: true })}>
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            ) : (
              <>
                <Link to="/login" onClick={closeMenu} className={buttonClass('secondary', 'md', { fullWidth: true })}>
                  Masuk
                </Link>
                <Link to="/register" onClick={closeMenu} className={buttonClass('primary', 'md', { fullWidth: true })}>
                  Daftar gratis
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

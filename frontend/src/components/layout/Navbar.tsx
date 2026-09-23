import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Shield, Laptop, Download, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { isAuthenticated, user, license, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const rawTier = license?.tier || 'free';
  const tier = rawTier.toUpperCase();

  const getTierBadgeStyle = (tierName: string) => {
    switch (tierName) {
      case 'VIP':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'PRO':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'FREE':
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-6">
          <Link
            to={isAuthenticated ? '/dashboard' : '/'}
            className="flex items-center gap-3 group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 group-hover:border-cyan-500/40 group-hover:shadow-lg group-hover:shadow-cyan-500/20 transition-all duration-300">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
              <span className="font-bold tracking-tight text-white font-mono text-base group-hover:text-cyan-400 transition-colors">
                SPOORF CLOUD
              </span>
              <span className="text-xs text-slate-400 font-mono hidden md:inline">
                / Sentinel Command Portal
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden sm:flex items-center gap-1">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                }`
              }
            >
              <Laptop className="w-4 h-4 text-cyan-400" />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/download"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                }`
              }
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Unduh Desktop</span>
            </NavLink>
          </nav>
        </div>

        {/* Right Section: Auth State / Profile Pill */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {/* User Profile Info Pill */}
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 shadow-sm">
                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center gap-2 max-w-[140px] sm:max-w-[200px] truncate">
                  <span className="text-xs font-medium text-slate-200 truncate">
                    {user?.name || user?.email}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${getTierBadgeStyle(
                      tier
                    )}`}
                  >
                    {tier}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/20 transition-colors focus:outline-none"
                title="Keluar dari sesi"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800 transition-colors"
              >
                Masuk
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors shadow-sm shadow-cyan-400/20 font-semibold"
              >
                Daftar Akun
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sub-Navigation for small screens */}
      <div className="sm:hidden flex items-center justify-around border-t border-slate-900 py-2 px-4 bg-slate-950">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${
              isActive ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400'
            }`
          }
        >
          <Laptop className="w-3.5 h-3.5 text-cyan-400" />
          <span>Dashboard</span>
        </NavLink>
        <NavLink
          to="/download"
          className={({ isActive }) =>
            `flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${
              isActive ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400'
            }`
          }
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Unduh Desktop</span>
        </NavLink>
      </div>
    </header>
  );
};

export default Navbar;

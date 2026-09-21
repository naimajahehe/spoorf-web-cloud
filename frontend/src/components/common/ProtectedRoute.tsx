import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 select-none">
        <div className="relative flex items-center justify-center">
          {/* Cyber Pulse Ambient Glow */}
          <div className="absolute w-24 h-24 bg-cyan-500/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-xl shadow-cyan-500/10">
            <Shield className="w-8 h-8 text-cyan-400 animate-pulse" />
          </div>
        </div>
        <div className="mt-6 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-mono font-medium tracking-widest text-slate-300 uppercase">
              Memverifikasi Sesi Sentinel...
            </span>
          </div>
          <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">
            SPOORF CLOUD SECURITY CORE
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

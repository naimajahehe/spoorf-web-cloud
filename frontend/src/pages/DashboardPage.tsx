import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { sessionService } from '../services/sessionService';
import { DeviceSession } from '../types/session';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { WEB_PLATFORM, getWebSessionId } from '../services/webSession';
import {
  Laptop,
  Monitor,
  PowerOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  Zap,
  Globe,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { license } = useAuth();
  const currentSessionId = getWebSessionId();
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal states
  const [targetToRevoke, setTargetToRevoke] = useState<DeviceSession | null>(null);
  const [isRevokeAllOpen, setIsRevokeAllOpen] = useState<boolean>(false);

  const fetchSessions = async (isMountedRef?: { current: boolean }) => {
    setIsLoading(true);
    try {
      const data = await sessionService.getSessions();
      if (!isMountedRef || isMountedRef.current) {
        setSessions(data.sessions || []);
      }
    } catch (err: any) {
      if (!isMountedRef || isMountedRef.current) {
        const errorMessage =
          err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Gagal memuat sesi perangkat.';
        setFeedback({ type: 'error', message: errorMessage });
      }
    } finally {
      if (!isMountedRef || isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const isMountedRef = { current: true };
    fetchSessions(isMountedRef);
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Auto-dismiss feedback toast after 5 seconds
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => {
      setFeedback(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const handleConfirmSingleRevoke = async () => {
    if (!targetToRevoke) return;
    try {
      const res = await sessionService.revokeSession(targetToRevoke.id);
      setFeedback({
        type: 'success',
        message:
          res.message ||
          `Akses perangkat "${targetToRevoke.deviceName || targetToRevoke.sessionId.substring(0, 8)}" berhasil dicabut.`,
      });
      await fetchSessions();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Gagal mencabut sesi perangkat.';
      setFeedback({ type: 'error', message: errorMessage });
    } finally {
      setTargetToRevoke(null);
    }
  };

  const handleConfirmRevokeAll = async () => {
    try {
      const res = await sessionService.revokeAllSessions();
      setFeedback({
        type: 'success',
        message: res.message || 'Semua sesi aktif berhasil dicabut.',
      });
      await fetchSessions();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Gagal mencabut semua sesi.';
      setFeedback({ type: 'error', message: errorMessage });
    } finally {
      setIsRevokeAllOpen(false);
    }
  };

  const getMaxSlots = (): number => {
    const tier = (license?.tier || 'free').toLowerCase();
    if (tier === 'vip') return 5;
    if (tier === 'pro') return 2;
    return 1;
  };

  const maxSlots = getMaxSlots();
  // Web portal sessions are revocable but do not use desktop device slots (mirrors the API).
  const activeSessionsCount = useMemo(
    () => sessions.filter((s) => !s.isRevoked && s.platform !== WEB_PLATFORM).length,
    [sessions]
  );
  const revocableSessionsCount = useMemo(
    () => sessions.filter((s) => !s.isRevoked && s.sessionId !== currentSessionId).length,
    [sessions, currentSessionId]
  );
  const slotPercentage = Math.min(100, Math.round((activeSessionsCount / maxSlots) * 100));

  const formatTimestamp = (dateStr: string | null | undefined): string => {
    if (!dateStr) return 'Tidak diketahui';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Tidak diketahui';
    return `${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} (${d.toLocaleDateString('id-ID')})`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center justify-between text-sm shadow-lg backdrop-blur-md transition-all animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 shadow-emerald-950/30'
              : 'bg-rose-950/70 border border-rose-800/60 text-rose-300 shadow-rose-950/30'
          }`}
          role="alert"
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs uppercase font-mono tracking-wider ml-4 opacity-70 hover:opacity-100 transition-opacity cursor-pointer focus:outline-none"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Header Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Tier Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400">Paket Langganan</span>
            <Shield className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono tracking-wide uppercase">
              {license?.tier || 'FREE'}
            </span>
            <span className="text-xs text-slate-400 font-mono">PLAN</span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-mono">
            Batas Pemutusan: <strong className="text-slate-200">{license?.max_cuts || 5} Perangkat</strong>
          </p>
        </div>

        {/* Slot Usage Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400">Slot Perangkat</span>
            <Laptop className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">
              {activeSessionsCount} <span className="text-slate-500 text-2xl font-normal">/ {maxSlots}</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">Aktif</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                activeSessionsCount >= maxSlots ? 'bg-amber-500' : 'bg-cyan-500'
              }`}
              style={{ width: `${slotPercentage}%` }}
            />
          </div>
        </div>

        {/* Capabilities Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400">Fitur Jaringan</span>
            <Zap className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>PWM Throttling:</span>
              </span>
              <span className={`flex items-center gap-1 ${license?.can_throttle ? 'text-emerald-400' : 'text-slate-500'}`}>
                {license?.can_throttle && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{license?.can_throttle ? 'AKTIF' : 'TERKUNCI (PRO)'}</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>Sinkhole Gateway:</span>
              </span>
              <span className={`flex items-center gap-1 ${license?.can_gateway ? 'text-emerald-400' : 'text-slate-500'}`}>
                {license?.can_gateway && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{license?.can_gateway ? 'AKTIF' : 'TERKUNCI (PRO)'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sessions Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              <Laptop className="w-5 h-5 text-cyan-400" />
              Perangkat Terhubung & Sesi Desktop
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Daftar seluruh komputer yang menggunakan lisensi akun ini. Anda dapat mencabut akses perangkat dari jarak jauh.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fetchSessions()}
              disabled={isLoading}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors disabled:opacity-50 cursor-pointer focus:outline-none"
              title="Refresh Sesi"
            >
              <RefreshCw className={`w-4 h-4 text-cyan-400 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {revocableSessionsCount > 0 && (
              <button
                type="button"
                onClick={() => setIsRevokeAllOpen(true)}
                className="px-3.5 py-2 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 rounded-xl text-xs font-mono flex items-center gap-2 transition-colors cursor-pointer focus:outline-none"
              >
                <PowerOff className="w-3.5 h-3.5" />
                <span>Putuskan Semua Sesi</span>
              </button>
            )}
          </div>
        </div>

        {/* Sessions Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 font-mono">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
            <p className="text-xs uppercase tracking-widest text-slate-500">Memuat Sesi Perangkat...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 text-slate-500 font-mono text-sm">
            <Laptop className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
            <p>Belum ada sesi desktop yang terdaftar.</p>
            <p className="text-xs mt-1 text-slate-600">Login pada aplikasi desktop Spoorf untuk mendaftarkan sesi.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {sessions.map((sess) => {
              const isWeb = sess.platform === WEB_PLATFORM;
              const isCurrent = sess.sessionId === currentSessionId;
              const isWindows = sess.platform === 'win32' || (sess.platform || '').toLowerCase().includes('win');

              return (
                <div
                  key={sess.id}
                  className={`p-5 rounded-xl border transition-all ${
                    sess.isRevoked
                      ? 'bg-slate-950/40 border-slate-900 opacity-60'
                      : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                        {isWeb ? (
                          <Globe className="w-5 h-5 text-cyan-400" />
                        ) : isWindows ? (
                          <Monitor className="w-5 h-5 text-cyan-400" />
                        ) : (
                          <Laptop className="w-5 h-5 text-cyan-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white font-mono">
                          {sess.deviceName || (isWeb ? 'Web Portal' : 'Perangkat Desktop Sentinel')}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-mono">
                          {isWeb ? (
                            <span>Browser · tidak memakai slot perangkat</span>
                          ) : (
                            <>
                              <span>{sess.platform || 'Windows'}</span>
                              <span>·</span>
                              <span>v{sess.appVersion || '2.41.79'}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div>
                      {sess.isRevoked ? (
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-rose-950/60 border border-rose-800/60 text-rose-400 font-semibold">
                          Dicabut
                        </span>
                      ) : sess.is_online ? (
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 font-semibold flex items-center gap-1.5 shadow-sm shadow-emerald-950">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Online
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-800/60 text-amber-400 font-semibold">
                          Idle
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metadata & Last Seen */}
                  <div className="space-y-1.5 text-xs text-slate-400 font-mono mb-4 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/40">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Terakhir Aktif:</span>
                      </span>
                      <span className="text-slate-300">{formatTimestamp(sess.lastSeenAt)}</span>
                    </div>
                    {sess.ipAddress && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-slate-500" />
                          <span>IP Publik:</span>
                        </span>
                        <span className="text-slate-300 font-mono">{sess.ipAddress}</span>
                      </div>
                    )}
                    {sess.isRevoked && sess.revokedReason && (
                      <div className="text-[11px] text-rose-400/90 pt-1.5 mt-1 border-t border-slate-800 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <span>Alasan: {sess.revokedReason}</span>
                      </div>
                    )}
                  </div>

                  {/* Kick Action Button */}
                  {isCurrent && !sess.isRevoked ? (
                    <div className="w-full py-2 bg-cyan-950/20 border border-cyan-800/40 text-cyan-300 rounded-lg text-xs font-mono text-center select-none">
                      Sesi Ini (Browser Anda)
                    </div>
                  ) : !sess.isRevoked ? (
                    <button
                      type="button"
                      onClick={() => setTargetToRevoke(sess)}
                      className="w-full py-2 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/50 hover:border-rose-600 text-rose-300 hover:text-white rounded-lg text-xs font-mono flex items-center justify-center gap-2 transition-colors cursor-pointer focus:outline-none"
                    >
                      <PowerOff className="w-3.5 h-3.5" />
                      <span>Putuskan Akses (Kick)</span>
                    </button>
                  ) : (
                    <div className="w-full py-2 bg-slate-900/30 border border-slate-800/40 text-slate-500 rounded-lg text-xs font-mono text-center select-none">
                      Akses Telah Dicabut
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmModal
        isOpen={!!targetToRevoke}
        title="Putuskan Akses Perangkat"
        message={`Apakah Anda yakin ingin mencabut sesi untuk "${targetToRevoke?.deviceName || targetToRevoke?.sessionId.substring(0, 8)}"? Aplikasi desktop pada perangkat tersebut akan otomatis diturunkan ke versi Free pada heartbeat berikutnya.`}
        confirmLabel="Ya, Putuskan Sesi"
        cancelLabel="Batal"
        isDanger={true}
        onConfirm={handleConfirmSingleRevoke}
        onCancel={() => setTargetToRevoke(null)}
      />

      <ConfirmModal
        isOpen={isRevokeAllOpen}
        title="Putuskan Semua Sesi Aktif"
        message={`Tindakan ini akan mencabut ${revocableSessionsCount} sesi aktif lain (desktop dan browser). Aplikasi desktop terkait akan otomatis diturunkan ke versi Free. Sesi browser ini tetap aktif. Lanjutkan?`}
        confirmLabel="Ya, Putuskan Semua"
        cancelLabel="Batal"
        isDanger={true}
        onConfirm={handleConfirmRevokeAll}
        onCancel={() => setIsRevokeAllOpen(false)}
      />
    </div>
  );
};

export default DashboardPage;

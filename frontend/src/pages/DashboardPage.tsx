import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sessionService } from '../services/sessionService';
import { DeviceSession } from '../types/session';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { Alert } from '../components/ui/Alert';
import { buttonClass } from '../components/ui/button';
import { PlanSummary } from '../components/dashboard/PlanSummary';
import { SessionRow } from '../components/dashboard/SessionRow';
import { WEB_PLATFORM, getWebSessionId } from '../services/webSession';
import { getApiErrorMessage } from '../utils/apiError';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

type Feedback = { tone: 'success' | 'error'; message: string };

export const DashboardPage: React.FC = () => {
  const { license } = useAuth();
  const currentSessionId = getWebSessionId();

  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [target, setTarget] = useState<DeviceSession | null>(null);
  const [isRevokeAllOpen, setIsRevokeAllOpen] = useState(false);

  const load = useCallback(async (mounted?: { current: boolean }) => {
    const alive = () => !mounted || mounted.current;
    try {
      const data = await sessionService.getSessions();
      if (alive()) setSessions(data.sessions || []);
    } catch (err) {
      if (alive()) setFeedback({ tone: 'error', message: getApiErrorMessage(err, 'Gagal memuat sesi perangkat.') });
    } finally {
      if (alive()) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    const mounted = { current: true };
    load(mounted);
    return () => {
      mounted.current = false;
    };
  }, [load]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 6000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const refresh = () => {
    setIsRefreshing(true);
    load();
  };

  const activeSessions = useMemo(() => sessions.filter((s) => !s.isRevoked), [sessions]);
  const revokedSessions = useMemo(() => sessions.filter((s) => s.isRevoked), [sessions]);
  const desktopSessionCount = useMemo(
    () => activeSessions.filter((s) => s.platform !== WEB_PLATFORM).length,
    [activeSessions]
  );
  const revocableCount = useMemo(
    () => activeSessions.filter((s) => s.sessionId !== currentSessionId).length,
    [activeSessions, currentSessionId]
  );

  const revokeOne = async () => {
    if (!target) return;
    try {
      await sessionService.revokeSession(target.id);
      setFeedback({ tone: 'success', message: `Akses "${target.deviceName || 'perangkat'}" telah dicabut.` });
      await load();
    } catch (err) {
      setFeedback({ tone: 'error', message: getApiErrorMessage(err, 'Gagal mencabut sesi perangkat.') });
    } finally {
      setTarget(null);
    }
  };

  const revokeAll = async () => {
    try {
      const res = await sessionService.revokeAllSessions();
      setFeedback({ tone: 'success', message: res.message || 'Semua sesi lain telah dicabut.' });
      await load();
    } catch (err) {
      setFeedback({ tone: 'error', message: getApiErrorMessage(err, 'Gagal mencabut semua sesi.') });
    } finally {
      setIsRevokeAllOpen(false);
    }
  };

  useDocumentTitle('Dashboard');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Perangkat & sesi</h1>
          <p className="mt-1 text-sm text-ink">Kelola perangkat yang memakai lisensi akun ini.</p>
        </div>
      </header>

      {feedback && (
        <Alert tone={feedback.tone} onDismiss={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      <PlanSummary license={license} desktopSessionCount={desktopSessionCount} />

      <section className="rounded-3xl bg-white border border-border shadow-card">
        <div className="flex items-center justify-between gap-3 p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Sesi aktif</h2>
            <p className="mt-0.5 text-sm text-ink">{activeSessions.length} sesi terhubung saat ini.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refresh}
              disabled={isRefreshing || isLoading}
              className={buttonClass('secondary', 'sm')}
              aria-label="Muat ulang sesi"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Muat ulang</span>
            </button>
            {revocableCount > 0 && (
              <button type="button" onClick={() => setIsRevokeAllOpen(true)} className={buttonClass('danger', 'sm')}>
                Putuskan semua
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <p className="p-6 text-sm text-ink">Memuat sesi perangkat…</p>
        ) : activeSessions.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-foreground font-medium">Belum ada sesi aktif</p>
            <p className="mt-1 text-sm text-ink">Masuk di aplikasi desktop untuk mendaftarkan perangkat.</p>
          </div>
        ) : (
          <ul className="px-6 divide-y divide-border">
            {activeSessions.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                isCurrent={session.sessionId === currentSessionId}
                onRevoke={setTarget}
              />
            ))}
          </ul>
        )}
      </section>

      {revokedSessions.length > 0 && (
        <section className="rounded-3xl bg-white border border-border shadow-card">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Riwayat dicabut</h2>
            <p className="mt-0.5 text-sm text-ink">Sesi yang sudah tidak aktif.</p>
          </div>
          <ul className="px-6 divide-y divide-border">
            {revokedSessions.map((session) => (
              <SessionRow key={session.id} session={session} isCurrent={false} onRevoke={setTarget} />
            ))}
          </ul>
        </section>
      )}

      <ConfirmModal
        isOpen={Boolean(target)}
        title="Putuskan perangkat ini?"
        message={`"${target?.deviceName || 'Perangkat'}" akan diturunkan ke Free pada sinkronisasi berikutnya dan harus masuk kembali untuk memakai lisensi.`}
        confirmLabel="Putuskan"
        onConfirm={revokeOne}
        onCancel={() => setTarget(null)}
      />

      <ConfirmModal
        isOpen={isRevokeAllOpen}
        title="Putuskan semua sesi lain?"
        message={`${revocableCount} sesi lain (desktop dan browser) akan dicabut. Sesi browser ini tetap aktif.`}
        confirmLabel="Putuskan semua"
        onConfirm={revokeAll}
        onCancel={() => setIsRevokeAllOpen(false)}
      />
    </div>
  );
};

export default DashboardPage;

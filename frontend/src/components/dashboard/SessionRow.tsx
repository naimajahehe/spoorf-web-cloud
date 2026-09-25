import React from 'react';
import { Globe, Laptop, Monitor } from 'lucide-react';
import { DeviceSession } from '../../types/session';
import { StatusPill } from '../ui/StatusPill';
import { buttonClass } from '../ui/button';
import { WEB_PLATFORM } from '../../services/webSession';
import { platformLabel, formatRelative } from '../../utils/format';

interface SessionRowProps {
  session: DeviceSession;
  isCurrent: boolean;
  onRevoke: (session: DeviceSession) => void;
}

export const SessionRow: React.FC<SessionRowProps> = ({ session, isCurrent, onRevoke }) => {
  const isWeb = session.platform === WEB_PLATFORM;
  const isWindows = (session.platform || '').toLowerCase().includes('win');
  const Icon = isWeb ? Globe : isWindows ? Monitor : Laptop;
  const status = session.isRevoked ? 'revoked' : session.is_online ? 'online' : 'idle';

  const meta = isWeb
    ? 'Browser · tidak memakai slot perangkat'
    : [platformLabel(session.platform), session.appVersion && `v${session.appVersion}`].filter(Boolean).join(' · ');

  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-4">
      <span className="w-10 h-10 shrink-0 rounded-full bg-surface-muted text-ink flex items-center justify-center" aria-hidden="true">
        <Icon className="w-5 h-5" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-foreground truncate">
            {session.deviceName || (isWeb ? 'Web Portal' : 'Perangkat desktop')}
          </span>
          {isCurrent && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-brand/10 text-brand">Sesi ini</span>
          )}
        </div>
        <p className="text-sm text-ink truncate">{meta}</p>
        <p className="text-xs text-ink/60 mt-0.5">
          Aktif {formatRelative(session.lastSeenAt)}
          {session.ipAddress ? ` · ${session.ipAddress}` : ''}
        </p>
        {session.isRevoked && session.revokedReason && (
          <p className="text-xs text-status-danger mt-1">{session.revokedReason}</p>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <StatusPill status={status} />
        {!session.isRevoked && !isCurrent && (
          <button type="button" onClick={() => onRevoke(session)} className={buttonClass('danger', 'sm')}>
            Putuskan
          </button>
        )}
      </div>
    </li>
  );
};

export default SessionRow;

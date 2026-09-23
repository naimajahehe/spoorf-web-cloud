import React from 'react';

export type SessionStatus = 'online' | 'idle' | 'revoked';

const STYLES: Record<SessionStatus, { label: string; pill: string; dot: string }> = {
  online: { label: 'Online', pill: 'bg-status-online-bg text-status-online', dot: 'bg-status-online status-pulse' },
  idle: { label: 'Tidak aktif', pill: 'bg-status-idle-bg text-status-idle', dot: 'bg-status-idle' },
  revoked: { label: 'Dicabut', pill: 'bg-status-danger-bg text-status-danger', dot: 'bg-status-danger' },
};

export const StatusPill: React.FC<{ status: SessionStatus }> = ({ status }) => {
  const style = STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${style.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {style.label}
    </span>
  );
};

export default StatusPill;

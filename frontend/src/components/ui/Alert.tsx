import React from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

interface AlertProps {
  tone: 'success' | 'error';
  children: React.ReactNode;
  onDismiss?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ tone, children, onDismiss }) => {
  const isError = tone === 'error';
  const Icon = isError ? AlertTriangle : CheckCircle2;
  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-2xl border bg-white px-4 py-3 text-sm shadow-card ${
        isError ? 'border-status-danger/25' : 'border-status-online/25'
      }`}
    >
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isError ? 'text-status-danger' : 'text-status-online'}`} aria-hidden="true" />
      <div className="flex-1 text-foreground leading-relaxed">{children}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Tutup pesan"
          className="p-0.5 rounded-md text-ink/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;

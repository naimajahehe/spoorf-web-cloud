import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { buttonClass } from '../ui/button';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  /** May return a promise; the dialog stays open and disabled until it settles. */
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  isDanger = true,
  onConfirm,
  onCancel,
}) => {
  const [isPending, setIsPending] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  // Callers pass inline handlers; keep the latest in refs so the open effect runs once per opening
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;
  const isPendingRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    isPendingRef.current = false;
    setIsPending(false);
    // Focus the safe action first so Enter does not trigger a destructive action by accident
    cancelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isPendingRef.current) onCancelRef.current();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    isPendingRef.current = true;
    setIsPending(true);
    try {
      await onConfirm();
    } finally {
      isPendingRef.current = false;
      setIsPending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isPending) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-message"
        className="w-full max-w-md rounded-3xl bg-white border border-border shadow-panel p-6 sm:p-7"
      >
        <div className="flex items-start gap-3.5">
          <span
            className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${
              isDanger ? 'bg-status-danger-bg text-status-danger' : 'bg-brand/10 text-brand'
            }`}
            aria-hidden="true"
          >
            <AlertTriangle className="w-5 h-5" />
          </span>
          <div>
            <h2 id="confirm-modal-title" className="text-lg font-semibold tracking-tight text-foreground">
              {title}
            </h2>
            <p id="confirm-modal-message" className="mt-1.5 text-sm text-ink leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={isPending} className={buttonClass('secondary', 'md')}>
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className={buttonClass(isDanger ? 'destructive' : 'primary', 'md')}
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

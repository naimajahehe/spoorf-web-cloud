import React from 'react';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
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
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="relative bg-slate-900/95 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl backdrop-blur-xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Cyber Ambient Glow Accent */}
        <div
          className={`absolute -top-12 -left-12 w-32 h-32 rounded-full blur-2xl pointer-events-none ${
            isDanger ? 'bg-rose-500/15' : 'bg-cyan-500/15'
          }`}
        />

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`p-2.5 rounded-xl border shrink-0 ${
              isDanger
                ? 'bg-rose-950/50 border-rose-800/50 text-rose-400 shadow-lg shadow-rose-950/30'
                : 'bg-cyan-950/50 border-cyan-800/50 text-cyan-400 shadow-lg shadow-cyan-950/30'
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 id="confirm-modal-title" className="text-lg font-bold text-white font-mono tracking-tight">
            {title}
          </h3>
        </div>

        {/* Modal Body */}
        <p className="text-sm text-slate-300 mb-6 leading-relaxed font-sans">
          {message}
        </p>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-600 cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg cursor-pointer focus:outline-none focus:ring-2 ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-rose-950/50 focus:ring-rose-500/40'
                : 'bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-slate-950 shadow-cyan-950/50 focus:ring-cyan-500/40'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

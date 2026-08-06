import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Info, CheckCircle2, AlertTriangle, XCircle, Loader2 } from 'lucide-react';

export const CustomDialog: React.FC = () => {
  const { dialogState, closeDialog } = useApp();
  const modalRef = useRef<HTMLDivElement>(null);

  const isOpen = !!(dialogState && dialogState.isOpen);
  const type = dialogState?.type;
  const onCancel = dialogState?.onCancel;

  // Handle ESC key and focus trapping
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && type !== 'loading') {
        if (onCancel) {
          onCancel();
        } else {
          closeDialog();
        }
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (focusableElements.length === 0) return;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Autofocus modal or first interactive element
    if (modalRef.current) {
      const confirmBtn = modalRef.current.querySelector('[data-type="confirm"]') as HTMLElement;
      const closeBtn = modalRef.current.querySelector('[data-type="close"]') as HTMLElement;
      if (confirmBtn) {
        confirmBtn.focus();
      } else if (closeBtn) {
        closeBtn.focus();
      }
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, type, onCancel, closeDialog]);

  if (!isOpen) return null;

  const {
    title,
    message,
    confirmText = 'Lanjutkan',
    cancelText = 'Batal',
    onConfirm,
    showCancel = true,
  } = dialogState;

  // Color mappings
  const themeMap = {
    info: {
      bg: 'bg-blue-50 text-blue-600 border-blue-100',
      btn: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500/50',
      icon: <Info className="h-6 w-6 text-blue-600" />,
    },
    success: {
      bg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      btn: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500/50',
      icon: <CheckCircle2 className="h-6 w-6 text-emerald-600" />,
    },
    warning: {
      bg: 'bg-amber-50 text-amber-600 border-amber-100',
      btn: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500/50',
      icon: <AlertTriangle className="h-6 w-6 text-amber-600" />,
    },
    danger: {
      bg: 'bg-rose-50 text-rose-600 border-rose-100',
      btn: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500/50',
      icon: <XCircle className="h-6 w-6 text-rose-600" />,
    },
    loading: {
      bg: 'bg-slate-50 text-slate-600 border-slate-100',
      btn: 'bg-slate-500',
      icon: <Loader2 className="h-8 w-8 text-pink-600 animate-spin" />,
    },
  };

  const theme = (type ? themeMap[type] : null) || themeMap.info;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        ref={modalRef}
        className="w-full max-w-md transform rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl overflow-hidden transition-all duration-200 animate-in zoom-in-95"
      >
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Icon Header */}
          <div className={`flex h-12 w-12 items-center justify-center rounded-full border ${theme.bg}`}>
            {theme.icon}
          </div>

          {/* Title & Message */}
          <div className="space-y-2 w-full">
            <h3 id="dialog-title" className="text-base font-bold text-slate-800">
              {title}
            </h3>
            <div className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto whitespace-pre-line">
              {message}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-center gap-3 pt-4 w-full border-t border-slate-50">
            {type === 'loading' ? (
              <p className="text-[11px] font-medium text-slate-400 animate-pulse">
                Silakan tunggu beberapa saat...
              </p>
            ) : type === 'success' || type === 'info' || (type === 'danger' && !onConfirm) ? (
              <button
                type="button"
                data-type="close"
                onClick={() => {
                  if (onCancel) onCancel();
                  closeDialog();
                }}
                className={`rounded-lg px-5 py-2 text-xs font-bold text-white shadow-md transition-all cursor-pointer ${theme.btn} focus:outline-none focus:ring-2`}
              >
                Tutup
              </button>
            ) : (
              <>
                {showCancel && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onCancel) onCancel();
                      closeDialog();
                    }}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer focus:outline-none"
                  >
                    {cancelText}
                  </button>
                )}
                <button
                  type="button"
                  data-type="confirm"
                  onClick={() => {
                    if (onConfirm) onConfirm();
                  }}
                  className={`rounded-lg px-5 py-2 text-xs font-bold text-white shadow-md transition-all cursor-pointer ${theme.btn} focus:outline-none focus:ring-2`}
                >
                  {confirmText}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

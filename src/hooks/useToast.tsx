import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useSwipeDismiss } from '../motion/useSwipeDismiss';
import { useTranslation } from '../i18n/LanguageContext';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const ToastItem: React.FC<{
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}> = ({ toast, onDismiss }) => {
  const { t } = useTranslation();
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<number | null>(null);

  const { elementRef, swipeHandlers } = useSwipeDismiss({
    onDismiss: () => onDismiss(toast.id),
    onHoldChange: setPaused,
  });

  useEffect(() => {
    if (paused) return;
    timerRef.current = window.setTimeout(() => {
      onDismiss(toast.id);
    }, 3400);
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [paused, toast.id, onDismiss]);

  return (
    <div
      ref={elementRef}
      {...swipeHandlers}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={`pointer-events-auto touch-pan-y select-none material-popover flex items-center justify-between gap-3 px-4 py-3 rounded-lg border text-[13px] shadow-modal will-change-transform ${
        toast.type === 'success'
          ? 'text-primary border-green-300/80'
          : toast.type === 'error'
          ? 'bg-danger-bg text-danger-text border-danger-border'
          : 'text-primary border-border'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0" />}
        {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-danger shrink-0" />}
        {toast.type === 'info' && <Info className="w-4 h-4 text-info shrink-0" />}
        <span className="font-medium leading-snug break-words">{toast.message}</span>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label={t('common.dismiss')}
        className="relative shrink-0 text-secondary hover:text-primary p-1.5 rounded-sm hover:bg-surface-soft active:scale-[0.9] transition-[background-color,color,transform] duration-[110ms] before:content-[''] before:absolute before:-inset-1.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setToasts((prev) => [...prev.slice(-1), { id, type, message }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container: bottom-20 above BottomNav (z-30) and below Modals (z-50) */}
      <div
        className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] sm:w-auto pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

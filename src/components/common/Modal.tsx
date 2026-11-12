import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useMediaPreference } from '../../motion/useReducedMotion';
import { useSheetDrag } from '../../motion/useSheetDrag';
import { useModalDepth } from '../../motion/ModalDepthContext';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  footer,
  children,
  maxWidth = 'md',
}) => {
  const { t } = useTranslation();
  const modalId = useId();
  const titleId = useId();
  const subtitleId = useId();
  const isMobileSheet = useMediaPreference('(max-width: 639px)');
  const { registerModal, updateModalProgress, unregisterModal, isTopModal } = useModalDepth();
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const { rendered, sheetRef, backdropRef, dragHandlers } = useSheetDrag({
    isOpen,
    isMobileSheet,
    onClose,
    onProgress: (progress) => {
      updateModalProgress(modalId, progress);
    },
    onExited: () => {
      unregisterModal(modalId);
    },
  });

  // Register/unregister in depth stack and restore focus cleanly
  useEffect(() => {
    if (rendered) {
      registerModal(modalId, isOpen ? 1 : 0);
      return () => {
        unregisterModal(modalId);
      };
    }
    return undefined;
  }, [rendered, modalId, registerModal, unregisterModal, isOpen]);

  // Capture & restore focus + focus trap + Escape key on topmost modal
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    // Defer slightly so autofocus inside children settles first, else focus dialog
    const focusTimer = window.setTimeout(() => {
      const sheet = sheetRef.current;
      if (!sheet) return;
      if (!sheet.contains(document.activeElement)) {
        const firstFocusable = sheet.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
        if (firstFocusable) {
          firstFocusable.focus();
        } else {
          sheet.focus();
        }
      }
    }, 10);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isTopModal(modalId)) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const sheet = sheetRef.current;
        if (!sheet) return;
        const focusables = Array.from(sheet.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
          (el) => el.offsetParent !== null || el === document.activeElement
        );
        if (focusables.length === 0) {
          e.preventDefault();
          sheet.focus();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && (document.activeElement === first || !sheet.contains(document.activeElement))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      const prev = previouslyFocusedRef.current;
      if (prev && typeof prev.focus === 'function' && prev.isConnected) {
        prev.focus();
      }
    };
  }, [isOpen, modalId, isTopModal, onClose, sheetRef]);

  if (!rendered || typeof document === 'undefined') return null;

  const maxWidthStyles = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6 overflow-hidden">
      {/* Dimming Scrim */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-[var(--color-scrim)] backdrop-blur-[3px] will-change-[opacity]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Responsive Paper Sheet: 1:1 draggable bottom sheet on mobile, materialized folio on desktop */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={subtitle ? subtitleId : undefined}
        tabIndex={-1}
        className={`relative w-full ${maxWidthStyles[maxWidth]} paper-grid shadow-modal rounded-t-[12px] sm:rounded-[6px] border border-border-strong max-h-[92vh] flex flex-col z-10 overflow-hidden will-change-transform focus:outline-none`}
      >
        {/* Drag handle & header region (supports 1:1 pointer drag on mobile) */}
        <div
          {...dragHandlers}
          className="px-5 sm:px-6 pt-3 sm:pt-5 pb-3.5 border-b border-dashed border-border-strong/80 bg-surface/70 shrink-0 select-none sm:select-auto touch-none sm:touch-auto cursor-grab sm:cursor-auto active:cursor-grabbing sm:active:cursor-auto"
        >
          <div
            className="sm:hidden w-11 h-1.5 bg-muted opacity-55 rounded-full mx-auto mb-3.5"
            aria-hidden="true"
          />

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {title && (
                <h2
                  id={titleId}
                  className="type-title text-primary leading-[1.25]"
                >
                  {title}
                </h2>
              )}
              {subtitle && (
                <p id={subtitleId} className="type-hand text-[18px] text-secondary mt-0.5 leading-[1.2]">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="relative shrink-0 w-9 h-9 -mr-1.5 -mt-0.5 rounded-full text-secondary hover:text-primary hover:bg-surface-soft active:scale-[0.92] transition-[background-color,color,transform] duration-[110ms] flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700/45 before:content-[''] before:absolute before:-inset-1"
              aria-label={t('common.closeDialog')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Sheet Body */}
        <div className={`px-5 sm:px-6 py-5 overflow-y-auto flex-1 min-h-0 ${footer ? '' : 'pb-safe'}`}>
          {children}
        </div>

        {footer && (
          <div className="px-5 sm:px-6 py-3.5 border-t border-dashed border-border-strong/75 bg-surface/85 shrink-0 pb-safe">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

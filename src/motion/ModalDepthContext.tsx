import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';

interface ModalDepthContextValue {
  /** Number of currently mounted/active modals */
  openCount: number;
  /** Checks whether the given modal id is currently the topmost dialog */
  isTopModal: (id: string) => boolean;
  /** Attach the main app shell DOM element to receive zero-rerender GPU push-back updates */
  attachShellElement: (el: HTMLElement | null) => void;
  registerModal: (id: string, initialProgress?: number) => void;
  updateModalProgress: (id: string, progress: number) => void;
  unregisterModal: (id: string) => void;
}

const ModalDepthContext = createContext<ModalDepthContextValue | null>(null);

export const ModalDepthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [openCount, setOpenCount] = useState(0);
  const entriesRef = useRef<Array<{ id: string; progress: number }>>([]);
  const shellRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = openCount > 0 ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [openCount]);

  const syncCssDepth = useCallback(() => {
    const maxProgress = entriesRef.current.reduce((max, item) => Math.max(max, item.progress), 0);
    const target = shellRef.current ?? (typeof document !== 'undefined' ? document.documentElement : null);
    if (target) {
      target.style.setProperty('--modal-depth', maxProgress.toFixed(4));
    }
  }, []);

  const attachShellElement = useCallback(
    (el: HTMLElement | null) => {
      shellRef.current = el;
      syncCssDepth();
    },
    [syncCssDepth]
  );

  const registerModal = useCallback(
    (id: string, initialProgress = 0) => {
      if (entriesRef.current.some((e) => e.id === id)) return;
      entriesRef.current = [...entriesRef.current, { id, progress: Math.max(0, Math.min(1, initialProgress)) }];
      setOpenCount(entriesRef.current.length);
      syncCssDepth();
    },
    [syncCssDepth]
  );

  const updateModalProgress = useCallback(
    (id: string, progress: number) => {
      const clamped = Math.max(0, Math.min(1, progress));
      let changed = false;
      entriesRef.current = entriesRef.current.map((e) => {
        if (e.id !== id) return e;
        if (Math.abs(e.progress - clamped) < 0.002) return e;
        changed = true;
        return { ...e, progress: clamped };
      });
      if (changed) {
        syncCssDepth();
      }
    },
    [syncCssDepth]
  );

  const unregisterModal = useCallback(
    (id: string) => {
      if (!entriesRef.current.some((e) => e.id === id)) return;
      entriesRef.current = entriesRef.current.filter((e) => e.id !== id);
      setOpenCount(entriesRef.current.length);
      syncCssDepth();
    },
    [syncCssDepth]
  );

  const isTopModal = useCallback((id: string) => {
    const list = entriesRef.current;
    return list.length > 0 && list[list.length - 1].id === id;
  }, []);

  const value = useMemo(
    () => ({
      openCount,
      isTopModal,
      attachShellElement,
      registerModal,
      updateModalProgress,
      unregisterModal,
    }),
    [openCount, isTopModal, attachShellElement, registerModal, updateModalProgress, unregisterModal]
  );

  return <ModalDepthContext.Provider value={value}>{children}</ModalDepthContext.Provider>;
};

export function useModalDepth(): ModalDepthContextValue {
  const ctx = useContext(ModalDepthContext);
  if (!ctx) {
    return {
      openCount: 0,
      isTopModal: () => true,
      attachShellElement: () => undefined,
      registerModal: () => undefined,
      updateModalProgress: () => undefined,
      unregisterModal: () => undefined,
    };
  }
  return ctx;
}

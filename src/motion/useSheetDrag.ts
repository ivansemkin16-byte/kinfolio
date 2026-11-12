import { useEffect, useRef, useState, useCallback } from 'react';
import {
  APPLE_SPRINGS,
  SpringDriver,
  VelocityTracker,
  createSpringDriver,
  project,
  rubberband,
} from './spring';
import { useReducedMotion } from './useReducedMotion';
import { triggerHaptic } from './haptics';

interface UseSheetDragOptions {
  isOpen: boolean;
  isMobileSheet: boolean;
  onClose: () => void;
  onProgress?: (progress: number) => void;
  onExited?: () => void;
}

/**
 * Coordinates 1:1 interruptible drag-to-dismiss on mobile bottom sheets and
 * symmetric spring materialization on desktop/tablet dialogs.
 */
export function useSheetDrag({
  isOpen,
  isMobileSheet,
  onClose,
  onProgress,
  onExited,
}: UseSheetDragOptions) {
  const reducedMotion = useReducedMotion();
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const [rendered, setRendered] = useState(isOpen);

  const driverRef = useRef<SpringDriver | null>(null);
  const trackerRef = useRef(new VelocityTracker(110, 80));
  const dragStateRef = useRef<{
    active: boolean;
    pointerId: number;
    startY: number;
    startOffset: number;
    currentOffset: number;
    committedDirection: boolean;
  } | null>(null);

  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;
  const isMobileRef = useRef(isMobileSheet);
  isMobileRef.current = isMobileSheet;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;
  const onExitedRef = useRef(onExited);
  onExitedRef.current = onExited;

  const getMaxDistance = useCallback(() => {
    const elHeight = sheetRef.current?.offsetHeight ?? 440;
    return isMobileRef.current ? Math.max(elHeight + 36, 360) : 28;
  }, []);

  const applyFrame = useCallback(
    (offset: number) => {
      const sheet = sheetRef.current;
      const backdrop = backdropRef.current;
      const maxDist = getMaxDistance();
      const progress = Math.max(0, Math.min(1, 1 - offset / maxDist));

      if (sheet) {
        if (reducedMotion) {
          sheet.style.transform = 'none';
          sheet.style.opacity = String(progress);
          sheet.style.filter = 'none';
        } else if (isMobileRef.current) {
          sheet.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
          sheet.style.opacity = '1';
          sheet.style.filter = 'none';
        } else {
          const scale = 0.955 + 0.045 * progress;
          const blurPx = (1 - progress) * 4;
          sheet.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
          sheet.style.opacity = String(Math.max(0, Math.min(1, progress)));
          sheet.style.filter = blurPx > 0.15 ? `blur(${blurPx.toFixed(2)}px)` : 'none';
        }
      }

      if (backdrop) {
        backdrop.style.opacity = String(progress);
      }

      onProgressRef.current?.(progress);
    },
    [getMaxDistance, reducedMotion]
  );

  // Sync mount & open/close transitions
  useEffect(() => {
    if (isOpen) {
      setRendered(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!rendered) return;

    const initialDist = getMaxDistance();
    const driver = createSpringDriver(
      isOpen ? initialDist : 0,
      APPLE_SPRINGS.default,
      (val) => {
        applyFrame(val);
        if (!isOpenRef.current && isMobileRef.current && val >= getMaxDistance() - 2) {
          driver.stop();
          setRendered(false);
          onProgressRef.current?.(0);
          onExitedRef.current?.();
        }
      },
      (finalVal) => {
        if (!isOpenRef.current && finalVal > 1) {
          setRendered(false);
          onProgressRef.current?.(0);
          onExitedRef.current?.();
        }
      }
    );
    driverRef.current = driver;

    if (isOpen) {
      driver.setTarget(0, {
        config: isMobileRef.current ? APPLE_SPRINGS.sheet : APPLE_SPRINGS.default,
        immediate: reducedMotion,
      });
    } else {
      driver.setTarget(initialDist, {
        config: APPLE_SPRINGS.snappy,
        immediate: reducedMotion,
      });
    }

    return () => {
      driver.stop();
      driverRef.current = null;
    };
    // Create driver once per mount lifecycle of rendered sheet
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rendered]);

  useEffect(() => {
    if (!rendered || !driverRef.current) return;

    if (isOpen) {
      driverRef.current.setTarget(0, {
        config: isMobileRef.current ? APPLE_SPRINGS.sheet : APPLE_SPRINGS.default,
        immediate: reducedMotion,
      });
    } else {
      const target = getMaxDistance();
      driverRef.current.setTarget(target, {
        config: APPLE_SPRINGS.snappy,
        immediate: reducedMotion,
      });
    }
  }, [isOpen, rendered, reducedMotion, getMaxDistance]);

  const onDragPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!isMobileRef.current || reducedMotion) return;
      if (e.button !== 0 && e.pointerType === 'mouse') return;

      // Ignore clicks on buttons/inputs inside the header
      const targetEl = e.target as HTMLElement;
      if (targetEl.closest('button, a, input, select, textarea')) return;

      const driver = driverRef.current;
      if (!driver) return;

      // Interrupt any running open/close spring at its live presentation value
      const liveOffset = driver.getState().value;
      driver.stop();

      e.currentTarget.setPointerCapture(e.pointerId);
      trackerRef.current.reset(liveOffset, e.timeStamp);
      dragStateRef.current = {
        active: true,
        pointerId: e.pointerId,
        startY: e.clientY,
        startOffset: liveOffset,
        currentOffset: liveOffset,
        committedDirection: false,
      };
    },
    [reducedMotion]
  );

  const onDragPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const drag = dragStateRef.current;
      if (!drag || !drag.active || drag.pointerId !== e.pointerId) return;

      const deltaY = e.clientY - drag.startY;
      if (!drag.committedDirection && Math.abs(deltaY) < 6) {
        return;
      }
      drag.committedDirection = true;

      const rawOffset = drag.startOffset + deltaY;
      const offset =
        rawOffset < 0
          ? rubberband(rawOffset, Math.max(240, sheetRef.current?.offsetHeight ?? 360), 0.55)
          : rawOffset;

      drag.currentOffset = offset;
      trackerRef.current.addSample(offset, e.timeStamp);
      driverRef.current?.setValueImmediate(offset);
    },
    []
  );

  const finishDrag = useCallback(
    (e: React.PointerEvent<HTMLElement>, cancelled = false) => {
      const drag = dragStateRef.current;
      if (!drag || !drag.active || drag.pointerId !== e.pointerId) return;
      dragStateRef.current = null;

      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }

      const driver = driverRef.current;
      if (!driver) return;

      if (cancelled || !drag.committedDirection) {
        driver.setTarget(0, { config: APPLE_SPRINGS.sheet });
        return;
      }

      const releaseVelocity = trackerRef.current.getVelocity(e.timeStamp);
      const sheetHeight = sheetRef.current?.offsetHeight ?? 420;
      const projected = drag.currentOffset + project(releaseVelocity, 0.992);

      // Decide commit vs. reverse using velocity sign when flicked, otherwise projected distance
      const shouldDismiss =
        Math.abs(releaseVelocity) > 220
          ? releaseVelocity > 0
          : projected > Math.min(sheetHeight * 0.35, 160);

      if (shouldDismiss) {
        triggerHaptic('selection');
        driver.setTarget(getMaxDistance(), {
          velocity: Math.max(releaseVelocity, 0),
          config: APPLE_SPRINGS.sheet,
        });
        onCloseRef.current();
      } else {
        driver.setTarget(0, {
          velocity: releaseVelocity,
          config: APPLE_SPRINGS.sheet,
        });
      }
    },
    [getMaxDistance]
  );

  return {
    rendered,
    sheetRef,
    backdropRef,
    dragHandlers: {
      onPointerDown: onDragPointerDown,
      onPointerMove: onDragPointerMove,
      onPointerUp: (e: React.PointerEvent<HTMLElement>) => finishDrag(e, false),
      onPointerCancel: (e: React.PointerEvent<HTMLElement>) => finishDrag(e, true),
    },
  };
}

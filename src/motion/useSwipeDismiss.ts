import { useEffect, useRef, useCallback } from 'react';
import {
  APPLE_SPRINGS,
  SpringDriver,
  VelocityTracker,
  createSpringDriver,
  project,
  rubberband,
} from './spring';
import { useReducedMotion } from './useReducedMotion';

interface UseSwipeDismissOptions {
  onDismiss: () => void;
  onHoldChange?: (held: boolean) => void;
}

/**
 * Enables smooth spring entrance and 1:1 pointer swipe-to-dismiss for floating toast items.
 */
export function useSwipeDismiss({ onDismiss, onHoldChange }: UseSwipeDismissOptions) {
  const reducedMotion = useReducedMotion();
  const elementRef = useRef<HTMLDivElement | null>(null);
  const driverRef = useRef<SpringDriver | null>(null);
  const trackerRef = useRef(new VelocityTracker(100, 80));
  const dismissingRef = useRef(false);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startOffset: number;
    currentOffset: number;
    committed: boolean;
  } | null>(null);

  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;
  const onHoldRef = useRef(onHoldChange);
  onHoldRef.current = onHoldChange;

  const applyTransform = useCallback(
    (x: number) => {
      const el = elementRef.current;
      if (!el) return;
      if (reducedMotion) {
        el.style.transform = 'none';
        el.style.opacity = dismissingRef.current ? '0' : '1';
        return;
      }
      const opacity = Math.max(0, Math.min(1, 1 - Math.abs(x) / 220));
      el.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
      el.style.opacity = String(opacity);
    },
    [reducedMotion]
  );

  useEffect(() => {
    const startX = reducedMotion ? 0 : 28;
    const driver = createSpringDriver(
      startX,
      APPLE_SPRINGS.momentum,
      (val) => applyTransform(val),
      () => {
        if (dismissingRef.current) {
          onDismissRef.current();
        }
      }
    );
    driverRef.current = driver;
    driver.setTarget(0, {
      config: APPLE_SPRINGS.snappy,
      immediate: reducedMotion,
    });

    return () => {
      driver.stop();
      driverRef.current = null;
    };
  }, [applyTransform, reducedMotion]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest('button')) return;
      onHoldRef.current?.(true);
      if (reducedMotion) return;

      const driver = driverRef.current;
      if (!driver) return;

      const liveX = driver.getState().value;
      driver.stop();
      e.currentTarget.setPointerCapture(e.pointerId);
      trackerRef.current.reset(liveX, e.timeStamp);
      dragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startOffset: liveX,
        currentOffset: liveX,
        committed: false,
      };
    },
    [reducedMotion]
  );

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    const dx = e.clientX - drag.startX;
    if (!drag.committed && Math.abs(dx) < 8) return;
    drag.committed = true;

    const raw = drag.startOffset + dx;
    // Allow flicking right freely, rubber-band lightly to the left
    const nextX = raw < 0 ? rubberband(raw, 120, 0.45) : raw;
    drag.currentOffset = nextX;
    trackerRef.current.addSample(nextX, e.timeStamp);
    driverRef.current?.setValueImmediate(nextX);
  }, []);

  const finishDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, cancelled = false) => {
      onHoldRef.current?.(false);
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      dragRef.current = null;

      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }

      const driver = driverRef.current;
      if (!driver) return;

      if (cancelled || !drag.committed) {
        driver.setTarget(0, { config: APPLE_SPRINGS.snappy });
        return;
      }

      const releaseVelocity = trackerRef.current.getVelocity(e.timeStamp);
      const projected = drag.currentOffset + project(releaseVelocity, 0.99);

      const shouldDismiss =
        Math.abs(releaseVelocity) > 250
          ? releaseVelocity > 0
          : projected > 96;

      if (shouldDismiss) {
        dismissingRef.current = true;
        driver.setTarget(260, {
          velocity: Math.max(releaseVelocity, 220),
          config: APPLE_SPRINGS.momentum,
        });
      } else {
        driver.setTarget(0, {
          velocity: releaseVelocity,
          config: APPLE_SPRINGS.momentum,
        });
      }
    },
    []
  );

  return {
    elementRef,
    swipeHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => finishDrag(e, false),
      onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => finishDrag(e, true),
    },
  };
}

import { useEffect, useRef } from 'react';
import { APPLE_SPRINGS, SpringConfig, SpringDriver, createSpringDriver } from './spring';
import { useReducedMotion } from './useReducedMotion';

export interface UseSpringTargetOptions {
  target: number;
  config?: SpringConfig;
  onUpdate: (value: number) => void;
  onSettle?: (value: number) => void;
  immediate?: boolean;
}

/**
 * Drives a DOM mutation callback via an interruptible Apple-style spring without React re-renders.
 */
export function useSpringEffect({
  target,
  config = APPLE_SPRINGS.default,
  onUpdate,
  onSettle,
  immediate = false,
}: UseSpringTargetOptions): React.MutableRefObject<SpringDriver | null> {
  const reducedMotion = useReducedMotion();
  const driverRef = useRef<SpringDriver | null>(null);
  const onUpdateRef = useRef(onUpdate);
  const onSettleRef = useRef(onSettle);
  onUpdateRef.current = onUpdate;
  onSettleRef.current = onSettle;

  useEffect(() => {
    const driver = createSpringDriver(
      target,
      config,
      (val) => onUpdateRef.current(val),
      (val) => onSettleRef.current?.(val)
    );
    driverRef.current = driver;
    onUpdateRef.current(target);

    return () => {
      driver.stop();
      driverRef.current = null;
    };
    // Intentionally mount-only; target/config updates flow through the second effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    driverRef.current?.setTarget(target, {
      config,
      immediate: immediate || reducedMotion,
    });
  }, [target, config, immediate, reducedMotion]);

  return driverRef;
}

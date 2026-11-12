import React, { useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { APPLE_SPRINGS, SpringDriver, createSpringDriver } from '../../motion/spring';
import { useReducedMotion } from '../../motion/useReducedMotion';
import { triggerHaptic } from '../../motion/haptics';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
  isAlert?: boolean;
  ariaLabel?: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: 'xs' | 'sm' | 'md';
  tone?: 'surface' | 'green';
  roleMode?: 'tablist' | 'radiogroup';
  className?: string;
  idPrefix?: string;
}

/**
 * Apple-style segmented control with an interruptible critically-damped spring pill
 * and full arrow-key keyboard navigation.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = 'sm',
  tone = 'green',
  roleMode = 'tablist',
  className = '',
  idPrefix = 'seg',
}: SegmentedControlProps<T>) {
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pillRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const xDriverRef = useRef<SpringDriver | null>(null);
  const wDriverRef = useRef<SpringDriver | null>(null);
  const hasMountedRef = useRef(false);

  const syncGeometry = useCallback(() => {
    const pill = pillRef.current;
    const activeBtn = itemRefs.current.get(value);
    if (!pill || !activeBtn) return;

    const targetX = activeBtn.offsetLeft;
    const targetW = activeBtn.offsetWidth;

    if (!hasMountedRef.current || reducedMotion) {
      hasMountedRef.current = true;
      pill.style.opacity = '1';
      xDriverRef.current?.setValueImmediate(targetX);
      wDriverRef.current?.setValueImmediate(targetW);
      pill.style.transform = `translate3d(${targetX}px, 0, 0)`;
      pill.style.width = `${targetW}px`;
      return;
    }

    xDriverRef.current?.setTarget(targetX, { config: APPLE_SPRINGS.snappy });
    wDriverRef.current?.setTarget(targetW, { config: APPLE_SPRINGS.snappy });
  }, [value, reducedMotion]);

  useEffect(() => {
    let currentX = 0;
    let currentW = 0;

    const applyPill = () => {
      if (!pillRef.current) return;
      pillRef.current.style.transform = `translate3d(${currentX.toFixed(2)}px, 0, 0)`;
      pillRef.current.style.width = `${Math.max(0, currentW).toFixed(2)}px`;
    };

    const xDriver = createSpringDriver(0, APPLE_SPRINGS.snappy, (val) => {
      currentX = val;
      applyPill();
    });
    const wDriver = createSpringDriver(0, APPLE_SPRINGS.snappy, (val) => {
      currentW = val;
      applyPill();
    });

    xDriverRef.current = xDriver;
    wDriverRef.current = wDriver;

    return () => {
      xDriver.stop();
      wDriver.stop();
      xDriverRef.current = null;
      wDriverRef.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    syncGeometry();
  }, [syncGeometry, options]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      const pill = pillRef.current;
      const activeBtn = itemRefs.current.get(value);
      if (!pill || !activeBtn) return;
      xDriverRef.current?.setValueImmediate(activeBtn.offsetLeft);
      wDriverRef.current?.setValueImmediate(activeBtn.offsetWidth);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, currentIdx: number) => {
    if (options.length < 2) return;
    let nextIdx: number | null = null;
    if (e.key === 'ArrowRight') nextIdx = (currentIdx + 1) % options.length;
    else if (e.key === 'ArrowLeft') nextIdx = (currentIdx - 1 + options.length) % options.length;
    else if (e.key === 'Home') nextIdx = 0;
    else if (e.key === 'End') nextIdx = options.length - 1;

    if (nextIdx !== null) {
      e.preventDefault();
      const targetOpt = options[nextIdx];
      triggerHaptic('selection');
      onChange(targetOpt.value);
      itemRefs.current.get(targetOpt.value)?.focus();
    }
  };

  const sizeClasses = {
    xs: 'px-2 sm:px-3 py-1 text-[11px] sm:text-[12px] min-h-[30px] gap-1',
    sm: 'px-2.5 sm:px-3.5 py-1.5 text-[12px] sm:text-[13px] min-h-[34px] gap-1.5',
    md: 'px-3.5 sm:px-4 py-2 text-[13px] sm:text-[13.5px] min-h-[38px] gap-1.5 sm:gap-2',
  };

  const pillColor =
    tone === 'green'
      ? 'bg-surface border border-border-strong/80 shadow-soft'
      : 'bg-surface border border-border-strong/80 shadow-soft';

  return (
    <div
      ref={containerRef}
      role={roleMode}
      aria-label={ariaLabel}
      className={`relative inline-flex items-center bg-surface-soft/90 border border-border p-1 rounded-md max-w-full overflow-x-auto no-scrollbar select-none ${className}`}
    >
      {/* Spring-animated sliding paper slip */}
      <div
        ref={pillRef}
        aria-hidden="true"
        className={`absolute top-1 bottom-1 left-0 rounded-sm pointer-events-none opacity-0 ${pillColor}`}
      />

      {options.map((opt, idx) => {
        const isActive = opt.value === value;
        const itemRole = roleMode === 'tablist' ? 'tab' : 'radio';
        const ariaSelectionProp =
          roleMode === 'tablist'
            ? { 'aria-selected': isActive }
            : { 'aria-checked': isActive };

        return (
          <button
            key={opt.value}
            ref={(node) => {
              if (node) itemRefs.current.set(opt.value, node);
              else itemRefs.current.delete(opt.value);
            }}
            id={roleMode === 'tablist' ? `${idPrefix}-tab-${opt.value}` : undefined}
            type="button"
            role={itemRole}
            {...ariaSelectionProp}
            aria-controls={roleMode === 'tablist' ? `${idPrefix}-panel-${opt.value}` : undefined}
            aria-label={opt.ariaLabel}
            tabIndex={isActive ? 0 : -1}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            onClick={() => {
              if (!isActive) {
                triggerHaptic('selection');
                onChange(opt.value);
              }
            }}
            className={`relative z-10 inline-flex items-center justify-center rounded-sm whitespace-nowrap transition-[color,transform] duration-[110ms] ease-out active:scale-[0.96] focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700/45 ${
              sizeClasses[size]
            } ${
              isActive
                ? tone === 'green'
                  ? 'text-green-900 font-semibold'
                  : 'text-primary font-semibold'
                : 'text-secondary font-medium hover:text-primary'
            }`}
          >
            {opt.icon && <span className="shrink-0 flex items-center">{opt.icon}</span>}
            <span>{opt.label}</span>
            {opt.badge !== undefined && (
              <span
                className={`text-[11px] font-semibold px-1.5 py-0.2 rounded-full tabular-nums ${
                  opt.isAlert
                    ? 'bg-danger-bg text-danger-text'
                    : isActive
                    ? 'bg-surface text-green-900'
                    : 'bg-surface/70 text-secondary'
                }`}
              >
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

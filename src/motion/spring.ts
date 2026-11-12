export interface SpringConfig {
  /** Damping ratio: 1.0 = critically damped (no overshoot); < 1.0 = underdamped bounce */
  damping: number;
  /** Response time in seconds (time constant, not fixed duration) */
  response: number;
  /** Positional threshold to consider settled */
  precision?: number;
  /** Velocity threshold (units/s) to consider settled */
  velocityPrecision?: number;
}

export const APPLE_SPRINGS = {
  /** Critically damped default for tabs, UI state, and reposition */
  default: { damping: 1.0, response: 0.34, precision: 0.04, velocityPrecision: 0.5 },
  /** Snappy critically damped spring for compact controls and press release */
  snappy: { damping: 1.0, response: 0.25, precision: 0.04, velocityPrecision: 0.5 },
  /** Momentum-aware sheet/drawer handoff (slight natural settle on flick) */
  sheet: { damping: 0.88, response: 0.35, precision: 0.2, velocityPrecision: 1.5 },
  /** Under-damped spring for flicked cards, toasts, and celebratory pops */
  momentum: { damping: 0.8, response: 0.36, precision: 0.15, velocityPrecision: 1 },
} as const satisfies Record<string, SpringConfig>;

/**
 * Apple WWDC 2018 momentum projection:
 * Estimates resting offset from release velocity (px/s) using exponential decay.
 */
export function project(initialVelocityPxPerSec: number, decelerationRate = 0.998): number {
  if (decelerationRate <= 0 || decelerationRate >= 1) return 0;
  return ((initialVelocityPxPerSec / 1000) * decelerationRate) / (1 - decelerationRate);
}

/**
 * Apple WWDC 2018 progressive boundary resistance (rubber-banding).
 */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  if (dimension <= 0) return 0;
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

export interface SpringState {
  value: number;
  velocity: number;
}

/**
 * Advances a 1D spring one frame using bounded sub-stepped semi-implicit Euler.
 * Sub-stepping at <= 4ms guarantees numerical stability across 60Hz-240Hz displays.
 */
export function stepSpring(
  state: SpringState,
  target: number,
  dtSeconds: number,
  config: SpringConfig
): { value: number; velocity: number; settled: boolean } {
  const response = Math.max(0.05, config.response);
  const damping = Math.max(0.1, config.damping);
  const precision = config.precision ?? 0.1;
  const velocityPrecision = config.velocityPrecision ?? 0.5;

  const omega = (2 * Math.PI) / response;
  const clampedDt = Math.min(Math.max(dtSeconds, 0), 0.032);

  if (clampedDt === 0) {
    const settled =
      Math.abs(state.value - target) <= precision &&
      Math.abs(state.velocity) <= velocityPrecision;
    return { value: state.value, velocity: state.velocity, settled };
  }

  const maxSubStep = 1 / 240;
  const steps = Math.max(1, Math.ceil(clampedDt / maxSubStep));
  const h = clampedDt / steps;

  let x = state.value;
  let v = state.velocity;

  for (let i = 0; i < steps; i++) {
    const displacement = x - target;
    const accel = -omega * omega * displacement - 2 * damping * omega * v;
    v += accel * h;
    x += v * h;
  }

  const isSettled =
    Math.abs(x - target) <= precision && Math.abs(v) <= velocityPrecision;

  if (isSettled) {
    return { value: target, velocity: 0, settled: true };
  }

  return { value: x, velocity: v, settled: false };
}

interface VelocitySample {
  value: number;
  time: number;
}

/**
 * Tracks a short rolling window of pointer samples to compute clean release velocity in px/s.
 */
export class VelocityTracker {
  private samples: VelocitySample[] = [];
  private readonly windowMs: number;
  private readonly stalePauseMs: number;

  constructor(windowMs = 110, stalePauseMs = 80) {
    this.windowMs = windowMs;
    this.stalePauseMs = stalePauseMs;
  }

  reset(initialValue?: number, time = performance.now()): void {
    this.samples = initialValue !== undefined ? [{ value: initialValue, time }] : [];
  }

  addSample(value: number, time = performance.now()): void {
    this.samples.push({ value, time });
    const cutoff = time - this.windowMs;
    while (this.samples.length > 2 && this.samples[0].time < cutoff) {
      this.samples.shift();
    }
  }

  getVelocity(now = performance.now()): number {
    if (this.samples.length < 2) return 0;
    const newest = this.samples[this.samples.length - 1];
    if (now - newest.time > this.stalePauseMs) {
      return 0;
    }

    const oldest = this.samples[0];
    const dtMs = newest.time - oldest.time;
    if (dtMs <= 1) return 0;

    const rawVelocity = ((newest.value - oldest.value) / dtMs) * 1000;
    return Math.max(-4500, Math.min(4500, rawVelocity));
  }
}

export interface SpringDriver {
  setTarget: (target: number, options?: { velocity?: number; immediate?: boolean; config?: SpringConfig }) => void;
  setValueImmediate: (value: number) => void;
  getState: () => SpringState;
  stop: () => void;
}

/**
 * Creates an interruptible requestAnimationFrame spring driver that always animates
 * from the live presentation value and blends velocity across re-targets.
 */
export function createSpringDriver(
  initialValue: number,
  initialConfig: SpringConfig,
  onFrame: (value: number, velocity: number) => void,
  onSettle?: (finalValue: number) => void
): SpringDriver {
  let value = initialValue;
  let velocity = 0;
  let target = initialValue;
  let config = initialConfig;
  let rafId: number | null = null;
  let lastTime: number | null = null;

  const stop = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    lastTime = null;
  };

  const tick = (now: number) => {
    const dt = lastTime === null ? 1 / 60 : (now - lastTime) / 1000;
    lastTime = now;

    const next = stepSpring({ value, velocity }, target, dt, config);
    value = next.value;
    velocity = next.velocity;
    onFrame(value, velocity);

    if (next.settled) {
      rafId = null;
      lastTime = null;
      onSettle?.(value);
      return;
    }

    rafId = requestAnimationFrame(tick);
  };

  const start = () => {
    if (rafId === null) {
      lastTime = performance.now();
      rafId = requestAnimationFrame(tick);
    }
  };

  return {
    setTarget(nextTarget, options) {
      if (options?.config) {
        config = options.config;
      }
      if (options?.velocity !== undefined) {
        velocity = options.velocity;
      }
      target = nextTarget;

      if (options?.immediate) {
        stop();
        value = nextTarget;
        velocity = 0;
        onFrame(value, velocity);
        onSettle?.(value);
        return;
      }

      start();
    },
    setValueImmediate(nextValue) {
      stop();
      value = nextValue;
      target = nextValue;
      velocity = 0;
      onFrame(value, 0);
    },
    getState() {
      return { value, velocity };
    },
    stop,
  };
}

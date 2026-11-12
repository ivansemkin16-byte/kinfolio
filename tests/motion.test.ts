import { describe, it, expect } from 'vitest';
import {
  APPLE_SPRINGS,
  VelocityTracker,
  project,
  rubberband,
  stepSpring,
} from '../src/motion/spring';

describe('Apple Fluid Motion Physics Engine', () => {
  it('projects momentum using Apple exponential decay formula', () => {
    // At 1000 px/s with decelerationRate 0.998 -> (1) * 0.998 / 0.002 = 499 px
    expect(project(1000, 0.998)).toBeCloseTo(499, 2);
    expect(project(-500, 0.998)).toBeCloseTo(-249.5, 2);
    expect(project(0, 0.998)).toBe(0);
  });

  it('applies progressive rubber-band resistance past boundaries', () => {
    const dim = 300;
    const smallPull = rubberband(20, dim);
    const largePull = rubberband(200, dim);
    const hugePull = rubberband(2000, dim);

    expect(smallPull).toBeGreaterThan(0);
    expect(smallPull).toBeLessThan(20);
    expect(largePull).toBeGreaterThan(smallPull);
    expect(largePull).toBeLessThan(dim);
    expect(hugePull).toBeLessThan(dim);
    expect(hugePull / 2000).toBeLessThan(largePull / 200);
    expect(rubberband(-100, dim)).toBeLessThan(0);
  });

  it('computes release velocity accurately and zeroes out after a pause', () => {
    const tracker = new VelocityTracker(110, 80);
    tracker.reset(0, 100);
    tracker.addSample(25, 125);
    tracker.addSample(50, 150);

    // 50px over 50ms -> 1000 px/s
    expect(tracker.getVelocity(160)).toBeCloseTo(1000, 0);

    // If user paused > 80ms before releasing, velocity resets to 0
    expect(tracker.getVelocity(260)).toBe(0);
  });

  it('settles critically damped spring without overshoot and carries velocity on re-target', () => {
    let state = { value: 0, velocity: 0 };
    let maxVal = 0;

    for (let i = 0; i < 60; i++) {
      const next = stepSpring(state, 100, 1 / 60, APPLE_SPRINGS.default);
      state = { value: next.value, velocity: next.velocity };
      maxVal = Math.max(maxVal, state.value);
    }

    expect(state.value).toBeCloseTo(100, 1);
    expect(maxVal).toBeLessThanOrEqual(100.2);

    // Mid-flight re-target preserves non-zero velocity seamlessly
    let mid = { value: 0, velocity: 0 };
    for (let i = 0; i < 6; i++) {
      const next = stepSpring(mid, 200, 1 / 60, APPLE_SPRINGS.sheet);
      mid = { value: next.value, velocity: next.velocity };
    }
    expect(mid.value).toBeGreaterThan(10);
    expect(mid.velocity).toBeGreaterThan(100);

    // Reversing target back to 0 starts from live value and live velocity
    const reversed = stepSpring(mid, 0, 1 / 60, APPLE_SPRINGS.sheet);
    expect(reversed.velocity).toBeLessThan(mid.velocity);
  });
});

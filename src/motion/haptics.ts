export type HapticKind = 'selection' | 'success' | 'warning';

const HAPTIC_PATTERNS: Record<HapticKind, number | number[]> = {
  selection: 6,
  success: [8, 28, 10],
  warning: [14, 32, 14],
};

/**
 * Triggers subtle hardware haptic feedback via the Vibration API when supported.
 * Intentionally no-ops on desktop browsers or devices without vibration support.
 */
export function triggerHaptic(kind: HapticKind = 'selection'): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return;
  }
  try {
    navigator.vibrate(HAPTIC_PATTERNS[kind]);
  } catch {
    // Ignore restricted/sandboxed browser contexts
  }
}

import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { sanitizeExternalUrl } from '../src/utils/url';
import { resetDatabase } from '../src/db/database';
import { lockService } from '../src/services/lockService';

describe('Security & URL Sanitization', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('allows safe http/https URLs and normalizes bare domains', () => {
    expect(sanitizeExternalUrl('https://aesop.com/item')).toBe('https://aesop.com/item');
    expect(sanitizeExternalUrl('http://example.com')).toBe('http://example.com/');
    expect(sanitizeExternalUrl('aesop.com/candle')).toBe('https://aesop.com/candle');
  });

  it('blocks unsafe schemes such as javascript:, data:, and vbscript:', () => {
    expect(sanitizeExternalUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizeExternalUrl('  JAVASCRIPT:alert(document.cookie)')).toBeNull();
    expect(sanitizeExternalUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(sanitizeExternalUrl('vbscript:msgbox(1)')).toBeNull();
    expect(sanitizeExternalUrl('')).toBeNull();
    expect(sanitizeExternalUrl(undefined)).toBeNull();
  });

  it('stores salted passcode digest, verifies matches, rejects mismatches, and clears cleanly', async () => {
    expect(await lockService.hasPasscode()).toBe(false);

    await lockService.setPasscode('2580');
    expect(await lockService.hasPasscode()).toBe(true);
    expect(await lockService.verifyPasscode('2580')).toBe(true);
    expect(await lockService.verifyPasscode('0000')).toBe(false);

    await lockService.clearPasscode();
    expect(await lockService.hasPasscode()).toBe(false);
  });
});

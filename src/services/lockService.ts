import { settingsRepository } from '../db/repositories/settingsRepository';

export interface PasscodeDigest {
  salt: string;
  hash: string;
  updatedAt: string;
}

const PASSCODE_STORAGE_KEY = 'passcodeDigest';

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateSalt(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return toHex(bytes);
}

async function computeSaltedHash(salt: string, passcode: string): Promise<string> {
  const payload = new TextEncoder().encode(`${salt}:${passcode}`);
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', payload);
    return toHex(new Uint8Array(digest));
  }
  // Fallback FNV-1a mix strictly for non-secure test contexts without SubtleCrypto
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (const byte of payload) {
    h1 ^= byte;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= byte;
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  return `${(h1 >>> 0).toString(16).padStart(8, '0')}${(h2 >>> 0).toString(16).padStart(8, '0')}`;
}

export function validatePasscodeFormat(passcode: string): boolean {
  return passcode.trim().length >= 4 && passcode.trim().length <= 32;
}

export const lockService = {
  async hasPasscode(): Promise<boolean> {
    const stored = await settingsRepository.get<PasscodeDigest | null>(PASSCODE_STORAGE_KEY, null);
    return Boolean(stored?.salt && stored?.hash);
  },

  async setPasscode(passcode: string): Promise<void> {
    const normalized = passcode.trim();
    if (!validatePasscodeFormat(normalized)) {
      throw new Error('Passcode must be at least 4 characters.');
    }
    const salt = generateSalt();
    const hash = await computeSaltedHash(salt, normalized);
    const digest: PasscodeDigest = {
      salt,
      hash,
      updatedAt: new Date().toISOString(),
    };
    await settingsRepository.set(PASSCODE_STORAGE_KEY, digest);
  },

  async verifyPasscode(passcode: string): Promise<boolean> {
    const stored = await settingsRepository.get<PasscodeDigest | null>(PASSCODE_STORAGE_KEY, null);
    if (!stored?.salt || !stored?.hash) return true;
    const candidateHash = await computeSaltedHash(stored.salt, passcode.trim());
    return candidateHash === stored.hash;
  },

  async clearPasscode(): Promise<void> {
    await settingsRepository.set(PASSCODE_STORAGE_KEY, null);
  },
};

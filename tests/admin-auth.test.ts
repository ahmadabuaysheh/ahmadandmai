import { describe, it, expect, beforeEach } from 'vitest';
import {
  signAdminCookie,
  verifyAdminCookie,
  passphraseMatches,
} from '@/lib/admin/auth';

describe('admin auth', () => {
  beforeEach(() => {
    process.env.ADMIN_SECRET = 'correct-horse-battery-staple';
  });

  it('round-trips the signed cookie', () => {
    const value = signAdminCookie();
    expect(value).toBeTruthy();
    expect(verifyAdminCookie(value!)).toBe(true);
  });

  it('rejects tampered or missing cookies', () => {
    expect(verifyAdminCookie(signAdminCookie()! + 'x')).toBe(false);
    expect(verifyAdminCookie(undefined)).toBe(false);
    expect(verifyAdminCookie('')).toBe(false);
  });

  it('matches the passphrase exactly', () => {
    expect(passphraseMatches('correct-horse-battery-staple')).toBe(true);
    expect(passphraseMatches('wrong')).toBe(false);
  });

  it('refuses everything when ADMIN_SECRET is unset', () => {
    delete process.env.ADMIN_SECRET;
    expect(signAdminCookie()).toBeNull();
    expect(passphraseMatches('anything')).toBe(false);
    expect(verifyAdminCookie('anything')).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import { signInviteCookie, verifyInviteCookie } from '@/lib/invite/cookie';

describe('invite cookie signing', () => {
  it('round-trips a signed code', () => {
    const value = signInviteCookie('ROSE42');
    expect(verifyInviteCookie(value)).toBe('ROSE42');
  });

  it('rejects tampered values', () => {
    const value = signInviteCookie('ROSE42');
    expect(verifyInviteCookie(value.replace('ROSE42', 'MOON17'))).toBeNull();
    expect(verifyInviteCookie('ROSE42.bogus-signature')).toBeNull();
  });

  it('rejects missing/malformed values', () => {
    expect(verifyInviteCookie(undefined)).toBeNull();
    expect(verifyInviteCookie('')).toBeNull();
    expect(verifyInviteCookie('no-dot-here')).toBeNull();
  });
});

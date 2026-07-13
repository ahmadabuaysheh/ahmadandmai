import { createHmac, timingSafeEqual } from 'node:crypto';

export const INVITE_COOKIE = 'invite';

function secret(): string {
  return process.env.INVITE_SECRET ?? 'dev-secret-change-me';
}

export function signInviteCookie(code: string): string {
  const sig = createHmac('sha256', secret()).update(code).digest('base64url');
  return `${code}.${sig}`;
}

export function verifyInviteCookie(value: string | undefined): string | null {
  if (!value) return null;
  const dot = value.lastIndexOf('.');
  if (dot < 1) return null;
  const code = value.slice(0, dot);
  const expected = Buffer.from(signInviteCookie(code));
  const actual = Buffer.from(value);
  if (expected.length !== actual.length) return null;
  return timingSafeEqual(expected, actual) ? code : null;
}

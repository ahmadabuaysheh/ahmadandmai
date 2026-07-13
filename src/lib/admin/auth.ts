import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE = 'admin';
const PAYLOAD = 'admin-session-v1';

function secret(): string | null {
  return process.env.ADMIN_SECRET ?? null;
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function signAdminCookie(): string | null {
  const s = secret();
  if (!s) return null;
  return createHmac('sha256', s).update(PAYLOAD).digest('base64url');
}

export function verifyAdminCookie(value: string | undefined): boolean {
  const expected = signAdminCookie();
  if (!expected || !value) return false;
  return safeEqual(value, expected);
}

export function passphraseMatches(provided: string): boolean {
  const s = secret();
  if (!s) return false;
  return safeEqual(provided, s);
}

export async function requireAdmin(): Promise<boolean> {
  const jar = await cookies();
  return verifyAdminCookie(jar.get(ADMIN_COOKIE)?.value);
}

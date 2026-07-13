'use server';

import { cookies } from 'next/headers';
import { getDataStore } from '@/lib/data';
import { INVITE_COOKIE, signInviteCookie } from '@/lib/invite/cookie';

export type InviteFormState = { status: 'idle' | 'invalid' | 'ok' };

export async function submitInviteCode(
  _prev: InviteFormState,
  formData: FormData,
): Promise<InviteFormState> {
  const raw = String(formData.get('code') ?? '').trim();
  if (!raw) return { status: 'invalid' };

  const invite = await getDataStore().getInvite(raw);
  if (!invite) return { status: 'invalid' };

  const jar = await cookies();
  jar.set(INVITE_COOKIE, signInviteCookie(invite.code), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 180,
    path: '/',
  });
  return { status: 'ok' };
}

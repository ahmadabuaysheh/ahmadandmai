import { cookies } from 'next/headers';
import { getDataStore } from '@/lib/data';
import type { Tier } from '@/lib/data';
import { INVITE_COOKIE, verifyInviteCookie } from './cookie';

export interface GuestContext {
  tier: Tier;
  guestNames: string[];
  maxPartySize: number;
  code: string | null;
}

export const PUBLIC_CONTEXT: GuestContext = {
  tier: 'public',
  guestNames: [],
  maxPartySize: 0,
  code: null,
};

export async function getGuestContext(): Promise<GuestContext> {
  const jar = await cookies();
  const code = verifyInviteCookie(jar.get(INVITE_COOKIE)?.value);
  if (!code) return PUBLIC_CONTEXT;
  const invite = await getDataStore().getInvite(code);
  if (!invite) return PUBLIC_CONTEXT;
  return {
    tier: invite.tier,
    guestNames: invite.guestNames,
    maxPartySize: invite.maxPartySize,
    code: invite.code,
  };
}

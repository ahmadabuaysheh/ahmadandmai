'use server';

import { getDataStore } from '@/lib/data';
import { getGuestContext } from '@/lib/invite/guest-context';
import { validateGuestbookNote } from '@/lib/guestbook/validate';

export async function submitGuestbookNote(input: {
  name: string;
  note: string;
}): Promise<{ status: 'ok' | 'error' }> {
  const guest = await getGuestContext();
  if (guest.tier === 'public' || !guest.code) return { status: 'error' };

  const invite = await getDataStore().getInvite(guest.code);
  if (!invite) return { status: 'error' };

  const result = validateGuestbookNote(input, invite);
  if (!result.ok) return { status: 'error' };

  try {
    await getDataStore().addGuestbookNote(result.entry);
    return { status: 'ok' };
  } catch {
    return { status: 'error' };
  }
}

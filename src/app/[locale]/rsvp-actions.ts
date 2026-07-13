'use server';

import { getDataStore } from '@/lib/data';
import { getGuestContext } from '@/lib/invite/guest-context';
import { validateRsvp, type RsvpSubmission } from '@/lib/rsvp/validate';
import enMessages from '@/messages/en.json';
import arMessages from '@/messages/ar.json';

// Guests may switch language mid-flow, so accept meals from either locale.
const MEAL_OPTIONS = [
  ...enMessages.rsvp.mealOptions,
  ...arMessages.rsvp.mealOptions,
];

export async function submitRsvp(
  sub: RsvpSubmission,
): Promise<{ status: 'ok' | 'error' }> {
  const guest = await getGuestContext();
  if (guest.tier === 'public' || !guest.code) return { status: 'error' };

  const invite = await getDataStore().getInvite(guest.code);
  if (!invite) return { status: 'error' };

  const result = validateRsvp(sub, invite, MEAL_OPTIONS);
  if (!result.ok) return { status: 'error' };

  try {
    await getDataStore().replaceRsvps(invite.code, result.rows);
    return { status: 'ok' };
  } catch {
    return { status: 'error' };
  }
}

'use server';

import { getDataStore } from '@/lib/data';
import { getGuestContext } from '@/lib/invite/guest-context';
import { validateQuizScore } from '@/lib/quiz/validate';
import enMessages from '@/messages/en.json';
import arMessages from '@/messages/ar.json';

// Guests may play in either language; accept the larger question count.
const MAX_SCORE = Math.max(
  enMessages.quiz.questions.length,
  arMessages.quiz.questions.length,
);

export async function submitQuizScore(input: {
  name: string;
  score: number;
}): Promise<{ status: 'ok' | 'error' }> {
  const guest = await getGuestContext();
  if (guest.tier === 'public' || !guest.code) return { status: 'error' };

  const invite = await getDataStore().getInvite(guest.code);
  if (!invite) return { status: 'error' };

  const result = validateQuizScore(input, invite, MAX_SCORE);
  if (!result.ok) return { status: 'error' };

  try {
    await getDataStore().addQuizScore(result.entry);
    return { status: 'ok' };
  } catch {
    return { status: 'error' };
  }
}

import type { Invite, NewQuizScore } from '@/lib/data';

export function validateQuizScore(
  input: { name: string; score: number },
  invite: Invite,
  maxScore: number,
): { ok: true; entry: NewQuizScore } | { ok: false } {
  if (!invite.guestNames.includes(input.name)) return { ok: false };
  if (
    !Number.isInteger(input.score) ||
    input.score < 0 ||
    input.score > maxScore
  ) {
    return { ok: false };
  }
  return {
    ok: true,
    entry: { inviteCode: invite.code, name: input.name, score: input.score },
  };
}

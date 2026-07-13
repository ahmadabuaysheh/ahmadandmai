import { describe, it, expect } from 'vitest';
import { validateQuizScore } from '@/lib/quiz/validate';
import type { Invite } from '@/lib/data';

const invite: Invite = {
  code: 'ROSE42',
  guestNames: ['Suzan', 'Omar'],
  tier: 'full',
  maxPartySize: 2,
  languagePref: null,
};

describe('validateQuizScore', () => {
  it('accepts a valid score for a named guest', () => {
    expect(validateQuizScore({ name: 'Suzan', score: 4 }, invite, 6)).toEqual({
      ok: true,
      entry: { inviteCode: 'ROSE42', name: 'Suzan', score: 4 },
    });
  });

  it('rejects unknown names, out-of-range and non-integer scores', () => {
    expect(validateQuizScore({ name: 'Nope', score: 4 }, invite, 6).ok).toBe(
      false,
    );
    expect(validateQuizScore({ name: 'Suzan', score: 7 }, invite, 6).ok).toBe(
      false,
    );
    expect(validateQuizScore({ name: 'Suzan', score: -1 }, invite, 6).ok).toBe(
      false,
    );
    expect(validateQuizScore({ name: 'Suzan', score: 2.5 }, invite, 6).ok).toBe(
      false,
    );
  });
});

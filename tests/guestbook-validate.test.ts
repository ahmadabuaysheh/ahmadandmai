import { describe, it, expect } from 'vitest';
import { validateGuestbookNote } from '@/lib/guestbook/validate';
import type { Invite } from '@/lib/data';

const invite: Invite = {
  code: 'ROSE42',
  guestNames: ['Suzan', 'Omar'],
  tier: 'full',
  maxPartySize: 2,
  languagePref: null,
};

describe('validateGuestbookNote', () => {
  it('accepts a named guest with a trimmed note', () => {
    const res = validateGuestbookNote(
      { name: 'Omar', note: '  Congratulations!  ' },
      invite,
    );
    expect(res).toEqual({
      ok: true,
      entry: { inviteCode: 'ROSE42', name: 'Omar', note: 'Congratulations!' },
    });
  });

  it('rejects names not on the invite', () => {
    expect(
      validateGuestbookNote({ name: 'Hacker', note: 'hi' }, invite).ok,
    ).toBe(false);
  });

  it('rejects empty notes and caps long ones', () => {
    expect(validateGuestbookNote({ name: 'Omar', note: '   ' }, invite).ok).toBe(
      false,
    );
    const res = validateGuestbookNote(
      { name: 'Omar', note: 'x'.repeat(600) },
      invite,
    );
    expect(res.ok && res.entry.note.length).toBe(500);
  });
});

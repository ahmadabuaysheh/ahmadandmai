import { describe, it, expect } from 'vitest';
import { validateRsvp, type RsvpSubmission } from '@/lib/rsvp/validate';
import type { Invite } from '@/lib/data';

const invite: Invite = {
  code: 'ROSE42',
  guestNames: ['Suzan', 'Omar'],
  tier: 'full',
  maxPartySize: 3,
  languagePref: null,
};
const MEALS = ['Chicken', 'Beef', 'Vegetarian'];

const base: RsvpSubmission = {
  attending: true,
  partySize: 2,
  meals: ['Chicken', 'Beef'],
  songRequest: ' Our Song ',
  message: '',
};

describe('validateRsvp', () => {
  it('builds one row per guest with names from the invite', () => {
    const res = validateRsvp(base, invite, MEALS);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.rows).toHaveLength(2);
    expect(res.rows[0]).toEqual({
      inviteCode: 'ROSE42',
      guestName: 'Suzan',
      attending: true,
      meal: 'Chicken',
      songRequest: 'Our Song',
      message: null,
    });
    expect(res.rows[1].guestName).toBe('Omar');
    expect(res.rows[1].songRequest).toBeNull();
  });

  it('names overflow guests Guest N', () => {
    const res = validateRsvp(
      { ...base, partySize: 3, meals: ['Chicken', 'Beef', null] },
      invite,
      MEALS,
    );
    expect(res.ok && res.rows[2].guestName).toBe('Guest 3');
  });

  it('rejects party size above the invite cap or below 1', () => {
    expect(
      validateRsvp(
        { ...base, partySize: 4, meals: [null, null, null, null] },
        invite,
        MEALS,
      ).ok,
    ).toBe(false);
    expect(validateRsvp({ ...base, partySize: 0, meals: [] }, invite, MEALS).ok).toBe(
      false,
    );
    expect(
      validateRsvp({ ...base, partySize: 1.5, meals: [null, null] }, invite, MEALS)
        .ok,
    ).toBe(false);
  });

  it('rejects meals not on the menu', () => {
    expect(validateRsvp({ ...base, meals: ['Pizza', 'Beef'] }, invite, MEALS).ok).toBe(
      false,
    );
  });

  it('caps free text at 500 chars', () => {
    const res = validateRsvp({ ...base, message: 'x'.repeat(600) }, invite, MEALS);
    expect(res.ok && res.rows[0].message?.length).toBe(500);
  });

  it('decline produces a single non-attending row', () => {
    const res = validateRsvp(
      {
        attending: false,
        partySize: 1,
        meals: [],
        songRequest: '',
        message: 'Sorry! ',
      },
      invite,
      MEALS,
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.rows).toEqual([
      {
        inviteCode: 'ROSE42',
        guestName: 'Suzan',
        attending: false,
        meal: null,
        songRequest: null,
        message: 'Sorry!',
      },
    ]);
  });
});

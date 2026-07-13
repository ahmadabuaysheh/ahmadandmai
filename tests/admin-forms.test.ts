import { describe, it, expect } from 'vitest';
import { parseInviteForm, parseSettingsForm } from '@/lib/admin/forms';
import type { Settings } from '@/lib/data';

const current: Settings = {
  weddingDateIso: '2026-11-15T16:00:00+03:00',
  venue: { name: 'Hall', address: 'Addr', mapUrl: 'https://m' },
  galleryMode: 'couple',
  uploadToken: 'tok',
};

describe('parseInviteForm', () => {
  const base = {
    code: ' fam01 ',
    guestNames: ' Aunt Salma , Uncle Sami ,',
    tier: 'full',
    maxPartySize: '2',
    languagePref: '',
  };

  it('normalizes a valid form', () => {
    expect(parseInviteForm(base)).toEqual({
      code: 'FAM01',
      guestNames: ['Aunt Salma', 'Uncle Sami'],
      tier: 'full',
      maxPartySize: 2,
      languagePref: null,
    });
  });

  it('rejects bad tiers, sizes, empty codes/names', () => {
    expect(parseInviteForm({ ...base, tier: 'vip' })).toBeNull();
    expect(parseInviteForm({ ...base, maxPartySize: '0' })).toBeNull();
    expect(parseInviteForm({ ...base, maxPartySize: '21' })).toBeNull();
    expect(parseInviteForm({ ...base, code: '  ' })).toBeNull();
    expect(parseInviteForm({ ...base, guestNames: ' , ' })).toBeNull();
  });

  it('accepts ar language pref', () => {
    expect(parseInviteForm({ ...base, languagePref: 'ar' })?.languagePref).toBe(
      'ar',
    );
  });
});

describe('parseSettingsForm', () => {
  const base = {
    weddingDate: '2026-11-15T16:00',
    venueName: 'The Rose Garden Hall',
    venueAddress: '123 Garden Lane',
    venueMapUrl: 'https://maps.example',
    galleryMode: 'guests',
  };

  it('builds ISO date with +03:00 and preserves uploadToken', () => {
    const s = parseSettingsForm(base, current);
    expect(s).toEqual({
      weddingDateIso: '2026-11-15T16:00:00+03:00',
      venue: {
        name: 'The Rose Garden Hall',
        address: '123 Garden Lane',
        mapUrl: 'https://maps.example',
      },
      galleryMode: 'guests',
      uploadToken: 'tok',
    });
  });

  it('empty date clears it; empty venue name clears venue', () => {
    const s = parseSettingsForm(
      { ...base, weddingDate: '', venueName: '' },
      current,
    );
    expect(s?.weddingDateIso).toBeNull();
    expect(s?.venue).toBeNull();
  });

  it('rejects invalid dates and gallery modes', () => {
    expect(
      parseSettingsForm({ ...base, weddingDate: 'garbage' }, current),
    ).toBeNull();
    expect(
      parseSettingsForm({ ...base, galleryMode: 'both' }, current),
    ).toBeNull();
  });
});

import { describe, it, expect } from 'vitest';
import { gateForTier } from '@/lib/gating';
import type { Settings } from '@/lib/data';

const settings: Settings = {
  weddingDateIso: '2027-05-21T16:00:00+03:00',
  venue: { name: 'Hall', address: 'Addr', mapUrl: 'https://maps.example' },
  galleryMode: 'couple',
};

describe('gateForTier', () => {
  it('full tier sees everything', () => {
    const g = gateForTier('full', settings);
    expect(g.weddingDateIso).toBe(settings.weddingDateIso);
    expect(g.venue).toEqual(settings.venue);
    expect(g.showSchedule).toBe(true);
  });

  it('save_the_date tier sees no date, venue, or schedule', () => {
    const g = gateForTier('save_the_date', settings);
    expect(g.weddingDateIso).toBeNull();
    expect(g.venue).toBeNull();
    expect(g.showSchedule).toBe(false);
  });

  it('public tier sees nothing', () => {
    const g = gateForTier('public', settings);
    expect(g.weddingDateIso).toBeNull();
    expect(g.venue).toBeNull();
    expect(g.showSchedule).toBe(false);
  });
});

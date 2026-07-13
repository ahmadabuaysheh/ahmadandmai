import { describe, it, expect } from 'vitest';
import { csvEscape, rsvpsToCsv, songsToText } from '@/lib/admin/csv';
import type { RsvpRow } from '@/lib/data';

const row = (over: Partial<RsvpRow>): RsvpRow => ({
  inviteCode: 'ROSE42',
  guestName: 'Suzan',
  attending: true,
  meal: 'Chicken',
  songRequest: null,
  message: null,
  createdAt: '2026-07-14T10:00:00Z',
  ...over,
});

describe('csvEscape', () => {
  it('quotes commas, quotes, and newlines', () => {
    expect(csvEscape('plain')).toBe('plain');
    expect(csvEscape('a,b')).toBe('"a,b"');
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
    expect(csvEscape('line\nbreak')).toBe('"line\nbreak"');
  });
});

describe('rsvpsToCsv', () => {
  it('emits header plus one line per row', () => {
    const csv = rsvpsToCsv([row({ message: 'love, us' })]);
    const lines = csv.split('\n');
    expect(lines[0]).toBe(
      'invite_code,guest_name,attending,meal,song_request,message,created_at',
    );
    expect(lines[1]).toContain('"love, us"');
  });
});

describe('songsToText', () => {
  it('lists non-empty requests and dedupes identical lines', () => {
    const rows = [
      row({ songRequest: 'Perfect', guestName: 'Suzan' }),
      row({ songRequest: 'Perfect', guestName: 'Suzan' }),
      row({ songRequest: null }),
    ];
    expect(songsToText(rows)).toBe('Perfect — Suzan');
  });
});

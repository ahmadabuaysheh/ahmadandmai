import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createLocalStore } from '@/lib/data/local';

describe('local data store', () => {
  let store: ReturnType<typeof createLocalStore>;

  beforeEach(() => {
    const dir = mkdtempSync(path.join(tmpdir(), 'wedding-db-'));
    store = createLocalStore({ dbPath: path.join(dir, 'db.json') });
  });

  it('finds a seeded invite case/whitespace-insensitively', async () => {
    const invite = await store.getInvite('  rose42 ');
    expect(invite).not.toBeNull();
    expect(invite!.tier).toBe('full');
    expect(invite!.guestNames).toEqual(['Layla', 'Omar']);
    expect(invite!.maxPartySize).toBe(2);
  });

  it('returns null for unknown codes', async () => {
    expect(await store.getInvite('NOPE')).toBeNull();
  });

  it('returns settings with a wedding date and venue', async () => {
    const settings = await store.getSettings();
    expect(settings.weddingDateIso).toBeTruthy();
    expect(settings.venue?.name).toBeTruthy();
    expect(settings.galleryMode).toBe('couple');
  });

  it('persists RSVPs to the db file', async () => {
    await store.saveRsvp({
      inviteCode: 'ROSE42',
      guestName: 'Layla',
      attending: true,
      meal: null,
      songRequest: 'Our song',
      message: null,
    });
    await store.saveRsvp({
      inviteCode: 'ROSE42',
      guestName: 'Omar',
      attending: false,
      meal: null,
      songRequest: null,
      message: 'Sorry!',
    });
    expect((await store.__readAll()).rsvps).toHaveLength(2);
  });
});

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
    expect(invite!.guestNames).toEqual(['Suzan', 'Omar']);
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

  it('replaceRsvps overwrites an invite reply and getRsvps reads it back', async () => {
    await store.replaceRsvps('ROSE42', [
      {
        inviteCode: 'ROSE42',
        guestName: 'Suzan',
        attending: true,
        meal: 'A',
        songRequest: 'Song 1',
        message: 'Hi',
      },
      {
        inviteCode: 'ROSE42',
        guestName: 'Omar',
        attending: true,
        meal: 'B',
        songRequest: null,
        message: null,
      },
    ]);
    expect(await store.getRsvps('ROSE42')).toHaveLength(2);

    // Changing the reply replaces, never appends
    await store.replaceRsvps('ROSE42', [
      {
        inviteCode: 'ROSE42',
        guestName: 'Suzan',
        attending: false,
        meal: null,
        songRequest: null,
        message: null,
      },
    ]);
    const rows = await store.getRsvps('ROSE42');
    expect(rows).toHaveLength(1);
    expect(rows[0].attending).toBe(false);
    expect(rows[0].createdAt).toBeTruthy();
  });

  it('replaceRsvps leaves other invites untouched', async () => {
    await store.replaceRsvps('ROSE42', [
      {
        inviteCode: 'ROSE42',
        guestName: 'Suzan',
        attending: true,
        meal: null,
        songRequest: null,
        message: null,
      },
    ]);
    await store.replaceRsvps('MOON17', [
      {
        inviteCode: 'MOON17',
        guestName: 'Sara',
        attending: true,
        meal: null,
        songRequest: null,
        message: null,
      },
    ]);
    expect(await store.getRsvps('ROSE42')).toHaveLength(1);
    expect(await store.getRsvps('MOON17')).toHaveLength(1);
  });

  it('guestbook notes round-trip newest first', async () => {
    await store.addGuestbookNote({
      inviteCode: 'ROSE42',
      name: 'Suzan',
      note: 'First!',
    });
    await store.addGuestbookNote({
      inviteCode: 'MOON17',
      name: 'Sara',
      note: 'Second!',
    });
    const notes = await store.getGuestbookNotes();
    expect(notes).toHaveLength(2);
    expect(notes[0].note).toBe('Second!');
    expect(notes[0].name).toBe('Sara');
    expect(notes[0].createdAt).toBeTruthy();
    // inviteCode must not be exposed
    expect(
      (notes[0] as unknown as Record<string, unknown>).inviteCode,
    ).toBeUndefined();
  });

  it('quiz scores round-trip', async () => {
    await store.addQuizScore({ inviteCode: 'ROSE42', name: 'Omar', score: 5 });
    const scores = await store.getQuizScores();
    expect(scores).toEqual([
      { name: 'Omar', score: 5, createdAt: expect.any(String) },
    ]);
  });
});

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

  it('photos: addPhoto lands unapproved and getPhotos hides it', async () => {
    await store.addPhoto({ uploaderName: 'Sara', storagePath: 'uploads/a.jpg' });
    expect(await store.getPhotos()).toEqual([]);
  });

  it('photos: getPhotos returns approved photos oldest first', async () => {
    await store.addPhoto({ uploaderName: 'Sara', storagePath: 'uploads/a.jpg' });
    await store.addPhoto({ uploaderName: null, storagePath: 'uploads/b.jpg' });
    await store.__approveAllPhotos();
    const photos = await store.getPhotos();
    expect(photos.map((p) => p.storagePath)).toEqual([
      'uploads/a.jpg',
      'uploads/b.jpg',
    ]);
    expect(photos[0].uploaderName).toBe('Sara');
    expect(photos[0].id).toBeTruthy();
    expect(photos[0].createdAt).toBeTruthy();
  });

  it('admin: listAllRsvps returns every invite reply', async () => {
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
        attending: false,
        meal: null,
        songRequest: null,
        message: null,
      },
    ]);
    expect(await store.listAllRsvps()).toHaveLength(2);
  });

  it('admin: guestbook approval toggles and hides from public reads', async () => {
    await store.addGuestbookNote({
      inviteCode: 'ROSE42',
      name: 'Omar',
      note: 'Hi',
    });
    const [note] = await store.listGuestbook();
    expect(note.approved).toBe(true);
    await store.setGuestbookApproval(note.id, false);
    expect((await store.listGuestbook())[0].approved).toBe(false);
    expect(await store.getGuestbookNotes()).toHaveLength(0);
  });

  it('admin: photo approval toggles', async () => {
    await store.addPhoto({ uploaderName: 'Sara', storagePath: 'uploads/x.jpg' });
    const [photo] = await store.listAllPhotos();
    expect(photo.approved).toBe(false);
    await store.setPhotoApproval(photo.id, true);
    expect(await store.getPhotos()).toHaveLength(1);
  });

  it('admin: updateSettings overrides reads', async () => {
    const settings = await store.getSettings();
    await store.updateSettings({ ...settings, galleryMode: 'guests' });
    expect((await store.getSettings()).galleryMode).toBe('guests');
    expect((await store.getSettings()).uploadToken).toBe(settings.uploadToken);
  });

  it('admin: upsertInvite creates and updates codes over the seed', async () => {
    expect(await store.listInvites()).toHaveLength(2); // seed
    await store.upsertInvite({
      code: 'NEW01',
      guestNames: ['Test'],
      tier: 'full',
      maxPartySize: 1,
      languagePref: null,
    });
    expect(await store.listInvites()).toHaveLength(3);
    expect((await store.getInvite('NEW01'))?.guestNames).toEqual(['Test']);
    await store.upsertInvite({
      code: 'ROSE42',
      guestNames: ['Suzan', 'Omar', 'Baby'],
      tier: 'full',
      maxPartySize: 3,
      languagePref: null,
    });
    expect(await store.listInvites()).toHaveLength(3);
    expect((await store.getInvite('ROSE42'))?.maxPartySize).toBe(3);
  });
});

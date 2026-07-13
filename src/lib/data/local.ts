import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import seed from './seed.json';
import type {
  AdminGuestbookNote,
  AdminPhoto,
  DataStore,
  GuestbookNote,
  Invite,
  NewGuestbookNote,
  NewPhoto,
  NewQuizScore,
  NewRsvp,
  Photo,
  QuizScore,
  RsvpRow,
  Settings,
} from './types';

interface LocalDb {
  rsvps: RsvpRow[];
  guestbook: (NewGuestbookNote & {
    id?: string;
    approved: boolean;
    createdAt: string;
  })[];
  quizScores: (NewQuizScore & { createdAt: string })[];
  photos: (NewPhoto & { id: string; approved: boolean; createdAt: string })[];
  settingsOverride?: Settings;
  invitesOverride?: Invite[];
}

const EMPTY_DB: LocalDb = {
  rsvps: [],
  guestbook: [],
  quizScores: [],
  photos: [],
};

const guestbookId = (n: { id?: string; createdAt: string; name: string }) =>
  n.id ?? `${n.createdAt}:${n.name}`;

export function createLocalStore(opts?: { dbPath?: string }): DataStore & {
  __approveAllPhotos(): Promise<void>;
} {
  const dbPath = opts?.dbPath ?? path.join(process.cwd(), '.local-db.json');

  const readDb = (): LocalDb => {
    if (!existsSync(dbPath)) return structuredClone(EMPTY_DB);
    const raw = JSON.parse(readFileSync(dbPath, 'utf8')) as Partial<LocalDb>;
    return { ...structuredClone(EMPTY_DB), ...raw };
  };

  const mergedInvites = (db: LocalDb): Invite[] => {
    const map = new Map<string, Invite>(
      (seed.invites as Invite[]).map((i) => [i.code, i]),
    );
    for (const i of db.invitesOverride ?? []) map.set(i.code, i);
    return [...map.values()];
  };

  return {
    async getInvite(code: string): Promise<Invite | null> {
      const normalized = code.trim().toUpperCase();
      return mergedInvites(readDb()).find((i) => i.code === normalized) ?? null;
    },

    async getSettings(): Promise<Settings> {
      return readDb().settingsOverride ?? (seed.settings as Settings);
    },

    async getRsvps(inviteCode: string): Promise<RsvpRow[]> {
      return readDb().rsvps.filter((r) => r.inviteCode === inviteCode);
    },

    async replaceRsvps(inviteCode: string, rows: NewRsvp[]): Promise<void> {
      const db = readDb();
      const createdAt = new Date().toISOString();
      db.rsvps = db.rsvps
        .filter((r) => r.inviteCode !== inviteCode)
        .concat(rows.map((r) => ({ ...r, createdAt })));
      writeFileSync(dbPath, JSON.stringify(db, null, 2));
    },

    async getGuestbookNotes(): Promise<GuestbookNote[]> {
      // Insertion order is chronological; reverse for newest-first without
      // relying on millisecond-precision timestamps to break ties.
      return readDb()
        .guestbook.filter((n) => n.approved)
        .reverse()
        .slice(0, 100)
        .map(({ name, note, createdAt }) => ({ name, note, createdAt }));
    },

    async addGuestbookNote(entry: NewGuestbookNote): Promise<void> {
      const db = readDb();
      db.guestbook.push({
        ...entry,
        id: randomUUID(),
        approved: true,
        createdAt: new Date().toISOString(),
      });
      writeFileSync(dbPath, JSON.stringify(db, null, 2));
    },

    async getQuizScores(): Promise<QuizScore[]> {
      return readDb().quizScores.map(({ name, score, createdAt }) => ({
        name,
        score,
        createdAt,
      }));
    },

    async addQuizScore(entry: NewQuizScore): Promise<void> {
      const db = readDb();
      db.quizScores.push({ ...entry, createdAt: new Date().toISOString() });
      writeFileSync(dbPath, JSON.stringify(db, null, 2));
    },

    async getPhotos(): Promise<Photo[]> {
      // Insertion order is chronological (oldest first) already.
      return readDb()
        .photos.filter((p) => p.approved)
        .map(({ id, uploaderName, storagePath, createdAt }) => ({
          id,
          uploaderName,
          storagePath,
          createdAt,
        }));
    },

    async addPhoto(entry: NewPhoto): Promise<void> {
      const db = readDb();
      db.photos.push({
        ...entry,
        id: randomUUID(),
        approved: false,
        createdAt: new Date().toISOString(),
      });
      writeFileSync(dbPath, JSON.stringify(db, null, 2));
    },

    // Test-only helper mirroring dashboard approval.
    async __approveAllPhotos(): Promise<void> {
      const db = readDb();
      db.photos = db.photos.map((p) => ({ ...p, approved: true }));
      writeFileSync(dbPath, JSON.stringify(db, null, 2));
    },

    async listAllRsvps(): Promise<RsvpRow[]> {
      return readDb().rsvps;
    },

    async listGuestbook(): Promise<AdminGuestbookNote[]> {
      return readDb()
        .guestbook.map((n) => ({
          id: guestbookId(n),
          inviteCode: n.inviteCode,
          name: n.name,
          note: n.note,
          approved: n.approved,
          createdAt: n.createdAt,
        }))
        .reverse();
    },

    async setGuestbookApproval(id: string, approved: boolean): Promise<void> {
      const db = readDb();
      db.guestbook = db.guestbook.map((n) =>
        guestbookId(n) === id ? { ...n, approved } : n,
      );
      writeFileSync(dbPath, JSON.stringify(db, null, 2));
    },

    async listAllPhotos(): Promise<AdminPhoto[]> {
      return readDb().photos.map(
        ({ id, uploaderName, storagePath, approved, createdAt }) => ({
          id,
          uploaderName,
          storagePath,
          approved,
          createdAt,
        }),
      );
    },

    async setPhotoApproval(id: string, approved: boolean): Promise<void> {
      const db = readDb();
      db.photos = db.photos.map((p) => (p.id === id ? { ...p, approved } : p));
      writeFileSync(dbPath, JSON.stringify(db, null, 2));
    },

    async updateSettings(settings: Settings): Promise<void> {
      const db = readDb();
      db.settingsOverride = settings;
      writeFileSync(dbPath, JSON.stringify(db, null, 2));
    },

    async listInvites(): Promise<Invite[]> {
      return mergedInvites(readDb());
    },

    async upsertInvite(invite: Invite): Promise<void> {
      const db = readDb();
      db.invitesOverride = [
        ...(db.invitesOverride ?? []).filter((i) => i.code !== invite.code),
        invite,
      ];
      writeFileSync(dbPath, JSON.stringify(db, null, 2));
    },
  };
}

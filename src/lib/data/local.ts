import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import seed from './seed.json';
import type { DataStore, Invite, NewRsvp, Settings } from './types';

interface LocalDb {
  rsvps: (NewRsvp & { createdAt: string })[];
}

const EMPTY_DB: LocalDb = { rsvps: [] };

export function createLocalStore(opts?: { dbPath?: string }): DataStore & {
  __readAll(): Promise<LocalDb>;
} {
  const dbPath = opts?.dbPath ?? path.join(process.cwd(), '.local-db.json');

  const readDb = (): LocalDb =>
    existsSync(dbPath)
      ? (JSON.parse(readFileSync(dbPath, 'utf8')) as LocalDb)
      : structuredClone(EMPTY_DB);

  return {
    async getInvite(code: string): Promise<Invite | null> {
      const normalized = code.trim().toUpperCase();
      return (
        (seed.invites as Invite[]).find((i) => i.code === normalized) ?? null
      );
    },

    async getSettings(): Promise<Settings> {
      return seed.settings as Settings;
    },

    async saveRsvp(rsvp: NewRsvp): Promise<void> {
      const db = readDb();
      db.rsvps.push({ ...rsvp, createdAt: new Date().toISOString() });
      writeFileSync(dbPath, JSON.stringify(db, null, 2));
    },

    async __readAll(): Promise<LocalDb> {
      return readDb();
    },
  };
}

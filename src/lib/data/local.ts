import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import seed from './seed.json';
import type { DataStore, Invite, NewRsvp, RsvpRow, Settings } from './types';

interface LocalDb {
  rsvps: RsvpRow[];
}

const EMPTY_DB: LocalDb = { rsvps: [] };

export function createLocalStore(opts?: { dbPath?: string }): DataStore {
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
  };
}

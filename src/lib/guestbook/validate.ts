import type { Invite, NewGuestbookNote } from '@/lib/data';

const NOTE_MAX = 500;

export function validateGuestbookNote(
  input: { name: string; note: string },
  invite: Invite,
): { ok: true; entry: NewGuestbookNote } | { ok: false } {
  if (!invite.guestNames.includes(input.name)) return { ok: false };
  const note = input.note.trim().slice(0, NOTE_MAX);
  if (!note) return { ok: false };
  return {
    ok: true,
    entry: { inviteCode: invite.code, name: input.name, note },
  };
}

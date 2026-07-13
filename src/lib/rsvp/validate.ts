import type { Invite, NewRsvp } from '@/lib/data';

export interface RsvpSubmission {
  attending: boolean;
  partySize: number;
  meals: (string | null)[];
  songRequest: string;
  message: string;
}

const TEXT_MAX = 500;

function cleanText(value: string): string | null {
  const trimmed = value.trim().slice(0, TEXT_MAX);
  return trimmed === '' ? null : trimmed;
}

function guestName(invite: Invite, i: number): string {
  return invite.guestNames[i] ?? `Guest ${i + 1}`;
}

export function validateRsvp(
  sub: RsvpSubmission,
  invite: Invite,
  mealOptions: string[],
): { ok: true; rows: NewRsvp[] } | { ok: false } {
  const song = cleanText(sub.songRequest);
  const message = cleanText(sub.message);

  if (!sub.attending) {
    return {
      ok: true,
      rows: [
        {
          inviteCode: invite.code,
          guestName: guestName(invite, 0),
          attending: false,
          meal: null,
          songRequest: song,
          message,
        },
      ],
    };
  }

  if (
    !Number.isInteger(sub.partySize) ||
    sub.partySize < 1 ||
    sub.partySize > invite.maxPartySize
  ) {
    return { ok: false };
  }

  const rows: NewRsvp[] = [];
  for (let i = 0; i < sub.partySize; i++) {
    const meal = sub.meals[i] ?? null;
    if (meal !== null && !mealOptions.includes(meal)) return { ok: false };
    rows.push({
      inviteCode: invite.code,
      guestName: guestName(invite, i),
      attending: true,
      meal,
      songRequest: i === 0 ? song : null,
      message: i === 0 ? message : null,
    });
  }
  return { ok: true, rows };
}

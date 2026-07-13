import type { RsvpRow } from '@/lib/data';

export function csvEscape(value: string): string {
  return /[",\n\r]/.test(value)
    ? '"' + value.replaceAll('"', '""') + '"'
    : value;
}

export function rsvpsToCsv(rows: RsvpRow[]): string {
  const header =
    'invite_code,guest_name,attending,meal,song_request,message,created_at';
  const lines = rows.map((r) =>
    [
      r.inviteCode,
      r.guestName,
      String(r.attending),
      r.meal ?? '',
      r.songRequest ?? '',
      r.message ?? '',
      r.createdAt,
    ]
      .map(csvEscape)
      .join(','),
  );
  return [header, ...lines].join('\n');
}

export function songsToText(rows: RsvpRow[]): string {
  const lines = rows
    .filter((r) => r.songRequest)
    .map((r) => `${r.songRequest} — ${r.guestName}`);
  return [...new Set(lines)].join('\n');
}

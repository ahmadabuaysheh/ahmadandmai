import type { Invite, Settings } from '@/lib/data';

export function parseInviteForm(f: {
  code: string;
  guestNames: string;
  tier: string;
  maxPartySize: string;
  languagePref: string;
}): Invite | null {
  const code = f.code.trim().toUpperCase();
  if (!code) return null;
  const guestNames = f.guestNames
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (guestNames.length === 0) return null;
  if (f.tier !== 'full' && f.tier !== 'save_the_date') return null;
  const maxPartySize = Number(f.maxPartySize);
  if (
    !Number.isInteger(maxPartySize) ||
    maxPartySize < 1 ||
    maxPartySize > 20
  ) {
    return null;
  }
  const languagePref =
    f.languagePref === 'en' || f.languagePref === 'ar' ? f.languagePref : null;
  return { code, guestNames, tier: f.tier, maxPartySize, languagePref };
}

export function parseSettingsForm(
  f: {
    weddingDate: string;
    venueName: string;
    venueAddress: string;
    venueMapUrl: string;
    galleryMode: string;
  },
  current: Settings,
): Settings | null {
  let weddingDateIso: string | null = null;
  const rawDate = f.weddingDate.trim();
  if (rawDate) {
    const withSeconds = rawDate.length === 16 ? `${rawDate}:00` : rawDate;
    const iso = `${withSeconds}+03:00`;
    if (Number.isNaN(Date.parse(iso))) return null;
    weddingDateIso = iso;
  }
  const name = f.venueName.trim();
  const venue = name
    ? {
        name,
        address: f.venueAddress.trim(),
        mapUrl: f.venueMapUrl.trim(),
      }
    : null;
  if (f.galleryMode !== 'couple' && f.galleryMode !== 'guests') return null;
  return {
    weddingDateIso,
    venue,
    galleryMode: f.galleryMode,
    uploadToken: current.uploadToken,
  };
}

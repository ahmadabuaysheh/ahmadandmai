import type { Settings, Tier, Venue } from '@/lib/data';

export interface GatedContent {
  weddingDateIso: string | null;
  venue: Venue | null;
  showSchedule: boolean;
}

export function gateForTier(tier: Tier, settings: Settings): GatedContent {
  if (tier === 'full') {
    return {
      weddingDateIso: settings.weddingDateIso,
      venue: settings.venue,
      showSchedule: true,
    };
  }
  return { weddingDateIso: null, venue: null, showSchedule: false };
}

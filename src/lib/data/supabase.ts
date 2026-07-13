import { createClient } from '@supabase/supabase-js';
import type { DataStore, Invite, NewRsvp, Settings } from './types';

export function createSupabaseStore(): DataStore {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  return {
    async getInvite(code: string): Promise<Invite | null> {
      const normalized = code.trim().toUpperCase();
      const { data, error } = await client
        .from('invites')
        .select('code, guest_names, tier, max_party_size, language_pref')
        .eq('code', normalized)
        .maybeSingle();
      if (error || !data) return null;
      return {
        code: data.code,
        guestNames: data.guest_names,
        tier: data.tier,
        maxPartySize: data.max_party_size,
        languagePref: data.language_pref,
      };
    },

    async getSettings(): Promise<Settings> {
      const { data, error } = await client
        .from('settings')
        .select('value')
        .eq('key', 'wedding')
        .single();
      if (error || !data) {
        return { weddingDateIso: null, venue: null, galleryMode: 'couple' };
      }
      return data.value as Settings;
    },

    async saveRsvp(rsvp: NewRsvp): Promise<void> {
      const { error } = await client.from('rsvps').insert({
        invite_code: rsvp.inviteCode,
        guest_name: rsvp.guestName,
        attending: rsvp.attending,
        meal: rsvp.meal,
        song_request: rsvp.songRequest,
        message: rsvp.message,
      });
      if (error) throw new Error(`saveRsvp failed: ${error.message}`);
    },
  };
}

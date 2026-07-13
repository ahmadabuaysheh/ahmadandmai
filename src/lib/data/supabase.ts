import { createClient } from '@supabase/supabase-js';
import type {
  DataStore,
  GuestbookNote,
  Invite,
  NewGuestbookNote,
  NewQuizScore,
  NewRsvp,
  QuizScore,
  RsvpRow,
  Settings,
} from './types';

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
      const stored = (error || !data ? {} : data.value) as Partial<Settings>;
      return {
        weddingDateIso: stored.weddingDateIso ?? null,
        venue: stored.venue ?? null,
        galleryMode: stored.galleryMode ?? 'couple',
        uploadToken: stored.uploadToken ?? null,
      };
    },

    async getRsvps(inviteCode: string): Promise<RsvpRow[]> {
      const { data, error } = await client
        .from('rsvps')
        .select(
          'invite_code, guest_name, attending, meal, song_request, message, created_at',
        )
        .eq('invite_code', inviteCode);
      if (error || !data) return [];
      return data.map((r) => ({
        inviteCode: r.invite_code,
        guestName: r.guest_name,
        attending: r.attending,
        meal: r.meal,
        songRequest: r.song_request,
        message: r.message,
        createdAt: r.created_at,
      }));
    },

    async replaceRsvps(inviteCode: string, rows: NewRsvp[]): Promise<void> {
      const del = await client
        .from('rsvps')
        .delete()
        .eq('invite_code', inviteCode);
      if (del.error) {
        throw new Error(`replaceRsvps delete failed: ${del.error.message}`);
      }
      if (rows.length === 0) return;
      const ins = await client.from('rsvps').insert(
        rows.map((r) => ({
          invite_code: r.inviteCode,
          guest_name: r.guestName,
          attending: r.attending,
          meal: r.meal,
          song_request: r.songRequest,
          message: r.message,
        })),
      );
      if (ins.error) {
        throw new Error(`replaceRsvps insert failed: ${ins.error.message}`);
      }
    },

    async getGuestbookNotes(): Promise<GuestbookNote[]> {
      const { data, error } = await client
        .from('guestbook')
        .select('name, note, created_at')
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error || !data) return [];
      return data.map((n) => ({
        name: n.name,
        note: n.note,
        createdAt: n.created_at,
      }));
    },

    async addGuestbookNote(entry: NewGuestbookNote): Promise<void> {
      const { error } = await client.from('guestbook').insert({
        invite_code: entry.inviteCode,
        name: entry.name,
        note: entry.note,
      });
      if (error) throw new Error(`addGuestbookNote failed: ${error.message}`);
    },

    async getQuizScores(): Promise<QuizScore[]> {
      const { data, error } = await client
        .from('quiz_scores')
        .select('name, score, created_at');
      if (error || !data) return [];
      return data.map((s) => ({
        name: s.name,
        score: s.score,
        createdAt: s.created_at,
      }));
    },

    async addQuizScore(entry: NewQuizScore): Promise<void> {
      const { error } = await client.from('quiz_scores').insert({
        invite_code: entry.inviteCode,
        name: entry.name,
        score: entry.score,
      });
      if (error) throw new Error(`addQuizScore failed: ${error.message}`);
    },
  };
}

# Supabase Migration + Conversational RSVP — Design

Date: 2026-07-13
Status: Approved by Ahmad
Scope: plan.md milestone 4 (RSVP → Supabase), plus moving the deployed site onto the real database. Follows the milestone 1–3 spec (2026-07-13-wedding-site-design.md).

## 1. Supabase setup (user + agent split)

- **User does:** create a free Supabase project; paste two SQL scripts into the dashboard SQL editor (`supabase/migrations/0001_init.sql`, then new `supabase/migrations/0002_seed.sql`); put `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` into `.env.local` directly (secrets never pass through chat).
- **Agent does:** write `0002_seed.sql` (invites `ROSE42`/`MOON17` + settings row with `weddingDateIso: 2026-11-15T16:00:00+03:00`, current venue placeholder, `galleryMode: couple`); verify the app reads from Supabase locally; add the two env vars to Vercel via CLI; redeploy; verify production.
- The backend switch already exists: `getDataStore()` picks Supabase when `NEXT_PUBLIC_SUPABASE_URL` is set. No page-code changes.
- `0002_seed.sql` must be idempotent (upserts) so re-running is safe.

## 2. Data layer changes

Replace the write-only RSVP method with read + replace:

```ts
interface DataStore {
  getInvite(code: string): Promise<Invite | null>;
  getSettings(): Promise<Settings>;
  getRsvps(inviteCode: string): Promise<RsvpRow[]>;
  replaceRsvps(inviteCode: string, rows: NewRsvp[]): Promise<void>;
}
```

- `RsvpRow = NewRsvp & { createdAt: string }`.
- One row per attending guest: `guestName`, `attending`, `meal`. `songRequest` and `message` stored on the first row only (party-level answers).
- Declining: a single row, `attending: false`, `meal: null`.
- `replaceRsvps` deletes the invite's existing rows then inserts the new set (Supabase: `delete().eq('invite_code', …)` then `insert()`; local: filter + append). Guests can change their reply; latest reply wins.
- Update local backend, Supabase backend, and unit tests. `saveRsvp` is removed (nothing shipped uses it yet).

## 3. Conversational RSVP UI

Client component `RsvpFlow` rendered inside the existing `LetterSection id="rsvp"`; server component wrapper fetches the invite's current reply and passes it down.

- **Steps:** `attending` → (yes) `partySize` → `meals` → `song` → `message` → `done`; (no) → `done`. Back link on every step after the first.
- **partySize:** stepper 1‥`maxPartySize` (from invite, server-derived). Skipped entirely when `maxPartySize === 1`.
- **meals:** one picker per attending guest. Guest labels: invite `guestNames[i]`, falling back to a translated "Guest {n}" for unnamed plus-ones. Options from `rsvp.mealOptions` (still `[EDIT ME]` placeholders).
- **song/message:** free text, optional, single input each.
- **done:** `thanksYes` / `thanksNo` copy.
- **Already replied:** section shows a compact summary of the saved reply + "change our reply" button that re-enters the flow pre-filled.
- Chat-like presentation: previous answers remain visible as small "sent" lines; one active question at a time; framer-motion slide/fade transitions, instant under reduced motion; mobile-first.
- New locale keys (EN + AR): `rsvp.editReply`, `rsvp.repliedSummary`, `rsvp.guestN`, `rsvp.partyOf`, `rsvp.skip`, `rsvp.errorGeneric`. No hardcoded strings.

## 4. Server action & validation

`submitRsvp` server action:

- Derives the invite from the signed httpOnly cookie (`getGuestContext()`); rejects `public`.
- Validates: `attending` boolean; `partySize` integer 1‥`maxPartySize`; each meal ∈ `mealOptions` for that locale or null; `songRequest`/`message` trimmed, max 500 chars.
- Builds rows per §2 and calls `replaceRsvps`.
- Returns `{ status: 'ok' } | { status: 'error' }`; UI shows `rsvp.errorGeneric` on error.

## 5. Verification

- Unit tests: `replaceRsvps` on the local store (replace semantics, decline shape); validation function for the server action (caps, meal whitelist, party-size bounds).
- Local E2E: reply as `ROSE42` (party of 2), change reply, decline as `MOON17`; confirm rows in Supabase table editor.
- Production: push → auto-deploy → submit a test reply with `ROSE42`, verify row in Supabase, then delete the test rows.
- Existing tier-gating behavior unchanged; RSVP section visible to both guest tiers (it's not date/venue-gated).

## Out of scope

Guestbook, quiz, gallery, admin panel, per-guest invite management UI, RSVP CSV/playlist export (admin milestone).

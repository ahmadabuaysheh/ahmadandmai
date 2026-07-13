# Wedding Website — Project Brief

Hand this file to Claude Code as the spec. Build it step by step; ask me before making product decisions not covered here.

## Concept: "A Love Letter"

The entire site feels like reading a handwritten love letter. Guests arrive at a sealed envelope with a wax seal; tapping it breaks the seal, the letter unfolds, and the site begins. Text writes itself in as you scroll (handwriting/ink reveal effect), sections feel like pages of stationery, buttons look like wax seals, and transitions feel like turning delicate paper.

Tone: elegant and romantic at its core, with playful surprises hidden throughout.

## Hard Requirements

- **Mobile-first.** Most guests will open this on a phone. Design for ~390px first, enhance upward.
- **Bilingual: English + Arabic**, with full RTL support for Arabic.
  - Language toggle always visible (persist choice in localStorage + URL, e.g. `/en`, `/ar`).
  - Use CSS logical properties (`margin-inline-start`, etc.) everywhere — never left/right.
  - Fonts: an elegant Latin serif (e.g. Cormorant Garamond or Playfair Display) paired with a matching Arabic display font (e.g. Amiri or Aref Ruqaa for headings, IBM Plex Sans Arabic or Noto Naskh Arabic for body). Test the handwriting/ink-reveal effect in Arabic — if it doesn't work well with connected script, use an elegant fade/mask reveal for AR instead.
- **Stack:** Next.js (App Router) + Supabase (DB, Auth-less invite codes, Storage) + Vercel hosting. Custom domain connected later.
- **Date & venue are not final** and may be visible only to certain guests. Build everything so date/venue render from config/DB, never hardcoded, and can be hidden per guest tier (see Access Tiers).

## Access Tiers (invite codes)

Guests enter via a personal or group **invite code** (printed on physical invites / sent by message). No accounts, no passwords.

- Codes live in a Supabase `invites` table: `code`, `guest_names[]`, `tier`, `max_party_size`, `language_pref`.
- Tiers control what's visible:
  - `full` — sees everything including date, venue, schedule.
  - `save_the_date` — sees the letter, story, countdown "coming soon", but venue/date hidden or teased ("Somewhere beautiful, soon").
  - `public` (no code) — landing envelope + teaser only.
- Middleware/server checks the code (stored in a cookie after first entry); tier-gated content is filtered **server-side**, not just hidden in CSS.

## Pages / Letter Sections

One continuous scroll (the letter), with an anchor nav styled as a ribbon bookmark:

1. **Envelope (landing)** — sealed envelope with the couple's initials in wax. Tap to break the seal (satisfying animation + subtle sound, muted by default). Invite code entry here, styled as "addressed to…".
2. **The Letter Opens / Hero** — names, date (tier-gated; otherwise "a date to remember"), and countdown.
3. **Our Story** — timeline written as paragraphs of the letter, photos as tucked-in polaroids that tilt/slide out as you scroll.
4. **The Details** — venue, schedule of the day, map (tier-gated). Interactive map with hotels, travel tips, "our favorite spots nearby".
5. **RSVP** — conversational, one question at a time like a chat: attending? party size (capped by invite)? meal choice? song request? a message for us? Song requests saved to DB (couple can export a playlist).
6. **Guestbook** — notes appear as small folded letters / floating polaroids pinned to a board. Guests write a note (name auto-filled from invite).
7. **Gallery** — engagement photos pre-wedding; after the wedding, flips to a guest-upload wall (Supabase Storage, QR code on tables links here with an upload token). Moderation flag before public display.
8. **Quiz — "How well do you know us?"** — 6–8 questions, leaderboard by guest name. Playful, skippable.
9. **FAQ + Registry** — dress code, kids, parking, gifts. Written as a P.S. at the bottom of the letter.
10. **Signature** — the letter ends with our "handwritten" signatures and the wax seal re-forming as a footer.

## Creative Details & Easter Eggs

- **Countdown:** two ink-drawn characters walking toward each other across the page, meeting on the wedding day. Fallback: elegant numeric flip.
- **Ink reveal:** headings write themselves when they enter the viewport (SVG stroke animation for EN; masked fade for AR if stroke doesn't suit connected script).
- Paper grain texture, deckled edges, subtle page-curl transitions.
- Konami code (or tapping the wax seal 5×) → confetti of tiny hearts + a hidden blooper photo.
- Tiny inside-joke footnotes scattered in the letter margins (content TBD by us).
- Envelope re-seals if idle for a long time (gentle, skippable).

## Supabase Schema (starting point)

- `invites(code pk, guest_names text[], tier, max_party_size, language_pref, created_at)`
- `rsvps(id, invite_code fk, guest_name, attending bool, meal, song_request, message, created_at)`
- `guestbook(id, invite_code fk, name, note, approved bool default true, created_at)`
- `quiz_scores(id, invite_code fk, name, score, created_at)`
- `photos(id, uploader_name, storage_path, approved bool default false, created_at)`
- `settings(key pk, value jsonb)` — wedding date, venue, feature flags (e.g. `gallery_mode: "couple" | "guests"`).
- RLS on: reads of tier-gated settings via server only; writes validated against a valid invite code.

## Admin

Small `/admin` route (protected by a Supabase-auth login for just us): view RSVPs, export CSV + song playlist, approve photos/guestbook, edit settings (date, venue, flags), manage invite codes.

## Non-Functional

- Performance: animations must not tank mobile scroll — use CSS/`framer-motion` with `prefers-reduced-motion` respected.
- Accessibility: semantic HTML, focus states, alt text, reduced-motion fallbacks for every animation.
- SEO mostly irrelevant (private-ish site) — add `noindex`.
- All copy lives in locale files (`en.json`, `ar.json`) from day one. No hardcoded strings. Draft copy already exists in `copy/en.json` and `copy/ar.json` — use these as the initial locale files. Anything marked `[EDIT ME]` / `[عدّلني]` or in `[brackets]` is a placeholder the couple will edit via the admin panel, so all copy must be stored in / editable from the `settings`-style DB layer, not only static files.

## Build Order (suggested milestones)

1. Scaffold Next.js + i18n (EN/AR, RTL) + Supabase connection + deploy pipeline to Vercel.
2. Envelope landing + invite-code flow + tier gating.
3. Letter layout, typography, ink-reveal system, countdown.
4. RSVP conversational flow → Supabase.
5. Story, Details (tier-gated), FAQ/Registry sections.
6. Guestbook + Quiz + leaderboard.
7. Gallery (couple mode), then guest-upload mode + moderation.
8. Admin panel.
9. Polish: easter eggs, sound, transitions, perf pass, reduced-motion audit, AR typography audit.

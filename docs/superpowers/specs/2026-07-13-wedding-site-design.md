# "A Love Letter" Wedding Website — Design (Milestones 1–3)

Date: 2026-07-13
Status: Approved by Ahmad
Product spec: see [PLAN.md](../../../PLAN.md) — this doc covers the technical design for milestones 1–3 (scaffold + i18n, envelope/invite/tier gating, letter layout + ink reveal + countdown).

## Decisions made during brainstorming

- **No Supabase project exists yet** — build against a swappable local data backend; set up Supabase cloud when we reach the database-dependent features.
- **Local dev first** — no GitHub/Vercel pipeline yet; preview in the local browser. Deployment set up when the site is worth showing.
- **Session scope: milestones 1–3** — ends with envelope → letter → hero/story/details skeleton working in EN + AR on mobile.

## 1. Stack & i18n

- **Next.js 15, App Router, TypeScript**, `src/` layout.
- **next-intl** for i18n. Routes under `/[locale]/` (`/en`, `/ar`). Locale persisted in cookie + URL. Language toggle always visible.
  - Rejected: next-i18next (Pages-Router era), hand-rolled i18n (rebuilds formatting/pluralization for no gain).
- `<html lang dir>` derived from locale; `dir="rtl"` for Arabic.
- **CSS logical properties only** (`margin-inline-start`, `padding-block`, etc.) — never left/right. Enforced by convention + code review.
- Locale files: `copy/en.json` and `copy/ar.json` move to `src/messages/{en,ar}.json` verbatim. All copy referenced by key; no hardcoded strings in components.
- Fonts via `next/font/google`:
  - Latin serif: **Cormorant Garamond** (headings + body EN).
  - Arabic display: **Amiri** (headings AR).
  - Arabic body: **IBM Plex Sans Arabic**.
- Tailwind CSS v4 for utility styling (logical-property utilities) + custom CSS for paper textures and animations.

## 2. Data layer (Supabase-ready, local-first)

Single server-only module `src/lib/data/` exposing a narrow interface; page code never touches a DB client directly.

```
interface DataStore {
  getInvite(code: string): Promise<Invite | null>
  getSettings(): Promise<Settings>            // wedding date, venue, feature flags
  saveRsvp(rsvp: NewRsvp): Promise<void>      // later milestone
  // guestbook / quiz / photos methods added in later milestones
}
```

- **Local backend** (`local.ts`): reads seed data from `src/lib/data/seed.json` — sample invite codes for each tier (`full`, `save_the_date`), wedding settings. Active when `NEXT_PUBLIC_SUPABASE_URL` is unset. Writes go to a git-ignored `.local-db.json` so RSVP dev-testing works.
- **Supabase backend** (`supabase.ts`): same interface via `@supabase/supabase-js` (server-side, service-role key). Activated automatically when env keys exist.
- **SQL migration** written now at `supabase/migrations/0001_init.sql` implementing the schema from PLAN.md (invites, rsvps, guestbook, quiz_scores, photos, settings + RLS notes). Applied when the Supabase project is created.
- Types for all tables in `src/lib/data/types.ts`; tier is `'full' | 'save_the_date' | 'public'`.

## 3. Invite flow & tier gating

- Envelope landing shows invite-code entry ("Addressed to…"). Submitting calls a **server action**: validates code via DataStore, on success sets an **httpOnly, signed cookie** (`invite` = code, HMAC-signed with a server secret) and returns guest names + tier.
- Every request derives the guest context server-side: `getGuestContext()` reads the cookie, re-validates the code, returns `{ tier, guestNames, maxPartySize, languagePref }`. Invalid/absent cookie → `public` tier.
- **Tier-gated content is filtered server-side**: date, venue, schedule, and map render only for `full`; `save_the_date` gets the teaser strings ("a date to remember", "Somewhere beautiful — we'll whisper the address soon"); `public` sees only envelope + teaser. The gated HTML never reaches lower-tier clients.
- Wedding date/venue always come from `getSettings()` — never hardcoded.

## 4. Letter UI & animation system (milestone 3 scope)

- One continuous scroll page `/[locale]` composed of section components: `Envelope` (full-screen overlay until seal broken), `Hero`, `Story`, `Details`, plus placeholder stubs for RSVP/Guestbook/Gallery/Quiz/FAQ/Signature (later milestones).
- **Envelope**: wax seal with initials; tap → seal-break + unfold animation (Framer Motion), then letter revealed. Sound optional and muted by default (deferred to polish if time-boxed). "Seal broken" stored in sessionStorage so it doesn't replay every visit.
- **Ink reveal headings**: component `InkHeading` — EN: SVG stroke-draw animation of the heading text; AR: masked wipe/fade reveal (connected script doesn't stroke-animate well). Triggered on viewport entry (IntersectionObserver / Framer `whileInView`).
- **Countdown**: elegant numeric flip fed by wedding date from settings; hidden date tiers show the "coming soon" teaser. Ink-drawn walking characters = later polish milestone.
- **Paper aesthetic**: grain texture + deckled edges via CSS (SVG filters/background images), stationery-page section styling, ribbon-bookmark anchor nav.
- **Story**: letter paragraphs + polaroid photos (placeholder images for now) that tilt/slide in on scroll.
- All animation respects `prefers-reduced-motion` (Framer Motion `useReducedMotion` + CSS media query fallbacks: content appears without motion).
- Mobile-first: designed at 390px, enhanced upward.

## 5. Non-functional

- `robots: noindex` metadata from day one.
- Semantic HTML, focus states, alt text on all images.
- Performance: animations GPU-friendly (transform/opacity only), no scroll-jank on mobile.

## 6. Testing & verification

- **Vitest** unit tests: data layer (local backend), invite validation, cookie signing/verification, tier-gating logic (which fields each tier receives).
- Visual verification in the embedded browser at 390px, both `/en` and `/ar`, checking RTL layout and Arabic typography.
- Manual tier walkthrough with seed codes: public / save_the_date / full.

## Out of scope for this session

RSVP flow, guestbook, gallery, quiz, FAQ/registry content sections beyond stubs, admin panel, easter eggs, sound, Vercel deploy, real Supabase project.

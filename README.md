# A Love Letter — Wedding Website

A bilingual (English/Arabic) wedding website styled as a handwritten love letter: guests break a wax seal, enter their invite code, and read the letter. Built with Next.js (App Router), next-intl, framer-motion, and Supabase. Live at https://ahmadandmai.vercel.app.

## Dev setup

```bash
npm install
npm run dev        # http://localhost:3000 → redirects to /en (or /ar)
npm test           # vitest unit tests
```

## Invite codes (seeded)

| Code     | Tier           | Sees                                   |
| -------- | -------------- | -------------------------------------- |
| `ROSE42` | `full`         | date, countdown, venue, schedule       |
| `MOON17` | `save_the_date`| letter + teasers, no date/venue        |
| (none)   | `public`       | envelope + teaser + code entry only    |

Tier-gated content is filtered **server-side** — it never reaches the HTML of lower tiers.

## RSVP

Guests reply through a conversational flow in the letter: attending → party size (capped by their invite) → per-guest meal → song request → message. Replies are stored one row per guest in the `rsvps` table; re-submitting **replaces** the previous reply. Submissions are validated server-side against the signed invite cookie.

## Guestbook & Quiz

- **Guestbook:** approved notes render as a pinned board (newest first, capped at 100); guests sign with a name from their invite. Notes appear immediately (`approved` default true) — the future admin panel can hide any.
- **Quiz:** questions live in `src/messages/{en,ar}.json` under `quiz.questions` (`answer` is the index of the correct option). Leaderboard shows the top 10 — best score per guest name, earliest attempt wins ties. Retakes allowed.

## Data backend

`src/lib/data/index.ts` picks the backend automatically: **Supabase** when `NEXT_PUBLIC_SUPABASE_URL` is set in `.env.local`, otherwise a **local JSON** store (seed data in `src/lib/data/seed.json`, writes to gitignored `.local-db.json`).

- Schema: `supabase/migrations/0001_init.sql`; seeds: `0002_seed.sql` (both idempotent to re-run).
- Production (Vercel) has `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `INVITE_SECRET` set in the project env. Dev and prod currently share the same Supabase project.
- Deploys: push to `main` → Vercel auto-deploys.

## Project docs

- Product brief: `PLAN.md`
- Design specs: `docs/superpowers/specs/`
- Implementation plans: `docs/superpowers/plans/`
- Copy lives in `src/messages/{en,ar}.json` (drafts preserved in `copy/`); strings in `[brackets]` are placeholders the couple will edit.

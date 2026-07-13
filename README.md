# A Love Letter — Wedding Website

A bilingual (English/Arabic) wedding website styled as a handwritten love letter: guests break a wax seal, enter their invite code, and read the letter. Built with Next.js (App Router), next-intl, framer-motion, and a Supabase-ready data layer.

## Dev setup

```bash
npm install
npm run dev        # http://localhost:3000 → redirects to /en (or /ar)
npm test           # vitest unit tests
```

## Seed invite codes (local backend)

| Code     | Tier           | Sees                                   |
| -------- | -------------- | -------------------------------------- |
| `ROSE42` | `full`         | date, countdown, venue, schedule       |
| `MOON17` | `save_the_date`| letter + teasers, no date/venue        |
| (none)   | `public`       | envelope + teaser + code entry only    |

Tier-gated content is filtered **server-side** — it never reaches the HTML of lower tiers.

## Switching to Supabase

1. Create a Supabase project and run `supabase/migrations/0001_init.sql` in the SQL editor.
2. Copy `.env.local.example` to `.env.local` and fill `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and a strong `INVITE_SECRET`.
3. Restart the dev server — `src/lib/data/index.ts` picks the Supabase backend automatically when the URL is set. Page code doesn't change.

## Project docs

- Product brief: `PLAN.md`
- Design spec: `docs/superpowers/specs/2026-07-13-wedding-site-design.md`
- Implementation plan (milestones 1–3): `docs/superpowers/plans/2026-07-13-love-letter-m1-m3.md`
- Copy lives in `src/messages/{en,ar}.json` (drafts preserved in `copy/`); strings in `[brackets]` are placeholders the couple will edit.

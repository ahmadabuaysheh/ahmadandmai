# Supabase Migration + Conversational RSVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the deployed site onto a real Supabase database and ship the conversational RSVP flow end-to-end (local + production).

**Architecture:** The existing `DataStore` interface gains `getRsvps`/`replaceRsvps` (replacing write-only `saveRsvp`); both backends implement it. A pure validation module builds per-guest RSVP rows from a submission; a server action derives the invite from the signed cookie and persists via the data layer. The UI is a chat-like client wizard inside the existing `rsvp` letter section. Supabase activation stays env-driven — filling `.env.local`/Vercel env flips the backend with no page-code changes.

**Tech Stack:** Existing stack (Next.js 15, next-intl, framer-motion, Vitest, @supabase/supabase-js). No new dependencies.

## Global Constraints

- Mobile-first (~390px); CSS logical properties only (`ms-*`/`me-*`/`ps-*`/`pe-*`, `insetInlineStart/End`); never `left/right` utilities.
- No hardcoded copy — every new string added to BOTH `src/messages/en.json` and `src/messages/ar.json`.
- All animation respects `prefers-reduced-motion` (framer-motion `useReducedMotion()`).
- Server-side trust: RSVP submissions validated against the invite derived from the signed httpOnly cookie, never client data.
- Secrets: Supabase keys go into `.env.local` (user-typed) and Vercel env (CLI) — never into chat, git, or logs.
- Song request + message stored on the FIRST row of a party's RSVP only. Declining = single row `attending: false, meal: null`.
- Working dir `C:\Users\ahmad\Desktop\My Wedding Site`; Git Bash command syntax; commit each task with trailer `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: Idempotent seed migration for Supabase

**Files:**
- Create: `supabase/migrations/0002_seed.sql`

**Interfaces:**
- Consumes: schema from `supabase/migrations/0001_init.sql` (tables `invites`, `settings`).
- Produces: SQL the user pastes into the Supabase SQL editor after `0001_init.sql`. Idempotent (safe to re-run).

- [ ] **Step 1: Write the seed migration**

`supabase/migrations/0002_seed.sql`:

```sql
-- Seed data matching src/lib/data/seed.json. Idempotent: re-running updates.
insert into invites (code, guest_names, tier, max_party_size, language_pref)
values
  ('ROSE42', array['Layla', 'Omar'], 'full', 2, null),
  ('MOON17', array['Sara'], 'save_the_date', 1, 'ar')
on conflict (code) do update set
  guest_names = excluded.guest_names,
  tier = excluded.tier,
  max_party_size = excluded.max_party_size,
  language_pref = excluded.language_pref;

insert into settings (key, value) values (
  'wedding',
  '{
    "weddingDateIso": "2026-11-15T16:00:00+03:00",
    "venue": {
      "name": "The Rose Garden Hall",
      "address": "123 Garden Lane",
      "mapUrl": "https://maps.google.com/?q=rose+garden+hall"
    },
    "galleryMode": "couple"
  }'::jsonb
)
on conflict (key) do update set value = excluded.value;
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/0002_seed.sql
git commit -m "feat: idempotent Supabase seed migration (invites + settings)"
```

---

### Task 2: Data layer — getRsvps/replaceRsvps (TDD)

**Files:**
- Modify: `src/lib/data/types.ts` (replace `saveRsvp` with `getRsvps` + `replaceRsvps`, add `RsvpRow`)
- Modify: `src/lib/data/local.ts`, `src/lib/data/supabase.ts`, `src/lib/data/index.ts` (export `RsvpRow`)
- Test: `tests/data-local.test.ts` (replace the `saveRsvp` test)

**Interfaces:**
- Consumes: existing `NewRsvp`, `DataStore`.
- Produces:
  - `type RsvpRow = NewRsvp & { createdAt: string }`
  - `DataStore.getRsvps(inviteCode: string): Promise<RsvpRow[]>`
  - `DataStore.replaceRsvps(inviteCode: string, rows: NewRsvp[]): Promise<void>` — deletes the invite's rows, inserts the new set. `saveRsvp` is deleted.

- [ ] **Step 1: Rewrite the RSVP test in `tests/data-local.test.ts`**

Replace the `persists RSVPs to the db file` test with:

```ts
  it('replaceRsvps overwrites an invite reply and getRsvps reads it back', async () => {
    await store.replaceRsvps('ROSE42', [
      {
        inviteCode: 'ROSE42',
        guestName: 'Layla',
        attending: true,
        meal: 'A',
        songRequest: 'Song 1',
        message: 'Hi',
      },
      {
        inviteCode: 'ROSE42',
        guestName: 'Omar',
        attending: true,
        meal: 'B',
        songRequest: null,
        message: null,
      },
    ]);
    expect(await store.getRsvps('ROSE42')).toHaveLength(2);

    // Changing the reply replaces, never appends
    await store.replaceRsvps('ROSE42', [
      {
        inviteCode: 'ROSE42',
        guestName: 'Layla',
        attending: false,
        meal: null,
        songRequest: null,
        message: null,
      },
    ]);
    const rows = await store.getRsvps('ROSE42');
    expect(rows).toHaveLength(1);
    expect(rows[0].attending).toBe(false);
    expect(rows[0].createdAt).toBeTruthy();
  });

  it('replaceRsvps leaves other invites untouched', async () => {
    await store.replaceRsvps('ROSE42', [
      { inviteCode: 'ROSE42', guestName: 'Layla', attending: true, meal: null, songRequest: null, message: null },
    ]);
    await store.replaceRsvps('MOON17', [
      { inviteCode: 'MOON17', guestName: 'Sara', attending: true, meal: null, songRequest: null, message: null },
    ]);
    expect(await store.getRsvps('ROSE42')).toHaveLength(1);
    expect(await store.getRsvps('MOON17')).toHaveLength(1);
  });
```

- [ ] **Step 2: Run tests — expect FAIL** (`replaceRsvps is not a function`): `npm test`

- [ ] **Step 3: Implement**

`src/lib/data/types.ts` — replace `saveRsvp` in `DataStore` and add `RsvpRow`:

```ts
export type RsvpRow = NewRsvp & { createdAt: string };

export interface DataStore {
  getInvite(code: string): Promise<Invite | null>;
  getSettings(): Promise<Settings>;
  getRsvps(inviteCode: string): Promise<RsvpRow[]>;
  replaceRsvps(inviteCode: string, rows: NewRsvp[]): Promise<void>;
}
```

`src/lib/data/local.ts` — replace `saveRsvp` with (and change `LocalDb` to `{ rsvps: RsvpRow[] }`, importing `RsvpRow`):

```ts
    async getRsvps(inviteCode: string): Promise<RsvpRow[]> {
      return readDb().rsvps.filter((r) => r.inviteCode === inviteCode);
    },

    async replaceRsvps(inviteCode: string, rows: NewRsvp[]): Promise<void> {
      const db = readDb();
      const createdAt = new Date().toISOString();
      db.rsvps = db.rsvps
        .filter((r) => r.inviteCode !== inviteCode)
        .concat(rows.map((r) => ({ ...r, createdAt })));
      writeFileSync(dbPath, JSON.stringify(db, null, 2));
    },
```

`src/lib/data/supabase.ts` — replace `saveRsvp` with:

```ts
    async getRsvps(inviteCode: string): Promise<RsvpRow[]> {
      const { data, error } = await client
        .from('rsvps')
        .select('invite_code, guest_name, attending, meal, song_request, message, created_at')
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
      const del = await client.from('rsvps').delete().eq('invite_code', inviteCode);
      if (del.error) throw new Error(`replaceRsvps delete failed: ${del.error.message}`);
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
      if (ins.error) throw new Error(`replaceRsvps insert failed: ${ins.error.message}`);
    },
```

Add `RsvpRow` to the type re-exports in `src/lib/data/index.ts`. Delete the `__readAll` helper if no test uses it anymore (the new tests use `getRsvps`; if `__readAll` is unused, remove it and its return-type wrapper).

- [ ] **Step 4: Run tests + typecheck — expect PASS**: `npm test && npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: data layer reads and replaces RSVP replies per invite"
```

---

### Task 3: CHECKPOINT — user creates the Supabase project

**Files:** none (user actions + verification).

**Interfaces:**
- Produces: working Supabase backend locally (`.env.local` filled), schema + seeds applied.

- [ ] **Step 1: Ask the user to do the manual part**

Ask the user (AskUserQuestion or plain message) to:
1. Create a project at https://supabase.com/dashboard (free tier, any region near guests).
2. In the SQL editor, paste and run the full contents of `supabase/migrations/0001_init.sql`, then `supabase/migrations/0002_seed.sql`.
3. In `.env.local` (create from `.env.local.example` if missing), set `NEXT_PUBLIC_SUPABASE_URL` (Project Settings → API → Project URL) and `SUPABASE_SERVICE_ROLE_KEY` (service_role secret). Do NOT paste keys into chat.
4. Say "done".

Wait for confirmation. Do not proceed on assumption.

- [ ] **Step 2: Verify the app now runs on Supabase locally**

Restart the dev server (env change requires restart): stop/start the preview server. Then fetch `http://localhost:3000/en` fresh (no cookie) — envelope shows; enter `ROSE42` (seeded in Supabase now) — letter opens with date/venue from the `settings` table. If the invite is rejected, debug before continuing (check env var names, seed ran, project URL).

- [ ] **Step 3: Commit** (only if any incidental fixes were needed; otherwise nothing to commit).

---

### Task 4: RSVP validation module (TDD)

**Files:**
- Create: `src/lib/rsvp/validate.ts`
- Test: `tests/rsvp-validate.test.ts`

**Interfaces:**
- Consumes: `Invite`, `NewRsvp` from `@/lib/data`.
- Produces:
  - `interface RsvpSubmission { attending: boolean; partySize: number; meals: (string | null)[]; songRequest: string; message: string }`
  - `validateRsvp(sub: RsvpSubmission, invite: Invite, mealOptions: string[]): { ok: true; rows: NewRsvp[] } | { ok: false }`
  - Row-building rules: decline → one row (`guestName: invite.guestNames[0] ?? 'Guest 1'`, `attending: false`, `meal: null`, song/message still captured on that row after trimming). Accept → `partySize` rows; `guestName = invite.guestNames[i] ?? 'Guest ' + (i + 1)`; `meal = meals[i]` (must be in `mealOptions` or null); `songRequest`/`message` trimmed to ≤500 chars, empty → null, first row only.

- [ ] **Step 1: Write the failing test**

`tests/rsvp-validate.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { validateRsvp, type RsvpSubmission } from '@/lib/rsvp/validate';
import type { Invite } from '@/lib/data';

const invite: Invite = {
  code: 'ROSE42',
  guestNames: ['Layla', 'Omar'],
  tier: 'full',
  maxPartySize: 3,
  languagePref: null,
};
const MEALS = ['Chicken', 'Beef', 'Vegetarian'];

const base: RsvpSubmission = {
  attending: true,
  partySize: 2,
  meals: ['Chicken', 'Beef'],
  songRequest: ' Our Song ',
  message: '',
};

describe('validateRsvp', () => {
  it('builds one row per guest with names from the invite', () => {
    const res = validateRsvp(base, invite, MEALS);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.rows).toHaveLength(2);
    expect(res.rows[0]).toEqual({
      inviteCode: 'ROSE42',
      guestName: 'Layla',
      attending: true,
      meal: 'Chicken',
      songRequest: 'Our Song',
      message: null,
    });
    expect(res.rows[1].guestName).toBe('Omar');
    expect(res.rows[1].songRequest).toBeNull();
  });

  it('names overflow guests Guest N', () => {
    const res = validateRsvp(
      { ...base, partySize: 3, meals: ['Chicken', 'Beef', null] },
      invite,
      MEALS,
    );
    expect(res.ok && res.rows[2].guestName).toBe('Guest 3');
  });

  it('rejects party size above the invite cap or below 1', () => {
    expect(validateRsvp({ ...base, partySize: 4, meals: [null, null, null, null] }, invite, MEALS).ok).toBe(false);
    expect(validateRsvp({ ...base, partySize: 0, meals: [] }, invite, MEALS).ok).toBe(false);
    expect(validateRsvp({ ...base, partySize: 1.5, meals: [null, null] }, invite, MEALS).ok).toBe(false);
  });

  it('rejects meals not on the menu', () => {
    expect(validateRsvp({ ...base, meals: ['Pizza', 'Beef'] }, invite, MEALS).ok).toBe(false);
  });

  it('caps free text at 500 chars', () => {
    const res = validateRsvp({ ...base, message: 'x'.repeat(600) }, invite, MEALS);
    expect(res.ok && res.rows[0].message?.length).toBe(500);
  });

  it('decline produces a single non-attending row', () => {
    const res = validateRsvp(
      { attending: false, partySize: 1, meals: [], songRequest: '', message: 'Sorry! ' },
      invite,
      MEALS,
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.rows).toEqual([
      {
        inviteCode: 'ROSE42',
        guestName: 'Layla',
        attending: false,
        meal: null,
        songRequest: null,
        message: 'Sorry!',
      },
    ]);
  });
});
```

- [ ] **Step 2: Run — expect FAIL** (module missing): `npm test`

- [ ] **Step 3: Implement `src/lib/rsvp/validate.ts`**

```ts
import type { Invite, NewRsvp } from '@/lib/data';

export interface RsvpSubmission {
  attending: boolean;
  partySize: number;
  meals: (string | null)[];
  songRequest: string;
  message: string;
}

const TEXT_MAX = 500;

function cleanText(value: string): string | null {
  const trimmed = value.trim().slice(0, TEXT_MAX);
  return trimmed === '' ? null : trimmed;
}

function guestName(invite: Invite, i: number): string {
  return invite.guestNames[i] ?? `Guest ${i + 1}`;
}

export function validateRsvp(
  sub: RsvpSubmission,
  invite: Invite,
  mealOptions: string[],
): { ok: true; rows: NewRsvp[] } | { ok: false } {
  const song = cleanText(sub.songRequest);
  const message = cleanText(sub.message);

  if (!sub.attending) {
    return {
      ok: true,
      rows: [
        {
          inviteCode: invite.code,
          guestName: guestName(invite, 0),
          attending: false,
          meal: null,
          songRequest: song,
          message,
        },
      ],
    };
  }

  if (
    !Number.isInteger(sub.partySize) ||
    sub.partySize < 1 ||
    sub.partySize > invite.maxPartySize
  ) {
    return { ok: false };
  }

  const rows: NewRsvp[] = [];
  for (let i = 0; i < sub.partySize; i++) {
    const meal = sub.meals[i] ?? null;
    if (meal !== null && !mealOptions.includes(meal)) return { ok: false };
    rows.push({
      inviteCode: invite.code,
      guestName: guestName(invite, i),
      attending: true,
      meal,
      songRequest: i === 0 ? song : null,
      message: i === 0 ? message : null,
    });
  }
  return { ok: true, rows };
}
```

- [ ] **Step 4: Run — expect PASS**: `npm test`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: RSVP submission validation and row building"
```

---

### Task 5: submitRsvp server action

**Files:**
- Create: `src/app/[locale]/rsvp-actions.ts`

**Interfaces:**
- Consumes: `getGuestContext()`, `getDataStore()`, `validateRsvp`, `RsvpSubmission`.
- Produces: `submitRsvp(sub: RsvpSubmission): Promise<{ status: 'ok' | 'error' }>` — meal whitelist is the union of EN and AR `rsvp.mealOptions` (guests may switch language mid-flow).

- [ ] **Step 1: Implement**

`src/app/[locale]/rsvp-actions.ts`:

```ts
'use server';

import { getDataStore } from '@/lib/data';
import { getGuestContext } from '@/lib/invite/guest-context';
import { validateRsvp, type RsvpSubmission } from '@/lib/rsvp/validate';
import enMessages from '@/messages/en.json';
import arMessages from '@/messages/ar.json';

const MEAL_OPTIONS = [
  ...enMessages.rsvp.mealOptions,
  ...arMessages.rsvp.mealOptions,
];

export async function submitRsvp(
  sub: RsvpSubmission,
): Promise<{ status: 'ok' | 'error' }> {
  const guest = await getGuestContext();
  if (guest.tier === 'public' || !guest.code) return { status: 'error' };

  const invite = await getDataStore().getInvite(guest.code);
  if (!invite) return { status: 'error' };

  const result = validateRsvp(sub, invite, MEAL_OPTIONS);
  if (!result.ok) return { status: 'error' };

  try {
    await getDataStore().replaceRsvps(invite.code, result.rows);
    return { status: 'ok' };
  } catch {
    return { status: 'error' };
  }
}
```

- [ ] **Step 2: Typecheck**: `npx tsc --noEmit` — expect clean. (Behavior is exercised end-to-end in Task 6/7; the validation core is already unit-tested.)

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: submitRsvp server action with cookie-derived invite"
```

---

### Task 6: Conversational RSVP UI

**Files:**
- Create: `src/components/letter/Rsvp.tsx` (server wrapper), `src/components/letter/RsvpFlow.tsx` (client wizard)
- Modify: `src/messages/en.json`, `src/messages/ar.json` (new `rsvp.*` keys)
- Modify: `src/app/[locale]/page.tsx` (replace the rsvp stub with `<Rsvp guest={guest} />`)

**Interfaces:**
- Consumes: `getDataStore().getRsvps`, `GuestContext`, `submitRsvp`, messages `rsvp.*`.
- Produces: `<Rsvp guest={GuestContext} />` server component.

- [ ] **Step 1: Add locale keys**

Into `rsvp` in `src/messages/en.json` (before `"thanksYes"`):

```json
    "editReply": "Change our reply",
    "repliedSummary": "Your reply is sealed:",
    "guestN": "Guest {n}",
    "partyOf": "Party of {n}",
    "notComing": "Regretfully declined",
    "skip": "Skip this one",
    "errorGeneric": "The ink smudged — please try sending again.",
```

Into `rsvp` in `src/messages/ar.json`:

```json
    "editReply": "تعديل ردّنا",
    "repliedSummary": "خُتم ردّكم:",
    "guestN": "الضيف {n}",
    "partyOf": "عدد الحضور {n}",
    "notComing": "نعتذر عن الحضور",
    "skip": "تخطَّ هذا السؤال",
    "errorGeneric": "لُطّخ الحبر — حاول الإرسال مرة أخرى.",
```

Validate both files parse: `node -e "for (const f of ['src/messages/en.json','src/messages/ar.json']) JSON.parse(require('fs').readFileSync(f)); console.log('OK')"`

- [ ] **Step 2: Server wrapper `src/components/letter/Rsvp.tsx`**

```tsx
import { getTranslations } from 'next-intl/server';
import { getDataStore } from '@/lib/data';
import type { GuestContext } from '@/lib/invite/guest-context';
import LetterSection from './LetterSection';
import RsvpFlow from './RsvpFlow';

export default async function Rsvp({ guest }: { guest: GuestContext }) {
  const t = await getTranslations('rsvp');
  const existing = guest.code ? await getDataStore().getRsvps(guest.code) : [];

  return (
    <LetterSection id="rsvp" title={t('title')}>
      <p className="italic text-ink-faded">{t('intro')}</p>
      <RsvpFlow
        guestNames={guest.guestNames}
        maxPartySize={guest.maxPartySize}
        existing={existing.map((r) => ({
          guestName: r.guestName,
          attending: r.attending,
          meal: r.meal,
          songRequest: r.songRequest,
          message: r.message,
        }))}
      />
    </LetterSection>
  );
}
```

- [ ] **Step 3: Client wizard `src/components/letter/RsvpFlow.tsx`**

```tsx
'use client';

import { useState, useTransition } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { submitRsvp } from '@/app/[locale]/rsvp-actions';

type Step = 'attending' | 'partySize' | 'meals' | 'song' | 'message' | 'done';

interface ExistingRow {
  guestName: string;
  attending: boolean;
  meal: string | null;
  songRequest: string | null;
  message: string | null;
}

const stepMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

function Chip({
  selected,
  onClick,
  children,
}: {
  selected?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 transition-colors ${
        selected
          ? 'border-wax bg-wax text-paper'
          : 'border-ink-faded/40 bg-paper hover:border-wax'
      }`}
    >
      {children}
    </button>
  );
}

export default function RsvpFlow({
  guestNames,
  maxPartySize,
  existing,
}: {
  guestNames: string[];
  maxPartySize: number;
  existing: ExistingRow[];
}) {
  const t = useTranslations('rsvp');
  const reduced = useReducedMotion();
  const [isPending, startTransition] = useTransition();

  const [editing, setEditing] = useState(existing.length === 0);
  const [step, setStep] = useState<Step>('attending');
  const [attending, setAttending] = useState<boolean | null>(null);
  const [partySize, setPartySize] = useState(1);
  const [meals, setMeals] = useState<(string | null)[]>([]);
  const [song, setSong] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);

  const mealOptions = t.raw('mealOptions') as string[];
  const guestLabel = (i: number) =>
    guestNames[i] ?? t('guestN', { n: i + 1 });

  const send = (finalAttending: boolean, finalMessage: string) => {
    setError(false);
    startTransition(async () => {
      const res = await submitRsvp({
        attending: finalAttending,
        partySize,
        meals,
        songRequest: song,
        message: finalMessage,
      });
      if (res.status === 'ok') {
        setStep('done');
      } else {
        setError(true);
      }
    });
  };

  const chooseAttending = (yes: boolean) => {
    setAttending(yes);
    if (!yes) {
      setStep('message');
    } else {
      setStep(maxPartySize > 1 ? 'partySize' : 'meals');
    }
  };

  // Saved-reply summary
  if (!editing) {
    const first = existing[0];
    return (
      <div className="mt-6 space-y-2">
        <p className="font-medium">{t('repliedSummary')}</p>
        {first.attending ? (
          <>
            <p>{t('partyOf', { n: existing.length })}</p>
            <ul className="text-sm text-ink-faded">
              {existing.map((r) => (
                <li key={r.guestName}>
                  {r.guestName}
                  {r.meal ? ` — ${r.meal}` : ''}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>{t('notComing')}</p>
        )}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-2 underline decoration-gold underline-offset-4"
        >
          {t('editReply')}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          {...(reduced ? {} : stepMotion)}
          transition={{ duration: 0.35 }}
        >
          {step === 'attending' && (
            <fieldset>
              <legend className="mb-3 font-medium">{t('qAttending')}</legend>
              <div className="flex flex-wrap gap-2">
                <Chip onClick={() => chooseAttending(true)}>{t('aYes')}</Chip>
                <Chip onClick={() => chooseAttending(false)}>{t('aNo')}</Chip>
              </div>
            </fieldset>
          )}

          {step === 'partySize' && (
            <fieldset>
              <legend className="mb-3 font-medium">{t('qParty')}</legend>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: maxPartySize }, (_, i) => i + 1).map(
                  (n) => (
                    <Chip
                      key={n}
                      selected={partySize === n}
                      onClick={() => {
                        setPartySize(n);
                        setMeals(Array(n).fill(null));
                        setStep('meals');
                      }}
                    >
                      {n}
                    </Chip>
                  ),
                )}
              </div>
            </fieldset>
          )}

          {step === 'meals' && (
            <fieldset>
              <legend className="mb-3 font-medium">{t('qMeal')}</legend>
              <div className="space-y-4">
                {Array.from({ length: partySize }, (_, i) => (
                  <div key={i}>
                    <p className="mb-1 text-sm text-ink-faded">
                      {guestLabel(i)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {mealOptions.map((opt) => (
                        <Chip
                          key={opt}
                          selected={meals[i] === opt}
                          onClick={() =>
                            setMeals((m) => {
                              const next = [...m];
                              next[i] = opt;
                              return next;
                            })
                          }
                        >
                          {opt}
                        </Chip>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                disabled={meals.some((m) => m === null)}
                onClick={() => setStep('song')}
                className="mt-4 rounded-full bg-wax px-5 py-2 text-paper disabled:opacity-40"
              >
                {t('title')}
              </button>
            </fieldset>
          )}

          {step === 'song' && (
            <div>
              <label htmlFor="rsvp-song" className="mb-3 block font-medium">
                {t('qSong')}
              </label>
              <input
                id="rsvp-song"
                value={song}
                onChange={(e) => setSong(e.target.value)}
                maxLength={500}
                placeholder={t('songPlaceholder')}
                className="w-full rounded-md border border-ink-faded/40 bg-paper px-3 py-2"
              />
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('message')}
                  className="rounded-full bg-wax px-5 py-2 text-paper"
                >
                  {t('title')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSong('');
                    setStep('message');
                  }}
                  className="text-sm text-ink-faded underline"
                >
                  {t('skip')}
                </button>
              </div>
            </div>
          )}

          {step === 'message' && (
            <div>
              <label htmlFor="rsvp-message" className="mb-3 block font-medium">
                {t('qMessage')}
              </label>
              <textarea
                id="rsvp-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={500}
                rows={4}
                placeholder={t('messagePlaceholder')}
                className="w-full rounded-md border border-ink-faded/40 bg-paper px-3 py-2"
              />
              {error && (
                <p role="alert" className="mt-2 text-sm text-wax">
                  {t('errorGeneric')}
                </p>
              )}
              <button
                type="button"
                disabled={isPending || attending === null}
                onClick={() => send(attending!, message)}
                className="mt-3 rounded-full bg-wax px-5 py-2 text-paper disabled:opacity-40"
              >
                {isPending ? '…' : t('title')}
              </button>
            </div>
          )}

          {step === 'done' && (
            <p className="font-medium">
              {attending ? t('thanksYes') : t('thanksNo')}
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
```

Note for executor: the continue buttons reuse `t('title')` ("Write Back to Us") which reads oddly as a button. Use `common.continue` and `common.send` instead: continue buttons → `useTranslations('common')` `tc('continue')`; the final submit button → `tc('send')`. Implement it that way from the start.

Also add a back link (`common.back`) on every step after `attending`, above the question, wired to this step map (declining jumps `attending → message`, so back from `message` returns to where the user actually came from):

```tsx
const goBack = () => {
  if (step === 'partySize') setStep('attending');
  else if (step === 'meals') setStep(maxPartySize > 1 ? 'partySize' : 'attending');
  else if (step === 'song') setStep('meals');
  else if (step === 'message') setStep(attending ? 'song' : 'attending');
};
// render when step !== 'attending' && step !== 'done':
// <button type="button" onClick={goBack} className="mb-3 text-sm text-ink-faded underline">{tc('back')}</button>
```

- [ ] **Step 4: Wire into the page**

In `src/app/[locale]/page.tsx`: import `Rsvp` from `@/components/letter/Rsvp`; change `const stubs = sections.slice(2)` to exclude rsvp too (`sections.slice(3)`), and render `<Rsvp guest={guest} />` after `<Details gated={gated} />`.

- [ ] **Step 5: Verify locally (dev server, both locales)**

- `ROSE42`: attending → party 2 → meals per Layla/Omar → song → message → send → thank-you; reload → sealed summary with both guests; "Change our reply" → decline → reload → "Regretfully declined".
- `MOON17` (`/ar`): party question skipped (max 1), full flow in Arabic, RTL.
- Check the Supabase dashboard `rsvps` table shows the rows replacing, not appending.

- [ ] **Step 6: Run gates + commit**

```bash
npm test && npx tsc --noEmit && npm run lint
git add -A
git commit -m "feat: conversational RSVP flow with per-guest meals and reply editing"
```

---

### Task 7: Deploy + production verification

**Files:** none (env + deploy).

- [ ] **Step 1: Add Supabase env vars to Vercel production**

```bash
# Values read from .env.local, never echoed
node -e "const l=require('fs').readFileSync('.env.local','utf8'); const m=k=>l.match(new RegExp(k+'=(.*)'))[1].trim(); process.stdout.write(m('NEXT_PUBLIC_SUPABASE_URL'))" | npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
node -e "const l=require('fs').readFileSync('.env.local','utf8'); const m=k=>l.match(new RegExp(k+'=(.*)'))[1].trim(); process.stdout.write(m('SUPABASE_SERVICE_ROLE_KEY'))" | npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
npx vercel env ls | tail -5
```

- [ ] **Step 2: Push to main (auto-deploys)**

```bash
git push origin main
```

Wait for `npx vercel ls` to show the new deployment `● Ready`.

- [ ] **Step 3: Verify production end-to-end**

In the browser at https://ahmadandmai.vercel.app/en: enter `ROSE42`, open the letter, submit a full RSVP with song request `PROD-TEST`. Confirm the row appears in the Supabase `rsvps` table. Then re-enter the flow and decline (leaves realistic non-test data minimal), or delete the test rows in the Supabase table editor.

- [ ] **Step 4: Update README**

Add to README: RSVP feature note; production requires `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `INVITE_SECRET` in Vercel env.

```bash
git add README.md
git commit -m "docs: RSVP + Supabase production env notes"
git push origin main
```

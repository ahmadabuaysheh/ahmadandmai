# Guestbook + Quiz Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the guestbook and quiz letter stubs with a pinned-notes board and a playful quiz + leaderboard, wired to Supabase, deployed to production.

**Architecture:** Extends the established pattern: `DataStore` gains guestbook/quiz methods on both backends; pure validation modules build rows from cookie-derived invites; server actions persist; server components fetch and pass data to small client components (entrance-only motion). Leaderboard aggregation is a pure, unit-tested function.

**Tech Stack:** Existing stack only (Next.js 15, next-intl, framer-motion, Vitest, @supabase/supabase-js).

## Global Constraints

- Mobile-first (~390px); CSS logical properties only; never `left/right` utilities.
- No hardcoded copy — every new string added to BOTH `src/messages/en.json` and `src/messages/ar.json`.
- Entrance-only framer-motion transitions (no exit animations — rAF pauses in hidden tabs); `useReducedMotion()` respected.
- Server-side trust: identity always from the signed httpOnly cookie via `getGuestContext()`; never client data.
- Free text trimmed and capped at 500 chars; guest `name` must be one of the invite's `guestNames`.
- Working dir `C:\Users\ahmad\Desktop\My Wedding Site`; Git Bash syntax; branch `build/guestbook-quiz`; commit each task with trailer `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Browser E2E note: drive flows via DOM `.click()` + JS (screenshots/rAF are dead in the embedded pane).

---

### Task 1: Data layer — guestbook + quiz methods (TDD)

**Files:**
- Modify: `src/lib/data/types.ts`, `src/lib/data/local.ts`, `src/lib/data/supabase.ts`, `src/lib/data/index.ts`
- Test: `tests/data-local.test.ts` (append)

**Interfaces:**
- Produces (added to `types.ts` and `DataStore`):
  - `interface GuestbookNote { name: string; note: string; createdAt: string }`
  - `interface NewGuestbookNote { inviteCode: string; name: string; note: string }`
  - `interface QuizScore { name: string; score: number; createdAt: string }`
  - `interface NewQuizScore { inviteCode: string; name: string; score: number }`
  - `DataStore.getGuestbookNotes(): Promise<GuestbookNote[]>` — approved only, newest first, limit 100
  - `DataStore.addGuestbookNote(entry: NewGuestbookNote): Promise<void>`
  - `DataStore.getQuizScores(): Promise<QuizScore[]>`
  - `DataStore.addQuizScore(entry: NewQuizScore): Promise<void>`

- [ ] **Step 1: Append failing tests to `tests/data-local.test.ts`**

```ts
  it('guestbook notes round-trip newest first', async () => {
    await store.addGuestbookNote({ inviteCode: 'ROSE42', name: 'Suzan', note: 'First!' });
    await store.addGuestbookNote({ inviteCode: 'MOON17', name: 'Sara', note: 'Second!' });
    const notes = await store.getGuestbookNotes();
    expect(notes).toHaveLength(2);
    expect(notes[0].note).toBe('Second!');
    expect(notes[0].name).toBe('Sara');
    expect(notes[0].createdAt).toBeTruthy();
    // inviteCode must not be exposed
    expect((notes[0] as Record<string, unknown>).inviteCode).toBeUndefined();
  });

  it('quiz scores round-trip', async () => {
    await store.addQuizScore({ inviteCode: 'ROSE42', name: 'Omar', score: 5 });
    const scores = await store.getQuizScores();
    expect(scores).toEqual([
      { name: 'Omar', score: 5, createdAt: expect.any(String) },
    ]);
  });
```

- [ ] **Step 2: Run — expect FAIL** (`addGuestbookNote is not a function`): `npm test`

- [ ] **Step 3: Implement**

`src/lib/data/types.ts` — add after `RsvpRow`:

```ts
export interface GuestbookNote {
  name: string;
  note: string;
  createdAt: string;
}

export interface NewGuestbookNote {
  inviteCode: string;
  name: string;
  note: string;
}

export interface QuizScore {
  name: string;
  score: number;
  createdAt: string;
}

export interface NewQuizScore {
  inviteCode: string;
  name: string;
  score: number;
}
```

and extend `DataStore`:

```ts
  getGuestbookNotes(): Promise<GuestbookNote[]>;
  addGuestbookNote(entry: NewGuestbookNote): Promise<void>;
  getQuizScores(): Promise<QuizScore[]>;
  addQuizScore(entry: NewQuizScore): Promise<void>;
```

`src/lib/data/local.ts` — extend `LocalDb` and `EMPTY_DB`:

```ts
interface LocalDb {
  rsvps: RsvpRow[];
  guestbook: (NewGuestbookNote & { approved: boolean; createdAt: string })[];
  quizScores: (NewQuizScore & { createdAt: string })[];
}

const EMPTY_DB: LocalDb = { rsvps: [], guestbook: [], quizScores: [] };
```

Make `readDb` tolerate older db files missing the new keys:

```ts
  const readDb = (): LocalDb => {
    if (!existsSync(dbPath)) return structuredClone(EMPTY_DB);
    const raw = JSON.parse(readFileSync(dbPath, 'utf8')) as Partial<LocalDb>;
    return { ...structuredClone(EMPTY_DB), ...raw };
  };
```

Add methods to the returned store (imports: add `GuestbookNote`, `NewGuestbookNote`, `QuizScore`, `NewQuizScore`):

```ts
    async getGuestbookNotes(): Promise<GuestbookNote[]> {
      return readDb()
        .guestbook.filter((n) => n.approved)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 100)
        .map(({ name, note, createdAt }) => ({ name, note, createdAt }));
    },

    async addGuestbookNote(entry: NewGuestbookNote): Promise<void> {
      const db = readDb();
      db.guestbook.push({
        ...entry,
        approved: true,
        createdAt: new Date().toISOString(),
      });
      writeFileSync(dbPath, JSON.stringify(db, null, 2));
    },

    async getQuizScores(): Promise<QuizScore[]> {
      return readDb().quizScores.map(({ name, score, createdAt }) => ({
        name,
        score,
        createdAt,
      }));
    },

    async addQuizScore(entry: NewQuizScore): Promise<void> {
      const db = readDb();
      db.quizScores.push({ ...entry, createdAt: new Date().toISOString() });
      writeFileSync(dbPath, JSON.stringify(db, null, 2));
    },
```

`src/lib/data/supabase.ts` — add methods (imports: add the four new types):

```ts
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
```

`src/lib/data/index.ts` — add `GuestbookNote`, `NewGuestbookNote`, `QuizScore`, `NewQuizScore` to the type re-exports.

- [ ] **Step 4: Run — expect PASS**: `npm test && npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: data layer guestbook and quiz score methods"
```

---

### Task 2: Leaderboard aggregation `topScores` (TDD)

**Files:**
- Create: `src/lib/quiz/leaderboard.ts`
- Test: `tests/quiz-leaderboard.test.ts`

**Interfaces:**
- Consumes: `QuizScore` from `@/lib/data`.
- Produces: `topScores(rows: QuizScore[], limit?: number): QuizScore[]` — best score per name (earliest attempt wins ties within a name), sorted score desc then createdAt asc, truncated to `limit` (default 10).

- [ ] **Step 1: Write the failing test**

`tests/quiz-leaderboard.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { topScores } from '@/lib/quiz/leaderboard';
import type { QuizScore } from '@/lib/data';

const row = (name: string, score: number, createdAt: string): QuizScore => ({
  name,
  score,
  createdAt,
});

describe('topScores', () => {
  it('keeps only the best score per name', () => {
    const rows = [
      row('Omar', 3, '2026-01-01T10:00:00Z'),
      row('Omar', 5, '2026-01-02T10:00:00Z'),
      row('Sara', 4, '2026-01-01T11:00:00Z'),
    ];
    expect(topScores(rows).map((r) => [r.name, r.score])).toEqual([
      ['Omar', 5],
      ['Sara', 4],
    ]);
  });

  it('breaks equal-score ties by earliest achievement', () => {
    const rows = [
      row('Sara', 5, '2026-01-02T10:00:00Z'),
      row('Omar', 5, '2026-01-01T10:00:00Z'),
    ];
    expect(topScores(rows).map((r) => r.name)).toEqual(['Omar', 'Sara']);
  });

  it('uses the earliest attempt of a repeated best score', () => {
    const rows = [
      row('Omar', 5, '2026-01-03T10:00:00Z'),
      row('Omar', 5, '2026-01-01T10:00:00Z'),
      row('Sara', 5, '2026-01-02T10:00:00Z'),
    ];
    expect(topScores(rows).map((r) => r.name)).toEqual(['Omar', 'Sara']);
  });

  it('truncates to the limit', () => {
    const rows = Array.from({ length: 15 }, (_, i) =>
      row(`Guest ${i}`, i, '2026-01-01T00:00:00Z'),
    );
    expect(topScores(rows)).toHaveLength(10);
    expect(topScores(rows, 3)).toHaveLength(3);
  });

  it('handles empty input', () => {
    expect(topScores([])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**: `npm test`

- [ ] **Step 3: Implement `src/lib/quiz/leaderboard.ts`**

```ts
import type { QuizScore } from '@/lib/data';

export function topScores(rows: QuizScore[], limit = 10): QuizScore[] {
  const best = new Map<string, QuizScore>();
  for (const r of rows) {
    const cur = best.get(r.name);
    if (
      !cur ||
      r.score > cur.score ||
      (r.score === cur.score && r.createdAt < cur.createdAt)
    ) {
      best.set(r.name, r);
    }
  }
  return [...best.values()]
    .sort(
      (a, b) => b.score - a.score || a.createdAt.localeCompare(b.createdAt),
    )
    .slice(0, limit);
}
```

- [ ] **Step 4: Run — expect PASS**: `npm test`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: quiz leaderboard aggregation (best per name, stable ties)"
```

---

### Task 3: Validation modules (TDD)

**Files:**
- Create: `src/lib/guestbook/validate.ts`, `src/lib/quiz/validate.ts`
- Test: `tests/guestbook-validate.test.ts`, `tests/quiz-validate.test.ts`

**Interfaces:**
- Consumes: `Invite`, `NewGuestbookNote`, `NewQuizScore` from `@/lib/data`.
- Produces:
  - `validateGuestbookNote(input: { name: string; note: string }, invite: Invite): { ok: true; entry: NewGuestbookNote } | { ok: false }`
  - `validateQuizScore(input: { name: string; score: number }, invite: Invite, maxScore: number): { ok: true; entry: NewQuizScore } | { ok: false }`

- [ ] **Step 1: Write the failing tests**

`tests/guestbook-validate.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { validateGuestbookNote } from '@/lib/guestbook/validate';
import type { Invite } from '@/lib/data';

const invite: Invite = {
  code: 'ROSE42',
  guestNames: ['Suzan', 'Omar'],
  tier: 'full',
  maxPartySize: 2,
  languagePref: null,
};

describe('validateGuestbookNote', () => {
  it('accepts a named guest with a trimmed note', () => {
    const res = validateGuestbookNote(
      { name: 'Omar', note: '  Congratulations!  ' },
      invite,
    );
    expect(res).toEqual({
      ok: true,
      entry: { inviteCode: 'ROSE42', name: 'Omar', note: 'Congratulations!' },
    });
  });

  it('rejects names not on the invite', () => {
    expect(validateGuestbookNote({ name: 'Hacker', note: 'hi' }, invite).ok).toBe(false);
  });

  it('rejects empty notes and caps long ones', () => {
    expect(validateGuestbookNote({ name: 'Omar', note: '   ' }, invite).ok).toBe(false);
    const res = validateGuestbookNote({ name: 'Omar', note: 'x'.repeat(600) }, invite);
    expect(res.ok && res.entry.note.length).toBe(500);
  });
});
```

`tests/quiz-validate.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { validateQuizScore } from '@/lib/quiz/validate';
import type { Invite } from '@/lib/data';

const invite: Invite = {
  code: 'ROSE42',
  guestNames: ['Suzan', 'Omar'],
  tier: 'full',
  maxPartySize: 2,
  languagePref: null,
};

describe('validateQuizScore', () => {
  it('accepts a valid score for a named guest', () => {
    expect(validateQuizScore({ name: 'Suzan', score: 4 }, invite, 6)).toEqual({
      ok: true,
      entry: { inviteCode: 'ROSE42', name: 'Suzan', score: 4 },
    });
  });

  it('rejects unknown names, out-of-range and non-integer scores', () => {
    expect(validateQuizScore({ name: 'Nope', score: 4 }, invite, 6).ok).toBe(false);
    expect(validateQuizScore({ name: 'Suzan', score: 7 }, invite, 6).ok).toBe(false);
    expect(validateQuizScore({ name: 'Suzan', score: -1 }, invite, 6).ok).toBe(false);
    expect(validateQuizScore({ name: 'Suzan', score: 2.5 }, invite, 6).ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**: `npm test`

- [ ] **Step 3: Implement**

`src/lib/guestbook/validate.ts`:

```ts
import type { Invite, NewGuestbookNote } from '@/lib/data';

const NOTE_MAX = 500;

export function validateGuestbookNote(
  input: { name: string; note: string },
  invite: Invite,
): { ok: true; entry: NewGuestbookNote } | { ok: false } {
  if (!invite.guestNames.includes(input.name)) return { ok: false };
  const note = input.note.trim().slice(0, NOTE_MAX);
  if (!note) return { ok: false };
  return {
    ok: true,
    entry: { inviteCode: invite.code, name: input.name, note },
  };
}
```

`src/lib/quiz/validate.ts`:

```ts
import type { Invite, NewQuizScore } from '@/lib/data';

export function validateQuizScore(
  input: { name: string; score: number },
  invite: Invite,
  maxScore: number,
): { ok: true; entry: NewQuizScore } | { ok: false } {
  if (!invite.guestNames.includes(input.name)) return { ok: false };
  if (
    !Number.isInteger(input.score) ||
    input.score < 0 ||
    input.score > maxScore
  ) {
    return { ok: false };
  }
  return {
    ok: true,
    entry: { inviteCode: invite.code, name: input.name, score: input.score },
  };
}
```

- [ ] **Step 4: Run — expect PASS**: `npm test`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: guestbook and quiz validation modules"
```

---

### Task 4: Server actions

**Files:**
- Create: `src/app/[locale]/guestbook-actions.ts`, `src/app/[locale]/quiz-actions.ts`

**Interfaces:**
- Consumes: `getGuestContext()`, `getDataStore()`, both validators.
- Produces:
  - `submitGuestbookNote(input: { name: string; note: string }): Promise<{ status: 'ok' | 'error' }>`
  - `submitQuizScore(input: { name: string; score: number }): Promise<{ status: 'ok' | 'error' }>`

- [ ] **Step 1: Implement both actions**

`src/app/[locale]/guestbook-actions.ts`:

```ts
'use server';

import { getDataStore } from '@/lib/data';
import { getGuestContext } from '@/lib/invite/guest-context';
import { validateGuestbookNote } from '@/lib/guestbook/validate';

export async function submitGuestbookNote(input: {
  name: string;
  note: string;
}): Promise<{ status: 'ok' | 'error' }> {
  const guest = await getGuestContext();
  if (guest.tier === 'public' || !guest.code) return { status: 'error' };

  const invite = await getDataStore().getInvite(guest.code);
  if (!invite) return { status: 'error' };

  const result = validateGuestbookNote(input, invite);
  if (!result.ok) return { status: 'error' };

  try {
    await getDataStore().addGuestbookNote(result.entry);
    return { status: 'ok' };
  } catch {
    return { status: 'error' };
  }
}
```

`src/app/[locale]/quiz-actions.ts`:

```ts
'use server';

import { getDataStore } from '@/lib/data';
import { getGuestContext } from '@/lib/invite/guest-context';
import { validateQuizScore } from '@/lib/quiz/validate';
import enMessages from '@/messages/en.json';
import arMessages from '@/messages/ar.json';

// Guests may play in either language; accept the larger question count.
const MAX_SCORE = Math.max(
  enMessages.quiz.questions.length,
  arMessages.quiz.questions.length,
);

export async function submitQuizScore(input: {
  name: string;
  score: number;
}): Promise<{ status: 'ok' | 'error' }> {
  const guest = await getGuestContext();
  if (guest.tier === 'public' || !guest.code) return { status: 'error' };

  const invite = await getDataStore().getInvite(guest.code);
  if (!invite) return { status: 'error' };

  const result = validateQuizScore(input, invite, MAX_SCORE);
  if (!result.ok) return { status: 'error' };

  try {
    await getDataStore().addQuizScore(result.entry);
    return { status: 'ok' };
  } catch {
    return { status: 'error' };
  }
}
```

- [ ] **Step 2: Typecheck**: `npx tsc --noEmit` — expect clean.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: guestbook and quiz server actions"
```

---

### Task 5: Guestbook UI

**Files:**
- Create: `src/components/letter/Guestbook.tsx` (server), `src/components/letter/GuestbookBoard.tsx` (client cards), `src/components/letter/GuestbookForm.tsx` (client form)
- Modify: `src/messages/en.json`, `src/messages/ar.json`, `src/app/[locale]/page.tsx`

**Interfaces:**
- Consumes: `getDataStore().getGuestbookNotes()`, `GuestContext`, `submitGuestbookNote`.
- Produces: `<Guestbook guest={GuestContext} />` server component.

- [ ] **Step 1: Add locale keys** (script pattern from the RSVP milestone — Object.assign into the `guestbook` block of both files, then JSON-parse check)

en `guestbook`: `"signAs": "Signing as"`, `"empty": "The board is waiting for its very first note."`, `"errorGeneric": "The pin slipped — please try again."`
ar `guestbook`: `"signAs": "التوقيع باسم"`, `"empty": "اللوحة بانتظار أول رسالة."`, `"errorGeneric": "انزلق الدبوس — حاول مرة أخرى."`

- [ ] **Step 2: Components**

`src/components/letter/Guestbook.tsx`:

```tsx
import { getTranslations } from 'next-intl/server';
import { getDataStore } from '@/lib/data';
import type { GuestContext } from '@/lib/invite/guest-context';
import LetterSection from './LetterSection';
import GuestbookBoard from './GuestbookBoard';
import GuestbookForm from './GuestbookForm';

export default async function Guestbook({ guest }: { guest: GuestContext }) {
  const t = await getTranslations('guestbook');
  const notes = await getDataStore().getGuestbookNotes();

  return (
    <LetterSection id="guestbook" title={t('title')}>
      <p className="italic text-ink-faded">{t('intro')}</p>
      {notes.length === 0 ? (
        <p className="mt-6 text-sm text-ink-faded">{t('empty')}</p>
      ) : (
        <GuestbookBoard notes={notes} />
      )}
      <GuestbookForm guestNames={guest.guestNames} />
    </LetterSection>
  );
}
```

`src/components/letter/GuestbookBoard.tsx`:

```tsx
'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { GuestbookNote } from '@/lib/data/types';

export default function GuestbookBoard({ notes }: { notes: GuestbookNote[] }) {
  const reduced = useReducedMotion();
  return (
    <ul className="mt-6 grid grid-cols-2 gap-3">
      {notes.map((n, i) => {
        const tilt = i % 2 === 0 ? -2 : 2.5;
        return (
          <motion.li
            key={n.createdAt + n.name}
            className="rounded-sm bg-white p-3 shadow-md"
            initial={reduced ? false : { opacity: 0, y: 16, rotate: 0 }}
            whileInView={{ opacity: 1, y: 0, rotate: tilt }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={reduced ? { rotate: tilt } : undefined}
          >
            <p className="text-sm leading-snug">{n.note}</p>
            <p className="mt-2 text-xs italic text-ink-faded">— {n.name}</p>
          </motion.li>
        );
      })}
    </ul>
  );
}
```

`src/components/letter/GuestbookForm.tsx`:

```tsx
'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { submitGuestbookNote } from '@/app/[locale]/guestbook-actions';

export default function GuestbookForm({
  guestNames,
}: {
  guestNames: string[];
}) {
  const t = useTranslations('guestbook');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(guestNames[0] ?? '');
  const [note, setNote] = useState('');
  const [state, setState] = useState<'idle' | 'ok' | 'error'>('idle');

  const send = () => {
    setState('idle');
    startTransition(async () => {
      const res = await submitGuestbookNote({ name, note });
      if (res.status === 'ok') {
        setState('ok');
        setNote('');
        router.refresh(); // new note appears on the board
      } else {
        setState('error');
      }
    });
  };

  return (
    <div className="mt-8 border-t border-gold/30 pt-6">
      {guestNames.length > 1 && (
        <div className="mb-3">
          <p className="mb-1 text-sm text-ink-faded">{t('signAs')}</p>
          <div className="flex flex-wrap gap-2">
            {guestNames.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setName(n)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  name === n
                    ? 'border-wax bg-wax text-paper'
                    : 'border-ink-faded/40 bg-paper hover:border-wax'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={500}
        rows={3}
        placeholder={t('placeholder')}
        aria-label={t('placeholder')}
        className="w-full rounded-md border border-ink-faded/40 bg-paper px-3 py-2"
      />
      {state === 'error' && (
        <p role="alert" className="mt-1 text-sm text-wax">
          {t('errorGeneric')}
        </p>
      )}
      {state === 'ok' && <p className="mt-1 text-sm">{t('thanks')}</p>}
      <button
        type="button"
        disabled={isPending || note.trim() === '' || name === ''}
        onClick={send}
        className="mt-2 rounded-full bg-wax px-5 py-2 text-paper disabled:opacity-40"
      >
        {isPending ? '…' : t('submit')}
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Wire into `src/app/[locale]/page.tsx`** — import `Guestbook`, render `<Guestbook guest={guest} />` after `<Rsvp guest={guest} />`, and drop `guestbook` from the stub list (stubs become `gallery`, `quiz`, `faq` for now; quiz leaves in Task 6).

- [ ] **Step 4: Local E2E (both locales, via DOM JS)** — as `ROSE42`: empty-board message visible → sign as Omar, write a note, submit → thanks message + note appears after refresh; `/ar`: RTL rendering, note board shows the same notes.

- [ ] **Step 5: Gates + commit**

```bash
npm test && npx tsc --noEmit && npm run lint
git add -A
git commit -m "feat: guestbook board with pinned notes and signed writing form"
```

---

### Task 6: Quiz UI + leaderboard

**Files:**
- Create: `src/components/letter/Quiz.tsx` (server), `src/components/letter/QuizFlow.tsx` (client)
- Modify: `src/messages/en.json`, `src/messages/ar.json`, `src/app/[locale]/page.tsx`

**Interfaces:**
- Consumes: `getDataStore().getQuizScores()`, `topScores`, `GuestContext`, `submitQuizScore`, messages `quiz.*`.
- Produces: `<Quiz guest={GuestContext} />` server component.

- [ ] **Step 1: Add locale keys**

en `quiz`: `"next": "Next"`, `"progress": "{n} of {total}"`, `"saveScore": "Save my score"`, `"retake": "Try again"`, `"errorGeneric": "The ink smudged — please try again."`, `"emptyLeaderboard": "No champions yet — be the first."`
ar `quiz`: `"next": "التالي"`, `"progress": "{n} من {total}"`, `"saveScore": "احفظ نتيجتي"`, `"retake": "حاول مجدداً"`, `"errorGeneric": "لُطّخ الحبر — حاول مرة أخرى."`, `"emptyLeaderboard": "لا أبطال بعد — كن الأول."`

- [ ] **Step 2: Components**

`src/components/letter/Quiz.tsx`:

```tsx
import { getTranslations } from 'next-intl/server';
import { getDataStore } from '@/lib/data';
import { topScores } from '@/lib/quiz/leaderboard';
import type { GuestContext } from '@/lib/invite/guest-context';
import LetterSection from './LetterSection';
import QuizFlow from './QuizFlow';

export default async function Quiz({ guest }: { guest: GuestContext }) {
  const t = await getTranslations('quiz');
  const leaderboard = topScores(await getDataStore().getQuizScores());

  return (
    <LetterSection id="quiz" title={t('title')}>
      <p className="italic text-ink-faded">{t('intro')}</p>
      <QuizFlow guestNames={guest.guestNames} />
      <div className="mt-8 border-t border-gold/30 pt-6">
        <h3 className="text-xl">{t('leaderboard')}</h3>
        {leaderboard.length === 0 ? (
          <p className="mt-2 text-sm text-ink-faded">{t('emptyLeaderboard')}</p>
        ) : (
          <ol className="mt-2 space-y-1">
            {leaderboard.map((s, i) => (
              <li key={s.name} className="flex gap-3 text-sm">
                <span className="min-w-6 text-ink-faded">{i + 1}.</span>
                <span className="flex-1">{s.name}</span>
                <span className="tabular-nums">{s.score}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </LetterSection>
  );
}
```

`src/components/letter/QuizFlow.tsx`:

```tsx
'use client';

import { useState, useTransition } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { submitQuizScore } from '@/app/[locale]/quiz-actions';

interface Question {
  q: string;
  options: string[];
  answer: number;
}

const stepMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function QuizFlow({ guestNames }: { guestNames: string[] }) {
  const t = useTranslations('quiz');
  const tc = useTranslations('common');
  const reduced = useReducedMotion();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const questions = t.raw('questions') as Question[];
  const [phase, setPhase] = useState<'idle' | 'playing' | 'finished' | 'saved'>('idle');
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [name, setName] = useState(guestNames[0] ?? '');
  const [error, setError] = useState(false);

  const start = () => {
    setPhase('playing');
    setIndex(0);
    setPicked(null);
    setScore(0);
    setError(false);
  };

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === questions[index].answer) setScore((s) => s + 1);
  };

  const next = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setPicked(null);
    } else {
      setPhase('finished');
    }
  };

  const save = () => {
    setError(false);
    startTransition(async () => {
      const res = await submitQuizScore({ name, score });
      if (res.status === 'ok') {
        setPhase('saved');
        router.refresh(); // leaderboard updates
      } else {
        setError(true);
      }
    });
  };

  if (phase === 'idle') {
    return (
      <button
        type="button"
        onClick={start}
        className="mt-4 rounded-full bg-wax px-5 py-2 text-paper"
      >
        {t('start')}
      </button>
    );
  }

  if (phase === 'playing') {
    const q = questions[index];
    return (
      <motion.div
        key={index}
        {...(reduced ? {} : stepMotion)}
        transition={{ duration: 0.3 }}
        className="mt-4"
      >
        <p className="text-sm text-ink-faded">
          {t('progress', { n: index + 1, total: questions.length })}
        </p>
        <p className="mt-1 font-medium">{q.q}</p>
        <div className="mt-3 flex flex-col gap-2">
          {q.options.map((opt, i) => {
            const isAnswer = i === q.answer;
            const isPicked = i === picked;
            const revealed = picked !== null;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => pick(i)}
                disabled={revealed}
                className={`rounded-md border px-4 py-2 text-start transition-colors ${
                  revealed && isAnswer
                    ? 'border-gold bg-gold/20'
                    : revealed && isPicked
                      ? 'border-wax bg-wax/10'
                      : 'border-ink-faded/40 bg-paper'
                }`}
              >
                {opt}
                {revealed && isAnswer ? ' ✓' : revealed && isPicked ? ' ✗' : ''}
              </button>
            );
          })}
        </div>
        {picked !== null && (
          <button
            type="button"
            onClick={next}
            className="mt-4 rounded-full bg-wax px-5 py-2 text-paper"
          >
            {t('next')}
          </button>
        )}
      </motion.div>
    );
  }

  if (phase === 'finished') {
    return (
      <div className="mt-4">
        <p className="font-medium">
          {t('yourScore', { score, total: questions.length })}
        </p>
        {guestNames.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {guestNames.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setName(n)}
                className={`rounded-full border px-4 py-1.5 text-sm ${
                  name === n
                    ? 'border-wax bg-wax text-paper'
                    : 'border-ink-faded/40 bg-paper'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        )}
        {error && (
          <p role="alert" className="mt-2 text-sm text-wax">
            {t('errorGeneric')}
          </p>
        )}
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            disabled={isPending || name === ''}
            onClick={save}
            className="rounded-full bg-wax px-5 py-2 text-paper disabled:opacity-40"
          >
            {isPending ? '…' : t('saveScore')}
          </button>
          <button
            type="button"
            onClick={start}
            className="text-sm text-ink-faded underline"
          >
            {t('retake')}
          </button>
        </div>
      </div>
    );
  }

  // phase === 'saved'
  return (
    <div className="mt-4">
      <p>{t('yourScore', { score, total: questions.length })}</p>
      <button
        type="button"
        onClick={start}
        className="mt-2 text-sm text-ink-faded underline"
      >
        {t('retake')}
      </button>
    </div>
  );
}
```

Note for executor: `tc`/`useTranslations('common')` is unused in this component — don't import it.

- [ ] **Step 3: Wire into `src/app/[locale]/page.tsx`** — import `Quiz`, render `<Quiz guest={guest} />` between the gallery stub and the faq stub (order: story, details, rsvp, guestbook, gallery-stub, quiz, faq-stub).

- [ ] **Step 4: Local E2E (both locales)** — play through all 6 questions as `ROSE42` (answers are all index 0 in the placeholder questions: picking the first option each time scores 6/6), save as Suzan, leaderboard shows Suzan 6; retake scoring lower → leaderboard still shows 6 (best per name). `/ar`: full flow RTL.

- [ ] **Step 5: Gates + commit**

```bash
npm test && npx tsc --noEmit && npm run lint
git add -A
git commit -m "feat: quiz flow with instant feedback and leaderboard"
```

---

### Task 7: Deploy + production verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Full gates**: `npm test && npx tsc --noEmit && npm run lint && npm run build` — all pass.

- [ ] **Step 2: Merge + push** (re-run `npm test` after merge, then `git push origin main`); wait for `npx vercel ls` newest deployment `● Ready`.

- [ ] **Step 3: Verify production** — on https://ahmadandmai.vercel.app with `ROSE42`: post a guestbook note containing `PROD-TEST`, play the quiz and save a score; verify both rows via the REST probe scripts; then DELETE the test rows (`guestbook?note=like.*PROD-TEST*` and `quiz_scores?invite_code=eq.ROSE42`) and confirm empty.

- [ ] **Step 4: README** — add a Guestbook + Quiz paragraph under the RSVP section; commit `docs: guestbook + quiz notes` and push.

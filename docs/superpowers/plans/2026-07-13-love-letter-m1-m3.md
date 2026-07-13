# "A Love Letter" Wedding Site — Milestones 1–3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A working bilingual (EN/AR, RTL) Next.js wedding site: sealed-envelope landing with invite codes, server-side tier gating, and the letter (hero + countdown + ink-reveal headings + story + details) running against a local data backend that swaps to Supabase later.

**Architecture:** Next.js 15 App Router with next-intl `/[locale]/` routing. All data access flows through a `DataStore` interface with a local JSON-seed backend (active when Supabase env vars are absent) and a Supabase backend (written now, activated later). Invite codes set an HMAC-signed httpOnly cookie; every page render derives guest tier server-side and gated content (date/venue/schedule) is filtered before HTML is sent.

**Tech Stack:** Next.js 15 (TypeScript, `src/` dir), Tailwind CSS v4, next-intl, framer-motion, Vitest, @supabase/supabase-js (wired, unused until keys exist).

## Global Constraints

- Mobile-first: design at ~390px, enhance upward.
- CSS **logical properties only** — `ms-*`/`me-*`/`ps-*`/`pe-*` Tailwind utilities and `margin-inline-start` etc.; never `left/right` utilities (`ml-*`, `text-left`, …) except for physical positioning that is genuinely direction-independent (e.g. centering).
- **No hardcoded copy in components** — every string comes from `src/messages/{en,ar}.json` via next-intl.
- Date & venue **never hardcoded** — always from `DataStore.getSettings()`, filtered by tier server-side.
- Every animation must respect `prefers-reduced-motion` (framer-motion `useReducedMotion()` or CSS `@media (prefers-reduced-motion: reduce)`).
- `noindex` robots metadata on all pages.
- Working directory: `C:\Users\ahmad\Desktop\My Wedding Site` (repo root = app root). Shell commands below are Git Bash syntax.
- Commit after every task with the trailer `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: Scaffold Next.js app in the existing repo

**Files:**
- Create: entire Next.js scaffold at repo root (`package.json`, `src/app/*`, `tsconfig.json`, …)
- Create: `.env.local.example`
- Modify: `.gitignore` (append `.local-db.json`)

**Interfaces:**
- Consumes: nothing.
- Produces: a running `npm run dev` server; `@/*` path alias → `src/*`; Tailwind v4 via `src/app/globals.css`.

- [ ] **Step 1: Scaffold into a temp subdir (root is non-empty), then move to root**

```bash
cd "/c/Users/ahmad/Desktop/My Wedding Site"
npx --yes create-next-app@latest scaffold-tmp --ts --tailwind --eslint --app --src-dir --turbopack --import-alias "@/*" --use-npm --disable-git
shopt -s dotglob
mv scaffold-tmp/* .
rmdir scaffold-tmp
```

- [ ] **Step 2: Install runtime + dev dependencies**

```bash
npm install next-intl framer-motion @supabase/supabase-js
npm install -D vitest
```

- [ ] **Step 3: Add env example and gitignore entry**

Create `.env.local.example`:

```bash
# Copy to .env.local. Leave Supabase vars unset to use the local JSON backend.
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
# Secret for signing the invite cookie (any long random string in production)
INVITE_SECRET=dev-secret-change-me
```

Append to `.gitignore`:

```
.local-db.json
```

- [ ] **Step 4: Verify dev server boots**

Run: `npm run dev` (background), then fetch `http://localhost:3000`.
Expected: default Next.js page HTML, no errors in output. Stop is not needed — leave it running for later tasks.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 15 app with Tailwind, next-intl, framer-motion, vitest"
```

---

### Task 2: i18n routing (EN/AR), RTL layout, fonts, language toggle

**Files:**
- Create: `src/messages/en.json`, `src/messages/ar.json` (copied verbatim from `copy/en.json`, `copy/ar.json` — keep `copy/` as the untouched draft)
- Create: `src/i18n/routing.ts`, `src/i18n/request.ts`, `src/i18n/navigation.ts`
- Create: `src/middleware.ts`
- Create: `src/app/[locale]/layout.tsx`, `src/app/[locale]/page.tsx`
- Create: `src/components/LanguageToggle.tsx`
- Modify: `next.config.ts`
- Delete: `src/app/layout.tsx`, `src/app/page.tsx` (replaced by `[locale]` versions; keep `src/app/globals.css`)

**Interfaces:**
- Consumes: scaffold from Task 1.
- Produces: `routing` (locales `['en','ar']`, default `'en'`); `Link`/`usePathname`/`useRouter` from `src/i18n/navigation.ts`; `[locale]` layout that sets `lang`, `dir`, font CSS variables `--font-serif`, `--font-arabic-display`, `--font-arabic-body`; translations via `useTranslations`/`getTranslations`.

- [ ] **Step 1: Copy message files**

```bash
mkdir -p src/messages
cp copy/en.json src/messages/en.json
cp copy/ar.json src/messages/ar.json
```

- [ ] **Step 2: Create i18n config files**

`src/i18n/routing.ts`:

```ts
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'ar'],
  defaultLocale: 'en',
});

export type Locale = (typeof routing.locales)[number];
```

`src/i18n/request.ts`:

```ts
import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

`src/i18n/navigation.ts`:

```ts
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
```

`src/middleware.ts`:

```ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: '/((?!api|_next|.*\\..*).*)',
};
```

`next.config.ts` (replace contents):

```ts
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {};

export default withNextIntl(nextConfig);
```

- [ ] **Step 3: Locale layout with fonts, dir, noindex; delete old root layout/page**

Delete `src/app/layout.tsx` and `src/app/page.tsx`.

`src/app/[locale]/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Cormorant_Garamond, Amiri, IBM_Plex_Sans_Arabic } from 'next/font/google';
import { routing } from '@/i18n/routing';
import LanguageToggle from '@/components/LanguageToggle';
import '../globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
});
const amiri = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-arabic-display',
});
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500'],
  variable: '--font-arabic-body',
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('common');
  return {
    title: t('coupleNames'),
    robots: { index: false, follow: false },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className={`${cormorant.variable} ${amiri.variable} ${plexArabic.variable}`}
    >
      <body data-locale={locale}>
        <NextIntlClientProvider>
          <LanguageToggle />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

`src/components/LanguageToggle.tsx`:

```tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';

export default function LanguageToggle() {
  const t = useTranslations('common');
  const locale = useLocale();
  const pathname = usePathname();
  const other = locale === 'en' ? 'ar' : 'en';

  return (
    <Link
      href={pathname}
      locale={other}
      className="fixed top-4 z-50 inline-end-4 rounded-full border border-current/30 px-3 py-1 text-sm"
      aria-label={t('languageToggle')}
    >
      {t('languageToggle')}
    </Link>
  );
}
```

Note: Tailwind has no `inline-end-4` positioning utility — use this arbitrary style instead on the Link: `style={{ insetInlineEnd: '1rem' }}` and drop `inline-end-4` from className.

`src/app/[locale]/page.tsx` (temporary — replaced in Task 8):

```tsx
import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { use } from 'react';

export default function LetterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations('hero');
  return (
    <main className="p-8">
      <h1 className="text-3xl">{t('greeting')}</h1>
      <p>{t('line1')}</p>
    </main>
  );
}
```

- [ ] **Step 4: Update globals.css base styles**

Replace `src/app/globals.css` contents with:

```css
@import 'tailwindcss';

:root {
  --paper: #f6f1e7;
  --paper-deep: #ede4d3;
  --ink: #2b2620;
  --ink-faded: #6b6154;
  --wax: #8e2f3c;
  --gold: #a8894e;
}

@theme inline {
  --color-paper: var(--paper);
  --color-paper-deep: var(--paper-deep);
  --color-ink: var(--ink);
  --color-ink-faded: var(--ink-faded);
  --color-wax: var(--wax);
  --color-gold: var(--gold);
}

body {
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-serif), serif;
}

[dir='rtl'] body,
html[lang='ar'] body {
  font-family: var(--font-arabic-body), sans-serif;
}

h1, h2, h3 {
  font-family: var(--font-serif), serif;
}

html[lang='ar'] h1, html[lang='ar'] h2, html[lang='ar'] h3 {
  font-family: var(--font-arabic-display), serif;
}
```

- [ ] **Step 5: Verify both locales in browser**

Visit `http://localhost:3000` → should redirect to `/en` and show "Dearest friend," in Cormorant. Visit `/ar` → page is `dir="rtl"`, Arabic greeting "إلى أعزّ الناس،" in Amiri/Plex, toggle shows "English" and links back to `/en`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: EN/AR i18n routing with RTL, fonts, language toggle, noindex"
```

---

### Task 3: Vitest + data layer types, seed, and local backend (TDD)

**Files:**
- Create: `vitest.config.ts`
- Create: `src/lib/data/types.ts`, `src/lib/data/seed.json`, `src/lib/data/local.ts`, `src/lib/data/index.ts`
- Create: `tests/data-local.test.ts`
- Modify: `package.json` (add `"test": "vitest run"` script)

**Interfaces:**
- Consumes: nothing from earlier tasks (pure TS).
- Produces:
  - Types: `Tier = 'full' | 'save_the_date' | 'public'`; `Invite { code: string; guestNames: string[]; tier: 'full' | 'save_the_date'; maxPartySize: number; languagePref: 'en' | 'ar' | null }`; `Venue { name: string; address: string; mapUrl: string }`; `Settings { weddingDateIso: string | null; venue: Venue | null; galleryMode: 'couple' | 'guests' }`; `NewRsvp { inviteCode: string; guestName: string; attending: boolean; meal: string | null; songRequest: string | null; message: string | null }`.
  - `interface DataStore { getInvite(code: string): Promise<Invite | null>; getSettings(): Promise<Settings>; saveRsvp(rsvp: NewRsvp): Promise<void> }`
  - `createLocalStore(opts?: { dbPath?: string }): DataStore` from `local.ts`.
  - `getDataStore(): DataStore` from `index.ts` (Supabase if `NEXT_PUBLIC_SUPABASE_URL` set, else local).
  - Seed invite codes: `ROSE42` (full, ["Suzan", "Omar"], party 2, pref null) and `MOON17` (save_the_date, ["Sara"], party 1, pref 'ar').

- [ ] **Step 1: Vitest config + script**

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
});
```

In `package.json` scripts add: `"test": "vitest run"`.

- [ ] **Step 2: Write the failing test**

`tests/data-local.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createLocalStore } from '@/lib/data/local';

describe('local data store', () => {
  let store: ReturnType<typeof createLocalStore>;

  beforeEach(() => {
    const dir = mkdtempSync(path.join(tmpdir(), 'wedding-db-'));
    store = createLocalStore({ dbPath: path.join(dir, 'db.json') });
  });

  it('finds a seeded invite case/whitespace-insensitively', async () => {
    const invite = await store.getInvite('  rose42 ');
    expect(invite).not.toBeNull();
    expect(invite!.tier).toBe('full');
    expect(invite!.guestNames).toEqual(['Suzan', 'Omar']);
    expect(invite!.maxPartySize).toBe(2);
  });

  it('returns null for unknown codes', async () => {
    expect(await store.getInvite('NOPE')).toBeNull();
  });

  it('returns settings with a wedding date and venue', async () => {
    const settings = await store.getSettings();
    expect(settings.weddingDateIso).toBeTruthy();
    expect(settings.venue?.name).toBeTruthy();
    expect(settings.galleryMode).toBe('couple');
  });

  it('persists RSVPs to the db file', async () => {
    await store.saveRsvp({
      inviteCode: 'ROSE42',
      guestName: 'Suzan',
      attending: true,
      meal: null,
      songRequest: 'Our song',
      message: null,
    });
    await store.saveRsvp({
      inviteCode: 'ROSE42',
      guestName: 'Omar',
      attending: false,
      meal: null,
      songRequest: null,
      message: 'Sorry!',
    });
    // A fresh store over the same file sees both rows (proves persistence)
    // @ts-expect-error accessing test-only helper
    expect((await store.__readAll()).rsvps).toHaveLength(2);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `@/lib/data/local`.

- [ ] **Step 4: Implement types, seed, local store**

`src/lib/data/types.ts`:

```ts
export type Tier = 'full' | 'save_the_date' | 'public';

export interface Invite {
  code: string;
  guestNames: string[];
  tier: Exclude<Tier, 'public'>;
  maxPartySize: number;
  languagePref: 'en' | 'ar' | null;
}

export interface Venue {
  name: string;
  address: string;
  mapUrl: string;
}

export interface Settings {
  weddingDateIso: string | null;
  venue: Venue | null;
  galleryMode: 'couple' | 'guests';
}

export interface NewRsvp {
  inviteCode: string;
  guestName: string;
  attending: boolean;
  meal: string | null;
  songRequest: string | null;
  message: string | null;
}

export interface DataStore {
  getInvite(code: string): Promise<Invite | null>;
  getSettings(): Promise<Settings>;
  saveRsvp(rsvp: NewRsvp): Promise<void>;
}
```

`src/lib/data/seed.json`:

```json
{
  "invites": [
    {
      "code": "ROSE42",
      "guestNames": ["Suzan", "Omar"],
      "tier": "full",
      "maxPartySize": 2,
      "languagePref": null
    },
    {
      "code": "MOON17",
      "guestNames": ["Sara"],
      "tier": "save_the_date",
      "maxPartySize": 1,
      "languagePref": "ar"
    }
  ],
  "settings": {
    "weddingDateIso": "2027-05-21T16:00:00+03:00",
    "venue": {
      "name": "The Rose Garden Hall",
      "address": "123 Garden Lane",
      "mapUrl": "https://maps.google.com/?q=rose+garden+hall"
    },
    "galleryMode": "couple"
  }
}
```

(The date and venue are dev placeholders — they live in seed/DB, never in components, and the couple edits them via admin later.)

`src/lib/data/local.ts`:

```ts
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import seed from './seed.json';
import type { DataStore, Invite, NewRsvp, Settings } from './types';

interface LocalDb {
  rsvps: (NewRsvp & { createdAt: string })[];
}

const EMPTY_DB: LocalDb = { rsvps: [] };

export function createLocalStore(opts?: { dbPath?: string }): DataStore & {
  __readAll(): Promise<LocalDb>;
} {
  const dbPath = opts?.dbPath ?? path.join(process.cwd(), '.local-db.json');

  const readDb = (): LocalDb =>
    existsSync(dbPath)
      ? (JSON.parse(readFileSync(dbPath, 'utf8')) as LocalDb)
      : structuredClone(EMPTY_DB);

  return {
    async getInvite(code: string): Promise<Invite | null> {
      const normalized = code.trim().toUpperCase();
      return (
        (seed.invites as Invite[]).find((i) => i.code === normalized) ?? null
      );
    },

    async getSettings(): Promise<Settings> {
      return seed.settings as Settings;
    },

    async saveRsvp(rsvp: NewRsvp): Promise<void> {
      const db = readDb();
      db.rsvps.push({ ...rsvp, createdAt: new Date().toISOString() });
      writeFileSync(dbPath, JSON.stringify(db, null, 2));
    },

    async __readAll(): Promise<LocalDb> {
      return readDb();
    },
  };
}
```

`src/lib/data/index.ts`:

```ts
import type { DataStore } from './types';
import { createLocalStore } from './local';

let store: DataStore | null = null;

export function getDataStore(): DataStore {
  if (!store) {
    store = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? createSupabaseStoreLazy()
      : createLocalStore();
  }
  return store;
}

function createSupabaseStoreLazy(): DataStore {
  // Implemented in Task 6; throwing here keeps Task 3 honest.
  throw new Error('Supabase backend not implemented yet');
}

export type { DataStore, Invite, NewRsvp, Settings, Tier, Venue } from './types';
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: 4 passing.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: data layer with DataStore interface and local JSON backend"
```

---

### Task 4: Invite cookie signing + guest context (TDD)

**Files:**
- Create: `src/lib/invite/cookie.ts`, `src/lib/invite/guest-context.ts`
- Test: `tests/invite-cookie.test.ts`

**Interfaces:**
- Consumes: `getDataStore()`, `Invite`, `Tier` from Task 3.
- Produces:
  - `signInviteCookie(code: string): string` and `verifyInviteCookie(value: string | undefined): string | null` from `cookie.ts` (HMAC-SHA256, secret from `INVITE_SECRET` env, dev fallback `'dev-secret-change-me'`).
  - `INVITE_COOKIE = 'invite'` constant.
  - `interface GuestContext { tier: Tier; guestNames: string[]; maxPartySize: number; code: string | null }`, `PUBLIC_CONTEXT`, and `getGuestContext(): Promise<GuestContext>` (reads Next.js cookies; safe fallback to public) from `guest-context.ts`.

- [ ] **Step 1: Write the failing test**

`tests/invite-cookie.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { signInviteCookie, verifyInviteCookie } from '@/lib/invite/cookie';

describe('invite cookie signing', () => {
  it('round-trips a signed code', () => {
    const value = signInviteCookie('ROSE42');
    expect(verifyInviteCookie(value)).toBe('ROSE42');
  });

  it('rejects tampered values', () => {
    const value = signInviteCookie('ROSE42');
    expect(verifyInviteCookie(value.replace('ROSE42', 'MOON17'))).toBeNull();
    expect(verifyInviteCookie('ROSE42.bogus-signature')).toBeNull();
  });

  it('rejects missing/malformed values', () => {
    expect(verifyInviteCookie(undefined)).toBeNull();
    expect(verifyInviteCookie('')).toBeNull();
    expect(verifyInviteCookie('no-dot-here')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `@/lib/invite/cookie`.

- [ ] **Step 3: Implement**

`src/lib/invite/cookie.ts`:

```ts
import { createHmac, timingSafeEqual } from 'node:crypto';

export const INVITE_COOKIE = 'invite';

function secret(): string {
  return process.env.INVITE_SECRET ?? 'dev-secret-change-me';
}

export function signInviteCookie(code: string): string {
  const sig = createHmac('sha256', secret()).update(code).digest('base64url');
  return `${code}.${sig}`;
}

export function verifyInviteCookie(value: string | undefined): string | null {
  if (!value) return null;
  const dot = value.lastIndexOf('.');
  if (dot < 1) return null;
  const code = value.slice(0, dot);
  const expected = Buffer.from(signInviteCookie(code));
  const actual = Buffer.from(value);
  if (expected.length !== actual.length) return null;
  return timingSafeEqual(expected, actual) ? code : null;
}
```

`src/lib/invite/guest-context.ts`:

```ts
import { cookies } from 'next/headers';
import { getDataStore } from '@/lib/data';
import type { Tier } from '@/lib/data';
import { INVITE_COOKIE, verifyInviteCookie } from './cookie';

export interface GuestContext {
  tier: Tier;
  guestNames: string[];
  maxPartySize: number;
  code: string | null;
}

export const PUBLIC_CONTEXT: GuestContext = {
  tier: 'public',
  guestNames: [],
  maxPartySize: 0,
  code: null,
};

export async function getGuestContext(): Promise<GuestContext> {
  const jar = await cookies();
  const code = verifyInviteCookie(jar.get(INVITE_COOKIE)?.value);
  if (!code) return PUBLIC_CONTEXT;
  const invite = await getDataStore().getInvite(code);
  if (!invite) return PUBLIC_CONTEXT;
  return {
    tier: invite.tier,
    guestNames: invite.guestNames,
    maxPartySize: invite.maxPartySize,
    code: invite.code,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all passing (7 total).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: HMAC-signed invite cookie and server-side guest context"
```

---

### Task 5: Tier gating (TDD)

**Files:**
- Create: `src/lib/gating.ts`
- Test: `tests/gating.test.ts`

**Interfaces:**
- Consumes: `Tier`, `Settings`, `Venue` from Task 3.
- Produces: `interface GatedContent { weddingDateIso: string | null; venue: Venue | null; showSchedule: boolean }` and `gateForTier(tier: Tier, settings: Settings): GatedContent`.

- [ ] **Step 1: Write the failing test**

`tests/gating.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { gateForTier } from '@/lib/gating';
import type { Settings } from '@/lib/data';

const settings: Settings = {
  weddingDateIso: '2027-05-21T16:00:00+03:00',
  venue: { name: 'Hall', address: 'Addr', mapUrl: 'https://maps.example' },
  galleryMode: 'couple',
};

describe('gateForTier', () => {
  it('full tier sees everything', () => {
    const g = gateForTier('full', settings);
    expect(g.weddingDateIso).toBe(settings.weddingDateIso);
    expect(g.venue).toEqual(settings.venue);
    expect(g.showSchedule).toBe(true);
  });

  it('save_the_date tier sees no date, venue, or schedule', () => {
    const g = gateForTier('save_the_date', settings);
    expect(g.weddingDateIso).toBeNull();
    expect(g.venue).toBeNull();
    expect(g.showSchedule).toBe(false);
  });

  it('public tier sees nothing', () => {
    const g = gateForTier('public', settings);
    expect(g.weddingDateIso).toBeNull();
    expect(g.venue).toBeNull();
    expect(g.showSchedule).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test` — Expected: FAIL, cannot resolve `@/lib/gating`.

- [ ] **Step 3: Implement**

`src/lib/gating.ts`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test` — Expected: all passing (10 total).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: server-side tier gating for date, venue, and schedule"
```

---

### Task 6: Supabase backend + SQL migration (dormant until keys exist)

**Files:**
- Create: `supabase/migrations/0001_init.sql`
- Create: `src/lib/data/supabase.ts`
- Modify: `src/lib/data/index.ts` (replace the throwing stub with the real import)

**Interfaces:**
- Consumes: `DataStore`, `Invite`, `Settings`, `NewRsvp` from Task 3.
- Produces: `createSupabaseStore(): DataStore` from `supabase.ts`. `getDataStore()` now returns it when `NEXT_PUBLIC_SUPABASE_URL` is set. No live test — verified by typecheck + existing suite still passing with env unset.

- [ ] **Step 1: Write the migration**

`supabase/migrations/0001_init.sql`:

```sql
-- "A Love Letter" wedding site schema (from PLAN.md)
create type invite_tier as enum ('full', 'save_the_date');

create table invites (
  code text primary key,
  guest_names text[] not null default '{}',
  tier invite_tier not null default 'save_the_date',
  max_party_size int not null default 1,
  language_pref text check (language_pref in ('en', 'ar')),
  created_at timestamptz not null default now()
);

create table rsvps (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null references invites(code),
  guest_name text not null,
  attending boolean not null,
  meal text,
  song_request text,
  message text,
  created_at timestamptz not null default now()
);

create table guestbook (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null references invites(code),
  name text not null,
  note text not null,
  approved boolean not null default true,
  created_at timestamptz not null default now()
);

create table quiz_scores (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null references invites(code),
  name text not null,
  score int not null,
  created_at timestamptz not null default now()
);

create table photos (
  id uuid primary key default gen_random_uuid(),
  uploader_name text,
  storage_path text not null,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table settings (
  key text primary key,
  value jsonb not null
);

-- All access goes through the service-role key on the server; lock everything
-- down for anon/authenticated so nothing leaks if the anon key ever ships.
alter table invites enable row level security;
alter table rsvps enable row level security;
alter table guestbook enable row level security;
alter table quiz_scores enable row level security;
alter table photos enable row level security;
alter table settings enable row level security;

insert into settings (key, value) values
  ('wedding', '{"weddingDateIso": null, "venue": null, "galleryMode": "couple"}');
```

- [ ] **Step 2: Implement the Supabase store**

`src/lib/data/supabase.ts`:

```ts
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
```

In `src/lib/data/index.ts`, delete the `createSupabaseStoreLazy` function and replace its use:

```ts
import type { DataStore } from './types';
import { createLocalStore } from './local';
import { createSupabaseStore } from './supabase';

let store: DataStore | null = null;

export function getDataStore(): DataStore {
  if (!store) {
    store = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? createSupabaseStore()
      : createLocalStore();
  }
  return store;
}

export type { DataStore, Invite, NewRsvp, Settings, Tier, Venue } from './types';
```

- [ ] **Step 3: Verify typecheck and tests**

Run: `npx tsc --noEmit && npm test`
Expected: no type errors; all 10 tests still pass (env unset → local backend).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: Supabase backend and initial SQL migration (dormant until keys set)"
```

---

### Task 7: Invite server action + envelope landing UI

**Files:**
- Create: `src/app/[locale]/actions.ts`
- Create: `src/components/envelope/EnvelopeGate.tsx`, `src/components/envelope/WaxSeal.tsx`, `src/components/envelope/InviteCodeForm.tsx`
- Modify: `src/app/[locale]/page.tsx` (render EnvelopeGate around a placeholder letter)

**Interfaces:**
- Consumes: `getDataStore()`, `signInviteCookie`, `INVITE_COOKIE`, `getGuestContext()`.
- Produces:
  - `submitInviteCode(prev: InviteFormState, formData: FormData): Promise<InviteFormState>` server action with `type InviteFormState = { status: 'idle' | 'invalid' | 'ok' }`.
  - `<EnvelopeGate tier={Tier} addressedTo={string | null}>` client component: full-screen envelope overlay; wax-seal tap breaks seal (framer-motion) and reveals `children` (the letter). For `public` tier shows teaser + code form and never reveals children. Remembers open state in `sessionStorage['seal-broken']`.

- [ ] **Step 1: Server action**

`src/app/[locale]/actions.ts`:

```ts
'use server';

import { cookies } from 'next/headers';
import { getDataStore } from '@/lib/data';
import { INVITE_COOKIE, signInviteCookie } from '@/lib/invite/cookie';

export type InviteFormState = { status: 'idle' | 'invalid' | 'ok' };

export async function submitInviteCode(
  _prev: InviteFormState,
  formData: FormData,
): Promise<InviteFormState> {
  const raw = String(formData.get('code') ?? '').trim();
  if (!raw) return { status: 'invalid' };

  const invite = await getDataStore().getInvite(raw);
  if (!invite) return { status: 'invalid' };

  const jar = await cookies();
  jar.set(INVITE_COOKIE, signInviteCookie(invite.code), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 180,
    path: '/',
  });
  return { status: 'ok' };
}
```

- [ ] **Step 2: Wax seal + code form + gate components**

`src/components/envelope/WaxSeal.tsx`:

```tsx
'use client';

import { motion, useReducedMotion } from 'framer-motion';

export default function WaxSeal({
  initials,
  broken,
  onBreak,
  label,
}: {
  initials: string;
  broken: boolean;
  onBreak: () => void;
  label: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={onBreak}
      aria-label={label}
      className="relative grid size-24 place-items-center rounded-full text-paper shadow-lg"
      style={{
        background:
          'radial-gradient(circle at 35% 30%, #b04a58, var(--wax) 60%, #6e222d)',
      }}
      animate={
        broken
          ? reduced
            ? { opacity: 0 }
            : { scale: [1, 1.15, 0], rotate: [0, -8, 12], opacity: [1, 1, 0] }
          : {}
      }
      transition={{ duration: 0.7, ease: 'easeInOut' }}
      whileTap={reduced ? undefined : { scale: 0.92 }}
    >
      <span className="font-serif text-2xl tracking-wide">{initials}</span>
    </motion.button>
  );
}
```

`src/components/envelope/InviteCodeForm.tsx`:

```tsx
'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { submitInviteCode, type InviteFormState } from '@/app/[locale]/actions';

export default function InviteCodeForm() {
  const t = useTranslations('envelope');
  const [state, action, pending] = useActionState<InviteFormState, FormData>(
    submitInviteCode,
    { status: 'idle' },
  );

  return (
    <form action={action} className="flex w-full max-w-xs flex-col gap-2">
      <label htmlFor="invite-code" className="text-sm italic text-ink-faded">
        {t('addressedTo')}
      </label>
      <input
        id="invite-code"
        name="code"
        autoComplete="off"
        placeholder={t('codePlaceholder')}
        className="rounded-md border border-ink-faded/40 bg-paper px-3 py-2 text-center focus:outline-2 focus:outline-gold"
      />
      {state.status === 'invalid' && (
        <p role="alert" className="text-sm text-wax">
          {t('codeInvalid')}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-wax px-4 py-2 text-paper disabled:opacity-50"
      >
        {pending ? '…' : t('openPrompt')}
      </button>
    </form>
  );
}
```

Note: when the action returns `ok`, the cookie is set and the page re-renders server-side with the new tier — no client redirect needed (Next re-renders after server actions that call `cookies().set`). If the letter doesn't appear automatically, call `router.refresh()` from `useRouter` (from `@/i18n/navigation`) in a `useEffect` when `state.status === 'ok'`.

`src/components/envelope/EnvelopeGate.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import WaxSeal from './WaxSeal';
import InviteCodeForm from './InviteCodeForm';
import type { Tier } from '@/lib/data/types';

export default function EnvelopeGate({
  tier,
  children,
}: {
  tier: Tier;
  children: React.ReactNode;
}) {
  const t = useTranslations('envelope');
  const tc = useTranslations('common');
  const reduced = useReducedMotion();
  const isGuest = tier !== 'public';
  const [broken, setBroken] = useState(false);
  const [opened, setOpened] = useState<boolean | null>(null);

  useEffect(() => {
    setOpened(sessionStorage.getItem('seal-broken') === '1');
  }, []);

  const open = () => {
    setBroken(true);
    sessionStorage.setItem('seal-broken', '1');
    setTimeout(() => setOpened(true), reduced ? 0 : 700);
  };

  if (opened === null) return null; // avoid flash before sessionStorage read
  if (opened && isGuest) return <>{children}</>;

  return (
    <AnimatePresence>
      <motion.div
        key="envelope"
        className="fixed inset-0 z-40 grid place-items-center bg-paper-deep p-6"
        exit={{ opacity: 0 }}
      >
        <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-lg border border-gold/40 bg-paper p-8 text-center shadow-xl">
          {isGuest ? (
            <>
              <p className="text-sm text-ink-faded">{t('openPrompt')}</p>
              <WaxSeal
                initials={tc('initials')}
                broken={broken}
                onBreak={open}
                label={t('openPrompt')}
              />
            </>
          ) : (
            <>
              <p className="italic text-ink-faded">{t('publicTeaser')}</p>
              <WaxSeal
                initials={tc('initials')}
                broken={false}
                onBreak={() => {}}
                label={tc('initials')}
              />
              <InviteCodeForm />
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
```

- [ ] **Step 3: Wire into the page**

Replace `src/app/[locale]/page.tsx`:

```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getGuestContext } from '@/lib/invite/guest-context';
import EnvelopeGate from '@/components/envelope/EnvelopeGate';

export default async function LetterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const guest = await getGuestContext();
  const t = await getTranslations('hero');

  return (
    <EnvelopeGate tier={guest.tier}>
      <main className="mx-auto max-w-xl p-6">
        <h1 className="text-3xl">{t('greeting')}</h1>
        <p>{t('line1')}</p>
      </main>
    </EnvelopeGate>
  );
}
```

- [ ] **Step 4: Manually verify the three tiers in the browser**

1. Fresh browser (no cookie) at `/en`: envelope with teaser + code form; letter HTML absent from page source.
2. Enter `NOPE` → inline error message. Enter `ROSE42` → page re-renders, seal visible, tap → break animation → letter greeting shows.
3. Repeat at `/ar` for RTL rendering.

Note: server must never render `children` into the public response — confirm via view-source that the greeting text is not present before a valid code is entered. If it is present, move the gating to the server: in `page.tsx`, render `<EnvelopeGate tier="public" />` **without** children when `guest.tier === 'public'`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: envelope landing with wax seal, invite code entry, tier cookie"
```

---

### Task 8: Letter shell — paper aesthetic, section layout, ribbon nav, signature

**Files:**
- Create: `src/components/letter/LetterSection.tsx`, `src/components/letter/RibbonNav.tsx`, `src/components/letter/Signature.tsx`
- Modify: `src/app/globals.css` (paper texture + deckled edges), `src/app/[locale]/page.tsx`

**Interfaces:**
- Consumes: translations; `GatedContent` not needed yet.
- Produces:
  - `<LetterSection id={string} title={string | null}>{children}</LetterSection>` — stationery page with paper grain + deckled edge, anchor target.
  - `<RibbonNav sections={{ id: string; label: string }[]}>` — fixed ribbon-bookmark anchor nav (collapsible on mobile).
  - `<Signature />` — closing lines + re-formed wax seal footer from `signature.*` messages.

- [ ] **Step 1: Paper CSS**

Append to `src/app/globals.css`:

```css
/* Paper grain via layered gradients (no image assets needed) */
.paper-grain {
  background-color: var(--paper);
  background-image:
    radial-gradient(rgba(120, 100, 70, 0.05) 1px, transparent 1px),
    radial-gradient(rgba(120, 100, 70, 0.04) 1px, transparent 1px);
  background-size: 7px 7px, 11px 11px;
  background-position: 0 0, 3px 5px;
}

/* Deckled (torn) edge via a jagged mask on block-start/end */
.deckled {
  --notch: 8px;
  clip-path: polygon(
    0% var(--notch), 3% 0%, 8% var(--notch), 14% 2px, 20% var(--notch),
    27% 1px, 33% var(--notch), 40% 3px, 47% var(--notch), 54% 0%,
    61% var(--notch), 68% 2px, 75% var(--notch), 82% 1px, 89% var(--notch),
    95% 0%, 100% var(--notch),
    100% calc(100% - var(--notch)), 95% 100%, 89% calc(100% - var(--notch)),
    82% calc(100% - 2px), 75% calc(100% - var(--notch)), 68% calc(100% - 1px),
    61% calc(100% - var(--notch)), 54% 100%, 47% calc(100% - var(--notch)),
    40% calc(100% - 3px), 33% calc(100% - var(--notch)), 27% calc(100% - 1px),
    20% calc(100% - var(--notch)), 14% calc(100% - 2px),
    8% calc(100% - var(--notch)), 3% 100%, 0% calc(100% - var(--notch))
  );
}
```

- [ ] **Step 2: Section, nav, signature components**

`src/components/letter/LetterSection.tsx`:

```tsx
export default function LetterSection({
  id,
  title,
  children,
}: {
  id: string;
  title?: string | null;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="paper-grain deckled mx-auto my-6 w-full max-w-xl px-6 py-10 shadow-md"
      style={{ scrollMarginBlockStart: '3rem' }}
    >
      {title ? <h2 className="mb-6 text-3xl">{title}</h2> : null}
      {children}
    </section>
  );
}
```

`src/components/letter/RibbonNav.tsx`:

```tsx
'use client';

import { useState } from 'react';

export default function RibbonNav({
  sections,
}: {
  sections: { id: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <nav
      className="fixed top-0 z-30"
      style={{ insetInlineStart: '1rem' }}
      aria-label="letter sections"
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="block h-16 w-8 bg-wax text-paper shadow-md"
        style={{
          clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%)',
        }}
      >
        <span aria-hidden>≡</span>
      </button>
      {open && (
        <ul className="mt-2 flex flex-col gap-1 rounded-md bg-paper p-3 shadow-lg">
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} onClick={() => setOpen(false)}>
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
```

`src/components/letter/Signature.tsx`:

```tsx
import { useTranslations } from 'next-intl';

export default function Signature() {
  const t = useTranslations('signature');
  const tc = useTranslations('common');
  return (
    <footer className="mx-auto max-w-xl px-6 py-16 text-center">
      <p className="italic">{t('closing')}</p>
      <p className="mt-4 text-4xl" style={{ fontStyle: 'italic' }}>
        {t('names')}
      </p>
      <div
        aria-hidden
        className="mx-auto mt-8 grid size-16 place-items-center rounded-full text-paper"
        style={{
          background:
            'radial-gradient(circle at 35% 30%, #b04a58, var(--wax) 60%, #6e222d)',
        }}
      >
        <span className="text-lg">{tc('initials')}</span>
      </div>
      <p className="mt-8 text-sm text-ink-faded">{t('postscript')}</p>
    </footer>
  );
}
```

- [ ] **Step 3: Compose the page**

Replace the `<main>` content in `src/app/[locale]/page.tsx` so the letter is a sequence of `LetterSection`s (hero placeholder for now, filled in Tasks 10–12) followed by `<Signature />`, with `<RibbonNav>` fed from translated section titles (`story.title`, `details.title`, `rsvp.title`, `guestbook.title`, `gallery.title`, `quiz.title`, `faq.title`). Sections that don't exist yet get a `LetterSection` containing `common.comingSoon`.

- [ ] **Step 4: Visual check + commit**

Verify at 390px in `/en` and `/ar`: paper sections with grain + deckled edges, ribbon on the correct (start) side in both directions, anchors scroll.

```bash
git add -A
git commit -m "feat: letter shell with paper sections, ribbon nav, signature footer"
```

---

### Task 9: InkHeading — write-on reveal (EN stroke, AR masked fade)

**Files:**
- Create: `src/components/letter/InkHeading.tsx`
- Modify: `src/components/letter/LetterSection.tsx` (use InkHeading for titles)

**Interfaces:**
- Consumes: locale via `useLocale()`.
- Produces: `<InkHeading>{text}</InkHeading>` (renders an `h2`) — EN: SVG `<text>` stroke-dash draw then fill fade; AR: inline-size mask wipe (works with connected script). Both animate once on viewport entry (`whileInView`), instant when reduced-motion.

- [ ] **Step 1: Implement**

`src/components/letter/InkHeading.tsx`:

```tsx
'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useLocale } from 'next-intl';

export default function InkHeading({ children }: { children: string }) {
  const locale = useLocale();
  const reduced = useReducedMotion();

  if (reduced) return <h2 className="mb-6 text-3xl">{children}</h2>;

  if (locale === 'ar') {
    // Masked wipe: connected Arabic script doesn't suit stroke animation
    return (
      <h2 className="mb-6 overflow-hidden text-3xl">
        <motion.span
          className="inline-block"
          initial={{ clipPath: 'inset(0 100% 0 0)', opacity: 0.6 }}
          whileInView={{ clipPath: 'inset(0 0% 0 0)', opacity: 1 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 1.4, ease: 'easeInOut' }}
          style={{ direction: 'rtl' }}
        >
          {children}
        </motion.span>
      </h2>
    );
  }

  return (
    <h2 className="mb-6" aria-label={children}>
      <svg
        viewBox="0 0 320 48"
        className="h-12 w-full max-w-xs overflow-visible"
        aria-hidden
      >
        <motion.text
          x="0"
          y="36"
          className="text-3xl"
          fill="transparent"
          stroke="var(--ink)"
          strokeWidth="0.6"
          style={{ fontFamily: 'var(--font-serif), serif', fontSize: 32 }}
          initial={{ strokeDasharray: 400, strokeDashoffset: 400 }}
          whileInView={{ strokeDashoffset: 0, fill: 'var(--ink)' }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{
            strokeDashoffset: { duration: 1.6, ease: 'easeInOut' },
            fill: { delay: 1.2, duration: 0.6 },
          }}
        >
          {children}
        </motion.text>
      </svg>
    </h2>
  );
}
```

Implementation note for the executor: `clipPath inset(0 100% 0 0)` hides from the *right* physical edge, which is the correct reveal *start* for RTL text read right-to-left — verify visually in `/ar` that the wipe travels right→left; if it travels the wrong way, swap to `inset(0 0 0 100%)`.

- [ ] **Step 2: Use it in LetterSection**

In `LetterSection.tsx`, replace `<h2 className="mb-6 text-3xl">{title}</h2>` with `<InkHeading>{title}</InkHeading>`.

- [ ] **Step 3: Verify + commit**

Scroll `/en`: headings draw themselves in as they enter the viewport; `/ar`: headings wipe in right-to-left. Emulate reduced motion (DevTools → Rendering → prefers-reduced-motion) → headings appear instantly.

```bash
git add -A
git commit -m "feat: ink-reveal headings (SVG stroke for EN, masked wipe for AR)"
```

---

### Task 10: Hero + countdown (TDD for countdown math)

**Files:**
- Create: `src/lib/countdown.ts`, `src/components/letter/Countdown.tsx`, `src/components/letter/Hero.tsx`
- Test: `tests/countdown.test.ts`
- Modify: `src/app/[locale]/page.tsx` (pass gated settings into Hero)

**Interfaces:**
- Consumes: `gateForTier`, `getDataStore().getSettings()`, `getGuestContext()`, messages `hero.*`.
- Produces:
  - `countdownTo(targetIso: string, nowMs: number): { days: number; hours: number; minutes: number; seconds: number; done: boolean }` (pure, clamps at zero).
  - `<Countdown targetIso={string} label={string} />` client ticker (1s interval, cleans up).
  - `<Hero gated={GatedContent} locale={string} />` server component: greeting, letter opening lines, `hero.dateRevealed` with formatted date when `gated.weddingDateIso` present else `hero.dateHidden`, countdown only when date present.

- [ ] **Step 1: Write the failing test**

`tests/countdown.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { countdownTo } from '@/lib/countdown';

describe('countdownTo', () => {
  const target = '2027-05-21T16:00:00+03:00';

  it('computes full parts for a future date', () => {
    const now = Date.parse('2027-05-19T16:00:00+03:00'); // exactly 2 days
    expect(countdownTo(target, now)).toEqual({
      days: 2, hours: 0, minutes: 0, seconds: 0, done: false,
    });
  });

  it('computes mixed parts', () => {
    const now = Date.parse('2027-05-20T13:58:30+03:00');
    expect(countdownTo(target, now)).toEqual({
      days: 1, hours: 2, minutes: 1, seconds: 30, done: false,
    });
  });

  it('clamps to zero once the moment passes', () => {
    const now = Date.parse('2027-05-21T16:00:01+03:00');
    expect(countdownTo(target, now)).toEqual({
      days: 0, hours: 0, minutes: 0, seconds: 0, done: true,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test` — Expected: FAIL, cannot resolve `@/lib/countdown`.

- [ ] **Step 3: Implement countdown + components**

`src/lib/countdown.ts`:

```ts
export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
}

export function countdownTo(targetIso: string, nowMs: number): CountdownParts {
  const diff = Date.parse(targetIso) - nowMs;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  const seconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
    done: false,
  };
}
```

`src/components/letter/Countdown.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { countdownTo, type CountdownParts } from '@/lib/countdown';

export default function Countdown({
  targetIso,
  label,
}: {
  targetIso: string;
  label: string;
}) {
  const [parts, setParts] = useState<CountdownParts | null>(null);

  useEffect(() => {
    const tick = () => setParts(countdownTo(targetIso, Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  if (!parts || parts.done) return null;

  const cells: [number, string][] = [
    [parts.days, 'd'],
    [parts.hours, 'h'],
    [parts.minutes, 'm'],
    [parts.seconds, 's'],
  ];

  return (
    <div className="mt-6 text-center">
      <p className="text-sm italic text-ink-faded">{label}</p>
      <div className="mt-2 flex justify-center gap-3" dir="ltr">
        {cells.map(([value, unit]) => (
          <span
            key={unit}
            className="min-w-14 rounded-md bg-paper-deep px-2 py-3 text-2xl tabular-nums shadow-inner"
          >
            {String(value).padStart(2, '0')}
            <span className="block text-xs text-ink-faded">{unit}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
```

`src/components/letter/Hero.tsx`:

```tsx
import { getFormatter, getTranslations } from 'next-intl/server';
import type { GatedContent } from '@/lib/gating';
import Countdown from './Countdown';

export default async function Hero({ gated }: { gated: GatedContent }) {
  const t = await getTranslations('hero');
  const tc = await getTranslations('common');
  const format = await getFormatter();

  return (
    <header className="mx-auto max-w-xl px-6 pt-16 text-center">
      <p className="text-lg italic text-ink-faded">{t('greeting')}</p>
      <h1 className="mt-4 text-5xl">{tc('coupleNames')}</h1>
      <p className="mt-6">{t('line1')}</p>
      <p className="mt-2">{t('line2')}</p>
      <p className="mt-6 font-medium">
        {gated.weddingDateIso
          ? t('dateRevealed', {
              date: format.dateTime(new Date(gated.weddingDateIso), {
                dateStyle: 'full',
              }),
            })
          : t('dateHidden')}
      </p>
      {gated.weddingDateIso && (
        <Countdown targetIso={gated.weddingDateIso} label={t('countdownLabel')} />
      )}
    </header>
  );
}
```

In `page.tsx`, fetch settings + gate them and render `<Hero gated={gated} />` as the first letter block inside `EnvelopeGate`:

```tsx
const settings = await getDataStore().getSettings();
const gated = gateForTier(guest.tier, settings);
```

- [ ] **Step 4: Run tests, verify in browser**

Run: `npm test` — Expected: 13 passing.
Browser: with `ROSE42` cookie → full date + live countdown; clear cookie, enter `MOON17` → "The date is a secret…" teaser, no countdown. Check `/ar` for Arabic date formatting (next-intl formats by locale automatically).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: hero with tier-gated date and live countdown"
```

---

### Task 11: Story section — letter paragraphs + polaroids

**Files:**
- Create: `src/components/letter/Story.tsx`
- Create: `public/polaroids/placeholder-1.svg`, `public/polaroids/placeholder-2.svg`, `public/polaroids/placeholder-3.svg`
- Modify: `src/app/[locale]/page.tsx`

**Interfaces:**
- Consumes: messages `story.*` (`title`, `intro`, `chapters[]` with `title`/`body` — use `t.raw('chapters')` to read the array).
- Produces: `<Story />` server component wrapping client `PolaroidFigure`s.

- [ ] **Step 1: Placeholder polaroid SVGs**

Create three simple SVG placeholders (same pattern, vary the tint), e.g. `public/polaroids/placeholder-1.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240">
  <rect width="200" height="240" fill="#fffef9"/>
  <rect x="12" y="12" width="176" height="176" fill="#d8cdb8"/>
  <text x="100" y="105" text-anchor="middle" font-family="serif" font-size="14" fill="#6b6154">photo soon</text>
</svg>
```

- [ ] **Step 2: Story component**

`src/components/letter/Story.tsx`:

```tsx
import { getTranslations } from 'next-intl/server';
import LetterSection from './LetterSection';
import PolaroidFigure from './PolaroidFigure';

interface Chapter {
  title: string;
  body: string;
}

export default async function Story() {
  const t = await getTranslations('story');
  const chapters = t.raw('chapters') as Chapter[];

  return (
    <LetterSection id="story" title={t('title')}>
      <p className="italic text-ink-faded">{t('intro')}</p>
      {chapters.map((chapter, i) => (
        <div key={chapter.title} className="mt-8">
          <h3 className="text-xl">{chapter.title}</h3>
          <p className="mt-2 leading-relaxed">{chapter.body}</p>
          {i < 3 && (
            <PolaroidFigure
              src={`/polaroids/placeholder-${i + 1}.svg`}
              tilt={i % 2 === 0 ? -3 : 4}
            />
          )}
        </div>
      ))}
    </LetterSection>
  );
}
```

`PolaroidFigure` (same file folder, `src/components/letter/PolaroidFigure.tsx`):

```tsx
'use client';

import { motion, useReducedMotion } from 'framer-motion';

export default function PolaroidFigure({
  src,
  tilt,
}: {
  src: string;
  tilt: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.figure
      className="mx-auto mt-4 w-40 bg-white p-2 pb-6 shadow-lg"
      initial={reduced ? false : { opacity: 0, y: 24, rotate: 0 }}
      whileInView={{ opacity: 1, y: 0, rotate: tilt }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={reduced ? { rotate: tilt } : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static svg placeholder */}
      <img src={src} alt="" className="block w-full" />
    </motion.figure>
  );
}
```

(Placeholder polaroids are decorative → empty `alt`. Real photos get real alt text when the couple adds them.)

- [ ] **Step 3: Add `<Story />` to the page, verify, commit**

Verify polaroids tilt/slide in on scroll in both locales; reduced motion → static.

```bash
git add -A
git commit -m "feat: story section with letter chapters and polaroid reveals"
```

---

### Task 12: Details section — tier-gated venue & schedule

**Files:**
- Create: `src/components/letter/Details.tsx`
- Modify: `src/app/[locale]/page.tsx`

**Interfaces:**
- Consumes: `GatedContent` (Task 5), messages `details.*` (`title`, `venueLabel`, `whenLabel`, `venueHidden`, `schedule[]` via `t.raw('schedule')`, `mapTitle`).
- Produces: `<Details gated={GatedContent} />` server component. Hotels/spots lists are later milestones — omit entirely for now (YAGNI).

- [ ] **Step 1: Implement**

`src/components/letter/Details.tsx`:

```tsx
import { getFormatter, getTranslations } from 'next-intl/server';
import type { GatedContent } from '@/lib/gating';
import LetterSection from './LetterSection';

interface ScheduleRow {
  time: string;
  event: string;
}

export default async function Details({ gated }: { gated: GatedContent }) {
  const t = await getTranslations('details');
  const format = await getFormatter();
  const schedule = t.raw('schedule') as ScheduleRow[];

  return (
    <LetterSection id="details" title={t('title')}>
      <dl className="space-y-4">
        <div>
          <dt className="text-sm uppercase tracking-wide text-ink-faded">
            {t('whenLabel')}
          </dt>
          <dd className="mt-1">
            {gated.weddingDateIso
              ? format.dateTime(new Date(gated.weddingDateIso), {
                  dateStyle: 'full',
                  timeStyle: 'short',
                })
              : t('venueHidden')}
          </dd>
        </div>
        <div>
          <dt className="text-sm uppercase tracking-wide text-ink-faded">
            {t('venueLabel')}
          </dt>
          <dd className="mt-1">
            {gated.venue ? (
              <>
                {gated.venue.name} — {gated.venue.address}{' '}
                <a
                  href={gated.venue.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-gold underline-offset-4"
                >
                  {t('mapTitle')}
                </a>
              </>
            ) : (
              t('venueHidden')
            )}
          </dd>
        </div>
      </dl>
      {gated.showSchedule && (
        <ul className="mt-8 space-y-2 border-t border-gold/30 pt-6">
          {schedule.map((row) => (
            <li key={row.event} className="flex gap-4">
              <span className="min-w-16 text-ink-faded">{row.time}</span>
              <span>{row.event}</span>
            </li>
          ))}
        </ul>
      )}
    </LetterSection>
  );
}
```

- [ ] **Step 2: Add to page, verify tiers, commit**

`ROSE42` → date, venue, map link, schedule. `MOON17` → both rows show the "Somewhere beautiful…" teaser, no schedule; **view page source to confirm venue name/address strings are absent** for save_the_date.

```bash
git add -A
git commit -m "feat: tier-gated details section with venue, map link, schedule"
```

---

### Task 13: Final verification pass

**Files:** none new (fixes only).

- [ ] **Step 1: Full test + typecheck + lint + build**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build`
Expected: all pass. Fix anything that doesn't.

- [ ] **Step 2: Tier walkthrough at 390px, both locales**

In the embedded browser at 390×844:
1. No cookie → `/en` and `/ar`: envelope + teaser + form only; letter absent from source.
2. `MOON17` → letter opens; date/venue teased; countdown absent; Arabic (its `languagePref`) reads correctly RTL.
3. `ROSE42` → full letter: date, countdown, venue, schedule, story polaroids, ink headings, ribbon nav, signature.
4. Reduced-motion emulation → no animation, all content visible.

- [ ] **Step 3: Update project docs and commit**

Create `README.md` (dev setup: `npm install`, `npm run dev`, seed codes `ROSE42`/`MOON17`, how to switch to Supabase by filling `.env.local`, migration file location).

```bash
git add -A
git commit -m "docs: README with dev setup, seed codes, Supabase switchover"
```

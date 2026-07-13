# Admin Panel — Design

Date: 2026-07-14
Status: Approved by Ahmad
Scope: plan.md milestone 8, full list. Auth deviates from plan.md by agreement: shared passphrase instead of Supabase Auth (two trusted users, one fewer subsystem).

## 1. Access & auth

- Route `/admin`, outside `[locale]` (English-only, own minimal `layout.tsx` with html/body, `robots noindex`). next-intl middleware matcher excludes `admin`.
- `ADMIN_SECRET` env var (generated ~4-word passphrase; stored in `.env.local` + Vercel env + handed to the couple in a file — never committed).
- Login: passphrase form → server action compares constant-time → sets httpOnly signed cookie `admin` (HMAC-SHA256 of a fixed payload keyed by `ADMIN_SECRET`, same pattern as invite cookies), `maxAge` 30 days. Helper module `src/lib/admin/auth.ts`: `signAdminCookie()`, `verifyAdminCookie(value)`, `requireAdmin(): Promise<boolean>` (reads Next cookies). Every admin server action and export route calls `requireAdmin` first.
- Logout button clears the cookie.

## 2. Dashboard sections (one server-rendered page)

- **RSVPs**: table (invite code, guest, attending, meal, song, message, created). Header stats: total attending, total declined, per-meal counts. Export buttons → `GET /admin/export/rsvps.csv` and `GET /admin/export/songs.txt` (route handlers, admin-gated; CSV fields properly escaped; songs file: `"song — name"` per non-empty request).
- **Guestbook**: all notes incl. hidden, newest first, Approve/Hide toggle per row (server action + revalidate).
- **Photos**: all photos incl. unapproved, signed URLs, Approve/Hide toggle per photo.
- **Settings**: form for `weddingDateIso` (datetime-local input + timezone note), venue name/address/mapUrl (all-or-nothing: empty name clears venue), `galleryMode` select. Saving writes the whole `Settings` object (uploadToken preserved untouched).
- **Invites**: table of all invites; add/edit form (code, guest names comma-separated, tier, max party size, language pref). `upsertInvite` normalizes the code uppercase.

## 3. Data layer additions (both backends)

```
listAllRsvps(): Promise<RsvpRow[]>
listGuestbook(): Promise<AdminGuestbookNote[]>        // AdminGuestbookNote = { id, inviteCode, name, note, approved, createdAt }
setGuestbookApproval(id: string, approved: boolean): Promise<void>
listAllPhotos(): Promise<AdminPhoto[]>                 // AdminPhoto = Photo & { approved: boolean }
setPhotoApproval(id: string, approved: boolean): Promise<void>
updateSettings(settings: Settings): Promise<void>
listInvites(): Promise<Invite[]>
upsertInvite(invite: Invite): Promise<void>
```

- Local backend: guestbook rows gain `id` (randomUUID) on write; legacy rows without one get `createdAt + name` as a stable fallback id on read. Settings updates write to a `settings` override in `.local-db.json` (seed remains the fallback); invites likewise get a local override list merged over seed by code.
- Supabase backend: straightforward table operations (`upsert` on invites, `update ... eq id` for approvals, settings row update merging `uploadToken`).

## 4. Pure helpers (TDD)

- `src/lib/admin/csv.ts`: `csvEscape(value)`, `rsvpsToCsv(rows)`, `songsToText(rows)` (skip null/empty, dedupe identical lines).
- `src/lib/admin/forms.ts`: `parseInviteForm(fields)` → `Invite | null` (code trimmed/uppercased non-empty, names split on comma/trim/drop empties (≥1), tier ∈ {full, save_the_date}, party size int 1–20, languagePref ∈ {en, ar, ''→null}); `parseSettingsForm(fields, current)` → `Settings | null` (date empty→null else valid ISO from datetime-local + fixed `+03:00` suffix, venue all-or-nothing, galleryMode whitelist, preserves `current.uploadToken`).

## 5. Verification

- Vitest: admin cookie sign/verify (+ tamper), csv escaping (quotes/commas/newlines), songs dedupe, invite/settings form parsing, new local-store methods.
- Browser E2E locally: wrong passphrase rejected → login → all five sections render → toggle a guestbook note → edit settings (change galleryMode and back) → create a test invite → exports download with correct content-type.
- Production: login, verify data renders, create + delete-by-overwrite a scratch invite (`TEST99` then reset), confirm exports; clean anything created.

## Out of scope

Copy/quiz editing from admin, photo/invite deletion, per-user accounts, audit log, rate limiting on the login form (low-value target; passphrase is high-entropy).

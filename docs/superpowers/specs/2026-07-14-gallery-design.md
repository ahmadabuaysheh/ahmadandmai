# Gallery — Design

Date: 2026-07-14
Status: Approved by Ahmad
Scope: plan.md milestone 7 — couple-mode photo wall live now; guest-upload pipeline built and dormant behind `settings.galleryMode`. Follows the conventions of the RSVP and guestbook/quiz specs.

## 1. Storage & data

- **Private** Supabase Storage bucket `photos` (created via SQL migration `0003_photos_bucket.sql`: insert into `storage.buckets` with `public = false`, no RLS policies for anon — all access through the service-role key server-side).
- Existing `photos` table is the index: `id, uploader_name, storage_path, approved (default false), created_at`.
- `Settings` gains `uploadToken: string | null` (random hex). Set directly in the DB via service-key REST at execution time — **never committed to git**. `gateForTier` does not expose it; it is read only inside server actions.
- **DataStore** (both backends):
  - `getPhotos(): Promise<Photo[]>` — approved only, `created_at` ascending. `Photo = { id: string; uploaderName: string | null; storagePath: string; createdAt: string }`.
  - `addPhoto(entry: NewPhoto): Promise<void>` — `NewPhoto = { uploaderName: string | null; storagePath: string }`, inserted with `approved = false`.
- **Storage module** `src/lib/storage.ts` (server-only usage):
  - `getViewUrls(paths: string[]): Promise<Map<string, string>>` — Supabase: batch `createSignedUrls` (1 h expiry); local/env-less: identity mapping (path used as URL) so dev still renders seeded rows.
  - `createUploadUrl(path: string): Promise<{ path: string; token: string } | null>` — Supabase `createSignedUploadUrl`; local: returns null (upload disabled in env-less dev).

## 2. Couple mode (default)

- Gallery section (`LetterSection id="gallery"`): `gallery.coupleIntro`, then approved photos as polaroid-style frames in a 2-column grid (entrance-only motion, alt text from `uploaderName` or empty for decorative).
- Tap a photo → minimal lightbox: fixed dim overlay, image, close button (`common.close`), Escape/overlay-click closes. No prev/next arrows (YAGNI).
- Empty state: `gallery.comingSoonPhotos` new key ("We're tucking the photographs in — check back soon." / AR equivalent).
- Couple photo ingestion is manual and documented in README: upload file to bucket via dashboard → insert `photos` row with `approved = true`.

## 3. Guest-upload mode (dormant until `galleryMode = "guests"`)

- Same section switches to `gallery.guestsIntro` + the photo grid + an upload block.
- **Two authorization doors, one pipeline:**
  - Inline in the letter: authorized by the invite cookie; uploader name = chip picker of invite `guestNames` (same pattern as guestbook).
  - Standalone `/[locale]/upload?t=<token>` page (for the printed QR on tables): no envelope, minimal paper styling; authorized by comparing `t` to `settings.uploadToken`; uploader name = free-text input (required, ≤100 chars).
- **Upload flow per file** (client): validate type/size client-side → server action `createPhotoUpload({ auth })` validates authorization + extension and returns a signed upload URL for path `uploads/<uuid>.<ext>` → client uploads the file bytes directly to Supabase Storage → server action `finalizePhotoUpload({ auth, path, uploaderName })` re-validates and inserts the `photos` row (`approved = false`).
  - `auth` is `{ kind: 'invite' } | { kind: 'token'; token: string }`; invite kind re-derives from the cookie server-side.
  - Accepted extensions: `jpg, jpeg, png, webp, gif`; max 10 MB per file (client-checked; signed URL scope limits abuse); max 10 files per batch.
  - `finalizePhotoUpload` only accepts paths matching `uploads/<uuid>.<ext>` (server-generated shape) so nobody can register arbitrary storage paths.
- After upload: `gallery.uploadThanks` ("…will appear once we've had a peek") — uploads stay hidden until `approved = true` (Supabase Table Editor for now; admin panel later).
- Mode flip is a one-field settings change (`galleryMode: "guests"`), documented in README.

## 4. Validation & testing

- Pure module `src/lib/gallery/validate.ts`: `validUploadName(name)`, `extensionOf(filename)` whitelist check, `isServerUploadPath(path)` shape check, `tokenMatches(provided, expected)` (constant-time). Unit tests for all.
- Data-layer tests on the local store (`getPhotos` approved filter + ordering, `addPhoto` approved=false).
- Browser E2E: couple mode empty state + (after seeding a row pointing at an existing public asset) grid + lightbox; upload page rejects a bad token; both locales. Full byte-upload E2E verified in production with a tiny test image, then cleaned (row + object deleted).

## Out of scope

Admin moderation UI, QR image generation, HEIC conversion, image resizing/thumbnails (Supabase render/transform can be added later), prev/next lightbox navigation.

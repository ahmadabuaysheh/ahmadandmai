# Guestbook + Quiz — Design

Date: 2026-07-13
Status: Approved by Ahmad
Scope: plan.md milestone 6 (guestbook, quiz + leaderboard) on the Supabase-backed stack. Follows the patterns established in 2026-07-13-supabase-rsvp-design.md.

## 1. Guestbook

- The `guestbook` letter stub becomes a pinned-notes board inside `LetterSection id="guestbook"`: approved notes as small tilted paper cards (note text + writer name), alternating tilt, entrance-only motion; below it, the write form.
- **Write form:** name chip picker from the invite's `guestNames` (default first) so each guest signs their own note; textarea (`guestbook.placeholder`); wax submit button (`guestbook.submit`); success shows `guestbook.thanks` and the new note appears on the board.
- **Data layer** (both backends):
  - `getGuestbookNotes(): Promise<GuestbookNote[]>` — approved only, newest first, limit 100. `GuestbookNote = { name: string; note: string; createdAt: string }` (no invite code exposed to the client).
  - `addGuestbookNote(entry: NewGuestbookNote): Promise<void>` — `NewGuestbookNote = { inviteCode: string; name: string; note: string }`; `approved` defaults true (post-moderation via future admin).
- **Server action** `submitGuestbookNote({ name, note })`: derives invite from signed cookie (rejects `public`); validates name ∈ invite `guestNames`; note trimmed, non-empty, ≤500 chars. Multiple notes per invite allowed.
- Board visible to both guest tiers; posting available to both.
- Local backend stores notes in `.local-db.json` alongside rsvps.

## 2. Quiz + leaderboard

- The `quiz` stub becomes: intro (`quiz.intro`) + start button (`quiz.start`). Questions from `quiz.questions` in the locale files (`{ q, options[], answer }`, currently `[EDIT ME]` placeholders). One question at a time, option chips, instant right/wrong feedback (correct chip highlighted), running progress "n / total". Entrance-only motion.
- **Finish:** shows `quiz.yourScore` with `{score}/{total}`; picks the guest name (same chip picker pattern; auto-submit if the invite has one name) and saves via server action.
- **Leaderboard** (`quiz.leaderboard` = "The Inner Circle"): top 10 by best score per guest name, tie broken by earliest `createdAt`. Rendered under the quiz from server data; refreshes after submitting a score.
- **Data layer** (both backends):
  - `getQuizScores(): Promise<QuizScore[]>` — all rows, `QuizScore = { name: string; score: number; createdAt: string }`. Leaderboard aggregation (best per name, sort, top 10) is a pure function `topScores(rows, limit)` — unit tested.
  - `addQuizScore(entry: NewQuizScore): Promise<void>` — `NewQuizScore = { inviteCode: string; name: string; score: number }`. One row per attempt; retakes allowed, best counts.
- **Server action** `submitQuizScore({ name, score })`: invite from cookie (rejects `public`); name ∈ invite `guestNames`; score integer 0‥(question count). Question count validated against the union max of EN/AR `quiz.questions` lengths.
- Known and accepted: the answer key ships to the client in locale messages — party-game trust level.

## 3. Shared plumbing & constraints

- Same conventions as RSVP: CSS logical properties, mobile-first 390px, all copy in both `en.json`/`ar.json` (new keys listed in plan), `useReducedMotion`, entrance-only transitions (no exit animations — rAF pause lesson), server-side trust from the signed cookie only.
- New locale keys: `guestbook.signAs`, `guestbook.empty`, `guestbook.errorGeneric`, `quiz.next`, `quiz.progress`, `quiz.saveScore`, `quiz.retake`, `quiz.errorGeneric`, `quiz.emptyLeaderboard` (EN + AR).
- Testing: Vitest for validation modules, `topScores` aggregation, and local-store guestbook/quiz methods; browser E2E in both locales locally; deploy → verify in production → clean test rows.

## Out of scope

Gallery, admin panel (including guestbook moderation UI and quiz-question editing), rate limiting beyond validation caps.

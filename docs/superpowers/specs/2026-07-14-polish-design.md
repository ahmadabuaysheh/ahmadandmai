# Polish Pass — Design

Date: 2026-07-14
Status: Approved by Ahmad
Scope: plan.md milestone 9. Deliberately skipped: 3D page-curl transitions (tilted stationery already carries the paper feel).

## 1. Ink walking countdown

- Component `WalkingCountdown` rendered inside `Hero` above the numeric `Countdown`, only when `gated.weddingDateIso` exists.
- SVG scene: dotted ink line; two small ink stick-figures (groom from inline-start, bride from inline-end) whose positions interpolate on `progress = clamp((now − journeyStart) / (weddingDate − journeyStart), 0, 1)` where `journeyStart = 2026-07-13T00:00:00+03:00` (site launch). They meet in the middle at 100%; on/after the day, a small heart appears between them.
- Pure function `walkProgress(startIso, targetIso, nowMs): number` (0–1, clamped) — unit tested.
- Walk cycle: gentle CSS bob (transform-only, ~1.2 s loop). Reduced motion: static figures at correct positions. Ticks with the existing 1 s interval? No — positions update on mount only (a day's movement is sub-pixel); no timer.
- RTL: the scene is direction-neutral (SVG coordinates), labels none.

## 2. Easter egg — seal taps + Konami

- Trigger A: 5 taps on the signature footer's wax seal within 3 s. Trigger B: Konami code (↑↑↓↓←→←→BA) on keyboard.
- Effect: ~24 tiny heart particles burst from the seal (absolutely-positioned spans animated with CSS transforms, transform/opacity only, auto-cleanup) + a hidden "blooper" polaroid slides out beneath the signature (placeholder `public/polaroids/blooper.svg`; swap file to change). Caption key `signature.blooperCaption` (`[EDIT ME]`) in both locales.
- Reduced motion: hearts fade in/out in place; polaroid appears without slide.
- Client component `SealEasterEgg` wrapping the existing signature seal.

## 3. Margin footnotes

- Component `MarginNote` — small script-font aside positioned in the section padding (inline-end, rotated ~-2°), `aria-hidden` (decorative flavor; content also non-essential).
- Two instances: one in Story (after chapter 2), one in FAQ section title area. Keys `story.marginNote`, `faq.marginNote` — `[EDIT ME]`/`[عدّلني]` in both locales.

## 4. Seal-break sound

- WebAudio-synthesized paper/wax crack (short filtered noise burst + low thump), no audio assets. Module `src/lib/sound.ts`: `playSealCrack()` guarded by user preference.
- Off by default. Toggle button (🔇/🔊 via localized labels `envelope.soundOn`/`envelope.soundOff`) on the envelope overlay; preference in `localStorage['sound']` (`'1'`/`'0'`). Plays only on seal-break tap when enabled (user-gesture context, so autoplay policies are satisfied).

## 5. Idle re-seal

- In `EnvelopeGate`: when the letter is open, an idle timer (pointer/key/scroll/touch reset) re-seals after 10 minutes — clears the seal-broken flag so the envelope overlay returns (guest tier keeps cookie; one tap reopens).
- Only while tab is visible (`visibilitychange` pauses the timer) to avoid re-sealing backgrounded phones mid-visit... actually simpler and equally gentle: timer runs regardless; reopening is one tap. Decision: timer runs regardless.

## 6. Audits (verification work, may produce small fixes)

- **Reduced-motion sweep:** every animated component (envelope, seal, ink headings, polaroids, RSVP steps, guestbook cards, photo grid, quiz, walkers, hearts) verified under emulated `prefers-reduced-motion`; content must be fully visible/static.
- **Arabic typography:** check heading sizes/line-height in Amiri (3xl headings may clip diacritics — adjust `leading` if so), AR ink-wipe direction, countdown label, new keys' rendering.
- **Perf:** production build first-load JS per route recorded before/after; animations transform/opacity-only; images lazy; no new dependencies.

## Out of scope

Page-curl 3D, background music, PWA/offline, analytics.

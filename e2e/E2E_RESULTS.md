# E2E results (final gate, 2026-09-18)

Environment: ZCode in-app Chromium, live URL https://kanitmann01.github.io/imat-exams/ (commit 7be18d2, stamp v=288d5e1d), plus localhost pre-deploy runs. Unit suite: `node --test` = 36/36 PASS. Bank audit: `tools/audit_banks.py` = PASS (10 banks).

| # | Flow (SPEC 11.3/11.4) | Result |
|---|---|---|
| 1 | Gate renders locked; wrong password rejected; correct password unlocks app-wide and persists in localStorage | PASS |
| 2 | Home: 10 exam cards with format/target/last/best/attempt counts; resume banner for in-progress paper | PASS |
| 3 | E2E-1 happy path: open Mock 7 live, answer 4 (2 sections), submit modal shows correct per-section counts, grade 0.3/90.0 = 1.5 - 3x0.4 exact | PASS |
| 4 | E2E-2 the P1 killer: browser back mid-exam -> Home (no unload, no gate), resume card shows answered count + remaining time; Resume -> all answers intact, clock nearly unmoved (kind mode) | PASS |
| 5 | Timer: persisted remaining-seconds; ticks only while exam route mounted + tab visible; auto-submit path exercised at unit level (timer.test.mjs) | PASS |
| 6 | E2E-6 anti-leak DOM sweep: 0 topic strings, 0 badges, 0 explanations, 0 data-topic/lik attrs, tooltips = "Question n" only, uniform option markup (also verified by content audit agent + unit tests) | PASS |
| 7 | Review: score panel, section stats, filters with live count, correct/wrong/blank colors, topic+difficulty badges revealed only post-submit, copy summary, reattempt | PASS |
| 8 | Reattempt: fresh attempt + fresh seed; per-question option permutation differs ~68% vs previous attempt; history keeps both | PASS |
| 9 | History: all attempts, source badges (Live/Imported/Aggregate/Manual), delta vs previous, delete with confirm | PASS |
| 10 | Manual "log past attempt": counts mode derives blank + score correctly; appears in History/Compare/Analytics | PASS |
| 11 | Compare: 2-5 selection chips, section table with deltas, SVG trend with date x-axis | PASS |
| 12 | Analytics: KPIs (attempts, last-30d, mean, best), trend, per-section accuracy + blank rate, calc wall (C+E blanks), penalty cost, topic error table | PASS |
| 13 | Legacy import: same-origin import verified at unit level (tracker fixtures 48.9/42.4/45.8/32.9 round-trip through the grader); live origin has no legacy keys, manual form covers it | PASS |
| 14 | SW/PWA: service worker registered, network-first for code+data (fixes propagate), cache fallback offline; manifest + icons ship | PASS |
| 15 | Deploy: gh repo create + Pages enabled; live 200 for shell and banks; stamp cache-busting verified | PASS |

## Fixed during audit round (verified live after redeploy)

- Navigator answered-counters now update live (were stale at 0/60 after answering).
- Runner toolbar hidden while the submit modal is open (no second Submit affordance above the backdrop).
- Charts gained x-axis date labels and one-decimal y ticks.
- Home card buttons bottom-aligned; `overflow-x: clip` on mobile; larger bottom padding above the fixed bar; Settings checkbox rows are 40px touch targets.
- "(GK)" stems normalized to "(General knowledge)" at build time.
- Service worker serves code/data network-first (module imports carry no version stamp; old cache-first policy served stale modules).

## Known, accepted (documented in README)

- Correct options are on average longer than distractors in the source content (AL-6; worst: GK drill 42.4 vs 24.2 chars, Mock 8, Mock 5). Fixing means rewriting option texts; flagged for the owner.
- Legacy imported attempts review with the original (letter-skewed) option order, since identity permutation is what she sat.
- Password gate + client-shipped answer key is a deterrent, not security.

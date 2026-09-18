# IMAT Exam Platform

A free, static web app for sitting and reviewing IMAT 2026 practice papers:
8 full mocks (60 Q, max 90), a 100-question GK drill (max 150) and a 70-question
repair drill (max 105). Grading is the real IMAT scheme: +1.5 correct, -0.4
wrong, 0 blank, 100 minutes.

Live: https://kanitmann01.github.io/imat-exams/

## Why it exists

The original exams were standalone HTML files. They worked, but:

- Hitting browser back mid-exam lost the flow (password gate reappeared, the
  clock kept running while away).
- Scores lived in one browser with a "last 5" cap: no history, no reattempts,
  no comparison.
- The UI leaked answers: topic pills on every card ("Cellular respiration" next
  to a mitochondria question), an H/M/L difficulty badge, and in mocks 1-5 the
  correct answer was B in 27-29 of 60 questions.

This platform fixes all three:

1. **Never lose flow.** One-page app with hash routing: back navigation never
   unloads the paper. Every answer autosaves instantly. The clock runs only
   while the paper is open and the tab is visible (strict mode optional per
   exam, for exam-hall rehearsal). Auto-submit at 00:00.
2. **A product layer.** All attempts are kept forever: review any paper with
   filters and explanations, one-tap reattempt on a freshly shuffled paper,
   side-by-side comparison, and an analytics dashboard (score trend, per-section
   accuracy, blank rate, the C+E "calc wall", cost of wrong answers, topic-level
   error table). Past scores from the old pages import automatically (same
   browser) or via the manual "Log past attempt" form.
3. **Anti-leak engineering.** Topic and difficulty are hidden until submit.
   Option order is deterministically shuffled per attempt with the answer letters
   rebalanced to 12/12/12/12/12 per paper (numeric options stay in ascending
   order, as in real IMAT papers). All markdown emphasis and internal
   calibration tags are stripped at build time. Options render byte-identically;
   selection is the only style change.

## Honest limits

- The password gate (`imat2026`, change in `config.js`) is a deterrent against
  casual snooping, not security: the question banks (with answers) ship to the
  browser. That is the price of a free static app.
- Correct options in the source content are on average longer than distractors
  (content-level, measured by `tools/audit_banks.py` and reported per exam).
  Rebalancing letters cannot fix that; rewriting option texts would.

## Developer quickstart

```bash
python -m http.server 8000          # serve the repo root (modules need http)
node --test                         # unit tests (grader, perms, timer, storage, import)
python tools/build_banks.py --src ../IMAT_Research_2026/02_EXAMS/HTML --out data
python tools/build_banks.py --src ../IMAT_Research_2026/02_EXAMS/HTML --out data --check
python tools/audit_banks.py         # anti-leak audit of data/*.json
python tools/stamp.py               # cache-busting hash before each deploy
```

Deploy = `python tools/stamp.py && git push` (GitHub Pages serves `main`).

## Layout

- `index.html` + `js/` - the SPA (no framework, no build step). Pure modules
  (`core.js`, `grader.js`, `timer.js`, `analytics.js`, `legacy.js`) are shared
  with `node --test`.
- `data/*.json` - generated banks (do not hand-edit; regenerate from the source
  HTML with `tools/build_banks.py`).
- `tools/` - bank pipeline, audit, version stamping.
- `tests/` - node test suites. `schema.sql` + `SETUP-CLOUD.md` - optional sync.

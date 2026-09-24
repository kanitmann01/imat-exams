# IMAT Exam Platform: Product and Engineering Specification

Version: 1.0 (2026-09-18)
Owner: Ken (kanitmann01)
Target users: Bhavya (IMAT 2026 candidate, exam date 29 Sep 2026) and Ken
Deliverable: a standalone static SPA deployed free on GitHub Pages, replacing the self-contained HTML mock exams in `D:\Dev\Flashtest\IMAT_Research_2026\02_EXAMS\HTML\`

This document is the single source of truth for the rebuild. It is written so an engineer can implement it without asking questions. Where this document and the existing exam files disagree, the exam files (the "banks") win; every such discrepancy found during grounding is called out explicitly.

Style note: exam titles and section labels in the source data contain em dash punctuation (for example "IMAT MOCK EXAM 6 ... At-Level Calibration"). This spec displays them with plain hyphens; the platform itself preserves the extracted punctuation verbatim inside data files.

---

## 1. Product overview, personas, success criteria

### 1.1 What this is

A mobile-friendly, offline-capable web app for sitting and reviewing IMAT practice papers:

- 11 full mock exams (60 Q each, max 90): Mocks 1-9 built from the research dossier papers; Mocks 10-11 (added 2026-09, freshly authored) model the 2024-2026 MUR decree format exactly (Q1-4 reading/GK, Q5-9 logic, 10-32 biology, 33-47 chemistry, 48-54 maths, 55-60 physics; Mock 10 leans 2025-style metabolism/theory, Mock 11 leans 2024-style genetics/stoichiometry). Plus 1 GK drill (100 Q), 1 Repair drill (70 Q) and 4 medium-hard banks (bio 130, chem 65, maths/physics/logic 95, GK 60).
- Exam-day realistic runner: password gate, 100-minute countdown, section-grouped paper, question navigator, autosave; at zero the clock freezes and the paper stays open (manual submit only, no auto-submit).
- A product layer the old files never had: persistent attempt history with full review, one-tap reattempt, score comparison, and an analytics dashboard.
- Strict anti-leak guarantees: nothing in the pre-submit UI may hint at the answer (topic pills, difficulty badges, answer-letter clustering, emphasis markers, and internal calibration notes are all eliminated at build time).
- Free forever: static hosting on GitHub Pages, optional free-tier Supabase sync, no servers of our own.

### 1.2 Personas

**Bhavya (primary user, candidate).** Preparing full-time for IMAT 2026. Sits mocks on a laptop and reviews them on her phone. Pain today: leaving a mock mid-exam breaks it (gate reappears, timer keeps running while she is away), scores live in one browser with no way to compare attempts, and she has caught herself guessing answers from topic pills, option "bolding", and suspicious letter patterns. She needs: resume-able exams, all attempts saved and reviewable, and papers that give zero hints.

**Ken (owner, maintainer).** Built the existing content and generators. Regenerates question banks with Python tooling, deploys with git and the `gh` CLI, wants audits and tests he can run in one command. Will not maintain a paid backend.

### 1.3 The four problem areas (verified) and what fixes them

| # | Problem (verified in the current files) | Fix (where specified) |
|---|---|---|
| P1 | Back navigation mid-exam unloads the page, the password gate reappears, and the timer is wall-clock from a `*_start` timestamp so it keeps draining while she is away | Hash-routed SPA that never unloads on back; persisted remaining-seconds timer that only ticks while the exam route is open and the tab is visible (Sections 4, 6) |
| P2 | No revisiting of past papers, no reattempts, no score history beyond "last 5" per exam, no cross-exam view; each exam is an isolated HTML file | Attempt records, History, Review, Reattempt, Compare, Analytics (Sections 6, 7) |
| P3 | Answer leaks: (a) topic pill + difficulty badge on every card and topic in navigator tooltips; (b) correct-answer letter clustering in mocks 1-5 (B appears 24 to 29 times per 60 Q paper); (c) raw markdown emphasis and internal calibration tags rendered literally (for example the tag `[Geometry/solid - H (formula recall, as in 2024)]` visible in Mock 4); (d) inconsistent emphasis making options look different | Build-time scrub, deterministic option permutation to rebalance letters, review-only metadata, uniform option rendering, audit suite (Sections 3, 10) |
| P4 | Deployment and storage must be free; her existing scores are trapped in one browser's localStorage under legacy keys and possibly a different origin | GitHub Pages on a new public repo, localStorage-first with optional free Supabase sync, automatic same-origin legacy import plus a manual "log past attempt" form (Sections 8, 9, 5.4) |

### 1.4 Success criteria (each maps to a problem area and a test in Section 11)

- SC-1 (P1): Start a mock, answer 5 questions, press browser back, land on the dashboard, press Resume: all 5 answers are intact, the gate never reappeared, and the timer shows the same remaining seconds it showed on leaving (kind mode, default). Verified by E2E test E2E-2.
- SC-2 (P2): She can complete an attempt, find it in History, open its Review with filters and explanations, tap Reattempt to get a fresh shuffled paper, compare any two attempts side by side, and see all of it in Analytics. Closing the browser entirely loses nothing. Verified by E2E-1 and E2E-3.
- SC-3 (P3): The anti-leak audit suite passes (invariants AL-1 to AL-8 in Section 3). The five known leak instances render clean: Mock 2 Q54, Mock 4 Q52, Mock 5 Q37 (internal tags), Mock 1 Q1 and Mock 6 Q1 (`*Read:*` style markers). Every bank and every fresh attempt has a near-uniform answer-letter distribution. Verified by tests UNIT-2, UNIT-5, E2E-6.
- SC-4 (P4): The app is live at `https://kanitmann01.github.io/imat-exams/` at zero recurring cost, works offline after first visit (PWA-lite), and her past scores (Mock 1: 48.9, Mock 3: 42.4, Mock 4: 45.8, Mock 5: 32.9, per Ken's tracker) reappear in the app via legacy import when the old origin is available, or via the manual log form. Verified by E2E-4, E2E-5, UNIT-4.

---

## 2. IMAT fidelity rules

The platform is a faithful reproduction of the papers Ken authored. These rules are non-negotiable; any change to content structure must go through `tools/build_banks.py`, never through hand edits of data files.

### 2.1 Paper format

- Every question has exactly 5 options labelled A, B, C, D, E, exactly one correct.
- Scoring: correct = +1.5, wrong = -0.4, blank/unanswered = 0. Internally computed in integer tenths: +15, -4, 0 (Section 6.6).
- Duration: 100 minutes (6000 seconds) for all 10 exams (verified in all 10 current files: `timerSec = 100 * 60`).
- Maximum scores: mocks 90.0 (60 x 1.5), GK drill 150.0 (100 x 1.5), Repair drill 105.0 (70 x 1.5).

### 2.2 Per-exam section maps (read from the actual files; authoritative)

**Mocks 1 to 8** (ids `imat_mock1` ... `imat_mock8`, 60 questions each). Identical map in all eight, matching `SECTION_OF` / `SEC_RANGES` in the engines:

| Code | Questions | Long label (source) | Short label |
|---|---|---|---|
| A | Q1-9 | Section A - Logical Reasoning & Reading | Reasoning |
| B | Q10-32 | Section B - Biology | Biology |
| C | Q33-47 | Section C - Chemistry | Chemistry |
| D | Q48-54 | Section D - Mathematics | Mathematics |
| E | Q55-60 | Section E - Physics | Physics |

**GK_Drill_100** (id `GK_Drill_100`, 100 questions, max 150). Eight sections, codes A to H (this differs from the mock A-E structure):

| Code | Questions | Long label (source) | Short label |
|---|---|---|---|
| A | Q1-8 | Section A - Reading Skills & Vocabulary in Context | Reading |
| B | Q9-24 | Section B - Italian Constitution & Institutions | Constitution |
| C | Q25-40 | Section C - European Union | EU |
| D | Q41-54 | Section D - Italian History | History |
| E | Q55-66 | Section E - Art, Architecture & Heritage | Art |
| F | Q67-80 | Section F - Literature, Philosophy & Ideas | Letters |
| G | Q81-90 | Section G - Science, Technology & Society | Science |
| H | Q91-100 | Section H - Current Affairs 2024-2026 | Current |

**Repair_Drill_1** (id `Repair_Drill_1`, 70 questions, max 105). Seven sections, codes A to G:

| Code | Questions | Long label (source) | Short label |
|---|---|---|---|
| A | Q1-12 | Section A - Respiration & Bioenergetics | Respiration |
| B | Q13-20 | Section B - Body Systems | Body Systems |
| C | Q21-30 | Section C - Cell Division & Cell Biology | Cell & Division |
| D | Q31-44 | Section D - Quantitative Chemistry | Quant Chem |
| E | Q45-53 | Section E - Mathematics | Maths |
| F | Q54-62 | Section F - Physics | Physics |
| G | Q63-70 | Section G - Logic & Reasoning | Logic |

These maps are stored in each bank JSON as data (Section 5.1); the runner never hardcodes question-count boundaries.

### 2.3 Verified content facts that drive the anti-leak work

Answer-letter distribution in the current banks (counted directly from the embedded EXAM JSON on 2026-09-18):

| Exam | A | B | C | D | E |
|---|---|---|---|---|---|
| imat_mock1 | 6 | 27 | 18 | 9 | 0 |
| imat_mock2 | 4 | 29 | 20 | 7 | 0 |
| imat_mock3 | 7 | 24 | 19 | 9 | 1 |
| imat_mock4 | 8 | 29 | 16 | 4 | 3 |
| imat_mock5 | 4 | 27 | 18 | 8 | 3 |
| imat_mock6 | 13 | 13 | 14 | 11 | 9 |
| imat_mock7 | 12 | 13 | 12 | 12 | 11 |
| imat_mock8 | 12 | 12 | 14 | 11 | 11 |
| GK_Drill_100 | 20 | 20 | 20 | 20 | 20 |
| Repair_Drill_1 | 14 | 14 | 14 | 14 | 14 |

Mocks 6-8 and both drills are already near-uniform or exactly uniform. Mocks 1-5 are badly skewed (B dominates, E nearly absent). The rebalancing pipeline (Section 10) must not touch drills or mocks 6-8 materially (their distributions already meet the target, so their computed permutations will be close to identity; the algorithm still runs so the process is uniform).

Contamination instances found (fields containing markdown emphasis or internal calibration tags): mock1: 5, mock2: 7, mock3: 5, mock4: 8, mock5: 9, mock6: 6, mock7: 4, mock8: 5, GK: 1, Repair: 3. Named examples that must render clean after scrubbing:

- Stems: `*Read:*`, `*(General knowledge)*`, `*(GK)*`, `*De fabrica*` (Mock 2 Q3).
- Explanations: `*lower*` (Mock 1 Q1), `*store*` (Mock 6 Q1), `*atoms*` (Mock 6 Q40), `*not*` (Mock 5 Q27), `*increased*` (Mock 5 Q28).
- Internal calibration tags in explanations: `[Set theory - M (new entrant from 2025)]` (Mock 2 Q54), `[Geometry/solid - H (formula recall, as in 2024)]` (Mock 4 Q52), `[Redox - H (common trap)]` (Mock 5 Q37).

Discrepancy notes (bank files win over earlier assumptions):

1. The Mock 4 calibration tag `[Geometry/solid - H ...]` sits in the explanation field of Q52, not in the stem as previously described. The scrub must cover stems, options, AND explanations (it does).
2. Mock 1 has zero E answers and Mock 2 has zero E answers; the "B = 27-29" clustering claim is confirmed exactly (mock1 B=27, mock2 B=29, mock4 B=29, mock5 B=27, mock3 B=24).
3. GK and Repair drills each have all 5 options on every question (verified programmatically: option count is 5 for all 230 questions across all 10 exams), so no variable-option handling is needed, but the bank schema still stores option count per question defensively.
4. The drill exam ids are `GK_Drill_100` and `Repair_Drill_1` (no `imat_` prefix), which matters for legacy localStorage key mapping (Section 5.4).

### 2.4 Visibility rules during an exam

Must NOT be visible or present in the DOM before submit:
- The correct answer letter or any per-question correctness signal.
- Explanations (`exp`) in any form.
- Topic names (`topic`) anywhere: no pills, no tooltips, no data attributes.
- Difficulty (`lik`) anywhere.
- Any running score or "so far" correctness count.
- The answer key as a recognizable structure (see the threat-model note in Section 6.9).

Must be visible during the exam: question number and section headers, options, answered count, per-section answered counts in the navigator, timer, submit button.

After submit (Review route): correct/wrong/blank coloring (green correct option, red wrong pick, blue correct option when blank, matching the existing convention), explanation text, topic and difficulty badges, per-section stats, filters.

### 2.5 Password gate

- Single shared password, default `imat2026`, overridable in `config.js` (`window.IMAT_CONFIG.password`).
- One unlock unlocks the whole app (not per exam like today), remembered in localStorage (not sessionStorage), so a reload mid-exam never re-prompts.
- A Lock button in Settings clears the flag immediately and re-shows the gate.
- Honest threat model: this is a deterrent against casual snooping, not security. The bank JSON (including answers) ships to the client; anyone determined can read it. Document this in the README. Do not pretend otherwise in UI copy.

---

## 3. Anti-leak checklist (auditable invariants)

Each invariant is machine-checkable and enforced by the audit suite (Section 11.1). IDs are stable and referenced by tests.

- **AL-1 No metadata pre-submit.** On the exam route before submit, the DOM contains no topic strings and no difficulty letters. Concretely: no element has `data-topic` or `data-lik`, no badge nodes exist, and `document.body.innerText` contains none of the bank's topic strings. Badges are injected only on the review route.
- **AL-2 Uniform option styling.** Pre-submit, every option row of a question renders with byte-identical markup and identical computed styles (font-family, font-size, font-weight, color, background, border, padding). The only allowed differentiators are: the static letter label (`A.` to `E.`) and the user's own selection state. No option may contain `<b>`, `<em>`, `<strong>`, or any emphasis markup. E2E asserts computed-style equality across all options of every question on a sample exam.
- **AL-3 Answer-letter balance.** After the rebalance step: for each 60-question mock, each letter A-E appears between 11 and 13 times inclusive (target 12). For GK_Drill_100: exactly 20 each. For Repair_Drill_1: exactly 14 each. The same bounds hold for every fresh attempt's displayed key (the per-attempt assignment uses the same quota algorithm). Audited from bank files and from attempt records.
- **AL-4 No emphasis markers or internal tags.** Bank JSON fields `stem`, every `options[]` item, and `exp` contain no `*` characters, no `__`, no backticks, and no bracket group matching the internal-tag pattern (a bracket group containing a dash followed by H, M, or L as a token, or any keyword from the calibration-keyword list). Legitimate math/grammar brackets (for example `[x(x - 3)]` in Mock 4 Q50, `[having]` in GK Q38) are preserved; the scrub has regression fixtures for both.
- **AL-5 No tooltip leaks.** Pre-submit, navigator cells have either no tooltip or exactly `Question <n>`. Post-submit tooltips may add the result code. No tooltip ever contains topic text.
- **AL-6 No correct-option length pattern.** Audit computes, per exam, the mean character length of correct options versus distractors. Invariant: the absolute difference divided by the overall mean option length must be at most 0.10. If violated, the tool flags the exam for content-level review by Ken (fix the content or accept the risk explicitly in the report); the platform does not silently hide this.
- **AL-7 No explanation or answer structure in the pre-submit DOM.** Explanation nodes do not exist pre-submit (not `display:none`, absent). The answer key is not embedded in a trivially greppable HTML comment or global named variable; the runner reads it from the fetched bank JSON held in a closure, and the bank is fetched only after the gate is unlocked.
- **AL-8 Consistent stem rendering.** Stems render with the same paragraph style on every card; a stem line that was solely a directive artifact (for example `Read:`) is removed at build time per Section 10.3 rule S2, so no card looks different from its neighbors because of leftover markup.

---

## 4. Information architecture

### 4.1 Routes (hash-based)

| Route | Purpose |
|---|---|
| `#/home` | Dashboard: Resume card (if an in-progress attempt exists), one card per exam showing last score, best score, attempt count and target (targets carried over from the existing hub: mock1 47, mock2 47, mock3 45, mock4 43, mock5 42, mock6 45, mock7 38, mock8 44, drills "drill"), links to History and Analytics. |
| `#/exam/<examId>` | The runner. If an in-progress attempt exists for this exam, resume it. Otherwise start a new attempt (new attemptId, new seed, full duration). Unknown examId redirects to `#/home` with a toast. |
| `#/review/<attemptId>` | Graded paper for one attempt with filters, explanations, and revealed topic/difficulty badges. Unknown attemptId redirects to `#/history`. |
| `#/history` | All attempts, newest first, filterable by exam, with Reattempt and Review actions and a "Log past attempt" button. |
| `#/compare` | Side-by-side comparison of 2 to 5 selected attempts (section breakdown table plus SVG score-trend chart). |
| `#/analytics` | Trend and error analytics (Section 7.4). |
| `#/settings` | Lock/unlock gate, strict-timer defaults and per-exam overrides, sync status and config, legacy import re-run, data export/import, danger zone (wipe local data). |
| anything else | Redirect (replaceState) to `#/home`. |

### 4.2 Navigation model

- One HTML page (`index.html`). A tiny router listens to `hashchange`, maps the hash to a route module, and calls the module's `mount(params)` / `unmount()`. Routes never cause page loads.
- A persistent top bar (brand, current timer when on the exam route, link icons to Home, History, Analytics, Settings). On the exam route the bar also shows the answered count, matching the current engines' header.
- Bottom toolbar on the exam route (mobile-first): Submit (or "Back to paper" in review context).
- The navigator drawer (right slide-in under 980px, sticky sidebar above) is carried over from the current engines' design language (navy `#1F3864`, teal `#1B9E77`, same cell grid), so the app feels familiar.

### 4.3 Back-button behavior matrix

| Situation | User presses browser back | Result |
|---|---|---|
| Exam route, attempt in progress | Hash returns to the previous route (usually `#/home`) | SPA stays loaded, no gate, no unload. Attempt is already autosaved (every answer write is immediate). Timer stops ticking the moment the route unmounts (kind mode) or wall-time is accounted on return (strict mode). Home shows the Resume card. No confirmation dialog is shown (nothing can be lost, so a dialog would be friction). |
| Exam route, attempt in progress, then Forward | Returns to `#/exam/<id>` | Attempt resumes exactly. |
| Exam route | Reload, tab close, or app restart | On next visit to the app (any route), the Resume card appears; opening `#/exam/<id>` restores answers, permutation, and remaining seconds per the timer contract (6.5). |
| Exam route, submit-confirm modal open | Back | The modal closes; route and attempt unchanged. |
| Submit or auto-submit just happened | (app behavior) | The app uses `location.replace()` to move to `#/review/<attemptId>`, so the exam route is not left in history; back from review goes to wherever she was before the exam. |
| Review route | Back | Previous route (home or history). Never re-enters a submitted exam. |
| `#/exam/<id>` opened directly while only submitted attempts exist for that exam | n/a | Starts a NEW attempt immediately with a toast "New attempt started" (the Review route is for revisiting; this keeps "open exam" meaning "sit exam"). |
| History, Compare, Analytics, Settings | Back | Normal browser history. |
| Unknown hash | n/a | replaceState to `#/home`. |

Rule of thumb: back must never destroy data and never re-show the gate mid-attempt.

---

## 5. Data model

### 5.1 Bank JSON (`data/<examId>.json`, produced by `tools/build_banks.py`)

```json
{
  "schema": 1,
  "id": "imat_mock6",
  "title": "IMAT MOCK EXAM 6 - \"At-Level Calibration\"",
  "kind": "mock",                       // "mock" | "gk_drill" | "repair_drill"
  "durationSec": 6000,
  "maxTenths": 900,                     // 1500 for GK, 1050 for Repair
  "targetScore": 45,                    // display-only, from the existing hub; null for drills
  "sections": [
    { "code": "A", "from": 1, "to": 9,
      "label": "Section A - Logical Reasoning & Reading", "short": "Reasoning" }
    // ... exact maps from Section 2.2
  ],
  "bankVersion": "b3f2a1c9",            // "b" + first 8 hex of sha256 of canonical bank content
  "questions": [
    {
      "n": 1,
      "stem": "cleaned stem text",
      "options": ["cleaned opt A", "cleaned opt B", "cleaned opt C", "cleaned opt D", "cleaned opt E"],
      "ans": "C",                        // ORIGINAL answer letter, position in ORIGINAL options order
      "perm": [2, 0, 4, 1, 3],           // baseline permutation for seed 0; null if shuffle-unsafe
      "shuffleSafe": true,
      "shuffleUnsafeReason": null,       // e.g. "option references other options by letter"
      "topic": "Cellular respiration",   // metadata, REVIEW-ONLY (never rendered pre-submit)
      "lik": "H",                        // "H" | "M" | "L", REVIEW-ONLY
      "scrub": { "emphasisRemoved": 2, "tagsRemoved": 1 }   // audit counters for this question
    }
  ]
}
```

Exact permutation semantics (must be unambiguous for tests): options are ALWAYS stored in original order. For a question with permutation `perm`, the displayed option at 0-based position `i` is `options[perm[i]]`, and its displayed letter is `"ABCDE"[i]`. The displayed correct letter is the `i` where `perm[i]` equals the 0-based index of `ans`. For a question with `perm: null` (shuffle-unsafe) or for imported/manual attempts, the identity permutation is used and the displayed letter equals `ans`.

The bank `perm` field is the deterministic baseline permutation for seed 0 (the rebalanced ordering). Live attempts compute their own per-attempt permutation from their seed using the same algorithm (Section 10.4); `bank.perm` exists so the rebalanced key distribution is inspectable, testable, and available to any consumer that does not shuffle.

`data/exams.json` is a manifest for the dashboard:

```json
{ "schema": 1,
  "exams": [ { "id": "imat_mock1", "title": "...", "kind": "mock", "qCount": 60,
               "durationSec": 6000, "maxTenths": 900, "targetScore": 47,
               "sectionCount": 5, "bankVersion": "b..." } ] }
```

### 5.2 Attempt record (localStorage `imatex.attempt.<attemptId>`, versioned)

```json
{
  "v": 1,
  "attemptId": "a20260918T142233Z-x7q2",
  "examId": "imat_mock6",
  "bankVersion": "b3f2a1c9",
  "status": "in_progress",             // "in_progress" | "submitted"
  "source": "live",                    // "live" | "imported_legacy_result" | "imported_legacy_history" | "manual"
  "createdAt": "2026-09-18T14:22:33Z",
  "updatedAt": "2026-09-18T14:40:01Z",
  "startedAt": "2026-09-18T14:22:33Z",
  "submittedAt": null,
  "autoSubmitted": false,
  "durationSec": 6000,
  "remainingSec": 4180,
  "lastTickAt": "2026-09-18T14:40:01Z",
  "strictTimer": false,
  "seed": 918273645,                   // 0 for identity permutation (imports/manual)
  "perm": { "1": [2,0,4,1,3], "2": null, "3": [1,3,0,4,2] },   // per question; null = identity
  "answers": { "1": "C", "2": null, "3": "A" },                // DISPLAY letters; null/absent = blank
  "scoreTenths": 567,
  "maxTenths": 900,
  "correct": 41, "wrong": 12, "blank": 7,
  "sections": { "A": { "correct": 7, "wrong": 1, "blank": 1, "scoreTenths": 101 },
                "B": { }, "C": { }, "D": { }, "E": { } },
  "note": null,                        // free text, mainly for manual entries
  "dirty": false,                      // sync bookkeeping: true when not yet pushed
  "deleted": false                     // tombstone for sync deletion
}
```

- `answers` values are DISPLAY letters (post-permutation). Grading compares the display letter against the display key derived from `perm` (Section 5.1 semantics). Imported attempts use identity `perm`, so their stored legacy letters grade correctly against the original `ans`.
- Imported aggregate attempts (`imported_legacy_history`) have `answers: null`, `perm: null`, and only the aggregate counts; they appear in History and trend charts but not in per-question review or topic analytics.
- `scoreTenths` and section aggregates are written once at submit by the grading engine; `in_progress` records carry `scoreTenths: null` and empty aggregates.

### 5.3 localStorage key namespace (new app)

All keys are prefixed `imatex.` so a wipe removes exactly them:

| Key | Contents |
|---|---|
| `imatex.gate.unlocked` | `"1"` when unlocked (remembered; Lock clears it) |
| `imatex.settings` | `{ "strictTimer": { "default": false, "perExam": { } }, "sync": { "enabled": false }, "seenIntro": true }` |
| `imatex.attempts.index` | JSON array of attemptIds in creation order |
| `imatex.attempt.<attemptId>` | Full attempt record (5.2) |
| `imatex.sync.queue` | JSON array of attemptIds pending push |
| `imatex.sync.meta` | `{ "lastPullAt": "...", "lastPushAt": "..." }` |
| `imatex.legacy.import` | Import report `{ "at": "...", "found": [...], "imported": [...], "skipped": [...] }` |

Storage adapter: localStorage primary; if unavailable (private mode), an in-memory Map with a persistent warning banner ("answers will be lost when this tab closes") and an "Export attempts" prompt. The cookie fallback from the old engines is dropped. All adapter methods are behind an interface so node tests can inject a memory implementation.

### 5.4 Legacy data and migration/import rules

Legacy keys written by the current HTML files (verified ids: `imat_mock1` ... `imat_mock8`, `GK_Drill_100`, `Repair_Drill_1`):

| Legacy key | Shape |
|---|---|
| `<id>_answers` | object of `"1"`..`"60"` to letter |
| `<id>_result` | `{ total, correct, wrong, blank, bySec, answers, at }` (`bySec` keyed by full section label) |
| `<id>_history` | array (max 5) of `{ total, correct, wrong, blank, at }` |
| `<id>_start` | wall-clock ms timestamp |
| `<id>_unlocked` (sessionStorage) | `"1"` |

Import rules (runs automatically once on first unlock; re-runnable from Settings):

1. For each legacy id, if `<id>_result` exists: create an attempt with `source: "imported_legacy_result"`, `status: "submitted"`, `answers` copied verbatim (identity perm, since legacy letters refer to original option order, identical to bank option order), `startedAt/submittedAt` from `result.at`, aggregates RECOMPUTED by the grading engine from `answers` (authoritative). If recomputed `total` differs from stored `total` by more than 0.05, keep the recomputed values, keep the stored value in `note` ("legacy reported 48.9"), and list the attempt in the import report under `discrepancies`.
2. For each entry in `<id>_history`: create an aggregate attempt (`source: "imported_legacy_history"`, `answers: null`, counts and date copied). Dedupe: skip a history entry whose `at` matches the imported result's `at` (same sitting).
3. `<id>_answers` without a `<id>_result` (an abandoned in-progress paper): NOT imported (it cannot be resumed meaningfully into the new runner); listed in the report under `skipped` with the reason.
4. `<id>_start` and `<id>_unlocked`: ignored.
5. Legacy keys are never deleted or modified by the import (the old HTML files keep working side by side).
6. If the legacy keys are absent (she sat the old exams on a different origin, or the app is on the new Pages origin), the automatic import finds nothing; the History page's "Log past attempt" form covers this (Section 7.2).

Manual "log past attempt" form fields: exam (dropdown of the 10 banks plus a free-text "other paper" label), date (required), mode A: correct / wrong / blank counts (any two derive the third; score computed as `1.5*correct - 0.4*wrong`), mode B: score only (score and max, counts left unknown). Optional note. Creates an attempt with `source: "manual"`. Warn (non-blocking) if an attempt of the same exam exists with the same date.

---

## 6. Exam runner spec

### 6.1 Rendering

- Paper rendered in bank order (question numbers fixed; IMAT papers are not question-shuffled). Options rendered in the attempt's permuted order per Section 5.1 semantics.
- Section header bars inserted before the first question of each section, using bank `sections` data with question ranges (`Q1-9` style counts), matching the current visual style.
- Option rows: `<label>` wrapping a radio input, the letter key, and the option text in a `<span>`. All rows share one class; selection is the only state change. Text is inserted with `textContent` (no HTML injection anywhere; `innerHTML` is banned for any content-bearing string).
- Navigator: section-grouped grids of numbered cells; states pre-submit: answered (filled navy) / blank (outline). Current question outlined (IntersectionObserver tracking, carried over from the current engines). Jump-to-number input. Mobile: slide-in drawer with scrim.
- Answered counter in the header (`Answered n/60`).

### 6.2 Autosave contract

- Every answer change writes the full attempt record synchronously to the storage adapter before any UI update depends on it (writes are a few KB; no debouncing).
- The write also updates `remainingSec`, `lastTickAt`, and `updatedAt`.
- Toast "Answer saved" is NOT shown per click (it was noisy in the old engine); the navigator cell fill is the feedback. A one-time toast on the first saved answer per attempt ("Progress autosaves") is enough.
- If a storage write throws: banner appears immediately ("Storage unavailable: progress kept in memory only. Export before closing."), and the adapter switches to memory mode.

### 6.3 Navigator and pre-submit UI

Exactly as Section 2.4: no topic, no difficulty, no explanations, no correctness. Jump reveals filtered/hidden cards only in review, not during the exam (filters do not exist pre-submit).

### 6.4 Submit flow

- Submit button (bottom toolbar, always visible) opens a modal (never `confirm()`): "You answered X of N. Blank = 0 points, wrong = -0.4. Submit now?" with per-section answered counts, Cancel and Submit buttons.
- On confirm: grading engine runs (6.6), record updated (`status: "submitted"`, aggregates, `submittedAt`), `location.replace('#/review/' + attemptId)`.

### 6.5 Timer contract

- `durationSec` comes from the bank (6000 for all current exams). `remainingSec` is persisted with the attempt and is the single source of truth.
- Ticking: a 1-second interval runs ONLY while (a) the exam route is mounted and (b) `document.visibilityState === 'visible'`. Each tick computes elapsed from `Date.now()` deltas (not naive decrements) so throttling cannot inflate time, updates `remainingSec` and `lastTickAt`, and persists on every visible second boundary.
- On route unmount or tab hidden: persist, stop the interval.
- On resume: kind mode (default, `strictTimer: false`): `remainingSec` unchanged while away, `lastTickAt` reset to now. Strict mode (`strictTimer: true`, per-exam override in Settings, default off): subtract `min(elapsedSinceLastTick, remainingSec)` from `remainingSec`. This is a deliberate deviation from the old wall-clock behavior, chosen as practice kindness; strict mode exists to rehearse real exam conditions.
- Display: `MM:SS`, tabular numerals; amber pulse at 5:00 and below (matches current styling).
- At 00:00 (2026-09 change, on request): NO auto-submit. The ticker stops, the header chip turns red at 00:00, a persistent "Time expired" banner is prepended to the paper, and a one-time toast explains the paper stays open. Answers can still be changed; only the Submit button grades and navigates. A resumed attempt with `remainingSec` 0 mounts straight into this expired state instead of force-finalizing. `attempt.autoSubmitted` stays `false` for new attempts (the field and the legacy history/review badge are kept so old attempts still render).

### 6.6 Grading engine (pure module, browser and node)

`js/grader.js` exports `gradeAttempt(bank, attempt) -> {scoreTenths, correct, wrong, blank, sections}`:

- Internals in integer tenths: correct = +15, wrong = -4, blank = 0. No floating-point arithmetic anywhere in scoring.
- Display: `scoreTenths / 10` printed with exactly one decimal (`56.7`, `90.0`), max from `maxTenths` (90.0 / 150.0 / 105.0).
- Section aggregates per bank `sections` maps (correct, wrong, blank, scoreTenths per section).
- Sanity property (unit-tested): all-correct attempt on any bank yields exactly `maxTenths`; all-wrong yields `-4 * n`; the legacy tracker numbers reproduce: e.g. 41 correct / 12 wrong / 7 blank = 615 - 48 = 567 tenths = 56.7.

### 6.7 Review (post-submit view, also `#/review/<attemptId>`)

- Score panel: total with one decimal over max, sub-line `c correct / w wrong / b blank`, per-section stat cards (marks with c/w counts), auto-submitted badge when applicable.
- Filters: All / Correct / Wrong / Blank buttons plus a section dropdown, with a visible count ("showing 23 of 60"). Hidden cards can be temporarily revealed by navigator jump (carry over the current 2.5s reveal behavior).
- Each card: correct option green, her wrong pick red, correct option blue when blank; explanation block always visible post-submit; topic and difficulty badges NOW shown (review-only, per AL-1); navigator cells recolor to correct/wrong/blank with result tooltips.
- Buttons: Reattempt (one tap, Section 7.3), Copy summary (parity with current `resultsSummary`), Back to history.

### 6.8 Multi-tab and edge cases

- Two tabs on the same attempt: whole-record writes, last write wins; single-user app, acceptable; documented in README.
- Losing the bank fetch (offline first visit, no SW yet): exam route shows a retry card; nothing else breaks.

### 6.9 Answer-key exposure note

The bank (with answers) is fetched after gate unlock and held in module scope, not on `window`. This raises the bar slightly versus today's inline `const EXAM` but is not security; README and Settings copy say so plainly.

---

## 7. History, Reattempt, Compare, Analytics

### 7.1 History (`#/history`)

- Table/cards, newest first, all attempts ever (no cap; the old "last 5" cap is gone). Columns: exam title, date, score/max, c/w/b, delta vs her previous attempt of the same exam (arrow + value), source badge (Live / Imported / Aggregate / Manual), actions: Review, Reattempt, Delete (with confirm; tombstones the record for sync).
- Filter by exam; sort by date (default) or score.
- "Log past attempt" button opens the manual form (5.4).

### 7.2 Derived metrics and exact formulas (shared by History, Compare, Analytics)

All computed by `js/analytics.js` from attempt records; integer tenths internally, one-decimal display.

- Score: `scoreTenths / 10`.
- Answered accuracy: `correct / (correct + wrong)` (blank-safe; 0 when denominator 0, shown as "-").
- Overall accuracy: `correct / qCount`.
- Blank rate: `blank / qCount`.
- Penalty cost of wrong answers: `0.4 * wrong` points, shown as "-4.8 pts from wrong answers"; companion line "leaving those blank instead: +<0.4*wrong>".
- Calc wall (mocks only): `blanksC + blanksE`, plus "points left on the table: 1.5 * (blanksC + blanksE)". For drills, section codes differ, so the widget renders only for `kind: "mock"` exams; drills get a generic per-section blank-rate chart instead.
- Topic error aggregation: over wrong and blank questions of the selected exam, group by bank `topic`: `errors = wrong + blank`, `attempted = correct + wrong + blank`, `errorShare = errors / totalErrors`. Table sorted by `errors` desc, columns: topic, errors (w/b split), errorShare. Attempts with `answers: null` are excluded.
- Delta vs previous same-exam attempt: `score - previousScore` (one decimal, signed).

### 7.3 Reattempt

- One tap on Review or History: creates a fresh attempt for that exam: new attemptId, new random seed (crypto.getRandomValues into 32 bits), full duration, empty answers; navigates to `#/exam/<id>`. The previous attempt is untouched.
- The new seed feeds the per-attempt permutation algorithm (10.4), so the reattempt sees a different option order with the same balanced key distribution.

### 7.4 Compare (`#/compare`)

- Selection: chips of attempts grouped by exam; pick 2 to 5 (default when opened with none: her two most recent attempts of the same exam, else the two most recent overall).
- Table: rows = Total, then each section (bank labels); each cell = score (one decimal) and `(c/w/b)`; rightmost columns show delta vs the first selected attempt.
- Trend chart: pure SVG (no libraries): x = attempt date, y = score; one polyline per exam with dots and hover tooltips (date, score, c/w/b). Toggle: per-exam small multiples (default) or combined normalized (`score / max * 100`) view.
- Both the chart component and the table are shared with Analytics.

### 7.5 Analytics (`#/analytics`)

- KPI row: total attempts, attempts in last 30 days, mean mock score, best mock score.
- Score trend chart (same component as Compare), all attempts.
- Per-section answered-accuracy over time: one line per section of the selected exam (exam picker defaults to the most-attempted mock).
- Blank rate over time per section, same picker; the calc-wall panel (7.2) sits beside it for mocks.
- Penalty panel: per attempt, wrong count and points lost to penalties; cumulative line.
- Topic errors table (7.2) with exam picker.
- Every panel degrades gracefully when there are fewer than 2 attempts (show the numbers, hide the lines).

---

## 8. Sync contract (optional, Supabase, free tier)

Local mode is fully functional with `config.js` `supabaseUrl` / `supabaseAnonKey` empty (default). All sync code must no-op cleanly in that mode. Sync is single-user (Bhavya's account).

### 8.1 Schema (`schema.sql`, shipped in the repo)

```sql
create table if not exists public.attempts (
  attempt_id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  exam_id text not null,
  schema_v int not null default 1,
  data jsonb not null,               -- full attempt record (Section 5.2)
  deleted boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.attempts enable row level security;
create policy "owner_full_access" on public.attempts
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create index if not exists attempts_user_updated_idx
  on public.attempts (user_id, updated_at);
```

### 8.2 RLS policy sketch

One policy, owner-only: every operation (select, insert, update, delete) requires `auth.uid() = user_id`. Anon role has zero access (no public policy). Service role key never ships to the client.

### 8.3 Push/pull algorithm (offline-first, last-write-wins)

- Enable flow (Settings): paste URL + anon key (or read from config.js), sign in once with email + password (Supabase Auth; Ken creates her account in the dashboard), `sync.enabled = true`.
- Dirty tracking: every local submit/update sets `dirty: true` and appends the attemptId to `imatex.sync.queue`.
- Push (on: 60s interval, `online` event, return to `#/home`, and after each submit): for each queued attemptId, upsert `{ attempt_id, exam_id, schema_v, data, deleted, updated_at }`; on success clear `dirty`, remove from queue, update `lastPushAt`. Exponential backoff on failure, capped at 5 minutes.
- Pull (on: app load when enabled, `visibilitychange` to visible, and every 5 minutes): select rows `updated_at > lastPullAt`; for each, compare with the local record by `updated_at` (ISO UTC): newer wins; on exact tie the server wins. Apply to local store; a pulled tombstone (`deleted: true`) deletes the local record and its index entry.
- Conflict rule: last-write-wins per attemptId on `updatedAt`. Attempts are single-writer in practice (one human), so this is sufficient; no field-level merging, ever.
- Failure behavior: any sync error is silent locally except a small badge ("N pending") in Settings and on Home. Sync NEVER blocks navigation, grading, or autosave, and NEVER mutates attempt content beyond what local writes already did.
- Delete semantics: delete = set `deleted: true` locally, tombstone pushes, both sides converge to deleted.

### 8.4 SETUP-CLOUD.md outline (steps only, shipped in repo)

1. Create a free Supabase project; note the project URL and anon public key.
2. Open the SQL editor; run `schema.sql` from this repo.
3. Auth: enable Email provider; create the user (Bhavya's email + password); disable open signups.
4. Put the URL and anon key in `config.js` (or paste them in Settings; Settings values win).
5. On the phone/laptop: open the app, Settings, Sign in, enable Sync; confirm "N pending" clears.
6. Verify: make an attempt offline in airplane mode, go online, confirm it appears in the Supabase table.
7. Cost note: free tier limits are far above single-user volume; no payment method required.

---

## 9. Deployment plan

### 9.1 Repo layout (new public repo `kanitmann01/imat-exams`; repo root is the Pages root)

```
/index.html              one page, loads config.js + app modules
/404.html                redirect to ./index.html (safety net)
/.nojekyll               skip Jekyll processing (underscore files, exact filenames)
/manifest.webmanifest
/sw.js
/config.js               password, SUPABASE_URL, SUPABASE_ANON_KEY, strictTimerDefault
/css/app.css
/js/router.js  js/store.js  js/gate.js  js/banks.js  js/runner.js
/js/grader.js  js/review.js  js/history.js  js/compare.js  js/analytics.js
/js/sync.js  js/legacy.js  js/util.js
/data/exams.json         manifest
/data/imat_mock1.json ... /data/imat_mock8.json
/data/GK_Drill_100.json  /data/Repair_Drill_1.json
/assets/icons/icon-192.png  icon-512.png  favicon.svg
/tools/build_banks.py    tools/shuffle_overrides.json  tools/stamp.py  tools/audit_banks.py
/tests/*.test.mjs        node:test suites (Section 11.4)
/e2e/*.spec.mjs          Playwright specs
/SPEC.md  README.md  SETUP-CLOUD.md
```

All asset references are relative (`./js/...`, `./data/...`) so the site works at `https://kanitmann01.github.io/imat-exams/` and from any subpath. Local dev: `python -m http.server` in the repo root (ES modules and fetch require http, not file://).

### 9.2 Enablement via gh CLI (from the repo root, after first push)

```
gh repo create kanitmann01/imat-exams --public --source=. --push
gh api -X POST repos/kanitmann01/imat-exams/pages \
  -f "source[branch]=main" -f "source[path]=/"
gh api repos/kanitmann01/imat-exams/pages   # verify: status building, then live
```

The existing `kanitmann01/IMAT` repo (course site) is untouched; this is a separate repo so its Pages config stays as is.

### 9.3 Cache busting

- GitHub Pages sends `cache-control: max-age=600` for all assets, so stale-asset windows are at most 10 minutes.
- `tools/stamp.py` runs before each push: computes a short content hash of `js/`, `css/`, and `data/`, and rewrites the `?v=<hash>` query on script/link/fetch-base references in `index.html` and sets `self.VERSION` in `sw.js`. Query-param busting is authoritative; never rename files between releases.
- `data/*.json` are always fetched with `cache: 'no-cache'` semantics in the app layer (network-first in the SW) so bank fixes reach users without waiting on the HTML cache.

### 9.4 Service worker policy (PWA-lite)

- Precache at install: app shell (`./`, `index.html`, `config.js`, `css/`, all `js/`) plus `data/exams.json` and all bank JSONs (they total well under 1 MB), and icons.
- Strategy: navigations and `data/*.json`, `config.js`: network-first with cache fallback (bank fixes propagate; offline still works). Other static assets (`?v=` hashed): cache-first.
- Update flow: `self.skipWaiting()` + `clients.claim()`; when a new VERSION is detected, show a toast "Update available: tap to reload"; old caches deleted on activate.
- Manifest: name "IMAT Exam Platform", short name "IMAT", `start_url: "./"`, `scope: "./"`, `display: "standalone"`, theme and background `#1F3864`, icons 192 and 512. This makes "Add to Home Screen" on her phone behave like an app and keeps the gate/timer outside browser chrome.
- The SW never intercepts or caches Supabase API calls (fetch to a different origin passes through).

---

## 10. Tooling: `tools/build_banks.py`

### 10.1 Purpose and inputs

Extracts the embedded `EXAM` JSON from the 10 source HTML files in `D:\Dev\Flashtest\IMAT_Research_2026\02_EXAMS\HTML\` (the HTML is the source of truth because it is what she actually used; the markdown sources predate the drills' final content), scrubs and rebalances it, and writes the bank files. CLI:

```
python tools/build_banks.py --src <path to 02_EXAMS/HTML> --out data/ [--check]
```

`--check` validates everything and fails with a nonzero exit if any invariant would be violated, without writing (for CI and pre-push runs).

### 10.2 Pipeline steps

1. Extract: for each source HTML, pull the `const EXAM = {...};` JSON (regex tolerant of the two spacing variants: `"id": "x"` in mocks, `"id":"x"` in drills). Parse strictly.
2. Validate: expected question counts (60/60/60/60/60/60/60/60/100/70), 5 options per question, `ans` in A-E, non-empty stem and explanation, `lik` in H/M/L. Any failure aborts the build.
3. Scrub (10.3) on `stem`, each option, and `exp`; log every change (exam, question, field, before/after snippet) to `tools/build_report.md`.
4. Shuffle-safety detection (10.5) per question; manual overrides from `tools/shuffle_overrides.json` always win over heuristics (both directions: force-unsafe and force-safe).
5. Rebalance (10.4): compute baseline permutations for seed 0.
6. Emit: `data/<id>.json` (schema in 5.1, keys sorted, UTF-8, no trailing spaces), `data/exams.json`, `tools/build_report.md` (counts, scrub log, unsafe list, distribution table).
7. `bankVersion` = `"b"` + first 8 hex of sha256 over the canonical question content (no timestamps in the hash input), so identical inputs give byte-identical files on any day.

### 10.3 Scrub rules

Applied in order; every removal is logged, nothing is silently rewritten:

- **S1 Emphasis removal.** `**x**`, `*x*`, `__x__`, `` `x` `` wrappers become their inner text. Single `_` pairs are stripped only when both sides are word characters with no whitespace (protects rare underscores in identifiers). Verified outputs: `*Read:*` becomes `Read:`, `**not**` becomes `not`, `*De fabrica*` becomes `De fabrica`.
- **S2 Directive artifact removal.** Delete a stem line that consists solely of `Read:` or `Read the following passage and answer the question.` when the same stem also contains a double-quoted passage (the directive is redundant with the passage itself). Everything else is kept as words (so `*(General knowledge)*` becomes the plain text `(General knowledge)`).
- **S3 Internal calibration tag removal.** Remove any bracket group matching: contains a dash (any of em, en, or hyphen) followed by whitespace and a standalone H, M, or L token; or contains any of the keywords: `formula recall`, `common trap`, `new entrant`, `repeat offender`, `as in 20`, `forecast`. This catches `[Set theory - M (new entrant from 2025)]`, `[Geometry/solid - H (formula recall, as in 2024)]`, `[Redox - H (common trap)]` (the current generator's tag regex only matched tags with nothing between the H/M/L and the closing bracket, which is exactly why these three leaked).
- **S4 Legitimate bracket preservation.** Bracket groups with no H/M/L token and no keyword survive: regression fixtures `[x(x - 3)]` (Mock 4 Q50, math) and `[having]` (GK Q38, grammar) must pass through unchanged.
- **S5 Whitespace tidy.** Collapse 3+ consecutive newlines to 2, trim outer whitespace. No other punctuation or wording changes; content editing is Ken's job in the sources, not the tool's.

Post-condition (asserted): no `*`, no `` ` ``, no `__`, and no internal-tag pattern remains in any rendered field; S4 fixtures intact.

### 10.4 Rebalance algorithm and constraints

Goal: every exam and every fresh attempt presents a near-uniform correct-answer letter distribution, without touching shuffle-unsafe questions.

1. Targets: for n questions, base quota `q = floor(n/5)` per letter, remainder `r = n mod 5` spread to the first `r` letters in A..E order. n=60: 12 each. n=100: 20 each. n=70: 14 each.
2. Fixed letters: unsafe questions keep their original letter and are excluded; their letters consume quota. (Current data: unsafe counts are small, so no quota can go negative; if a future bank ever violates this, the tool relaxes the bound to plus-or-minus 2 for that letter, logs a warning, and continues, rather than failing.)
3. Assignment: for each safe question in question order, the candidate letters are those with remaining quota greater than 0; a seeded PRNG (mulberry32, seed derived from `hash(examId, question n, attemptSeed or 0, bankVersion content)`) picks uniformly among candidates; decrement that letter's quota. Greedy is always feasible here because total remaining quota always equals remaining unassigned questions.
4. Permutation build: the correct original option is placed at the assigned letter's position; the other four originals fill the remaining positions in PRNG-shuffled order. Output the `perm` array per Section 5.1 semantics.
5. Validation (every run): each `perm` is a bijection of 0..4; displayed option multiset equals original multiset; per-exam displayed letter counts meet AL-3 bounds; an all-correct simulated attempt grades to exactly `maxTenths`.

Idempotency: the same source files, overrides, and seed produce byte-identical outputs (sorted keys, content-derived `bankVersion`, PRNG fully deterministic). Running twice and diffing is part of the QA plan.

### 10.5 Shuffle-unsafe detection (heuristics + manual overrides)

Flag a question unsafe if any stem or option matches, case-insensitively:

- `\b(all|none) of (the )?above\b`
- `\b(both|all|none)\s+(of\s+)?(options?\s+|statements?\s+|answers?\s+)?[A-E]\s*(,|and|&|\+|or)\s*[A-E]\b` (guards against false positives like "vitamin A and D" by requiring option/statement/both/all/none context words; anything ambiguous lands in the report for Ken)
- Stem says `Which of the following statements` AND any option begins with `Statement` or `Option`

All matches with their pattern and text go into `tools/build_report.md`; Ken confirms or edits `tools/shuffle_overrides.json` (e.g. `{ "imat_mock3": { "unsafe": [14], "safe": [22] } }`). Unsafe questions: `perm: null`, `shuffleSafe: false`, reason string set.

---

## 11. QA and audit plan

### 11.1 Content audit (`tools/audit_banks.py`, runnable standalone and inside CI)

Checks AL-3, AL-4, AL-6 against `data/*.json` and prints a table. Exit code 1 on any violation. Includes the S4 preservation fixtures and a before/after diff summary from `build_report.md`. Also verifies: every bank's section ranges are contiguous and cover 1..n with no gaps or overlaps; `exams.json` matches the banks (counts, versions).

### 11.2 Visual audit plan (Playwright screenshots)

Screenshots at desktop 1280x800 and mobile 390x844 (iPhone 12/13/14 class), light theme only:

| Screen / state | Assertions of record |
|---|---|
| Gate (locked) | Card layout, no content visible behind |
| Home with resume card, home without | Resume card present/absent; exam cards show last/best scores |
| Exam top, mid-paper, navigator drawer (mobile) | Section headers, uniform options (AL-2 computed-style check), no badges/tooltips (AL-1, AL-5) |
| Submit modal with blanks | Blank count text correct |
| Review: all / wrong-only filter | Colors, explanation, topic+difficulty badges present |
| History, Compare (2 selected), Analytics, Settings | Tables render; SVG chart lines drawn; sync badge hidden in local mode |

Store the approved set in `e2e/screens/` and eyeball-diff on UI changes (no pixel-bot gate; visual review is human).

### 11.3 UX flow checklist (manual, run on phone and desktop before each release)

1. Unlock once, close browser, reopen: no gate prompt.
2. Start Mock 6, answer 5, back to Home, Resume: answers intact, timer paused (kind) / reduced (strict).
3. Kill the tab mid-exam, reopen via Home: same as 2.
4. Let a 2-minute exam (dev override `?duration=120` for testing only) hit zero: clock freezes at 00:00, red chip plus expired banner appear, the paper stays open; pressing Submit lands on Review with no auto-submit badge.
5. Submit with 3 blanks: modal shows 3, grading correct.
6. Review filters and navigator jump-reveal work.
7. Reattempt: new paper, options visibly reordered on shuffle-safe questions, history now has 2 rows.
8. Manual log a past attempt; it appears in History, Compare, and the trend chart.
9. Airplane mode: full attempt + review works from the service worker.
10. Lock in Settings: gate returns on next navigation; unlock restores everything.

### 11.4 END-GATE test plan (must all pass before the Pages URL is shared with her)

**Unit tests (`node --test tests/`, pure modules, no DOM):**

- **UNIT-1 grader:** exact tenths math: all-correct = maxTenths for all three bank kinds; 41/12/7 = 567 tenths (56.7); single wrong = -4; all-blank = 0; section aggregates match hand-computed fixtures; no float drift after 10,000 randomized cases versus a big-decimal reference.
- **UNIT-2 rebalance:** determinism (same seed, same perm twice); distribution bounds per AL-3 for all 10 banks and for 50 random attempt seeds each; unsafe questions untouched (Mock 3 Q14-type fixtures); permutation bijection and multiset preservation; legacy identity case (seed 0, imported attempts) grades correctly against original letters.
- **UNIT-3 storage:** attempt CRUD via the adapter interface (memory implementation), index consistency, corrupted JSON record is quarantined with a report instead of crashing, quota-error path flips to memory mode.
- **UNIT-4 legacy import:** fixture localStorage blob (all legacy key shapes from 5.4) converts to attempts; recomputed scores match stored totals for well-formed data; the tracker cross-check values (48.9 / 42.4 / 45.8 / 32.9) round-trip when fed as fixture answers; history dedupe against result; skipped in-progress case reported.
- **UNIT-5 scrub:** S1-S5 rules against the named leak instances (Mock 2 Q54, Mock 4 Q52, Mock 5 Q37, Mock 1 Q1, Mock 6 Q1) and the S4 preservation fixtures.
- **UNIT-6 timer math:** visible-tick accounting, pause on hidden, kind vs strict resume, expire signal at 0 (the view now uses it to freeze the paper open), drift resistance (fake clocks).

**E2E (Playwright, against a local static server and, post-deploy, the Pages URL):**

- **E2E-1** happy path: gate, mock, answer 20 including a section skip, submit with blanks, review, filters, badges visible, copy summary.
- **E2E-2** the P1 killer: mid-exam back, forward, reload, tab close/reopen; zero answer loss; no gate re-prompt; timer per mode.
- **E2E-3** history / reattempt / compare / analytics render with correct derived numbers (assert 56.7-style fixtures end to end).
- **E2E-4** legacy import on a same-origin fixture (seeds localStorage before load), plus manual log form path.
- **E2E-5** offline: cold load in airplane mode after one prior visit; full attempt works (SW).
- **E2E-6** anti-leak DOM sweep on the exam route: AL-1, AL-2, AL-5, AL-7 asserted programmatically across mocks 1 and 6 and GK.

**Acceptance criteria (product-level, all must hold):**

1. Every SC-1..SC-4 in Section 1.4 demonstrably passes.
2. `python tools/build_banks.py --check` and `tools/audit_banks.py` exit 0 on the shipped banks; double-build diff is empty.
3. `node --test` and the Playwright suite are green on the exact commit deployed to Pages.
4. The live URL loads on her phone over 4G in under 3 seconds cold and works offline afterward.
5. Ken can regenerate and redeploy the banks with three commands (build, test, push) in under 5 minutes.

---

## 12. Out of scope / explicit non-goals

- No server of our own, no paid services, no user accounts beyond the single optional Supabase login.
- No multi-user or classroom features, no leaderboards, no sharing between students.
- No question authoring UI. Content changes happen in the research repo sources and flow through `build_banks.py`.
- No rewriting or re-calibration of question content (the scrub removes markup and internal tags only; wording is Ken's).
- No real exam-security features. The client-side gate is a deterrent; the answer key ships in the client bundle by design (static, free). If that ever becomes unacceptable, that is a new architecture decision, not a config change.
- No spaced repetition, study planner, notes, or flashcards. The GK revision guide (`GK_Revision.html`) and interactive notes are NOT migrated; the Home page may link to their existing URLs, nothing more.
- No dark mode, no theming, no i18n (UI is English; content is English with Italian-culture GK as authored).
- No PDF export or printing of papers (the existing markdown/PDF pipeline in the research repo already covers paper printing).
- No native apps; PWA-lite only.
- No per-question timing analytics or telemetry of any kind; nothing phones home (Supabase sync is the only network call the app itself makes, and only when enabled).
- No support for browsers without ES modules and `localStorage` (modern Chrome, Edge, Firefox, Safari iOS 15+ only).

# Content Audit Report (independent verification)

Date: 2026-09-18
Auditor: independent re-verification, no reliance on prior reports (tools/audit_banks.py, tools/build_report.md were read for context only; every claim below was re-derived from the data and code by running scripts against the files).

Scope: js/view-exam.js, js/view-review.js, js/core.js, js/ui.js, js/grader.js, js/app.js, js/legacy.js, js/legacy-run.js, js/view-history.js, css/app.css, sw.js, config.js, and all 10 banks in data/ (imat_mock1..8, GK_Drill_100, Repair_Drill_1; 670 questions total).

## Verdict summary

| Invariant | Verdict |
|---|---|
| AL-1/AL-5 metadata (topic/lik/exp pre-submit) | PASS (2 minor informational notes) |
| AL-2 uniform options (render + CSS) | PASS |
| AL-3 letter balance (display keys) | PASS (1 advisory, review-only path) |
| AL-4 residual markers | PASS for pre-submit fields (notes on titles/explanations) |
| AL-6 correct-option length pattern | FAIL (content-level, ranked list below) |
| Numeric options ascending | PASS (157/157) |
| Order-sensitive non-numeric questions | PASS |
| Cross-reference options (shuffle safety) | PASS (0 questions need perm null) |
| Duplicate options | PASS (0 exact, 0 visual/codepoint) |
| Synonym option pairs | PASS (all near-pairs are intentional minimal pairs) |
| Explanations | PASS with 2 terse outliers (LOW) |

---

## AL-1 / AL-5: no topic, lik, or explanations in the pre-submit DOM

Method: line-by-line read of js/view-exam.js, js/ui.js, js/grader.js, js/app.js; grep of every `topic`, `lik`, `exp`, `ans`, `displayKey` reference across js/; grep for `innerHTML`, `insertAdjacentHTML`, `document.write`, `outerHTML`, `title:`, and every `dataset` usage.

Findings:

1. js/view-exam.js renders only: section labels (bank.sections[].label/short, standard subject names), question numbers, `q.stem`, and `q.options` via `optionAt(q, i, permMap[q.n])` (view-exam.js:132). The submit modal shows answered counts only (view-exam.js:223-237). There is no reference to `q.topic`, `q.lik`, or `q.exp` anywhere in the file.
2. The only `topic`/`lik`/`exp` consumers are js/view-review.js (lines 9, 112, 113, 116: badges and explanation, review route only) and js/analytics.js / js/view-analytics.js (aggregates of submitted attempts).
3. All content strings go through the `el()` helper which assigns `textContent` (js/ui.js:4-19). No `innerHTML` with dynamic data exists anywhere in js/ (grep hit is only the comment in ui.js:2).
4. `title:` attributes in js/ are static strings only ("Question n", modal titles). `dataset` payloads: `{qn, sec}` on exam cards, `{qn}` on nav cells, `{sec, res}` in review. No metadata keys.
5. `q.ans` is read only by core.js/grader.js/analytics.js for grading; the exam view never touches it.

Result: PASS. The only section-level information visible during the exam is the standard subject header per section, which mirrors the real paper layout.

Minor informational notes (not leaks of q.topic, but visible pre-submit metadata):

- The stem text of question 3 in every mock carries a parenthetical subject tag: "(General knowledge)" in imat_mock1/6/7/8, "(GK)" in imat_mock2/3/4/5. This is embedded in the data (stem field) and visible during the exam. It tells the candidate the question is out-of-section general knowledge, and the label format is itself inconsistent across mocks. Consider removing or unifying.
- Exam titles shown on Home/History carry composition/calibration language: imat_mock2 "Bioenergetics Spine", imat_mock4 "Calculation Spine", imat_mock5 "The Discriminator", imat_mock6 "At-Level Calibration", Repair_Drill_1 "Repeat Offenders". These are pre-exam hints about each paper's internal composition and intent.

## AL-2: uniform option rendering, no styling distinguishes the correct option pre-submit

Findings:

1. All five options render through one code path (view-exam.js:119-133): identical class string `opt`, identical children (`input`, `span.key`, `span` with `optionAt` text), identical insertion order. The only class ever mutated at runtime is `sel`, added/removed by `paintSelection` (view-exam.js:207-215) on the user's own selection.
2. css/app.css option rules: `.opt` base (uniform), `.opt:hover` (uniform), `.opt input` (uniform), `.opt .key` (uniform), `.opt.sel` (runtime selection state). The stateful rules `.qcard .opt.good`, `.qcard .opt.bad`, `.qcard .opt.show` and card-level `.qcard.good/.bad/.blank` are reached only when the `good`/`bad`/`show`/graded classes exist, and those are added exclusively in js/view-review.js lines 98-108. Verified by grep: no occurrence of `" good"`, `" bad"`, `" show"` in view-exam.js.
3. No `nth-child`, `nth-of-type`, or attribute selectors target `.opt` (grep of app.css).

Result: PASS.

## AL-3: display letter balance

Method: imported js/core.js in Node; computed `displayDistribution(bank, computePermMap(bank, seed))` for seeds 0..20 for all 10 banks, then stress-tested 500 additional random 32-bit seeds per bank. Targets: 60Q = 12/letter, 100Q = 20/letter, 70Q = 14/letter.

Results:

- All 10 banks: distribution exactly on target for every seed 0..20 (21/21 exact).
- Across 500 random seeds per bank: worst absolute deviation from target is 0 for every bank. This holds because the 41-47 numeric-fixed questions per mock (whose display letters skew toward C by rank, e.g. 11 of 19 in imat_mock6) are absorbed by the greedy assignment of the 41-47 free questions; no letter can end outside target +/- 1 for the tested seeds.

Result: PASS for the live exam runner.

Advisory (LOW): the identity path still exposes the legacy raw key skew. Raw stored `ans` distributions: imat_mock1 {A:6,B:27,C:18,D:9,E:0}, imat_mock2 {A:4,B:29,C:20,D:7,E:0}, imat_mock3 {A:7,B:24,C:19,D:9,E:1}, imat_mock4 {A:8,B:29,C:16,D:4,E:3}, imat_mock5 {A:4,B:27,C:18,D:8,E:3}. These raw keys are what a user sees when reviewing (a) attempts imported from legacy results (js/legacy.js:44-82 grades with an identity permMap) and (b) manually logged or aggregate-history attempts (view-history.js:188-202, legacy.js:86-106, perm null, answers null; view-review.js:90 falls back to `q.ans`). In those reviews the highlighted correct options follow the old skewed pattern (correct is never E in mocks 1-2, B about half the time in mock2). Live exams and reattempts always compute a fresh balanced perm (view-exam.js:45, 54-58), so this never reaches the exam runner. Options: accept, or suppress option highlighting for perm-less attempts.

## AL-4: residual markers and calibration tags

Method: full scan of stem, all five options, and exp of all 670 questions for: `**`, single-asterisk emphasis (word-flanked `*`), backticks, `__emphasis__`, tags of the form `[X - H]`, the phrases "formula recall", "common trap", "new entrant", "repeat offender", "as in 20xx", "forecast", "calibrat", "discriminator", "high-yield", leftover HTML tags and entities, TODO/FIXME/placeholder/lorem markers, and every bracketed `[...]` span (classified manually).

Raw counts across data/: `**` = 0, backtick = 0, any `*` = 0, `__` = 15, `[` = 1354.

Findings:

1. Every `__` occurrence is a fill-in-the-blank stem, not markdown emphasis: imat_mock2 q21 ("produced by the __ and stored in the __"), imat_mock2 q33, imat_mock3 q34, imat_mock5 q34 (equation balancing "Balance: __ Al + __ O2 ..."), imat_mock5 q22 ("in the CNS by __ and in the PNS by __"), imat_mock8 q3 ("the __ time that Italy has hosted"). Legitimate content.
2. All bracketed spans are legitimate: chemistry concentrations ([H+], [OH-], [A-], [B] in imat_mock7 q45), a quotation editorial bracket ([having] in GK_Drill_100 q38, quoting the Nobel citation), math grouping. Zero meta-style brackets such as "[Geometry" remain. The tags the build report says were removed (e.g. "[Geometry/solid - H (formula recall, as in 2024)]", "[Set theory - M (new entrant from 2025)]") are confirmed absent from the shipped data.
3. "trap" language appears only in exp fields (post-submit, review route): imat_mock5 q46, imat_mock6 q5/q9/q41, imat_mock7 q6/q35/q48, imat_mock8 q6/q51, Repair_Drill_1 q40/q46/q70. This is pedagogical explanation text ("(C is the trap for using Celsius...)"), not calibration metadata. Acceptable; flagged for awareness.
4. No HTML tags, entities, TODO/FIXME, or placeholder text anywhere.

Result: PASS for pre-submit fields (stem, options). No pipeline scrub residue found.

## AL-6: correct vs distractor option length (KNOWN CONTENT ISSUE, re-verified and ranked)

Mean option character length, correct vs distractors, plus the sharper tell: fraction of questions where the correct option is the longest.

| Exam | mean correct | mean distractor | diff | correct longest | correct shortest |
|---|---|---|---|---|---|
| GK_Drill_100 | 42.4 | 24.2 | +18.2 | 54% | 4% |
| imat_mock8 | 37.8 | 21.1 | +16.7 | 38% | 2% |
| imat_mock5 | 24.3 | 12.3 | +12.0 | 42% | 0% |
| imat_mock7 | 27.2 | 17.9 | +9.3 | 28% | 0% |
| imat_mock6 | 25.5 | 18.4 | +7.1 | 30% | 7% |
| imat_mock2 | 18.4 | 11.6 | +6.8 | 27% | 2% |
| imat_mock3 | 15.7 | 10.0 | +5.7 | 27% | 3% |
| imat_mock4 | 16.9 | 12.2 | +4.7 | 30% | 2% |
| imat_mock1 | 18.3 | 14.3 | +4.0 | 23% | 7% |
| Repair_Drill_1 | 28.9 | 25.6 | +3.4 | 14% | 10% |

Baseline for a balanced paper: about 20% longest and 20% shortest. Worst offenders, with examples:

1. GK_Drill_100: "always pick the longest" scores 54% vs 20% chance. Examples: q51 (correct 124 chars vs longest distractor 49), q28 (correct qualifies "the EU's executive arm: it proposes legislation and guards the treaties, with one member per member state." vs short distractors), q50 (correct 59 chars longer than the longest distractor).
2. imat_mock8: q57 correct option is +92 chars vs the longest distractor; q24 +64; q2 +55.
3. imat_mock5: q15 +66 ("The sarcomere shortens, but the filaments themselves do not change length (they slide past each other)."), q42 +60, q5 +52.

Related tells checked and found clean:

- Hedge words (both/all/always/never/only/must/none): correct options are hedged LESS than distractors in every bank (e.g. mock8: 7% vs 13%). No signal.
- Capitalization: 60 questions have mixed first-letter case among options, but it is a heuristic artifact of numeric/symbol options ("0 mV" vs "+2"); the answer sits in the minority style only 15% of the time (below the 50% random baseline). No signal.
- Option ending punctuation: 0 questions mix trailing punctuation styles.

Result: FAIL (content-level). Repair_Drill_1 and imat_mock1 are effectively clean; GK_Drill_100, imat_mock8 and imat_mock5 need distractors lengthened or correct options shortened.

## Numeric options display ascending

Runtime check (what the exam actually uses): for all 157 questions where `numericOrder` parses all five options as one quantity, `computePermMap` displays them ascending: 157/157, zero violations. Spot-checked 10 across banks (e.g. imat_mock2 q35: displayed values 5, 12.5, 25, 50, 100 mL; imat_mock3 q56: 2, 3, 6, 9, 18 ohms with the answer moving from raw E to displayed A; imat_mock4 q35: superscript scientific notation 1.2e24 > 9.03e23 handled correctly). The static `perm` arrays stored in the bank JSON agree with the runtime order (157/157 ascending) and are valid permutations; note the runtime never reads `q.perm`, it recomputes per attempt.

Result: PASS.

## Non-numeric order-sensitive questions

All 14 stems mentioning order/sequence were reviewed (list: imat_mock1 q9, imat_mock3 q2/q15/q25, imat_mock4 q4/q17/q32, imat_mock5 q32, imat_mock6 q1/q8, imat_mock7 q9, imat_mock8 q25, Repair_Drill_1 q12/q14). Every true sequence question offers whole-sequence options (each option is one complete candidate ordering, e.g. imat_mock3 q25 mitosis phases, imat_mock8 q25 reflex arc), which are shuffle-safe by construction. No question has options that are individual steps referencing each other by position words. Numeric "next term" sequence questions are handled by the numeric ascending rule or identity order, both fine.

Result: PASS.

## Options referencing other options (shuffle safety)

Scanned stems and options for: "option [A-E]", "[both|all|none] ... [A-E] (and|,|or) [A-E]", "of the above", "all/none of these", Roman-numeral and digit statement references, bare "[A-E] and [A-E]". Findings:

- Zero questions require `perm: null`. Every hit is legitimate content: imat_mock1 q4 is a seating puzzle whose options are statements about friends named A-E (independent statements, safe to shuffle); mock7 q34's "none of these reactions occurs spontaneously" refers to reactions listed in the other options, which remain present in any order; "both" hits ("both plant and animal cells", "in both processes") refer to stem content.
- Consistent with this, `shuffleSafe: false` is set on 0 questions in all banks, and `shuffleUnsafeReason` (core.js:69-77) fires on none of them.

Result: PASS for the shipped corpus. Note: safety currently rests entirely on the runtime regex plus the (unused at runtime) `shuffleSafe` flag; a future bank edit could introduce an unsafe question silently. Recommend the pipeline keep flagging (tools/audit_banks.py does not currently enforce "xref implies perm null" either).

## Duplicate options

Exact duplicate check (whitespace-collapsed) and visual-canonical check (unifying unicode minus U+2212 vs hyphen, curly quotes, dashes): 0 duplicate option pairs across all 670 questions. An earlier loose normalization produced dozens of false hits (inequality options like "x < -6" vs "x > -6", mirrored direction options "Matrix to intermembrane space" vs "Cytosol to matrix", sequence options that permute the same words); all were confirmed distinct on exact comparison.

Result: PASS.

## Synonym pairs

Near-identical option pairs (Levenshtein >= 0.90, length >= 12) were reviewed: every pair is an intentional minimal-pair discriminator (DNA vs RNA polymerase, G1 vs G2 checkpoint, +111 vs -111 kJ/mol, 1-bromopropane vs 2-bromopropane, metaphase I vs II, the 2x2 grid in Repair_Drill_1 q64, year options in GK_Drill_100 q32). No pair is semantically equivalent, and no ambiguous synonym is keyed.

Result: PASS.

## Explanations

0 empty. 2 terse outliers: imat_mock2 q49 exp "(x-2)(x-3) = 0." (2 words, still factually complete) and imat_mock3 q25 exp "PMAT." (1 word, a mnemonic). Everything else is substantive.

## Bank sanity

All banks: question numbers contiguous with no duplicates, exactly 5 non-empty options per question, `ans` in A-E, stored perms valid permutations.

---

## Final issue list (ordered by severity)

1. HIGH, content (AL-6): correct-option length tell. GK_Drill_100 worst (correct mean 42.4 vs 24.2 chars; correct is longest in 54% of questions, shortest in 4%): picking the longest option scores ~2.7x chance. Then imat_mock8 (+16.7 chars, 38% longest; worst single question q57, +92 chars), imat_mock5 (+12.0, 42%; q15 +66, q42 +60), imat_mock7 (+9.3, 28%), imat_mock6 (+7.1, 30%). Fix by lengthening distractors or trimming qualifiers from correct options, starting with GK_Drill_100.
2. MEDIUM, review-only (AL-3 advisory): reviewing an imported legacy result or a manually/aggregate-logged attempt shows options in raw order with raw keys, exposing the legacy skew (mock2: B 29/60, E 0/60; mocks 1-5 all have E <= 3). Code paths: js/legacy.js:44-82 and 86-106, js/view-history.js:188-202, js/view-review.js:90. Live exams are unaffected.
3. LOW, data: pre-submit subject tags inside stems, q3 of every mock: "(General knowledge)" (imat_mock1 q3, imat_mock6 q3, imat_mock7 q3, imat_mock8 q3) vs "(GK)" (imat_mock2 q3, imat_mock3 q3, imat_mock4 q3, imat_mock5 q3). Visible during the exam and inconsistent in format.
4. LOW, metadata: calibration/composition-flavored exam titles visible on Home and History: imat_mock2 "Bioenergetics Spine", imat_mock3 "Genetics & Molecular Rotation", imat_mock4 "Calculation Spine", imat_mock5 "The Discriminator", imat_mock6 "At-Level Calibration", Repair_Drill_1 "Repeat Offenders".
5. INFO, architectural: the full bank JSON (including ans, exp, topic, lik) is fetched to the client pre-submit and precached offline by sw.js (PRECACHE lists all data/*.json); the gate password is client-side ("imat2026" in config.js, self-described as "a deterrent, not security"). All UI-level invariants above hold, but anyone with DevTools can read answers directly. Inherent to client-side grading; document or accept.
6. INFO, robustness: view-exam.js does not re-check `attempt.bankVersion` against `bank.bankVersion` on resume; if a bank is regenerated between sessions, a resumed attempt would pair stale perm indices with new option arrays. Not currently triggered.
7. INFO, content: two terse explanations, imat_mock2 q49 and imat_mock3 q25 ("PMAT.").
8. INFO, process: 0 questions carry `shuffleSafe: false`; shuffle safety for the whole corpus depends on the core.js regex alone. Current corpus verified safe, but add a pipeline gate ("cross-reference found implies perm null") before future banks are added.

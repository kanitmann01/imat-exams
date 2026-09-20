# Duplicate and quality audit: new hard banks (audit only, nothing was modified)

Date: 2026-09-20. Auditor: independent duplicate/quality pass.

Scope audited:
- `bank_bio_hard.json` (130 Q), `bank_chem_hard.json` (65 Q), `bank_mpl_hard.json` (95 Q), `imat_mock9.json` (60 Q), total 350 Q.
- Compared against each other and against the full existing corpus (670 Q): `imat_mock1.json`..`imat_mock8.json`, `GK_Drill_100.json`, `Repair_Drill_1.json`.

Method: Python shingle script (`audit_dedup.py`, same folder) over normalized stem+options (lowercased, whitespace collapsed, digits masked), word 4-gram Jaccard with threshold 0.55 plus a template pass (first 9 stem words with digits masked) and a containment pass (0.62) for paraphrases. Every flagged pair was read in full; keyword probes (clock, bag, dice, coin, log, dilut, Meselson, PCR, Hardy, nondisjunction, kWh, ticket, recast, inscribed, truth-teller, and others) were run over the old corpus to catch same-setup twins that paraphrase below the text threshold. Explanation quality and difficulty were judged by reading all 350 explanations plus the key, and by recomputing the error-prone numeric answers (mpl#1, #9, #22, #41, chem#31, mock9#34, #44, #45, #48): all recomputations agree with the stored keys.

Severity used here: P0 = real duplicate/near-duplicate (including template twins where only numbers differ, since a candidate notices those). P1 = same-setup twin with a changed event/skill, or a difficulty mislabel, or a weak-but-passable exp. P2 = format/tag nits and family-density notes.

Overall: explanation quality is uniformly good. No empty exps (min length 122 chars), no exp shorter than 60 chars, every exp read justifies the key and names the intended distractor trap, and no exp contradicts its key (spot-recomputation of 9 multi-step numeric items all matched). No exact duplicate exp strings or option strings anywhere in the new banks. The one systematic weakness is recycled setups, mostly in maths/physics/chem and mostly against the existing mocks.

## Findings

| bank | n (and n of twin) | severity | issue | suggested fix |
|---|---|---|---|---|
| bank_mpl_hard vs imat_mock7 (existing corpus) | 30 vs 51 | P0 | Verbatim-equivalent duplicate: mock7#51 "Two fair dice are rolled. What is the probability of getting at least one six?" (ans 11/36) vs mpl#30 "Two fair six-sided dice are rolled. What is the probability that at least one of them shows a six?" (ans D 11/36). Same event, same complement method, same answer. The audience has already answered this question. | Replace mpl#30 with a different event (exactly one six, sum at least 10, or a 3-dice variant) or drop it. |
| bank_mpl_hard vs imat_mock9 | 1 vs 48 | P0 | Near-duplicate across the two new releases: both give log(2)=0.30 and log(3)=0.48 and ask for a value built from them (log 7.5 vs log 2.4); same skill, same given data, both H, both keyed C. | Change the givens in one item (e.g. give log 5 and log 3) or re-skill one to a different log property family. |
| bank_mpl_hard vs imat_mock6 (existing corpus) | 3 vs 50 | P0 | Number-swap twin: "What is the value of log_9 27?" vs mock6#50 "What is the value of log_3 81?". Identical one-line template, only the numbers differ; both are single-fact log evaluation. | Replace mpl#3 with a non-trivial evaluation (e.g. log_2 of 1/8, or log_8 16) or drop. |
| imat_mock9 vs imat_mock6 (existing corpus) | 37 vs 36 | P0 | Number-swap twin: tenfold dilution of a fully ionised strong acid raises pH by exactly 1 (mock9#37: pH 4 to 5; mock6#36: pH 3 to 4). Same setup, same trap, only the numbers differ. | Re-skill mock9#37 to a target-pH volume-ratio task or use a non-tenfold factor (e.g. 20-fold) so the step is not a memorised "+1 per tenfold". |
| bank_chem_hard (within bank) | 27 vs 35 | P0 | Twin with an identical stem skeleton: "What volume of water must be added to [25/20] cm3 of ... mol/dm3 ...", both answer V(final) minus V(initial), and both carry the same trap (forgetting the initial volume already occupies part of the final). #35 only prepends a pH-to-concentration step. | Keep #35 (richer), and change #27 to the inverse direction (given water added, find final concentration) or a different vessel setup. |
| bank_chem_hard (within bank) | 32 vs 33 | P0 | Back-to-back twins: identical template "Pure water is [heated/cooled] ..., Kw ..., pH is [6.5/7.27]. Which statement is correct?", same concept (neutral water has pH not 7 when Kw shifts), mirrored distractor logic. | Keep one; replace the other with a different Kw application (e.g. compute [H+] at the shifted Kw, or a Kw + mixing item). |
| bank_mpl_hard vs imat_mock9 | 69 vs 57 | P1 | Same circuit skeleton in both new banks: series resistor plus a 6.0 ohm parallel 3.0 ohm pair, find a current (mpl#69 12 V/2.0 ohm; mock9#57 24 V/8.0 ohm). mpl#68 and #70 also reuse the same 6/3 pair, so the pair appears in 3 of the new items. | Change the parallel pair in mock9#57 (e.g. 12/4) or give the battery an internal resistance; diversify mpl#68-70 values. |
| bank_mpl_hard (within bank) | 60 vs 61 | P1 | Same skill and setup twice: submerged fraction equals density ratio. #60 (P half, Q quarter submerged in oil) and #61 (fX/fY for densities 500/750) both reduce to f = rho_block/rho_fluid. | Replace #61 with an apparent-weight or overflow-displacement variant of floating. |
| bank_bio_hard (within bank) | 39 vs 40 | P1 | Same experiment twice in consecutive items: Meselson-Stahl 15N-to-14N. #39 asks the labelled fraction after 3 generations, #40 asks which model one intermediate band after 1 round excludes. Same setup, same topic tag family. | Keep one; convert the other to a density-gradient readout after 2 generations for dispersive, or a 14N-to-15N reverse shift. |
| bank_mpl_hard vs imat_mock9 | 34 vs 51 | P1 | Same setup in both new banks: bag with red and blue balls, two drawn without replacement (4R/6B ask P(at least one red) vs 3R/5B ask P(same colour)). Asked event differs, but the stem's first sentence is identical word for word apart from the counts. | Change one container scenario (cards, or three colours) or move one item to with-replacement. |
| bank_mpl_hard vs imat_mock9 | 21 vs 54 | P1 | Clock-angle twin (3:40 vs 9:36, same 0.5 deg/min hint text). Recycling is aggravated: the existing corpus already contains 9 clock-angle items (one in every mock plus Repair#70), so the audience has seen this setup 11 times once these ship. | Drop mock9#54; keep mpl#21 only if wanted (mpl#22 is a genuinely harder variant worth keeping). |
| bank_mpl_hard vs existing corpus (mock3#54, mock6#51) | 33 vs 54, 51 | P1 | Third run of "probability of at least one head" with N coins: old corpus used 2 coins (mock3) and 3 coins (mock6); mpl#33 is the same skill with 4 coins. | Replace with P(exactly two heads) or a biased-coin item so the skill is not a third repetition. |
| bank_chem_hard | 10 | P1 | Difficulty mislabel: H item is single-fact identification (butan-2-one is the ketone with 4 carbons); one textbook-line recognition step. | Relabel to M, or add a constraint that forces multi-step reasoning (e.g. also require a specific degree of unsaturation). |
| bank_bio_hard | 128 | P1 | Difficulty mislabel: H item is a single textbook fact (ATP binding detaches myosin; hydrolysis re-cocks the head). | Relabel to M, or convert to a scenario (drug that blocks ATP binding vs hydrolysis, asking which step fails). |
| bank_bio_hard | 45 | P1 | Difficulty mislabel: H frameshift item supplies the full codon table, so the answer is mechanical regrouping; no recall or inference needed. | Relabel to M, or omit the codon assignments for the shifted frame so the candidate must reason about the frame, not decode it. |
| bank_mpl_hard | 40 | P1 | Difficulty mislabel: M item "What is the value of 1/2 + 1/3 - 1/6?" is primary-school arithmetic, well below every other M in the set. | Replace (e.g. a fraction-of-remainder chain) or drop; not worthy of a hard-bank slot even at M. |
| all four banks | n/a | P2 | Topic domain prefixes are inconsistent across the new set: mock9 uses "Chem", "Maths", "Physics", "Logic & reasoning"; mpl uses "Algebra", "Geometry", "Probability", "Logic", "Physics"; bio uses "Chemistry of life". The same subtopic ("clock angles") sits under Geometry in mpl and Maths in mock9. All 350 tags do have the correct "Domain · subtopic" form (no missing separator, no malformed tag). | Agree one domain vocabulary (e.g. Maths, Physics, Chemistry, Biology, Logic) and normalize prefixes before merging. |
| bank_mpl_hard | 29, 30, 31, 32 | P2 | Four dice-probability items share the identical opener "Two fair six-sided dice are rolled"; #32's event is the union of #30's event (already flagged P0) with sum-7 (mock5#54 in the old corpus). Individually sound, but the family is dense. | After fixing #30, vary one or two contexts (spinner, urn, cards). |
| bank_bio_hard, imat_mock9 | 51, 55, 56, 57; 17 | P2 | Nondisjunction is heavily mined: 5 new items (mitotic, three spermatocyte counts, one oocyte) on top of 4 existing ones (mock7#23, Repair#21/22, GK). Each item is individually correct and distinct in ask. | Acceptable now; trim to 3 if a later revision removes any bio items. |
| bank_mpl_hard | 37 | P2 | Third km/h-to-m/s conversion in the corpus (after Repair#54/#55), though here embedded in a multi-step train problem. | Keep, or fold the conversion into an already-harder item. |
| bank_mpl_hard vs imat_mock9 | 41 vs 55 | P2 | Same setup family: "velocity of a trolley recorded every 2 s" table with different asks (mpl#41 acceleration statements; mock9#55 acceleration magnitude in one interval). | Fine to keep; vary the sampling interval in a later pass. |
| bank_bio_hard vs Repair_Drill_1 (existing) | 24 vs 29 | P2 | RBC-in-isotonic-saline family reused (Repair#29: 0.9% saline drip; bio#24: 150 mmol/dm3 NaCl, dissociation trap). Different numbers and framing. | Keep; the dissociation trap is a genuinely different skill. |
| bank_mpl_hard | 26, 65; 19; 23 | P2 | Borderline difficulty nits: #26 (slope from two points) and #65 (kWh to MJ) are very easy M one-liners; #19 (equilateral triangle area) is a formula plug-in at H; #23 (tan 30 x tan 60) is a two-value recall M. All passable. | If space allows, upgrade #26/#65 stems with one extra step; otherwise leave. |

False positives dropped (reviewed, not real duplicates): mpl#10 vs mpl#40 ("27^(2/3)+16^(3/4)" vs "1/2+1/3-1/6", sim 1.00 was an artifact of stopword-only shingles on very short stems; different skills; #40 kept only as a difficulty finding), mpl#24 vs mpl#25 (different trig skills), mpl#6 vs mpl#8 (shared "solution set of the inequality" opener, different sub-skills), mpl#2 vs mock4#50 (sum-of-logs equation, shifted argument and different base, acceptable variation), all "overlap=0 explanation" flags (numeric distractor references are not words; every flagged exp was read and cites distractor traps).

## Appendix: raw similarity output (top list from the script, plus keyword-verified additions)

Script raw result at threshold: strong text-similarity pairs (Jaccard > 0.55 with the short-stem guard): 0. Borderline band (0.38 to 0.55): 0. Template-identical stems (first 9 words, digits masked): 9, listed below. Because paraphrased twins score below any text threshold, the second block lists the pairs confirmed by full manual reading and keyword probes, with their scores under the digit-masking metric.

| # | pair | full sim | stem sim | template | verdict |
|---|---|---|---|---|---|
| 1 | bank_mpl_hard#34 vs imat_mock9#51 | 0.56 | 0.56 | yes | twin, P1 (bag without replacement) |
| 2 | bank_mpl_hard#21 vs imat_mock9#54 | 0.33 | 0.40 | yes | twin, P1 (clock angle) |
| 3 | bank_mpl_hard#30 vs bank_mpl_hard#31 | 0.00 | 0.25 | yes (shared opener) | family note, P2 |
| 4 | bank_mpl_hard#31 vs bank_mpl_hard#32 | 0.00 | 0.23 | yes (shared opener) | family note, P2 |
| 5 | bank_mpl_hard#30 vs bank_mpl_hard#32 | 0.00 | 0.21 | yes (shared opener) | family note, P2 |
| 6 | bank_chem_hard#27 vs bank_chem_hard#35 | 0.18 | 0.20 | yes | twin, P0 (dilution) |
| 7 | bank_mpl_hard#1 vs imat_mock9#48 | 0.00 (short stem) | 0.00 | yes (manual confirm) | near-duplicate, P0 (same given logs) |
| 8 | bank_mpl_hard#3 vs imat_mock6#50 | 0.00 (short stem) | 0.00 | yes (manual confirm) | number-swap twin, P0 |
| 9 | bank_mpl_hard#6 vs bank_mpl_hard#8 | 0.00 (short stem) | 0.00 | yes | false positive (different sub-skills) |
| 10 | bank_mpl_hard#30 vs imat_mock7#51 (existing) | n/a (paraphrase) | n/a | keyword-verified | true duplicate, P0 (same event, same answer 11/36) |
| 11 | imat_mock9#37 vs imat_mock6#36 (existing) | 0.00 (numbers masked) | 0.00 | keyword-verified | number-swap twin, P0 (tenfold dilution pH) |
| 12 | bank_chem_hard#32 vs bank_chem_hard#33 | 0.00 (numbers masked) | 0.00 | manual confirm | template twin, P0 (Kw vs temperature) |
| 13 | bank_mpl_hard#69 vs imat_mock9#57 | 0.04 | 0.04 | manual confirm | twin, P1 (series + 6//3 circuit) |
| 14 | bank_mpl_hard#60 vs bank_mpl_hard#61 | 0.01 | 0.02 | manual confirm | twin, P1 (floating fraction) |
| 15 | bank_bio_hard#39 vs bank_bio_hard#40 | 0.00 (long differing tails) | 0.00 | manual confirm | twin, P1 (Meselson-Stahl) |
| 16 | bank_mpl_hard#33 vs imat_mock3#54 (existing) | 0.00 (numbers masked) | 0.00 | keyword-verified | twin, P1 (2 coins vs 4 coins) |
| 17 | bank_mpl_hard#33 vs imat_mock6#51 (existing) | 0.00 (numbers masked) | 0.00 | keyword-verified | twin, P1 (3 coins vs 4 coins) |
| 18 | bank_mpl_hard#41 vs imat_mock9#55 | 0.13 | 0.12 | manual confirm | family note, P2 (v-t table) |
| 19 | bank_chem_hard#32 vs imat_mock9#36 | 0.00 (numbers masked) | 0.00 | manual confirm | cross-bank third Kw item, P2 |
| 20 | bank_mpl_hard#10 vs bank_mpl_hard#40 | 1.00 (artifact, stems under 12 content tokens) | 1.00 | no | false positive (different skills) |

## Summary

1. 23 findings: 6 P0, 10 P1, 7 P2. 8 twin pairs span two different files, of which 1 is a true verbatim-equivalent duplicate (mpl#30 vs mock7#51, same dice question and same answer already in the existing corpus) and 4 are number-swap twins (mpl#1/mock9#48, mpl#3/mock6#50, mock9#37/mock6#36, chem#27/35).
2. Explanations are clean across all 350 questions: none empty, none under 40 chars, all justify the key via distractor analysis, none contradict the key (9 multi-step numeric answers independently recomputed, all correct).
3. Difficulty mix is on target (61 to 65 percent H per bank) and explanations carry real teaching value, but 4 labels need adjustment (chem#10, bio#128, bio#45 H-to-M; mpl#40 replace) and the maths/physics sections lean on setups the audience has already seen (clock angles 11x, dice, coins, tenfold dilution).
4. Topic tags: all 350 are well-formed "Domain · subtopic"; only cross-bank vocabulary inconsistency remains (Chem vs Chemistry, Maths vs Geometry/Algebra, Logic vs Logic & reasoning).

Verdict: fix-then-ship. Replace or re-skill the 6 P0 items (one true duplicate, five near-duplicates/twins), apply the 4 difficulty relabels, and normalize domain prefixes; everything else can ship as is.

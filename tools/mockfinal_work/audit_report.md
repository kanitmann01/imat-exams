# Independent Audit: imat_mock10 and imat_mock11

Auditor: independent examiner, text-based review, 2026-09-26.
Targets: `data/imat_mock10.json`, `data/imat_mock11.json` (60 items each).
References: `tools/mockfinal_work/paper_2023.txt` (NOTE: this file is mojibake, font-encoding corrupted; 2023 overlap checking was therefore limited and the 2023 file should be re-extracted), `paper_2024.txt`, `paper_2025.txt`, and all 15 existing banks in `data/`.

Method: every one of the 120 items was re-derived independently (all numeric items recomputed from the given data; every logic puzzle checked for uniqueness of solution and for distractors satisfying the constraints). Keys were also mechanically checked (ans letter maps to the intended option in all 120 items; 5 options per item; numbering 1-60 contiguous; section fields correct).

---

## 1. Summary verdicts

| Paper | Verdict | Rationale |
|---|---|---|
| imat_mock10 | **PASS WITH FIXES** | Zero wrong keys, all 120 numerics recompute correctly, structure and section mix match the 2025 census exactly. But 3 items are near-copies of the real 2025 paper (Q9, Q33, Q50) and must be replaced before the student sees the paper; plus 1 borderline 2025-template item (Q55) and a handful of P2/P3 quality items. |
| imat_mock11 | **PASS WITH FIXES** | Zero wrong keys, all numerics recompute correctly, logic puzzles unique, structure faithful. No 2025 near-copies. But one census deviation (chemistry has 0 biomolecule items vs target 1-2), one insultingly easy clock item, and a cluster of near-verbatim copies of existing bank items (Q37, Q50, Q46, Q34, and others) that will deflate calibration if left. |

Key facts: all 120 stored answers are CORRECT. No ambiguity was found in any stem. No all/none-of-the-above options, no em dashes, no markdown, British spelling consistent within each paper (sulfur/haemoglobin/colour/-ise used consistently).

---

## 2. Itemised issue list

Severity: P1 = must fix (wrong key, ambiguity, 2025-paper near-copy). P2 = should fix (weak distractor, fidelity drift, near-verbatim bank copy, explanation gap, wrong difficulty). P3 = nice to have.

### imat_mock10

| # | Q | Sev | Problem | Suggested fix |
|---|---|---|---|---|
| 1 | 9 | P1 | Near-copy of real 2025 Q9. 2025: "an analogue clock is showing exactly 3:00 PM. After the minute hand has completed 1.75 full rotations..." This item: "an analogue clock shows exactly 7:15. After the minute hand completes 2.5 full rotations..." Same question template, near-identical wording, only the time and rotation count changed. The student has seen 2025 with its answer; she will pattern-match instantly and the item measures memory, not reasoning. | Replace with a different clock task: e.g. angle between hands at a non-round time (matching the bank's 7:35-style items), "after how many full rotations will the hands coincide again", or an hour-hand-rotation variant. Keep the census slot (clock item) but change the underlying task. |
| 2 | 33 | P1 | Near-copy of real 2025 Q39. 2025: weak acid Ka = 1.0e-5, C = 0.001 M, pH 4. This item: the SAME Ka = 1.0e-5, only the concentration changed to 0.01 mol/dm3, pH 3.5. Same stem sentence structure, same tested calculation. Also the explanation misstates a distractor (see Q33 exp note below). | Either change the task (e.g. dilute the acid tenfold and ask the new pH, or give a strong-base/weak-acid neutralisation), or keep weak-acid pH but with a different Ka and an added step so the 2025 answer cannot transfer. Then fix the explanation per issue 3. |
| 3 | 33 | P3 | Explanation says "The value 3.0 comes from treating the acid as fully dissociated"; full dissociation of 0.01 M gives pH 2.0, and 2.0 is itself an option. The attribution is wrong. | After reworking the item, rewrite the distractor notes so each named option matches a real error. |
| 4 | 50 | P1 | Near-copy of real 2025 Q54. 2025: "(a + 3)x = 5, which value of a is impossible? a = -3". This item: "(a - 2)x = 5 has exactly one solution when: a != 2". Same parametric-linear template with only the constant flipped; the 2025 answer (a = -3) directly cues a = 2 here. | Replace with a genuinely different parametric item (e.g. "kx = k + x has exactly one solution for which k?") or swap in a different algebra topic entirely (exponents, an identity), since the 2025 paper already carried TWO items of this exact template (Q53 and Q54). |
| 5 | 55 | P2 | Same chase/overtake template as real 2025 Q55 (two vehicles, fixed gap, constant speeds, "after one minute / after 15 minutes: overtaken / not yet / exactly level / never / much later"). The numbers were chosen so the verdict differs (exactly level vs overtaken), which saves it from P1, but the option list is nearly the real one and recognition helps. | Change the head start to 2 km (answer becomes "not yet reached") or convert to a different closing-gap framing; at minimum keep as is and accept, since computation is unavoidable. |
| 6 | 17 | P2 | Near-verbatim copy of imat_mock1 Q21 ("involuntary, striated, branched cells, intercalated discs" -> cardiac muscle). Attribute order shuffled only. | Change the asked feature (e.g. "which structure distinguishes cardiac from skeletal muscle: intercalated discs") or change the distractor set so the recall trace does not transfer. |
| 7 | 12 | P2 | Same question as Repair_Drill_1 Q1 and imat_mock1 Q10 (site of the Krebs cycle enzymes), and the same fact as real 2024 Q12. Fourth repetition the student may already have seen. | Acceptable high-yield fact, but if a swap is wanted: mitochondrial cristae/ETC localization or peroxisome function are untested here. Otherwise keep and accept. |
| 8 | 28 | P2 | Same question as imat_mock1 Q15 (where are secretory proteins synthesised -> rER). | Same treatment as Q12: keep or vary the asked detail (signal sequence vs organelle). |
| 9 | 29 | P2 | Same question as imat_mock1 Q16 (Golgi modifies, sorts, packages). | Keep or vary; low harm. |
| 10 | 39 | P2 | Same question as imat_mock2 Q43 (functional group of aldehydes -> -CHO). | Swap the tested group (e.g. carboxyl vs ester distinction) or keep and accept. |
| 11 | 9 | P3 | Options not in ascending time order (8:05, 9:15, 9:45, 10:45, 7:40). Real papers sometimes scramble, but the bank convention is ascending numeric options. | Sort: 7:40, 8:05, 9:15, 9:45, 10:45 (after reworking the item). |
| 12 | 9 | P3 | Explanation misattributes distractors: "9:15 counts only the two full rotations" (true, 7:15 + 2 h), but "8:05 counts only the half rotation" is wrong, 7:15 + 30 min = 7:45, not 8:05. | Rewrite the distractor notes (moot if the item is replaced). |
| 13 | 20 | P3 | Distractor "an allosteric site" is not a molecule, so it is eliminable by grammar alone ("a small organic non-protein molecule... is called: an allosteric site"). | Replace with "a prosthetic group" or "an activator", which are grammatically parallel and knowledge-testing. |
| 14 | 50 | P3 | Option E ("it has one solution for no value of a") breaks the parallel "a ..." form of the other four options and is much longer. | Reword to "for no value of a" so all five options match. |
| 15 | 36 | P3 | Electronegativity values are not supplied; the parallel bank item (mock7 Q35) supplies them. Qualitative ordering (O > Cl > N > H > C) is standard IMAT knowledge, so this is a judgment call, not an error. | Optionally add "(electronegativities: C 2.6, N 3.0, O 3.4, Cl 3.2, H 2.2)" to remove any fairness doubt. |

### imat_mock11

| # | Q | Sev | Problem | Suggested fix |
|---|---|---|---|---|
| 16 | Section C | P2 | Fidelity drift: chemistry has 0 biomolecule items against the target census of 1-2, because organic took two slots (Q39 alcohol isomers, Q40 hydroxyl group). Mock10 has the biomolecule slot filled (carbohydrates); mock11 does not. | Convert Q40 into a biomolecule item (e.g. "the bond joining two amino acids in a protein" or "which elements are characteristic of proteins"), keeping the functional-group skill but on a biomolecule, and leave Q39 as the single organic item. |
| 17 | 9 | P2 | Difficulty far below real level: angle between hands at exactly 3:00 is 90 degrees by inspection, a free point. The real 2025 clock analogue required computing 1.75 minute-hand rotations. The bank's other nine clock items all use non-round times (7:35, 9:18, 12:30...). This item would flatter the calibration. | Use a non-round time (e.g. 9:31 or 6:42, requiring hour-hand drift), or replace with a "when do the hands first overlap after 4:00" item. |
| 18 | 50 | P2 | Near-copy of imat_mock8 Q9 with ONLY the subjects renamed: "class of 30 students, 18 study biology, 15 study chemistry, 8 study both" vs "30 students, 18 study French, 15 study German, 8 study both". Identical numbers, identical answer (5). The student will recall the answer, not do inclusion-exclusion. | Change the numbers (e.g. 40 students, 25 French, 12 German, 9 both -> neither = 12) so the memorised answer fails. |
| 19 | 37 | P2 | Verbatim duplicate of imat_mock2 Q34 AND Repair_Drill_1 Q32 (oxidation number of Mn in KMnO4 = +7). Twice-seen exact item. | Swap species: e.g. ON of P in H3PO4 (+5) or of S in Na2SO3 (+4) (avoid Cr2O7^2-, also used in bank mock4 Q37, and Cl oxoacids, used in real 2025 Q34). |
| 20 | 46 | P2 | Near-verbatim copy of bank_chem_hard Q65 and imat_mock1 Q46 (heating increases rate mainly because a much larger fraction of collisions exceeds Ea). | Reframe: give a concrete rate increase (e.g. rate triples for +10 K) and ask what this implies, or ask which factor does NOT change with temperature. |
| 21 | 34 | P2 | Near-duplicate of bank_chem_hard Q32 (pure water heated, Kw rises, still neutral). Same scenario, same key idea, options reworded. Third run at the same concept in the visible banks. | Add a numeric twist: give Kw at 80 C and ask for the pH of pure water (about 6.5, still neutral), which forces the calculation the conceptual item lets her skip. |
| 22 | 23 | P2 | Same question as imat_mock2 Q23 (where filtration occurs -> glomerulus/Bowman's capsule), options renamed only. | Vary: ask which process happens at the proximal tubule, or which structure is NOT part of the filtrate pathway. |
| 23 | 10 | P2 | Same question as imat_mock1 Q12 (final electron acceptor -> oxygen). | Since the paper's respiration block is otherwise strong, swap for a less-drilled respiration fact (e.g. where glycolysis's NADH is reoxidised anaerobically) or accept as high-yield. |
| 24 | 15 | P2 | Same question as imat_mock1 Q24 (how most O2 is carried -> bound to haemoglobin in RBCs). | Same reasoning as Q23; consider swapping to the O2/CO2 binding-site distinction (heme iron vs globin), which the bank only has in harder form. |
| 25 | 21 | P2 | Near-copy of Repair_Drill_1 Q13 (bile assists fat digestion by emulsifying) and the same fact as bank_bio_hard Q93. | Keep or vary (e.g. ask what bile does NOT contain and why digestion still works); low harm. |
| 26 | 30 | P2 | Same question as imat_mock3 Q20 (Aa x Aa phenotypic ratio 3:1), letters swapped. | Combine with a twist (e.g. ask the genotypic ratio vs phenotypic distinction, already the distractor logic here) or accept. |
| 27 | 32 | P2 | Same question as imat_mock3 Q16 (anticodon found on -> tRNA), and the same fact as real 2024 Q21. | Since this is the paper's translation hedge, keep, but vary: e.g. "during elongation, the codon-anticodon pairing occurs in which order of events". |
| 28 | 59 | P2 | Same question as imat_mock2 Q60 (astronaut weight on the Moon = 1/6, mass unchanged). | Accept as high-yield, or change the fraction (g on Mars ~ 0.4 g) to force fresh reasoning. |
| 29 | 4 | P3 | Third reading passage in the bank family on antibiotic resistance selection (imat_mock2 Q1, imat_mock7 Q1), same tested claim. Harmless for validity (the answer is inferable from the passage) but the theme is stale for this student. | Keep (genres must match the census; the biomedical slot is well served), or choose a different biomedical passage next time. |
| 30 | 3 | P3 | The underlying fact (Galileo, four moons of Jupiter, 1610) is tested directly in GK_Drill_100 Q85. The reading item is answerable from the passage, so no unfair advantage, but the recognition shortcut exists. | Acceptable; note for score interpretation. |
| 31 | 13 | P3 | Same uncoupler scenario as bank_bio_hard Q123 (proton leak -> ETC speeds up, ATP falls), reworded options. A genuine two-step discriminator, so repetition is more defensible here. | Accept. |
| 32 | 31 | P3 | Explanation notation "(X X^c)" for the carrier mother is garbled (should be X^C X^c). Reasoning itself is correct. | Tidy the notation. |
| 33 | 39 | P3 | Stem wording "How many structural isomers are alcohols with the molecular formula C4H10O on an open carbon chain?" is slightly awkward, and the "open carbon chain" qualifier is redundant (cyclic alcohols with 4 C are C4H8O, not C4H10O). | Reword: "How many alcohols with molecular formula C4H10O exist as structural isomers?" |
| 34 | 28 | P3 | Options not in natural ascending order (2, 7.4, 5, 9, 12). | Reorder to 2, 5, 7.4, 9, 12 (or 2, 5, 9, 7.4... no: strictly 2, 5, 7.4, 9, 12). |
| 35 | 51 | P3 | Q51 (3x + 2y = 12, y = 3) is a one-step substitution, easier than anything in the real 2023-25 D sections. Deliberate given the student blanked the maths section, so acceptable, but it is the softest item in either paper. | Consider "if 3x + 2y = 12 and x = y, find x" (same one-step feel, no free value) if a slightly firmer item is wanted. |

### Shared / cross-paper

| # | Q | Sev | Problem | Suggested fix |
|---|---|---|---|---|
| 36 | m10 Q55 / 2025 Q55 | P2 | Covered as issue 5 above (chase template). | As issue 5. |
| 37 | tools/mockfinal_work/paper_2023.txt | P3 (process) | The 2023 reference file is mojibake (font-encoding corruption); overlap checking against 2023 was therefore limited to the fragments that are readable. | Re-extract the 2023 paper before the next audit round. Not a defect of the new papers. |

Items examined and explicitly CLEARED (no issue found): all 120 keys; mock10 Q1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 13, 14, 16, 18, 19, 21, 22, 23, 24, 25, 26, 27, 30, 31, 32, 34, 35, 36, 37, 38, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 52, 53, 54, 56, 57, 58, 59, 60; mock11 Q1, 2, 5, 6, 7, 8, 11, 14, 16, 17, 18, 19, 20, 22, 24, 25, 26, 27, 29, 33, 35, 36, 38, 40, 41, 42, 43, 44, 45, 47, 48, 49, 52, 53, 54, 55, 56, 57, 58, 60.

---

## 3. Fidelity count tables

Structure: both papers have 60 items, correct section boundaries (A 1-9, B 10-32, C 33-47, D 48-54, E 55-60), 100-minute duration, scoring metadata present.

### Section A (target: 4 reading in real genres + 5 logic, incl. ordering/assignment x2 and 1 clock)

| Slot | Target | mock10 actual | mock11 actual |
|---|---|---|---|
| Reading: medicine leaflet | 1 | 1 (Q1) | 1 (Q1) |
| Reading: science journalism | 1 | 1 (Q2) | 1 (Q2) |
| Reading: historical/cultural source | 1 | 1 (Q3, Marco Polo) | 1 (Q3, Galileo) |
| Reading: biomedical popular science | 1 | 1 (Q4) | 1 (Q4) |
| Logic: deducible/conditional | 2 | 2 (Q5 contrapositive, Q6 modus tollens) | 2 (Q5 contrapositive, Q6 chained modus tollens) |
| Logic: ordering or assignment puzzle | 2 | 2 (Q7 ordering, Q8 assignment) | 2 (Q7 floors, Q8 languages) |
| Logic: clock | 1 | 1 (Q9 rotations) | 1 (Q9 angle at 3:00, too easy, issue 17) |
| Total | 9 | 9 | 9 |

### Section B (target: sum 23; respiration/bioenergetics + gas transport capped at 7; muscle/histology 2-4; enzymes/digestion 2-3; organ systems 4-6; organelles 2-3; membrane transport 1-2; biomolecules 1-2; genetics/central dogma 1-3)

| Topic | Target | mock10 actual | mock11 actual |
|---|---|---|---|
| Respiration/bioenergetics + gas transport | max 7 | 7 (Q10-15 + Q32 ventilation) | 7 (Q10-16) |
| Muscle/histology | 2-4 | 3 (Q16-18) | 2 (Q17-18) |
| Enzymes/digestion | 2-3 | 3 (Q19-21) | 3 (Q19-21) |
| Organ systems | 4-6 | 4 (Q22-25) | 4 (Q22-25) |
| Organelles | 2-3 | 2 (Q28-29) | 2 (Q28-29) |
| Membrane transport | 1-2 | 1 (Q27) | 1 (Q27, fluid mosaic) |
| Biomolecules | 1-2 | 2 (Q26 glycosidic, Q30 triglyceride) | 1 (Q26 protein structure) |
| Genetics/central dogma | 1-3 | 1 (Q31) | 3 (Q30-32, the intended 2023/24 hedge) |
| Total | 23 | 23 | 23 |

### Section C (target: sum 15; acids/bases 2, bonding 2, redox 2, organic 1-2, biomolecules 1-2, stoich/gas 2, periodicity 1, atomic 1, equilibrium 1, kinetics 1, nomenclature 1)

| Topic | Target | mock10 actual | mock11 actual |
|---|---|---|---|
| Acids/bases | 2 | 2 (Q33, Q34) | 2 (Q33, Q34) |
| Bonding | 2 | 2 (Q35, Q36) | 2 (Q35, Q36) |
| Redox | 2 | 2 (Q37, Q38) | 2 (Q37, Q38) |
| Organic | 1-2 | 1 (Q39) | 2 (Q39, Q40) |
| Biomolecules | 1-2 | 1 (Q40) | 0 (issue 16) |
| Stoichiometry/gas | 2 | 2 (Q41, Q42) | 2 (Q41, Q42) |
| Periodicity | 1 | 1 (Q43) | 1 (Q43) |
| Atomic structure | 1 | 1 (Q44) | 1 (Q44) |
| Equilibrium | 1 | 1 (Q45) | 1 (Q45) |
| Kinetics | 1 | 1 (Q46) | 1 (Q46) |
| Nomenclature/formula | 1 | 1 (Q47) | 1 (Q47) |
| Total | 15 | 15 | 15 (mix drifts on organic/biomolecules) |

### Section D (target: inequalities 2, other algebra 2, sets 1, geometry 1, trigonometry 1)

| Topic | Target | mock10 actual | mock11 actual |
|---|---|---|---|
| Inequalities | 2 | 2 (Q48, Q49) | 2 (Q48, Q49) |
| Other algebra | 2 | 2 (Q50 parametric, Q52 expand) | 2 (Q51 simultaneous, Q52 factorise) |
| Sets | 1 | 1 (Q51) | 1 (Q50) |
| Geometry | 1 | 1 (Q53) | 1 (Q53) |
| Trigonometry | 1 | 1 (Q54) | 1 (Q54) |
| Total | 7 | 7 | 7 |

### Section E (target: electricity 2, kinematics 1, dynamics 1, gravitation 1, fluids 1)

| Topic | Target | mock10 actual | mock11 actual |
|---|---|---|---|
| Electricity | 2 | 2 (Q56 network, Q57 resistivity) | 2 (Q56 Ohm, Q57 energy) |
| Kinematics | 1 | 1 (Q55 chase) | 1 (Q55 v-t graph) |
| Dynamics | 1 | 1 (Q59) | 1 (Q58) |
| Gravitation | 1 | 1 (Q58) | 1 (Q59) |
| Fluids | 1 | 1 (Q60) | 1 (Q60) |
| Total | 6 | 6 | 6 |

Both papers are census-faithful except mock11's missing biomolecule item in chemistry (issue 16).

---

## 4. Duplication list

### Overlap with the real 2025 paper (the student has seen it)

| Mock/Q | 2025 item | Relationship | Severity |
|---|---|---|---|
| mock10 Q9 | 2025 Q9 (clock, 1.75 rotations) | Near-copy, wording and template preserved, numbers changed | P1, must replace |
| mock10 Q33 | 2025 Q39 (weak-acid pH, Ka = 1.0e-5, 0.001 M) | Same question, same Ka, concentration changed | P1, must replace |
| mock10 Q50 | 2025 Q54 ((a+3)x = 5 impossible value) | Same template, constant flipped | P1, must replace |
| mock10 Q55 | 2025 Q55 (two vehicles chase) | Same template, numbers give a different verdict | P2 |
| mock10 Q15 | 2025 Q18 (Bohr effect) | Same fact, different question angle (mechanism vs consequence) | P3, acceptable |
| mock10 Q16 | 2025 Q16 (Ca binds troponin) | Same complex, different question (effect of binding vs binding partner) | P3, acceptable |
| mock10 Q19 | 2025 Q20 (competitive inhibition) | Same fact family, different question | P3, acceptable |
| mock10 Q21 | 2025 Q21 (digestive enzymes) | Same family, different question | P3, acceptable |
| mock10 Q22 | 2025 Q25 (urea cycle, main liver process) | Same fact, different question form | P3, acceptable |
| mock10 Q24 | 2025 Q31 (osteoblast role) | Paired fact (osteoclasts vs osteoblasts) | P3, acceptable |
| mock10 Q35 | 2025 Q36 (NaCl solid type) | Same fact, different question | P3, acceptable |
| mock10 Q44 | 2025 Q46 (orbital electron capacity) | Same capacity family (sublevel vs orbital) | P3, acceptable |
| mock10 Q58 | 2025 Q58 (g at height, inverse square) | Same fact, different numbers and answer | P3, acceptable |
| mock10 Q59 | 2025 Q59 (car + friction, Newton II) | Same scenario family, different structure | P3, acceptable |
| mock11 Q20 | 2025 Q20 (competitive inhibition) | Complementary question (non-competitive) | P3, acceptable |
| mock10 Q1 / mock11 Q1 & Q2 | 2025 Q1/Q2 question formulas | Genre-template reuse (leaflet interpretation, "not correct" press item), content entirely different | Intended fidelity, not duplication |

No mock11 item is a 2025 near-copy.

### Overlap with existing banks

Near-verbatim (same question, surface changes only) - listed as P2 issues above:
- mock10 Q17 = imat_mock1 Q21 (cardiac muscle description)
- mock10 Q12 = Repair_Drill_1 Q1 and imat_mock1 Q10 (Krebs site; fact also = real 2024 Q12)
- mock10 Q28 = imat_mock1 Q15 (secretory protein site)
- mock10 Q29 = imat_mock1 Q16 (Golgi function)
- mock10 Q39 = imat_mock2 Q43 (aldehyde group)
- mock11 Q10 = imat_mock1 Q12 (final electron acceptor)
- mock11 Q15 = imat_mock1 Q24 (O2 carried on haemoglobin)
- mock11 Q21 = Repair_Drill_1 Q13 (bile emulsifies; fact also bank_bio_hard Q93)
- mock11 Q23 = imat_mock2 Q23 (filtration site)
- mock11 Q30 = imat_mock3 Q20 (Aa x Aa 3:1)
- mock11 Q32 = imat_mock3 Q16 (anticodon on tRNA; fact also real 2024 Q21)
- mock11 Q34 = bank_chem_hard Q32 (heated pure water still neutral)
- mock11 Q37 = imat_mock2 Q34 and Repair_Drill_1 Q32 (Mn in KMnO4, verbatim)
- mock11 Q46 = bank_chem_hard Q65 and imat_mock1 Q46 (temperature/collision theory)
- mock11 Q50 = imat_mock8 Q9 (inclusion-exclusion, identical numbers 30/18/15/8)
- mock11 Q59 = imat_mock2 Q60 (weight on the Moon 1/6)

Same core fact, clearly different stem (acceptable high-yield repetition, listed for the record):
- mock10 Q14 / mock11 Q14 (ETC mobile carriers ubiquinone / cytochrome c; complements bank_bio_hard Q120)
- mock10 Q19 (competitive inhibition overcome by substrate; family of mock1 Q20, mock7 Q18, mock11 Q20)
- mock10 Q23 (ADH; family mock5 Q20, mock8 Q30)
- mock10 Q25 (glucagon; family bank_bio_hard Q100, mock6 Q26)
- mock10 Q26 (glycosidic bond; family bank_bio_hard Q8-9, mock3 Q17 adjacent)
- mock10 Q32 (inhalation mechanics; family bank_bio_hard Q81, Repair_Drill_1 Q14)
- mock10 Q41/Q42 (combustion stoichiometry; skill family of 2024 Q36 and bank stoich items)
- mock10 Q56/Q57, mock11 Q56/Q57 (resistor networks, Ohm's law, kWh; skill family across mocks 1-9)
- mock10 Q60 (hydrostatic pressure; 5th use of rho-g-h across banks, mock1 Q60, mock9 Q59, mpl_hard Q57, Repair_Drill_1 Q60)
- mock11 Q13 (uncoupler; scenario of bank_bio_hard Q123)
- mock11 Q17 (fibre types; family mock5 Q16, bank_bio_hard Q130)
- mock11 Q16 (CO2 70% bicarbonate; family Repair_Drill_1 Q7-8, bank_bio_hard Q85)
- mock11 Q24 (ciliated epithelium; family Repair_Drill_1 Q20)
- mock11 Q27 (fluid mosaic; family bank_bio_hard Q25)
- mock11 Q29 (catalase/peroxisome; family bank_bio_hard Q20-21)
- mock11 Q36 (H-bonding and boiling point; family bank_chem_hard Q50-52)
- mock11 Q3 reading fact (Galileo's moons) = GK_Drill_100 Q85 direct recall item
- mock11 Q4 reading theme = imat_mock2 Q1 and imat_mock7 Q1 (antibiotic resistance selection)

---

## 5. Quality and fairness notes (passed unless listed)

- No stem is missing data: all constants needed (Ka, Kw, molar masses, equations, densities, g) are supplied where non-standard.
- All 120 keys verified: every numeric item recomputes to the stored key; every logic puzzle (mock10 Q5-8, mock11 Q5-8) has a unique solution and no distractor satisfies the constraints; mock11 Q31 (X-linked cross) re-derived: X^cY father x carrier mother gives 50% affected sons and 50% affected daughters, key D correct.
- No "all/none of the above" options, no em dashes, no markdown artefacts, no smart quotes in stems/options.
- Spelling: both papers use British conventions consistently (haemoglobin, colour, -ise, sulfur per IUPAC/platform convention). No within-paper inconsistency.
- Minor option-form issues: mock10 Q9 (times unsorted), mock10 Q20 (allosteric site not parallel), mock10 Q50 (option E breaks parallel form), mock11 Q28 (unsorted pH options).
- Explanation gaps: only mock10 Q9 (distractor attribution wrong), mock10 Q33 (distractor attribution wrong), mock11 Q31 (notation garbled). All other explanations name why the key distractors are wrong.

## 6. Student-fit sanity

- Maths: both D sections are one-step and attemptable end to end (linear inequalities with and without sign flip, difference of squares, Pythagoras, sin/cos identity, special-angle trig, set counting). The two "concept" items (mock10 Q48 empty set via discriminant; mock11 Q49 all reals via perfect square) mirror the exact two inequality-idea items the real 2025 paper carried. A student who blanked the real maths section will attempt most of these, which is the intended effect.
- Chemistry: a fair recall/one-step-calculation mix. The hardest item in either paper is mock10 Q33 (weak-acid pH), which is exactly the 2025 paper's hardest chemistry calculation, so it is real-level; it is nonetheless a P1 for duplication and should be reworked rather than removed.
- Biology: centred on the recall core the real paper rewards (respiration, enzymes, digestion, kidney, hormones, tissue histology, Mendelian and X-linked genetics as the 2023/24 hedge).
- Physics: all six per paper are single-concept (Ohm, network resistance, P = V/I style, buoyancy, rho-g-h, mass vs weight, net force). Easier than 2025's physics but consistent with the profile (attempted 2/6) and with the target scores (44/42).
- Morale risk: no crusher found. Nothing requires multi-concept cascades beyond the uncoupler item (mock11 Q13), which she has drilled in bank_bio_hard. Fixing the P2 bank near-copies matters mainly for calibration (free points would inflate her mock scores above what the real exam would return), not for fairness.

## 7. Recommended fix order

1. Replace or rework mock10 Q9, Q33, Q50 (P1, 2025 near-copies).
2. Change mock11 Q50 numbers, swap mock11 Q37 species, rework mock11 Q34 and Q46 (P2, bank near-copies that give free points).
3. Fill mock11's chemistry biomolecule slot (issue 16) and stiffen mock11 Q9 (issue 17).
4. Sweep the P3s (option order mock10 Q9, mock11 Q28; parallel forms mock10 Q20, Q50; explanation notes mock10 Q9/Q33; notation mock11 Q31).

---

# DELTA RE-AUDIT (rebuild v b8a0fa2ef / v be33b01be)

Scope: only the changed items listed by the authors. Method repeated from the first pass: every changed item re-derived independently (numerics recomputed, uniqueness checked), re-compared against the real 2025 paper and all 15 banks, stem/option quality rechecked. Both rebuilt files also re-validated mechanically: 60 items each, numbering contiguous, ans letters map to intended options, 5 options each, no em dashes, no markdown, no above/below options, unsorted numeric options none (mock10 Q33's Ka options are powers of ten in descending order, which reads naturally).

## Delta verdicts

| Paper | Verdict |
|---|---|
| imat_mock10 (b8a0fa2ef) | **PASS** (all three P1 items resolved with correct new keys; residuals are P3-grade acceptable repetitions) |
| imat_mock11 (be33b01be) | **PASS WITH FIXES** (one remaining P2: the Q23 replacement is itself a near-copy of imat_mock7 Q30; everything else resolved) |

## imat_mock10 changed items, re-derived

| Q | New item | Re-derivation | Result |
|---|---|---|---|
| 9 | Watch gains 3 min/h, correct at 8:00 am; true 10:00 am | 2 h elapsed, gain 6 min, shows 10:06 am. Key D correct. Options ascending; distractor notes now accurate (10:03 one hour, 9:57 losing, 10:09 tripled). | P1 RESOLVED. Not the 2025 rotation item; no bank watch-gain item exists; census clock slot preserved. |
| 12 | Largest share of ATP from one glucose | Roughly 26 of 30 ATP from oxidative phosphorylation. Key D correct. | Old Krebs-site copy (Repair Q1, mock1 Q10, real 2024 Q12) resolved. NEW P3: reworded version of Repair_Drill_1 Q10 ("most of this ATP is produced by oxidative phosphorylation"); single repetition, differently framed, acceptable but listed. |
| 17 | Gap junctions in intercalated discs | Electrical coupling between adjacent cells. Key B correct. | Old mock1 Q21 tissue-ID copy resolved; no bank or real-paper overlap on gap junctions. |
| 20 | Distractor swap to "a substrate analogue" | All five options now grammatically parallel ("a ..."); explanation updated and correct; coenzyme remains key. | P3 RESOLVED. |
| 28 | Secretory pathway order | Rough ER, Golgi, secretory vesicle, plasma membrane. Key B correct; distractor routes through nucleus/lysosome clearly wrong. | Old mock1 Q15 copy resolved; pathway-order question not present in any bank. |
| 29 | Golgi sorts/tags lysosomal enzymes | Key A correct. | Old mock1 Q16 copy resolved. New P3: fact family overlaps real 2025 Q27's key (Golgi-lysosome relationship) but the question asked is different (enzyme routing vs organelle origin); acceptable. |
| 33 | Given pH 4.0 at 0.001 mol/dm3, find Ka | Ka = (1.0e-4)²/1.0e-3 = 1.0e-5. Key C correct; distractor attributions now accurate. | P1 RESOLVED: inverse task, different option set, real computation required. P3 note: the numeric pairing (Ka 1e-5, C 1e-3, pH 4) still mirrors 2025 Q39's data; setting C = 0.01 (Ka = 1e-6) would fully decouple. |
| 36 | Electronegativities supplied | Pauling values in the stem are correct; C-O difference 0.89 is the largest. Key A unchanged, correct. | P3 RESOLVED. |
| 39 | Which compound is a ketone | Propanone. Key D correct; propanal and methanal correctly identified as aldehydes in the explanation. | Old mock2 Q43 aldehyde copy resolved. P3: same skill as bank_chem_hard Q10 (ketone ID with a C4 constraint); different compounds, acceptable. |
| 50 | x² - 5x + k = 0 with root 2, find k | 4 - 10 + k = 0 gives k = 6; other root 3. Key D correct; unique; options ascending. | 2025 Q54 template gone. Note: quadratic family of mock5 Q48 (x² - 5x - 6 = 0) but a different task (parameter vs solve); fine. |
| 55 | Pursuit: 90 vs 72 km/h, 2.0 km gap, after 5 min | Relative 18 km/h x (1/12 h) = 1.5 km gained, still 0.5 km behind. Key B "not yet caught" correct; full catch at about 6.7 min, explained. | 2025 template concern downgraded P2 to P3: numbers force computation and the key verdict differs from 2025's "overtaken"; genre overlap remains but is no longer exploitable by recall. |

Section census after changes (mock10): unchanged and still exact (A 9 in the right genres; B 7/3/3/4/2/1/2/1 = 23; C 15 with organic 1, biomolecules 1; D and E per target). Q9 keeps the clock slot, Q12/Q17 stay inside respiration and muscle/histology respectively.

## imat_mock11 changed items, re-derived

| Q | New item | Re-derivation | Result |
|---|---|---|---|
| 9 | Angle at 9:30 | Minute hand 180 degrees, hour hand 9.5 x 30 = 285 degrees, difference 105 degrees. Key C correct; the 90-degree trap is explained. Options ascending. | P2 RESOLVED. Non-round time with hour-hand drift; matches the bank's other clock items in demand. |
| 10 | How glycolysis's ATP is formed | Substrate-level phosphorylation from phosphorylated intermediates. Key B correct. | Old mock1 Q12 final-acceptor copy resolved. Complements mock10 Q12 (distribution vs mechanism) with no duplication. |
| 15 | Where O2 binds on haemoglobin | Iron ion at the centre of each heme. Key A correct; terminal-amino distractor correctly tied to CO2 and consistent with Q16. | Old mock1 Q24 copy resolved; fact family of bank_bio_hard Q86 remains, acceptable. |
| 21 | Bile stored and concentrated in the... | Gall bladder. Key D correct. | Old emulsification near-copy resolved. P3: storage-organ fact also in mock2 Q21 (liver/gallbladder pair item); acceptable high-yield repeat in a different form. |
| 23 | Glucose and amino acids reabsorbed in the... | Proximal convoluted tubule. Key B correct. | Old mock2 Q23 copy resolved, BUT the replacement is itself near-identical to imat_mock7 Q30 (filtered glucose almost completely reabsorbed in the proximal tubule; same proposition, same nephron-segment option family). REMAINING P2. |
| 28 | Lysosome pH options reordered | Key letter updated to B = "5.", which is correct; options now ascending 2, 5, 7.4, 9, 12. | P3 RESOLVED, no key error introduced. |
| 30 | GENOTYPE ratio of Aa x Aa | 1 AA : 2 Aa : 1 aa, key B correct; the 3:1 distractor now catches anyone who memorised the phenotypic ratio from mock3 Q20. | P2 RESOLVED and turned into a better item. |
| 31 | Explanation notation cleaned | Caret superscripts removed; reasoning unchanged and correct (affected man x carrier woman: half of sons and half of daughters colour blind). Key D correct. | P3 RESOLVED. |
| 32 | Peptide bond forms with the A-site amino acid | Growing chain on the P-site tRNA is transferred to the amino acid just arrived in the A site. Key A correct; mechanism accurately explained. | Old mock3 Q16 anticodon copy resolved; no elongation-mechanics item exists in the banks; translation census slot retained. |
| 34 | Numeric Kw item (4.0e-13 at 80 C) | [H+] = sqrt(4.0e-13) = 6.3e-7, pH about 6.2, still neutral. Key D correct; the neutral/acidic pair at 6.3e-7 cleanly separates the concepts. | Old chem_hard Q32 conceptual copy resolved into a genuine calculation; the neutrality idea repeats but must now be computed. Acceptable. |
| 37 | ON of P in H3PO4 | 3(+1) + x + 4(-2) = 0 gives x = +5. Key C correct; H3PO3 contrast in the explanation is right. | Both KMnO4 duplicates gone; no bank item uses H3PO4; distinct from real 2025 Q34 (Cl oxoacids). |
| 39 | Stem reworded | "How many open-chain alcohols have the molecular formula C4H10O?" Answer 4 unchanged and correct. | P3 RESOLVED. |
| 40 | Peptide bond item | Amino group + carboxyl group condensation gives a peptide bond. Key C correct. | Biomolecule census slot in section C RESTORED: mock11 C is now acids/bases 2, bonding 2, redox 2, organic 1, biomolecules 1, stoich/gas 2, periodicity 1, atomic 1, equilibrium 1, kinetics 1, nomenclature 1 = 15. Census compliant. P3: same fact as mock3 Q17 in a formation-based stem; acceptable. |
| 46 | Which property is unchanged when T rises | Activation energy. Key B correct; the collision-frequency and energetic-fraction options genuinely change. | Old chem_hard Q65 / mock1 Q46 near-copy resolved into the inverse question. P3 nit: option D ("number of reactant molecules able to react") is slightly loose but clearly changes, so the key is unique. |
| 50 | Inclusion-exclusion 40/25/18/9 | Union 25 + 18 - 9 = 34, neither = 6. Key A correct; distractor notes accurate. | mock8 Q9's identical numbers gone. P2 RESOLVED. |
| 59 | Why weight is one sixth on the Moon | Smaller lunar g acting on unchanged mass. Key B correct; distractors coherent and explained. | Old mock2 Q60 recall copy resolved into a causal question. |

Section census after changes (mock11): A 9 correct; B 7 (resp/gas, at cap) / 2 / 3 / 4 / 2 / 1 / 1 / 3 = 23; C 15 with the biomolecule slot filled; D and E per target.

## Remaining issues after the delta (full list)

| Mock | Q | Sev | Problem | Suggested action |
|---|---|---|---|---|
| mock11 | 23 | P2 | The replacement kidney item is itself a near-copy of imat_mock7 Q30 (filtered glucose reabsorbed in the proximal convoluted tubule). | Either accept as a final high-yield repeat, or swap the asked segment (e.g. which part of the nephron builds the medullary osmotic gradient) so the memorised answer does not transfer. |
| mock10 | 12 | P3 | Reworded version of Repair_Drill_1 Q10 (largest ATP share from oxidative phosphorylation). | Acceptable single high-yield repeat; swap only if desired. |
| mock10 | 33 | P3 | Inverse Ka item still mirrors 2025 Q39's numeric pairing (1e-5 / 1e-3 / pH 4). | Optional: set C = 0.01 mol/dm3 so Ka = 1e-6 and the pairing fully decouples. |
| mock10 | 29 | P3 | Fact family of real 2025 Q27's key (Golgi-lysosome link); different question asked. | Accept. |
| mock10 | 39 | P3 | Same skill as bank_chem_hard Q10 (ketone identification); different compounds. | Accept. |
| mock10 | 55 | P3 | Chase genre persists from 2025 Q55; numbers force computation and the verdict differs. | Accept. |
| mock11 | 21 | P3 | Storage-organ fact repeats mock2 Q21 in a different form. | Accept. |
| mock11 | 40 | P3 | Peptide-bond fact repeats mock3 Q17 in a formation-based stem. | Accept. |
| mock11 | 46 | P3 | Option D phrasing slightly loose ("number of reactant molecules able to react"). | Optional rewording to "the fraction of molecules with energy above the activation energy" as a changing quantity. |
| process | paper_2023.txt | P3 | Still mojibake; 2023 overlap checking remains limited. | Re-extract before the next audit round. |

## Delta conclusion

Every P1 from the first audit is resolved with a correct, independently verifiable key, and none of the replacement items reintroduces a 2025-paper overlap. Of the P2 set, fifteen of sixteen are resolved; the one exception is mock11 Q23, whose replacement landed on another bank near-copy (mock7 Q30), leaving mock11 at PASS WITH FIXES on that single item. Mock10 is now clean of P1/P2 findings and passes outright. Mechanical checks (keys, numbering, option form, hygiene) pass on both rebuilt files, and both papers remain census-faithful, with mock11's chemistry biomolecule slot now filled.

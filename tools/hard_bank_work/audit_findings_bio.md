# Independent answer-key audit: biology items

Scope: data/bank_bio_hard.json (130 Q) and data/imat_mock9.json questions n=1..32 only.
Method: every stem, all 5 options, ans and exp read independently before comparing with the marked key.
Independent decisions were checked against the key afterwards. Calculation items were re-derived in
python (Hardy-Weinberg n64, n65, mock9 n19; Meselson-Stahl n39; nucleosome count n37; PCR counting n48
and the general 2^n - 2 rule; independent assortment 2^n n59; dihybrid fractions n63, mock9 n18, n32;
glycogen-entry ATP mock9 n12; methane/limiting reagent mock9 n34 checked in passing).
The `perm` field of the assembled files was inspected against the work files in tools/hard_bank_work
and is inert metadata: the shipped `ans` letter refers directly to the shipped option order, so all
findings below are findings about the shipped product.

## Findings: bank_bio_hard.json

| bank | n | severity | issue | suggested fix |
|---|---|---|---|---|
| bank_bio_hard | 82 | P0 | Wrong key. Marked ans C ("The diaphragm relaxes while the ribs are pulled upward and outward, so thoracic volume increases") describes quiet inhalation, not forced exhalation; it even asserts thoracic volume increases, which draws air inward. The correct option is B (abdominals and internal intercostals contract, relaxed diaphragm pushed up, volume decreases, alveolar pressure rises well above atmospheric), and the written explanation argues exactly for B. The work file bank_bio_hard__F.json carries the same wrong key, so the error is upstream of assembly. | Change ans from C to B in both the work file and the assembled bank. |
| bank_bio_hard | 86 | Difficulty | lik H but pure single-fact recall: O2 binds heme iron, CO2 binds globin amino groups. No multi-step work. | Downgrade to M, or reframe as a scenario (e.g. predict which gas displaces which at which site). |
| bank_bio_hard | 85 | Difficulty | lik H but pure recall of three memorised percentages (70/23/7 bicarbonate/carbamino/dissolved) with permutation distractors. | Downgrade to M, or integrate into a scenario (e.g. explain why Venous CO2 content rises little when dissolved CO2 changes). |
| bank_bio_hard | 80 | Difficulty | lik H but near pure recall (pulmonary circuit short and low pressure vs systemic). The distractor discrimination adds only vessel-role recall. | Borderline: downgrade to M or add a second inference step. |
| bank_bio_hard | 59 | Difficulty | lik H but a one-step formula application (2^6 = 64). | Borderline: fits M better. |

No other wrong keys in the bank: all 130 keys were re-derived and agree, including the quantitative
items (n2 net charge 0, n24 urea/NaCl tonicity returning to original volume, n37 240 H3, n39 1/4,
n48 6 fully-new PCR molecules, n51 mitotic nondisjunction 47/45, n55 to n57 nondisjunction counts,
n62 9 genotypes, n63 1/8 aabb, n64 160 carriers, n65 p = 0.7) and all false-statement items
(n52 C, n61 E, n68 D, n90 D, n113 D, n119 E, n120 B).

## Findings: imat_mock9.json (n=1..32)

| bank | n | severity | issue | suggested fix |
|---|---|---|---|---|
| imat_mock9 | 25 | P1 | The discriminator between key A and distractor B is not in the stem and is outside the IMAT biology syllabus: a candidate must know that standard pulse oximetry cannot distinguish carboxyhaemoglobin from oxyhaemoglobin (and reads falsely high, not low). CO transport itself is in-syllabus, but the deciding content is a clinical-technology fact the stem never supplies. | Add one stem clause (e.g. "a pulse oximeter cannot distinguish carboxyhaemoglobin from oxyhaemoglobin") or strip the oximeter from options A and B and key on oxygen content alone. |
| imat_mock9 | 24 | P2 | Scenario overlap with bank Q84: both are stab-wound pneumothorax items ending in collapse of the same lung with the same mechanism. A candidate who drilled the bank gets a free mock item, inflating mock calibration. | Keep one of the two; rewrite the mock stem to a different entry route (e.g. rib fracture or pleural disease). |
| imat_mock9 | 21 | P2 | Distractor D is internally garbled biochemistry: "Glycolysis continues normally without regenerating NAD+, because the payoff phase of glycolysis produces NAD+." The payoff phase consumes NAD+ and produces NADH. It is obviously wrong so it does not mislead, but it reads as a broken sentence. | Rewrite as a clean false claim, e.g. "Glycolysis continues normally, because glycolysis does not need NAD+ at any step." |

All 9 Section A (logic/reading) keys verified by full enumeration where relevant (n4 liar puzzle: Farid,
only Gus true; n7 Gita can never be at position 5; n8 Demography never at 9:00; n9 Q always fourth or
fifth). All 23 Section B keys agree with the marked answers, including n12 (3 ATP from a glycogen unit),
n17 (meiosis I nondisjunction: 24, 24, 22, 22 and zygotes of 47 or 45), n19 (2pq about 1/25) and
n32 (15/20 = 0.75, bottleneck drift).

## Syllabus (SYL) check

No SYL flags. All manifest syl citations match their section content and fall inside the IMAT Annex A
bullets, including the two deliberate placements: Q10 (carotenoids/xanthophylls under The chemistry of
living things; defensible because the question keys on lipid-soluble pigment chemistry) and Q66
(Pasteur/spontaneous generation under Mutations (selection, evolutionary theories), a topic-map
arbitration recorded in hard_bank_topics.md). Borderline but not flagged: Hardy-Weinberg items
(n64, n65, mock9 n19) sit under the evolution-flavoured bullets, which matches mainstream IMAT
preparation material.

## Verification notes

- Automated checks passed for both files: exactly 5 options per item, no duplicate options, ans in A-E,
  explanations present, no em or en dashes, no option-to-option letter references.
- Numeric answers re-derived in python: n37 (240), n39 (1/4), n48 (6), n59 (64), n64 (160), n65 (0.7),
  mock9 n12 (3), n18 (1/16), n19 (1/25), n32 (0.75). All match the marked keys.
- The one wrong key (bank n82) is present identically in the work file and the assembled bank; the
  explanation was written for the correct option, so it is a keying slip, not a content error.

## Summary

Counts: P0 = 1 (bank n82 wrong key), P1 = 1 (mock9 n25 extra-syllabus discriminator), P2 = 2 (mock9 n24 overlap, mock9 n21 garbled distractor), SYL = 0. Difficulty: 4 H items in the bank are recall-grade (n59, n80, n85, n86) and should be relabelled or hardened.
Verdict: fix-then-ship. The single wrong key (bank n82) is a must-fix before release; everything else ships as-is.

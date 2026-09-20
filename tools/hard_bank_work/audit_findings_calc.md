# Quantitative answer-key audit: hard banks and mock9 C/D/E

Auditor: independent calc/logic re-derivation pass, Sep 2026.
Scope: bank_chem_hard (65), bank_mpl_hard (95), imat_mock9 n=33..60 (28). 188 items total.
Method: every numeric item recomputed from the stem in Python (moles, gas laws, pH/pOH, calorimetry,
resistor networks, clock angles, dice enumeration over 36 ordered outcomes, kinematics areas);
logic items checked by exhaustive enumeration (truth-teller assignments, constraint puzzles,
syllogism model checks). Every marked key was confirmed to follow necessarily; distractors were
confirmed to fail. Syllabus citations checked against the Annex A crosswalk (no calculus required
anywhere; intensity as W/m2 and centripetal acceleration are inside the agreed scope).

## Result by file

### bank_chem_hard (65 items)

All 65 keys correct. Recomputed and confirmed: n=14..21 (mole/Avogadro, molar volume, limiting
reagent 0.10 mol HCl vs 0.10 mol CaCO3, 75 percent yield), n=22..27 (Boyle 8.0 dm3, Gay-Lussac
200 kPa via 600/300 K, combined law 6.0 dm3, Dalton 90 kPa, mixing 0.32 M, dilution 475 cm3),
n=28..35 (pH 3.70, pOH 12.70, Sr(OH)2 pH 11.0, ordering Q,P,R,S, Kw vs temperature at 60 C and
10 C, dilution shifts 2 units and 1980 cm3), n=39..40 (0.100 M glucose; Ca(OH)2 0.025 M, pH 12.70,
Ca2+ 1000 ppm), n=41..49 (oxidation numbers incl. HCHO 0, thiosulfate avg +2 with +5/-1 split,
half-equation 2 e-, 5 e- and 5 Fe2+), n=58 (bond energies 678 - 862 = -184 kJ/mol), n=61 (three
half-lives, 1/8), n=62 (third order, dm6 mol-2 s-1). Conceptual items (isomer classes, nomenclature,
IMF ordering, polarity, bond type, catalysis) all sound; boiling-point data match real values.

| bank | n | severity | issue | suggested fix |
|---|---|---|---|---|
| bank_chem_hard | 22 | P2 | Stem gives the surface pressure as 50 kPa, about half an atmosphere; unphysical for a sea-level surface. The Boyle computation itself is internally consistent and the key (8.0 dm3) is right. | Change surface pressure to 100 kPa and depth pressure to 400 kPa (V2 = 4.0 dm3, adjust options), or keep values but set the scene at altitude. |
| bank_chem_hard | 34 | P2 | Distractor C "rises by 100 units" is a strawman (pH cannot move 100 units); the realistic trap is confusing the 100-fold dilution factor with a 2-unit rise, which the key option already covers. | Replace C with a concrete wrong shift, e.g. "It rises by 1 unit" already exists; better: "It rises by a factor of 100" is not a pH statement, so consider "It rises to pH 103" style trap or leave as is; cosmetic only. |

### bank_mpl_hard (95 items)

All 95 keys correct. Recomputed and confirmed: logs (0.88 from the given approximations, change of
base 3/2, mixed-base x=16, domain-checked log equation x=2), inequalities (sign study, rational
-2 < x <= 3, |2x-5| < 7, x(x-1) < 0), radicals (2 + sqrt3), exponents (17; 2^(a+b+2) = 60), systems
(94 adults, 29, 2 dm3 of the 50 percent solution), functions (f(f(3)) = 3; inverse (3x+1)/(x-2)),
geometry (2/3 remaining, 21.5 cm2, 36sqrt3, 66pi, clock 130 deg and m = 310/5.5 = 56 + 4/11 min,
tan30 tan60 = 1, identity value 1, 1/2), probability (10/36, 11/36, 2/36, 15/36 union, 15/16, 2/3,
5/12, 1/6, all brute-forced over the 36 ordered outcomes), units (25 m/s, 12000 L), kinematics
(68 m trapezium area, 6.4 m/s, 3.0 m/s and 1.0 m/s2, v2/r = 5.0, 60 m stopping distance, 3.0 m/s2),
dynamics (5.0, 1.0, 0.20 m/s recoil, 500 N impulse, 300 W, 12 kW), fluids (gauge 150 / absolute
250 kPa, manometer 113.6 kPa, layered Stevin 18.4 kPa, floating fractions 0.50/0.75), thermal
(420 kJ, mixing T = 30 C, m = 0.20 kg, 9.0 MJ, 7.2 kJ), electricity (series 12 W / parallel 48 W
with the single false option E, 7.0 ohm network, 1.0 A branch, 12 ohm added branch, 1.5 A after
the short, W/m2, inverse-square 4.0 W/m2). Logic section G: syllogisms (n=76..81), truth-teller and
liar puzzles (n=82..86), contrapositive/only-if/biconditional equivalences (n=87..91) and short
arguments (n=92..95) all verified by enumeration; each marked key is the unique necessary claim or
the unique equivalent form.

| bank | n | severity | issue | suggested fix |
|---|---|---|---|---|
| bank_mpl_hard | 22 | P2 | The explanation attributes distractors A (7:52 and 8/11) and E (8:00) to "misreading the closing rate as 5 or 6 degrees per minute", but rate 6 from 7:20 gives 7:53 1/3 and rate 5 gives 8:00 only; option A in fact equals solving 5.5m - 210 = 80 (gap of 80 deg, i.e. 290 instead of 310). The key derivation (5.5m = 310, m = 56 and 4/11) is correct. | Rewrite the last sentence: option A answers a gap of 80 deg and option E comes from taking the closing rate as 5 deg/min. |
| bank_mpl_hard | 59 | P2 | Stem says "ignoring atmospheric pressure" while asking for the gauge pressure; gauge pressure already excludes atmospheric pressure, so the phrase is redundant and could momentarily confuse. | Delete "and ignoring atmospheric pressure" or rephrase to "the tank is open, so report the gauge pressure". |
| bank_mpl_hard | 64 | P1 | Explanation misidentifies how the 0.70 kg distractor arises: using the 70 K span as the hot water's temperature drop gives m = 0.5 x 20 / 70 = 0.14 kg, not 0.70. The 0.70 value comes from using 70 K as the cold water's temperature rise: m x 50 = 0.5 x 70 gives m = 0.70. The key B (0.20 kg) is correct. | Change the sentence to: the 0.70 kg option uses the 70 K span between the starting temperatures as the warming of the cold water, though it only rises by 20 K. |

### imat_mock9, n=33..60 (28 items)

All 28 keys correct. Recomputed and confirmed: isomer classification, limiting reagent with gas
volumes (0.15 mol O2 limits, 0.075 mol CO2 = 1.68 dm3, 3.6 g CH4 left; Al/H2SO4 case 0.010 mol H2
= 0.224 dm3, 0.90 g Al left), pH chains (NaOH pH 12 then 10 after 100-fold dilution; Kw = 1e-13
gives pH 11; tenfold dilution pH 4 to 5; excess OH- 0.005 mol in 0.200 dm3, pH 12.40), IMF ordering
propane < propanone < ethanol < ethanoic acid, rate factor 18, tetrathionate average +2.5, nitrogen
+4 in NO2, half-life 0.050 mol/dm3, oxygen atoms 1.2e23 in both samples, evaporation 0.50 M, pH gap
100x, log 2.4 = 0.38, discriminant -6 < k < 6, recast cylinder h = 9 cm, same colour 13/28, 4.0 m/s,
6sqrt2, clock 9:36 = 72 deg, deceleration 4 m/s2, centripetal 2.0 m/s2 inward, 2.4 A network,
mixing T = 35 C, gauge 24 kPa, kettle 3.6e5 J. Section D maths and section E physics keys all match.

| bank | n | severity | issue | suggested fix |
|---|---|---|---|---|
| imat_mock9 | 34 | P1 | Explanation misidentifies the 3.36 dm3 distractor: "treat methane as the limiting reagent" would give 0.30 mol CO2 = 6.72 dm3, not 3.36. The 3.36 value comes from mapping n(O2) = 0.15 mol directly to 0.15 mol CO2, that is, taking oxygen as limiting but dropping the 2:1 O2 to CO2 ratio. The key C (1.68 dm3, 3.6 g methane left) is correct. | Rewrite: the 3.36 dm3 options take the 0.15 mol of oxygen as producing 0.15 mol of CO2 and forget that 2 mol of O2 are needed per mol of CO2. |

## Checks that found no problems

- Dice items: every probability re-enumerated over the 36 ordered outcomes; the stated distractor
  derivations (exactly one six = 5/18, sum exactly 9 = 1/9, overlap (1,6),(6,1) = 2) all check out.
- Clock items: 3:40 = 130 deg; 7:20 gap = 100 deg as claimed; 9:36 = 72 deg; second 100 deg gap at
  56 + 4/11 min confirmed by solving 5.5m = 310.
- Resistor networks: series 12 ohm, parallel 3 ohm, mixed 7 ohm and 10 ohm, short-circuit 1.5 A,
  48 W vs 12 W, all recomputed.
- Calorimetry: 30 C, 0.20 kg, 35 C, all from simultaneous heat-balance equations.
- Logic: mpl n=83 has exactly one consistent assignment (Amara liar, Ben truthful, Cara liar);
  mpl n=85 forces Dana as the sole truth teller with Eli the breaker; mock9 n=4 forces Farid;
  mock9 n=7 has exactly 4 arrangements with Gita only ever at position 2 or 4; mock9 n=8 has 5
  arrangements and Demography is never at 9:00; mock9 n=9 pins Q to fourth or fifth in all 4
  rankings. Marked keys are the unique necessary claims.
- SYL: all 188 citations fall inside the cited Annex A bullets per the topic map crosswalk; no
  item requires differentiation or any calculus; intensity items stay at the agreed W/m2 level.

## Summary

- Counts: P0 = 0, P1 = 2, P2 = 4, SYL = 0, over 188 audited items (0 wrong keys).
- The two P1 items are explanation-only errors about how a distractor arises (mpl n=64, mock9 n=34); both marked keys and all option values are correct.
- Verdict: ship (fix the two explanation sentences at the next editorial pass).

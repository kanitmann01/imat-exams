# Hard Bank Style Guide (authoring contract)

You write original IMAT-style items for the hard bank. Each question is one JSON object with exactly these author fields: "stem", "options" (exactly 5 strings), "ans" (A-E), "exp", "topic", "lik". The pipeline fills in "n", "perm", "shuffleSafe"; never write those. Style references: data/imat_mock5.json, data/imat_mock7.json, data/Repair_Drill_1.json.

## Official paper conventions (IMAT 2024 and 2025, extracted and checked)
- 60 items, options A) to E), one best answer; answer letters spread evenly, so vary "ans" across your items.
- Every constant and datum the solver needs is printed in the stem (atomic masses, molar volume, Ka, Kw); nothing is assumed from memory.
- Heavy use of inverted stems ("Which of the following statements is false?") and completion stems ("Krebs cycle reactions occur:").
- Units: mol/dm³, cm³, kPa, atm, mmHg, °C, with the kelvin conversion as a deliberate hidden step. Distractors are the classic numeric and conceptual slips.
- Multi-statement stems present each full claim as its own A-E option, never as numbered statements.

## Stem patterns
- Direct question: "What is the oxidation number of sulfur in H₂SO₄?"
- Completion stem: "During intense exercise, muscle regenerates NAD⁺ mainly in order to:"
- Passage-based: one quoted paragraph (under 80 words) plus one ask line, e.g. "Which statement is most strongly supported by the passage?"
- Data or table prompt: put the table or the numbers in the stem, then ask one computed question about them.
- Multi-statement: "Which of the following statements is/are correct?" or "...is false?". RULE: write each claim as a full self-contained option. Never label options "Statement 1", "Option 2" and similar: a stem of this shape whose options begin with "Statement"/"Option" is flagged shuffle-unsafe by the pipeline.
- Calculation prompt: all givens and units in the stem, constants in parentheses.

## Options
- Exactly five, grammatically parallel, similar length. No "all/none of the above", no "both A and B" (the pipeline flags these unsafe), and no option referring to another by letter.
- Only one defensible answer; every distractor must be a specific, plausible error, not filler.
- Numeric options: the unit in every option, ascending or otherwise natural order, and the classic error values included as distractors.

## Numbers (calculator-free)
- Clean results: integers, halves, simple fractions; one-significant-figure powers of ten (10⁻⁴, 3.0 × 10⁻⁸) where scientific notation is the point.
- Allowable constants (state them in the stem when used): g = 9.8 or 10 m/s², STP molar volume 22.4 dm³/mol, Avogadro 6.02 × 10²³, Kw = 1.0 × 10⁻¹⁴ (25 °C), c(water) = 4200 J/(kg·K), π ≈ 3.14. Give all molar masses in the stem.
- A °C to K conversion (27 °C = 300 K) is a favourite hidden step: build it in on purpose.

## Explanations
- 1 to 4 sentences: first the chain that justifies the answer, then name the key distractor and why it fails. Name distractors by their claim, not their letter, because display order is shuffled.
- Plain UTF-8 text only: unicode sub/superscripts (H₂O, 10⁻⁴, m/s²) are fine; no LaTeX, no markdown, no emoji.

## topic tag and lik
- topic: "Domain · subtopic" with the middle dot and single spaces, matching Repair_Drill_1, e.g. "Bio · photosynthesis (chemiosmosis)", "Chem · Kw and pOH", "Maths · inequalities (sign flip)", "Physics · circuits", "Logic & reasoning · conditional logic".
- lik: H or M only, no L. H: multi-step or integrated reasoning (a cascade, counting, combined quantities) that a well-prepared candidate still drops under time pressure. M: a solid two-step application, or a definition applied to one fresh case.

## HARD design patterns (lik H)
- Inhibitor or cascade reasoning: block one stage, reason about everything downstream (ETC, photosynthesis, feedback loops).
- Gamete-outcome counting: nondisjunction products, testcross fractions, blood-group crosses.
- Combined pH and temperature, or pH plus dilution, where two quantities interact.
- Limiting reagent combined with gas volumes at STP (multi-step stoichiometry).
- Multi-constraint logic: 3-5 entities, 3-4 rules, ask what must be true.

## MEDIUM design patterns (lik M)
- Two-step applications: find a, then use a; convert, then compute.
- Definition-plus-application: recognise the definition, apply it to one case.

## Model HARD item 1 (biology)
```json
{
 "stem": "In an experiment on isolated chloroplasts, a toxin blocks ATP synthase so that protons can no longer flow back into the stroma, while the electron transport chain is still driven by light. Which outcome is expected?",
 "options": [
  "Electron transport stops at once, because ATP synthesis and electron transport are the same process.",
  "Proton pumping into the thylakoid lumen continues at first, but the rising gradient increasingly opposes further pumping, so electron transport slows to a halt.",
  "The proton gradient dissipates and electron transport accelerates above its normal rate.",
  "NADPH production continues at its normal rate indefinitely, because NADP⁺ reduction does not depend on the proton gradient.",
  "Water splitting stops immediately, because photolysis is powered by ATP."
 ],
 "ans": "B",
 "exp": "With ATP synthase blocked, protons keep accumulating in the lumen, and the growing gradient creates back-pressure that stalls further electron flow, so NADPH production and water splitting stop as well. The dissipating-gradient option describes an uncoupler, not a blocked ATP synthase: an uncoupler lets protons leak back and electron transport speeds up.",
 "topic": "Bio · photosynthesis (chemiosmosis, inhibitor cascade)",
 "lik": "H"
}
```

## Model HARD item 2 (chemistry)
```json
{
 "stem": "3.6 g of magnesium (M = 24 g/mol) is added to 250 cm³ of 0.40 mol/dm³ hydrochloric acid: Mg + 2HCl → MgCl₂ + H₂. After the reaction stops, which statement is correct? (Molar volume of a gas at STP = 22.4 dm³/mol)",
 "options": [
  "1.12 dm³ of H₂ (measured at STP) is released and no magnesium remains.",
  "1.12 dm³ of H₂ (measured at STP) is released and 2.4 g of magnesium remains.",
  "2.24 dm³ of H₂ (measured at STP) is released and 1.2 g of magnesium remains.",
  "3.36 dm³ of H₂ (measured at STP) is released and the acid is in excess.",
  "1.12 dm³ of H₂ (measured at STP) is released and 1.2 g of magnesium remains."
 ],
 "ans": "B",
 "exp": "n(Mg) = 3.6/24 = 0.15 mol and n(HCl) = 0.250 × 0.40 = 0.10 mol, which consumes only 0.05 mol Mg, so the acid is limiting: H₂ = 0.05 mol = 1.12 dm³ at STP, leaving 0.10 mol = 2.4 g of magnesium. The 2.24 and 3.36 dm³ options forget the 2:1 acid ratio and treat magnesium as the limiting reagent.",
 "topic": "Chem · limiting reagent with gas volumes",
 "lik": "H"
}
```

## Model MEDIUM items (maths and physics)
```json
{
 "stem": "The mean of five numbers is 12. When one of the numbers is removed, the mean of the remaining four is 10. Which number was removed?",
 "options": ["2", "12", "20", "22", "40"],
 "ans": "C",
 "exp": "The five numbers sum to 5 × 12 = 60 and the remaining four sum to 4 × 10 = 40, so the removed number is 60 − 40 = 20. The 2 and 22 options come from combining the two means instead of the two totals.",
 "topic": "Maths · averages (totals before and after)",
 "lik": "M"
}
```

```json
{
 "stem": "A cyclist accelerates uniformly from rest to 20 m/s in 8.0 s. What distance does she cover while accelerating?",
 "options": ["40 m", "80 m", "100 m", "160 m", "320 m"],
 "ans": "B",
 "exp": "a = 20/8.0 = 2.5 m/s², so s = ½at² = 0.5 × 2.5 × 64 = 80 m, the same result as average speed 10 m/s for 8.0 s. The 160 m option uses the final speed for the whole time and forgets the average is half of it.",
 "topic": "Physics · kinematics (uniform acceleration)",
 "lik": "M"
}
```

## Do-not list
- No em dashes anywhere: use commas, colons, parentheses, or hyphens instead. En dashes only inside numeric ranges.
- No markdown emphasis markers (**, *, __, `) in any text field: the pipeline strips or rejects them.
- No "Read:" directives anywhere in the JSON.
- No bracketed internal tags such as [Redox - H] inside stem, options, or explanations.
- No reproduced questions from real papers: the officials are for style only, every item must be original.
- Options must not reference each other by letter, and multi-statement options must be full claims, never "Statement 1/2/3" labels (see Stem patterns).

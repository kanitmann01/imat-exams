# Hard Bank topic map and syllabus crosswalk

Contract for the Medium-Hard question bank build (Sep 2026). Sources: Kanit's two
handwritten topic lists (WhatsApp image + 6-page PDF) cross-walked against the
official MUR Annex A syllabus. Every question must cite its Annex A bullet in the
`syl` field of its work-file entry.

## Banks

| id | source HTML | title | Q | durationSec | targetScore |
|---|---|---|---|---|---|
| bank_bio_hard | Hard_Bank_Biology.html | IMAT QUESTION BANK: Biology (Medium-Hard) | 130 | 13000 | null |
| bank_chem_hard | Hard_Bank_Chemistry.html | IMAT QUESTION BANK: Chemistry (Medium-Hard) | 65 | 6500 | null |
| bank_mpl_hard | Hard_Bank_Maths_Physics_Logic.html | IMAT QUESTION BANK: Maths, Physics and Logic (Medium-Hard) | 95 | 9500 | null |
| imat_mock9 | Mock_Exam_9.html | IMAT MOCK EXAM 9: Hard Calibration | 60 | 6000 | 35 |

## Global authoring rules

1. Difficulty mix: 60% `lik: "H"`, 40% `lik: "M"` per section. H = multi-step or
   integrated (a strong candidate loses time on it); M = solid two-step application.
   Never `L`.
2. Original items only. Never copy or lightly edit stems from the existing 10 banks
   (data/*.json) or from real past papers. New scenarios, new numbers, new framings.
3. IMAT 2023-2025 style: 5 options A-E, self-contained parallel options, multi-statement
   questions worded as "Which of the following statements is correct?" with options as
   full claims (NOT "Statement 1/2/3" labels; the pipeline flags those shuffle-unsafe).
   Numeric options must be plain numbers with a shared unit; the pipeline sorts them
   ascending and fixes the correct letter by rank.
4. Calculator-free arithmetic: clean numbers, friendly powers of ten.
5. Explanations: 1-4 sentences; justify the key and say why the strongest distractor fails.
6. No em dashes or en dashes anywhere (hyphen allowed). No markdown markers
   (`**`, `*`, `__`, backticks). No "Read:" directive lines. No bracketed tags like
   [Redox - H] inside text fields. Options must not reference each other by letter.
7. Every entry carries `syl`: the Annex A bullet it examines (see per-section lists).
8. Syllabus arbitrations agreed with Kanit:
   - "Functions with derivatives": Annex A lists no calculus, so examine the same skill
     as slope of a line, tangent slope, rate of change from a graph or table. No formal
     differentiation rules.
   - "Cranium" and "important nerves": keep inside Annex A "Anatomy and Physiology of
     animals and humans", i.e. protection of the CNS, meninges, cranial nerve functions,
     reflex arcs, nerve injury effects. No foramina-level detail.
   - "Intensity": treat as power per unit area with unit conversions (Annex A physics:
     quantities, power). No decibel-scale questions.
   - Muscle fiber "types III and IV" from the notes: examine as smooth vs cardiac vs
     skeletal and type I (slow oxidative) vs type II (fast glycolytic), which is the
     IMAT-examinable framing.

## bank_bio_hard: 130 Q, 8 sections

### Section A: Chemistry of life and biological molecules (18 Q, syl: "The chemistry of living things")
- Amino acid types and structures (polar/non-polar/acidic/basic; behavior at pH) x3
- Protein structure levels primary→quaternary; alpha helix vs beta sheet; protein types x4
- Homopolysaccharides (glycogen, starch, cellulose: bond type and digestibility) x2
- Fat-soluble lipids and pigments (xanthophylls, carotenoids; lipid roles) x2
- Carbohydrate digestion and sources (amylase products, lactose/maltose) x2
- Enzyme concentration vs reaction rate; enzyme role and specificity x3
- Misfolded protein accumulation (prion-style logic, chaperone role) x2

### Section B: Cells, organelles and membrane transport (16 Q, syl: "The cell as the basis of life" / "The cell membrane")
- Peroxisomes vs lysosomes; products of SER and lysosome action x3
- Membrane transport (diffusion, osmosis, facilitated, active; which needs ATP) x3
- Fluid mosaic model; integral vs peripheral proteins x2
- Tonicity: iso/hyper/hypotonic outcomes in animal vs plant cells x2
- Viruses as acellular; why viruses are not cells x2
- Plastids: chromo/aleuro/elaioplast/amyloplast roles x2
- Organelle disorders: Tay-Sachs (lysosomal storage), organelle malfunction matching x2

### Section C: Molecular genetics and biotechnology (14 Q, syl: "Molecular genetics" / "Biotechnologies")
- Topoisomerase vs helicase vs ligase roles x2
- Histones, nucleosomes, eukaryotic chromosome structure x2
- Semi-conservative replication (Meselson-Stahl logic) x2
- Eukaryotic ribosome structure/assembly x1
- RNA splicing: eukaryotes yes, prokaryotes generally no; intron/exon logic x2
- Types of mutations (silent/missense/nonsense/frameshift) x3
- PCR components and what each does x2

### Section D: Cell cycle, heredity and evolution (18 Q, syl: "Cell cycle and cell reproduction" / "Mendelian genetics" / "Classical genetics" / "Human genetics" / "Mutations")
- Cell cycle phases G1/S/G0/G2/M: events and checkpoints x2
- Mitosis errors and outcomes x1
- Meiosis I vs II differentiation; prophase/metaphase/anaphase/telophase I events x3
- Non-disjunction in meiosis I vs II; gamete chromosome outcomes (n+1, n-1 counts) x3
- Independent assortment and genetic variability sources x2
- Mendelian ratios (3:1, 9:3:3:1, testcross, 1:2:1) x2
- Dihybrid cross with two-trait outcome counting x2
- Hardy-Weinberg equation (compute allele/genotype frequencies) x2
- Bottleneck effect; Pasteur/spontaneous generation as evolution-history items x1

### Section E: Animal tissues (8 Q, syl: "Anatomy and Physiology of animals and humans: Animal tissues")
- Epithelial tissue types by shape/layering and where each lines x4
- Tissue types in the kidney (which part is which epithelium) x2
- Matching tissue to function (cilia, microvilli, goblet cells) x2

### Section F: Cardiovascular, respiratory and blood physiology (17 Q, syl: "Anatomy and Physiology of animals and humans")
- Heart chambers, valves (semilunar vs AV), valve failure consequences x3
- Path of oxygenated vs deoxygenated blood (full circuit ordering) x3
- Anatomy of breathing; thoracic volume and pressure mechanics; diaphragm x4
- O2 and CO2 transport by hemoglobin; % dissolved vs bound vs bicarbonate x4
- Disease-to-system matching (cardio/resp) x3

### Section G: Digestive, endocrine, renal and nervous systems (21 Q, syl: "Anatomy and Physiology of animals and humans")
- Stomach and pancreatic digestive enzymes; bile production vs storage x4
- Endocrine: thyroid, parathyroid, pancreatic islets (hormone, target, feedback) x4
- Nephron function, ADH, calcium release, osteoclasts vs osteoblasts x4
- Neurons and their working (resting potential, impulse, synapse) x3
- CNS vs PNS divisions; eye structure/function x3
- Cranial protection (meninges/skull), important nerves and disorders x2
- Homeostasis (negative feedback logic) x1

### Section H: Bioenergetics and muscle (18 Q, syl: "Bioenergetics" / "Anatomy and Physiology")
- Glycolysis regulation; PFK-1 allosteric control x2
- Link reaction and pyruvate oxidation (CO2 release, NADH) x2
- Complete citric acid cycle (products per turn, location) x3
- ETC complexes I-IV: what each does, inhibitor action sites, H+ gradient, ATP synthase x4
- Roles of NAD+/FADH2/ATP as carriers x2
- Anaerobic respiration: glycolysis to lactic acid; yeast vs muscle fermentation x2
- Muscle contraction: actin/myosin, dystrophin, fiber type I vs II x3

## bank_chem_hard: 65 Q, 6 sections

### Section A: Organic chemistry and isomerism (13 Q, syl: "Fundamentals of organic chemistry")
- Enantiomers, epimers, anomers, diastereomers, constitutional isomers (classify pairs) x6
- Functional groups recognition and nomenclature x4
- Carbohydrate stereochemistry (D/L, alpha/beta glycosidic) x3

### Section B: Stoichiometry, moles and gas laws (14 Q, syl: "Chemical reactions and stoichiometry" / "Ideal gas laws")
- moles n = m/M; particles via Avogadro x3
- Molar volume at STP; cm3 to dm3 conversions x3
- Limiting reagent and yield x2
- Charles, Boyle, Gay-Lussac, combined; partial pressure (Dalton) x4
- Concentration after mixing/dilution x2

### Section C: Solutions, acids and bases (13 Q, syl: "Solutions" / "Acids and bases")
- pH and pOH from strong acid/base molarity x4
- pH dependence on temperature (Kw shifts) x2
- Dilution and pH change x2
- Buffer concept; hydrolysis x3
- Solubility and concentration expressions x2

### Section D: Redox and oxidation numbers (9 Q, syl: "Oxidation and reduction")
- Assign oxidation numbers (incl. C in organics, S/N oxoanions) x4
- Identify oxidizing/reducing agent x3
- Balance simple redox reactions x2

### Section E: Bonding, polarity and intermolecular forces (10 Q, syl: "Chemical bonding")
- IMF type vs boiling point ordering x3
- Molecular polarity from geometry (VSEPR-lite) x3
- Bond type identification (ionic/covalent/metallic) and properties x2
- Exothermic vs endothermic from bond energies or sign of ΔH x2

### Section F: Kinetics and catalysis (6 Q, syl: "Elements of chemical kinetics and catalysis")
- Rate constants, units, first-order decay logic x3
- Catalyst effect on activation energy vs equilibrium x2
- Collision-geometry reasoning x1

## bank_mpl_hard: 95 Q, 7 sections

### Section A: Algebra, functions and logarithms (16 Q, syl: "Number sets and algebra" / "Functions")
- Log equations and log properties x4
- Inequalities (sign study, rational inequality) x4
- Radicals and exponent manipulation x3
- Linear equations and systems (word-problem framing) x3
- Functions: domain, composite, inverse x2

### Section B: Geometry, trigonometry and graphs (12 Q, syl: "Geometry" / "Functions")
- Circle, cylinder, triangle formula problems (composite solids, areas) x4
- Clock angle problems x2
- Trig identities and notable values x3
- Slope/tangent/rate-of-change from graph (the "derivatives" slot; no formal calculus) x3

### Section C: Probability and combinatorics (8 Q, syl: "Probability and statistics")
- Dice problems (sums, at-least-one, ordered pairs) x4
- Complementary counting x2
- Simple combined events x2

### Section D: Unit conversion and arithmetic (4 Q, syl: "Physical quantities and their measurement" / "Number sets and algebra")
- Unit conversions (speed, area, volume prefixes) x2
- Fraction addition/subtraction with cancellation traps x2

### Section E: Physics: kinematics and dynamics (16 Q, syl: "Kinematics" / "Dynamics")
- Uniform vs non-uniform acceleration from tables/graphs x4
- Tangential vs centripetal acceleration in circular motion x3
- Deceleration and stopping distance x2
- Newton II with friction/weight x3
- Momentum/impulse x2
- Power from work/time x2

### Section F: Physics: fluids, thermal and electricity (19 Q, syl: "Fluid mechanics" / "Thermodynamics" / "Electricity and electromagnetism")
- Gauge vs absolute pressure; Stevin x3
- Density and floating x2
- q = mcΔT with mixing x3
- Power-energy-electricity (kWh, Joule heating) x3
- Ohm's law, series/parallel resistor networks x4
- Intensity as power per area, unit analysis x2
- Heat propagation modes x2

### Section G: Logic and argument analysis (20 Q, syl: "Logical Reasoning and Problems")
- Syllogisms (valid/invalid, Venn-based) x6
- Contradicting statements (who lies/tells truth) x5
- Converse/inverse fallacy identification x5
- Assumption/inference short arguments x4

## imat_mock9: 60 Q (kind mock, sections as IMAT)

Section A (9): 2 reading-comprehension, 4 hard logic (syllogism/constraint/fallacy), 3 GK-free reasoning.
Section B (23): biology drawn from the bank_bio_hard topic map, but integrated two-topic items (e.g. ETC inhibitor + fermentation; non-disjunction + Hardy-Weinberg).
Section C (15): chemistry from the bank_chem_hard map, calculation-heavy.
Section D (7): maths from the bank_mpl_hard map.
Section E (6): physics from the bank_mpl_hard map.
Target ~35/90. Must not reuse drill stems.

## Work-file manifest

Files live in tools/hard_bank_work/ named `<bank>__<SEC>.json` (mock9: `imat_mock9__A.json`, `__B.json`, `__C.json`, `__D.json`, `__E.json`). Format:

```json
{
  "bank": "bank_bio_hard",
  "section": "A",
  "questions": [
    {
      "stem": "...",
      "options": ["...", "...", "...", "...", "..."],
      "ans": "C",
      "exp": "...",
      "topic": "Chemistry of life · Amino acid behavior",
      "lik": "H",
      "syl": "3. Biology: The chemistry of living things"
    }
  ]
}
```

`syl` is stripped by the assembler and kept in audit_manifest.json for the auditors.

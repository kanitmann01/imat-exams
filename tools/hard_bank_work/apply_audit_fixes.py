# -*- coding: utf-8 -*-
"""Apply audit findings to the hard-bank work files (source of truth), then the
normal build chain regenerates everything. One-shot script, Sep 2026."""
import json
import os

WORK = os.path.dirname(os.path.abspath(__file__))


def load(name):
    with open(os.path.join(WORK, name), encoding="utf-8") as f:
        return json.load(f)


def save(name, d):
    with open(os.path.join(WORK, name), "w", encoding="utf-8", newline="\n") as f:
        json.dump(d, f, ensure_ascii=False, indent=1)


def q(f, i):
    return f["questions"][i - 1]


def repl(s, old, new):
    if old not in s:
        print("skip (already applied):", old[:50])
        return s
    return s.replace(old, new)


# ---- bio F: fix wrong key n82, relabel n80/n85/n86
f = load("bank_bio_hard__F.json")
q(f, 8)["ans"] = "B"
for i in (6, 11, 12):
    q(f, i)["lik"] = "M"
save("bank_bio_hard__F.json", f)

# ---- bio C: two-generation Meselson-Stahl rewrite (n40), relabel n45
f = load("bank_bio_hard__C.json")
q(f, 6).update({
    "stem": ("In a Meselson-Stahl type experiment, bacteria grown in 15N medium are shifted "
             "to 14N medium and allowed to replicate for exactly two rounds. Centrifugation "
             "then separates the DNA into two distinct bands: one at intermediate density and "
             "one fully light, with no heavy band anywhere in the tube. Which conclusion is justified?"),
    "options": [
        "Semiconservative replication is excluded, because it predicts a single intermediate band after two rounds.",
        "Only the conservative model is excluded, because the dispersive model still predicts two separate bands.",
        "Only the dispersive model is excluded, because the conservative model still predicts an intermediate band.",
        "Both the conservative and the dispersive models are excluded, which is the classic evidence for semiconservative replication.",
        "The experiment is uninterpretable, because no model predicts a light band after only two rounds.",
    ],
    "ans": "D",
    "exp": ("After two rounds semiconservative replication gives half hybrid molecules (the intermediate band) "
            "and half fully light molecules (the light band). The conservative model would still show a fully "
            "heavy band, and the dispersive model would give one single band of uniform intermediate density, "
            "so two bands with no heavy band rule out both rivals at once."),
    "topic": "Molecular genetics · Meselson-Stahl two-generation readout",
    "lik": "H",
})
q(f, 11)["lik"] = "M"
save("bank_bio_hard__C.json", f)

# ---- bio D/H relabels
f = load("bank_bio_hard__D.json")
q(f, 11)["lik"] = "M"
save("bank_bio_hard__D.json", f)
f = load("bank_bio_hard__H.json")
q(f, 16)["lik"] = "M"
save("bank_bio_hard__H.json", f)

# ---- chem A: relabel n10
f = load("bank_chem_hard__A.json")
q(f, 10)["lik"] = "M"
save("bank_chem_hard__A.json", f)

# ---- chem B: realistic pressures (n22), dilution twin fix (n27)
f = load("bank_chem_hard__B.json")
s = q(f, 9)
s["stem"] = repl(s["stem"], "the pressure is 200 kPa", "the pressure is 400 kPa")
s["stem"] = repl(s["stem"], "the pressure is 50 kPa", "the pressure is 100 kPa")
s["exp"] = repl(s["exp"], "(200/50)", "(400/100)")
q(f, 14).update({
    "stem": ("A solution is prepared by diluting 25 cm³ of a 2.0 mol/dm³ solution to a "
             "concentration of 0.10 mol/dm³. What is the final volume of the diluted solution?"),
    "options": ["25 cm³", "250 cm³", "450 cm³", "500 cm³", "1250 cm³"],
    "ans": "D",
    "exp": ("The moles of solute are constant at 25 × 2.0 = 50 mmol, so the final volume must be "
            "50/0.10 = 500 cm³. The 475 cm³ option subtracts the original 25 cm³, which answers a "
            "volume-of-water-added question, not a final-volume question."),
    "topic": "Stoichiometry · dilution to a target volume",
})
save("bank_chem_hard__B.json", f)

# ---- chem C: replace Kw twin (n33) with a numeric compute, fix strawman (n34)
f = load("bank_chem_hard__C.json")
q(f, 6).update({
    "stem": ("At 10 °C the ionic product of water has fallen to Kw = 3.0 × 10⁻¹⁵ mol² dm⁻⁶. "
             "What is the hydroxide ion concentration, [OH⁻], in pure water at 10 °C?"),
    "options": ["3.0 × 10⁻¹⁵ mol/dm³", "1.7 × 10⁻⁸ mol/dm³", "5.5 × 10⁻⁸ mol/dm³",
                "9.0 × 10⁻⁸ mol/dm³", "1.0 × 10⁻⁷ mol/dm³"],
    "ans": "C",
    "exp": ("In pure water [H⁺] = [OH⁻], so [OH⁻]² = Kw and [OH⁻] = √(3.0 × 10⁻¹⁵) = about "
            "5.5 × 10⁻⁸ mol/dm³. The 1.0 × 10⁻⁷ option keeps the 25 °C value, and 3.0 × 10⁻¹⁵ "
            "confuses the ionic product itself with a concentration."),
    "topic": "Acids and bases · ionic product of water",
    "lik": "H",
})
s = q(f, 7)
s["options"][2] = "It reaches pH 7, because a hundredfold dilution turns any strong acid neutral."
s["exp"] = ("The amount of HCl stays 1.0 × 10⁻³ mol, but the volume grows a hundredfold, so [H⁺] falls "
            "from 0.10 to 1.0 × 10⁻³ mol/dm³ and the pH climbs from 1.0 to 3.0. The pH 7 option confuses "
            "dilution with neutralisation, and the unchanged option ignores the concentration change.")
save("bank_chem_hard__C.json", f)

# ---- mpl A: replace log_9 27 twin (n3)
f = load("bank_mpl_hard__A.json")
q(f, 3).update({
    "stem": "What is the value of log₈ 32?",
    "options": ["4/3", "3/2", "5/3", "2", "3"],
    "ans": "C",
    "exp": ("Write both arguments as powers of 2: 8 = 2³ and 32 = 2⁵, so log₈ 32 = 5/3 by the change "
            "of base rule (log 32 / log 8 = 5 log 2 / (3 log 2)). The 3/2 option inverts the ratio, "
            "and 2 would solve 8² = 64, not 32."),
    "topic": "Algebra · change of base",
})
save("bank_mpl_hard__A.json", f)

# ---- mpl B: clock explanation provenance (n22)
f = load("bank_mpl_hard__B.json")
s = q(f, 6)
s["exp"] = repl(s["exp"],
                "The 7:52 and 8:00 options come from misreading the closing rate as 5 or 6 degrees per minute.",
                "The 7:52 option answers a gap of 80 degrees (5.5m = 290), and 8:00 exactly is what a closing rate of 5 degrees per minute would give.")
save("bank_mpl_hard__B.json", f)

# ---- mpl C: replace dice duplicate (n30), 4-coin repetition (n33), bag twin (n34)
f = load("bank_mpl_hard__C.json")
q(f, 2).update({
    "stem": "Three fair six-sided dice are rolled. What is the probability that all three show the same number?",
    "options": ["1/216", "1/108", "1/36", "1/18", "1/6"],
    "ans": "C",
    "exp": ("The first die can show anything, and each of the other two must then match it, so the "
            "probability is (1/6) × (1/6) = 1/36. The 1/216 option fixes all three faces in advance, "
            "and 1/6 is the chance of three copies of one particular named number."),
    "topic": "Probability · joint condition on three dice",
})
q(f, 5).update({
    "stem": "A fair coin is flipped four times. What is the probability of getting exactly two heads?",
    "options": ["1/8", "3/16", "1/4", "3/8", "1/2"],
    "ans": "D",
    "exp": ("There are 2⁴ = 16 equally likely sequences and C(4,2) = 6 of them contain exactly two "
            "heads, giving 6/16 = 3/8. The 1/4 option counts only a few of the six arrangements, and "
            "1/2 is the single-flip head probability."),
    "topic": "Probability · exactly-two-heads counting",
})
q(f, 6).update({
    "stem": ("An urn contains 3 red, 4 green and 5 blue balls. Two balls are drawn at random without "
             "replacement. What is the probability that at least one of them is green?"),
    "options": ["5/11", "14/33", "19/33", "2/3", "3/4"],
    "ans": "C",
    "exp": ("P(no green) = (8/12) × (7/11) = 14/33, so P(at least one green) = 1 − 14/33 = 19/33. "
            "The 14/33 option reports the complement instead of subtracting it, and 5/11 comes from "
            "drawing with replacement."),
    "topic": "Probability · complement without replacement",
})
save("bank_mpl_hard__C.json", f)

# ---- mpl D: replace trivial fraction sum (n40)
f = load("bank_mpl_hard__D.json")
q(f, 4).update({
    "stem": ("A water tank is one third full. After 40 more litres are poured in, the tank is "
             "three quarters full. What is the full capacity of the tank?"),
    "options": ["60 litres", "72 litres", "90 litres", "96 litres", "120 litres"],
    "ans": "D",
    "exp": ("The 40 litres fill the fraction 3/4 − 1/3 = 5/12 of the tank, so the capacity is "
            "40 × 12/5 = 96 litres. The 60 litre option assumes the 40 litres filled the remaining "
            "two thirds up to completely full, and 120 litres treats 40 litres as one third of the tank."),
    "topic": "Arithmetic · fractions of a quantity",
})
save("bank_mpl_hard__D.json", f)

# ---- mpl F: gauge wording (n59), floating twin (n61), calorimetry exp (n64), circuit diversify (n69)
f = load("bank_mpl_hard__F.json")
s = q(f, 3)
s["stem"] = repl(s["stem"], "and ignoring atmospheric pressure, what is the gauge pressure",
                 "what is the gauge pressure")
q(f, 5).update({
    "stem": ("A block of weight 6.0 N and density 750 kg/m3 floats freely in water of density "
             "1000 kg/m3. What is the apparent weight of the block while it floats?"),
    "options": ["0 N", "1.5 N", "2.0 N", "4.5 N", "6.0 N"],
    "ans": "A",
    "exp": ("While floating, the block is in equilibrium, so the upthrust equals its 6.0 N weight exactly "
            "(it displaces its own weight of water, submerging three quarters of its volume). The apparent "
            "weight is therefore zero; the 1.5 N option subtracts only three quarters of the weight."),
    "topic": "Physics · floating equilibrium",
})
s = q(f, 8)
s["exp"] = repl(s["exp"],
                "The 0.70 kg option uses the 70 K span between the two starting temperatures as the temperature drop of the hot water, though it only cools by 50 K.",
                "The 0.70 kg option uses the 70 K span between the starting temperatures as the warming of the cold water, though the cold water rises by only 20 K.")
q(f, 13).update({
    "stem": ("A battery of negligible internal resistance supplies 24 V to an 8.0 Ω resistor connected "
             "in series with a parallel combination of a 12 Ω resistor and a 6.0 Ω resistor. What "
             "current does the battery supply?"),
    "options": ["1.5 A", "2.0 A", "2.4 A", "3.0 A", "6.0 A"],
    "ans": "B",
    "exp": ("The parallel pair has resistance (12 × 6.0)/(12 + 6.0) = 4.0 Ω, so the total is "
            "8.0 + 4.0 = 12 Ω and I = 24/12 = 2.0 A. The 3.0 A option ignores the parallel section "
            "entirely (24/8.0), and 1.5 A comes from doubling the total resistance."),
    "topic": "Physics · series-parallel network",
})
save("bank_mpl_hard__F.json", f)

# ---- mock9 B: garbled distractor (n21), stab twin (n24), oximeter fact (n25)
f = load("imat_mock9__B.json")
s = q(f, 12)
s["options"][3] = "Glycolysis continues normally, because glycolysis never needs NAD+ at any step."
s = q(f, 15)
s["stem"] = repl(s["stem"], "A stab wound lets air enter the right pleural cavity",
                 "A fractured rib tears the lung surface and lets air leak into the right pleural cavity")
s["topic"] = s["topic"].replace("stab", "lung tear")
s = q(f, 16)
if "pulse oximeter cannot distinguish" not in s["stem"]:
    s["stem"] = repl(s["stem"], "Which statement is correct?",
                     "A pulse oximeter cannot distinguish carboxyhaemoglobin from oxyhaemoglobin. Which statement is correct?")
save("imat_mock9__B.json", f)

# ---- mock9 C: exp provenance (n34), dilution twin re-skill (n37)
f = load("imat_mock9__C.json")
s = q(f, 2)
s["exp"] = ("n(CH₄) = 4.8/16 = 0.30 mol and n(O₂) = 4.8/32 = 0.15 mol, so the 1:2 equation makes oxygen "
            "limiting: only 0.075 mol of methane burns, giving 0.075 mol of CO₂, that is 0.075 × 22.4 = "
            "1.68 dm3, and 0.225 mol (3.6 g) of methane remains. The 3.36 dm3 options take the 0.15 mol of "
            "oxygen as producing 0.15 mol of CO₂, forgetting that 2 mol of O₂ are needed per mol of CO₂ formed.")
q(f, 5).update({
    "stem": ("20 cm3 of 0.010 mol/dm3 hydrochloric acid, a strong acid that is fully ionised, is diluted "
             "with water to a final volume of 400 cm3. Taking log10 2 = 0.30, what is the pH of the "
             "diluted solution?"),
    "options": ["2.30", "3.00", "3.30", "3.70", "4.00"],
    "ans": "C",
    "exp": ("The initial pH is 2.00. The dilution factor is 400/20 = 20, so the pH rises by "
            "log10 20 = log10 2 + 1 = 1.30, giving pH 3.30; equivalently [H+] falls from 1.0 × 10^-2 "
            "to 5.0 × 10^-4 mol/dm3. The 4.00 option assumes a tenfold dilution, and 2.30 would need a "
            "further tenfold concentration."),
    "topic": "Chemistry · dilution with a non-tenfold factor",
    "lik": "H",
})
save("imat_mock9__C.json", f)

# ---- mock9 D: log givens twin (n48), clock twin (n54)
f = load("imat_mock9__D.json")
q(f, 1).update({
    "stem": "Given that log₁₀ 5 = 0.70 and log₁₀ 3 = 0.48, what is the value of log₁₀ 45?",
    "options": ["1.18", "1.48", "1.66", "1.88", "2.18"],
    "ans": "C",
    "exp": ("45 = 3² × 5, so log₁₀ 45 = 2 log₁₀ 3 + log₁₀ 5 = 0.96 + 0.70 = 1.66. The 1.88 option is "
            "log₁₀ 75 (3 × 5²), and 1.18 is log₁₀ 15 (3 × 5)."),
    "topic": "Maths · logarithm properties",
})
q(f, 7).update({
    "stem": ("For two events A and B, P(A) = 0.5, P(B) = 0.4 and P(A and B) = 0.2. What is P(A or B)?"),
    "options": ["0.2", "0.6", "0.7", "0.8", "0.9"],
    "ans": "C",
    "exp": ("The addition rule gives P(A or B) = P(A) + P(B) - P(A and B) = 0.5 + 0.4 - 0.2 = 0.7. "
            "The 0.9 option adds without subtracting the overlap, and 0.2 is the overlap itself."),
    "topic": "Maths · probability of combined events",
})
save("imat_mock9__D.json", f)

# ---- mock9 E: circuit value diversify (n57)
f = load("imat_mock9__E.json")
q(f, 3).update({
    "stem": ("A battery of negligible internal resistance supplies 24 V to an 8.0 Ω resistor connected "
             "in series with a parallel combination of a 12 Ω resistor and a 6.0 Ω resistor. What "
             "current does the battery supply?"),
    "options": ["1.5 A", "2.0 A", "2.4 A", "3.0 A", "6.0 A"],
    "ans": "B",
    "exp": ("The parallel pair has resistance (12 × 6.0)/(12 + 6.0) = 4.0 Ω, so the total is "
            "8.0 + 4.0 = 12 Ω and I = 24/12 = 2.0 A. The 3.0 A option ignores the parallel section "
            "entirely (24/8.0), and 1.5 A comes from doubling the total resistance."),
    "topic": "Physics · series-parallel network",
})
save("imat_mock9__E.json", f)

# ---- topic domain normalization across all work files
DOMAIN = {
    ("bank_bio_hard", None): "Biology",
    ("bank_chem_hard", None): "Chemistry",
    ("bank_mpl_hard", "A"): "Maths", ("bank_mpl_hard", "B"): "Maths",
    ("bank_mpl_hard", "C"): "Maths", ("bank_mpl_hard", "D"): "Maths",
    ("bank_mpl_hard", "E"): "Physics", ("bank_mpl_hard", "F"): "Physics",
    ("bank_mpl_hard", "G"): "Logic",
    ("imat_mock9", "A"): "Logic", ("imat_mock9", "B"): "Biology",
    ("imat_mock9", "C"): "Chemistry", ("imat_mock9", "D"): "Maths",
    ("imat_mock9", "E"): "Physics",
}
BANK_FILES = [n for n in os.listdir(WORK) if n.startswith(("bank_", "imat_mock9")) and n.endswith(".json")]
changed = 0
for name in sorted(BANK_FILES):
    f = load(name)
    bank = f["bank"]
    sec = f["section"]
    for item in f["questions"]:
        t = item["topic"]
        if bank == "imat_mock9" and sec == "A" and t == "Reading comprehension":
            continue
        dom = DOMAIN.get((bank, sec)) or DOMAIN[(bank, None)]
        if " · " in t:
            new = dom + t[t.index(" · "):]
        else:
            new = dom + " · " + t
        if new != t:
            item["topic"] = new
            changed += 1
    save(name, f)

print("topic normalizations:", changed)
print("ALL FIXES APPLIED")

#!/usr/bin/env python3
"""Build clean, leak-free question banks from the legacy self-contained exam HTML files.

Pipeline: extract EXAM JSON -> validate -> scrub (S1-S5) -> shuffle-safety -> rebalance -> emit.
Deterministic: same inputs and overrides produce byte-identical outputs.

Usage:
  python tools/build_banks.py --src <02_EXAMS/HTML dir> --out <data dir> [--check]
"""
import argparse
import hashlib
import json
import os
import re
import sys

# ---------------------------------------------------------------- constants

TARGETS = {
    "imat_mock1": 47, "imat_mock2": 47, "imat_mock3": 45, "imat_mock4": 43,
    "imat_mock5": 42, "imat_mock6": 45, "imat_mock7": 38, "imat_mock8": 44,
    "GK_Drill_100": None, "Repair_Drill_1": None,
}
KINDS = {
    "imat_mock1": "mock", "imat_mock2": "mock", "imat_mock3": "mock", "imat_mock4": "mock",
    "imat_mock5": "mock", "imat_mock6": "mock", "imat_mock7": "mock", "imat_mock8": "mock",
    "GK_Drill_100": "gk_drill", "Repair_Drill_1": "repair_drill",
}
EXPECTED_COUNTS = {"mock": 60, "gk_drill": 100, "repair_drill": 70}

SECTION_LABELS = {  # short labels, keyed "exam:code" fallback to generic per-kind defaults below
}
SHORT_LABELS = {
    "A": "Reasoning", "B": "Biology", "C": "Chemistry", "D": "Mathematics", "E": "Physics",
    "F": "Physics", "G": "Logic", "H": "Current",
}
DRILL_GK_SHORT = {"A": "Reading", "B": "Constitution", "C": "EU", "D": "History",
                  "E": "Art", "F": "Letters", "G": "Science", "H": "Current"}
DRILL_REPAIR_SHORT = {"A": "Respiration", "B": "Body Systems", "C": "Cell & Division",
                      "D": "Quant Chem", "E": "Maths", "F": "Physics", "G": "Logic"}

INTERNAL_TAG_KEYWORDS = [
    "formula recall", "common trap", "new entrant", "repeat offender",
    "as in 20", "forecast",
]
UNSAFE_PATTERNS = [
    re.compile(r"\b(all|none) of (the )?above\b", re.I),
    re.compile(r"\b(both|all|none)\s+(of\s+)?(options?\s+|statements?\s+|answers?\s+)?"
               r"[A-E]\s*(,|and|&|\+|or)\s*[A-E]\b", re.I),
]
STEM_STATEMENTS = re.compile(r"which of the following statements", re.I)
OPT_STATEMENT = re.compile(r"^\s*(statement|option)\b", re.I)

# ---------------------------------------------------------------- scrub rules


def scrub_field(text, log, exam_id, qn, field):
    """Apply S1-S5 scrub rules to one field; log every change."""
    if text is None:
        return None, {"emphasisRemoved": 0, "tagsRemoved": 0, "linesRemoved": 0}, False
    orig = text
    counters = {"emphasisRemoved": 0, "tagsRemoved": 0, "linesRemoved": 0}

    # S1 emphasis removal (repeat until stable)
    def strip_emph(s):
        before = s
        s = re.sub(r"\*\*(.+?)\*\*", r"\1", s, flags=re.S)
        s = re.sub(r"(?<!\*)\*(?=\S)([^*\n]+?)(?<=\S)\*(?!\*)", r"\1", s)
        s = re.sub(r"__(\S(?:[^_\n]*?\S)?)__", r"\1", s)
        s = re.sub(r"(?<![\w_])_(\w+)_(?![\w_])", r"\1", s)
        s = s.replace("`", "")
        if s != before:
            counters["emphasisRemoved"] += 1
            s = strip_emph(s)
        return s

    text = strip_emph(text)

    # S2 directive artifact removal (only for stems with a quoted passage)
    if field == "stem" and '"' in text:
        kept = []
        for line in text.split("\n"):
            stripped = line.strip()
            if stripped in ("Read:", "Read the passage.",
                            "Read the following passage and answer the question."):
                counters["linesRemoved"] += 1
                log.append((exam_id, qn, field, "removed directive line: " + stripped))
                continue
            kept.append(line)
        text = "\n".join(kept)

    # S3 internal calibration tag removal
    def tag_hit(inner):
        if re.search(r"[-\u2013\u2014]\s+(?:\w+\s+)?[HML]\b(?![a-z])", inner):
            return True
        low = inner.lower()
        return any(k in low for k in INTERNAL_TAG_KEYWORDS)

    def remove_tags(s):
        out, pos = [], 0
        for m in re.finditer(r"\[[^\]\n]*\]", s):
            inner = m.group(0)[1:-1]
            if tag_hit(inner):
                counters["tagsRemoved"] += 1
                log.append((exam_id, qn, field, "removed internal tag: " + m.group(0)))
                out.append(s[pos:m.start()])
                pos = m.end()
        out.append(s[pos:])
        return "".join(out)

    text = remove_tags(text)
    text = re.sub(r"  +", " ", text)
    text = re.sub(r" +\n", "\n", text)

    # S5 whitespace tidy
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    changed = text != orig
    return text, counters, changed


# ---------------------------------------------------------------- extraction


def extract_exam(html):
    m = re.search(r"const EXAM = (\{.*?\});\n", html, re.S)
    if not m:
        raise ValueError("EXAM JSON not found")
    return json.loads(m.group(1))


def extract_sections(html, exam_id):
    """Parse SEC_RANGES and SECTION_LABEL / SECTION_OF out of the engine JS."""
    ranges = {}
    m = re.search(r"SEC_RANGES\s*=\s*\{(.*?)\}", html, re.S)
    if m:
        for code, lo, hi in re.findall(r"([A-H])\s*:\s*\[\s*(\d+)\s*,\s*(\d+)\s*\]", m.group(1)):
            ranges[code] = (int(lo), int(hi))
    labels = {}
    m = re.search(r"SECTION_LABEL\s*=\s*\{(.*?)\}", html, re.S)
    if m:
        for code, lab in re.findall(r"([A-H])\s*:\s*\"([^\"]+)\"", m.group(1)):
            labels[code] = lab
    long_labels = {}
    # long labels: prefer full "Section X - ..." strings found in engine source
    for code in ranges:
        found = re.search(r"Section %s\s*[-\u2013\u2014]\s*([A-Za-z0-9 &/,]+)" % code, html)
        long_labels[code] = ("Section %s - %s" % (code, found.group(1).strip())) if found else \
                            ("Section %s" % code)
    return ranges, labels, long_labels


# ---------------------------------------------------------------- shuffle safety


def detect_unsafe(q, overrides, exam_id):
    qn = q["n"]
    ov = overrides.get(exam_id, {})
    if qn in ov.get("unsafe", []):
        return "manual override: unsafe"
    if qn in ov.get("safe", []):
        return None
    hay = q["stem"] + "\n" + "\n".join(q["options"])
    for pat in UNSAFE_PATTERNS:
        if pat.search(hay):
            return "pattern: " + pat.pattern[:50]
    if STEM_STATEMENTS.search(q["stem"]) and any(OPT_STATEMENT.match(o) for o in q["options"]):
        return "stem asks about statements"
    return None


# ---------------------------------------------------------------- rebalance


def mulberry32(seed):
    state = [seed & 0xFFFFFFFF]

    def rnd():
        state[0] = (state[0] + 0x6D2B79F5) & 0xFFFFFFFF
        t = state[0]
        t = (t ^ (t >> 15)) * (t | 1) & 0xFFFFFFFF
        t = (t ^ (t + (t ^ (t >> 7)) * (t | 61) & 0xFFFFFFFF)) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296.0
    return rnd


def stable_hash(*parts):
    h = hashlib.sha256("|".join(str(p) for p in parts).encode("utf-8")).hexdigest()
    return int(h[:8], 16)


def compute_perm_for_question(bank, q, assigned_letter, rnd):
    """Build perm so the correct original option lands at assigned_letter's position."""
    correct_idx = ord(q["ans"]) - ord("A")
    target_pos = ord(assigned_letter) - ord("A")
    others = [i for i in range(5) if i != correct_idx]
    # Fisher-Yates with rnd
    for i in range(len(others) - 1, 0, -1):
        j = int(rnd() * (i + 1))
        others[i], others[j] = others[j], others[i]
    perm = [None] * 5
    perm[target_pos] = correct_idx
    fill = [p for p in range(5) if p != target_pos]
    for pos, idx in zip(fill, others):
        perm[pos] = idx
    return perm


SUP = {"⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6",
       "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "-"}
SCI_RE = re.compile(r"[×x*]\s*10\s*(⁻?[⁰¹²³⁴⁵⁶⁷⁸⁹]+|\^?[-+]?\d+)")
NUM_RE = re.compile(r"^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))(?:\s*/\s*([+-]?\d+(?:\.\d+)?))?(?:\s*e([+-]?\d+))?\s*(.*)$")


def numeric_order(options):
    """If all 5 options are the same plain numeric quantity (optional shared unit),
    return the ascending display order (list of original indices), else None.
    Real IMAT papers list numeric options in ascending order; permuting them would
    read as a giveaway, so their correct letter is fixed by rank instead."""
    sup_digits = str.maketrans(SUP)
    vals = []
    units = []
    for o in options:
        # sci notation first (superscript or caret exponent), then remaining superscripts
        s = SCI_RE.sub(
            lambda m: "e" + m.group(1).translate(sup_digits).lstrip("+"), o)
        s = "".join(SUP.get(ch, ch) for ch in s)
        m = NUM_RE.match(s)
        if not m:
            return None
        base = float(m.group(1))
        if m.group(2) is not None:
            denom = float(m.group(2))
            if denom == 0:
                return None
            base = base / denom
        if m.group(3) is not None:
            base = base * (10 ** int(m.group(3)))
        unit = m.group(4).strip()
        vals.append(base)
        units.append(unit)
    if len(set(units)) != 1:
        return None
    return sorted(range(5), key=lambda i: (vals[i], i))


def rebalance(exam_id, questions, unsafe_map, attempt_seed=0, relax_bound=0):
    """Balance letters: numeric questions are fixed ascending (letter by rank),
    shuffle-unsafe keep their original letter; remaining questions are assigned
    greedily to the letter furthest below target, tie-broken by seeded PRNG.
    Returns {qn: perm or None} and letter counts."""
    n = len(questions)
    base, rem = n // 5, n % 5
    target = {c: base for c in "ABCDE"}
    for i in range(rem):
        target["ABCDE"[i]] += 1

    assigned = {c: 0 for c in "ABCDE"}
    fixed = {}      # qn -> letter (numeric or unsafe)
    numeric_perm = {}
    for q in questions:
        qn = q["n"]
        if qn in unsafe_map:
            fixed[qn] = q["ans"]
        else:
            order = numeric_order(q["options"])
            if order is not None:
                correct_idx = ord(q["ans"]) - ord("A")
                letter = "ABCDE"[order.index(correct_idx)]
                fixed[qn] = letter
                numeric_perm[qn] = order
    for qn, letter in fixed.items():
        assigned[letter] += 1

    relaxed = [c for c in "ABCDE" if assigned[c] > target[c] + relax_bound]
    if relaxed and relax_bound == 0:
        raise ValueError("%s: fixed letters exceed target for %s; pass relax_bound" % (exam_id, relaxed))

    perms = {}
    for q in questions:
        qn = q["n"]
        if qn in unsafe_map:
            perms[qn] = None
            continue
        if qn in numeric_perm:
            perms[qn] = numeric_perm[qn]
            continue
        # pick the letter furthest below target; ties broken by seeded PRNG
        need = {c: target[c] - assigned[c] for c in "ABCDE"}
        best = max(need.values())
        cands = [c for c in "ABCDE" if need[c] == best]
        rnd = mulberry32(stable_hash(exam_id, qn, attempt_seed))
        letter = cands[int(rnd() * len(cands)) % len(cands)]
        rnd2 = mulberry32(stable_hash(exam_id, qn, attempt_seed, "perm"))
        perms[qn] = compute_perm_for_question({}, q, letter, rnd2)
        assigned[letter] += 1
    return perms, assigned


# ---------------------------------------------------------------- build


def build_bank(src_html, exam_id, overrides, log):
    exam = extract_exam(src_html)
    questions = exam["questions"]
    kind = KINDS[exam_id]
    expected = EXPECTED_COUNTS[kind]
    assert len(questions) == expected, "%s: %d questions, expected %d" % (exam_id, len(questions), expected)

    ranges, short_labels, long_labels = extract_sections(src_html, exam_id)
    assert ranges, "%s: SEC_RANGES not found" % exam_id
    # validate ranges contiguous, cover 1..n
    covered = []
    for code in sorted(ranges):
        lo, hi = ranges[code]
        covered += list(range(lo, hi + 1))
    assert covered == list(range(1, expected + 1)), "%s: section ranges do not cover 1..%d" % (exam_id, expected)

    sections = []
    for code in sorted(ranges):
        lo, hi = ranges[code]
        if kind == "gk_drill":
            short = DRILL_GK_SHORT[code]
        elif kind == "repair_drill":
            short = DRILL_REPAIR_SHORT[code]
        else:
            short = SHORT_LABELS.get(code, code)
        sections.append({"code": code, "from": lo, "to": hi,
                         "label": long_labels.get(code, "Section %s" % code), "short": short})

    scrub_totals = {"emphasisRemoved": 0, "tagsRemoved": 0, "linesRemoved": 0}
    clean_questions = []
    for q in questions:
        assert len(q["options"]) == 5, "%s Q%d: %d options" % (exam_id, q["n"], len(q["options"]))
        assert q["ans"] in "ABCDE", "%s Q%d bad ans" % (exam_id, q["n"])
        assert q.get("lik") in ("H", "M", "L"), "%s Q%d bad lik" % (exam_id, q["n"])
        assert q["stem"].strip() and q["exp"].strip(), "%s Q%d empty stem/exp" % (exam_id, q["n"])
        scrubbed = {"n": q["n"], "topic": q["topic"], "lik": q["lik"], "ans": q["ans"]}
        for field in ("stem", "exp"):
            new, counters, _ = scrub_field(q[field], log, exam_id, q["n"], field)
            scrubbed[field] = new
            for k in scrub_totals:
                scrub_totals[k] += counters[k]
        opts = []
        for i, o in enumerate(q["options"]):
            new, counters, _ = scrub_field(o, log, exam_id, q["n"], "option%d" % i)
            opts.append(new)
            for k in scrub_totals:
                scrub_totals[k] += counters[k]
        scrubbed["options"] = opts
        clean_questions.append(scrubbed)

    unsafe_map = {}
    for q in clean_questions:
        reason = detect_unsafe(q, overrides, exam_id)
        if reason:
            unsafe_map[q["n"]] = reason
            log.append((exam_id, q["n"], "shuffle", "UNSAFE: " + reason))

    # bankVersion from canonical pre-permutation content
    canon = json.dumps({"id": exam_id, "title": exam["title"], "sections": sections,
                        "questions": clean_questions}, sort_keys=True, ensure_ascii=False)
    bank_version = "b" + hashlib.sha256(canon.encode("utf-8")).hexdigest()[:8]

    perms, counts = rebalance(exam_id, clean_questions, unsafe_map, attempt_seed=0)

    out_questions = []
    for q in clean_questions:
        out_questions.append({
            "n": q["n"], "stem": q["stem"], "options": q["options"], "ans": q["ans"],
            "exp": q["exp"],
            "perm": perms[q["n"]], "shuffleSafe": q["n"] not in unsafe_map,
            "shuffleUnsafeReason": unsafe_map.get(q["n"]),
            "topic": q["topic"], "lik": q["lik"],
        })

    bank = {
        "schema": 1,
        "id": exam_id,
        "title": exam["title"],
        "kind": kind,
        "durationSec": 6000,
        "maxTenths": len(questions) * 15,
        "targetScore": TARGETS[exam_id],
        "sections": sections,
        "bankVersion": bank_version,
        "questions": out_questions,
    }
    return bank, counts, unsafe_map, scrub_totals


# residual emphasis patterns mirror the S1 scrub rules; bare underscore blanks (____) are content
RESIDUAL_PATTERNS = [
    re.compile(r"\*\*[^*\n]+\*\*"),
    re.compile(r"(?<!\*)\*(?=\S)([^*\n]+?)(?<=\S)\*(?!\*)"),
    re.compile(r"`"),
    re.compile(r"__(?=\S)([^_\n]*?\S)__"),
]


def check_invariants(bank, counts, unsafe_map):
    problems = []
    warnings = []
    n = len(bank["questions"])
    base, rem = n // 5, n % 5
    for i, c in enumerate("ABCDE"):
        target = base + (1 if i < rem else 0)
        if not (target - 2 <= counts[c] <= target + 2):
            problems.append("%s: letter %s count %d outside hard bounds [%d,%d]"
                            % (bank["id"], c, counts[c], target - 2, target + 2))
        elif not (target - 1 <= counts[c] <= target + 1):
            warnings.append("%s: letter %s count %d outside soft bounds [%d,%d] "
                            "(numeric/unsafe fixed letters)"
                            % (bank["id"], c, counts[c], target - 1, target + 1))
    # AL-4 postcondition
    for q in bank["questions"]:
        for field in ("stem", "exp"):
            for pat in RESIDUAL_PATTERNS:
                if pat.search(q[field]):
                    problems.append("%s Q%d %s: residual emphasis marker %r" % (bank["id"], q["n"], field, pat.search(q[field]).group(0)))
        for o in q["options"]:
            for pat in RESIDUAL_PATTERNS:
                if pat.search(o):
                    problems.append("%s Q%d option: residual emphasis marker %r" % (bank["id"], q["n"], pat.search(o).group(0)))
    # perms valid
    for q in bank["questions"]:
        p = q["perm"]
        if p is None:
            continue
        if sorted(p) != [0, 1, 2, 3, 4]:
            problems.append("%s Q%d: perm not a bijection" % (bank["id"], q["n"]))
    return problems, warnings


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    tools_dir = os.path.dirname(os.path.abspath(__file__))
    ov_path = os.path.join(tools_dir, "shuffle_overrides.json")
    overrides = {}
    if os.path.exists(ov_path):
        with open(ov_path, encoding="utf-8") as f:
            overrides = json.load(f)

    src_files = {
        "imat_mock%d" % i: os.path.join(args.src, "Mock_Exam_%d.html" % i) for i in range(1, 9)
    }
    src_files["GK_Drill_100"] = os.path.join(args.src, "GK_Drill_100.html")
    src_files["Repair_Drill_1"] = os.path.join(args.src, "Repair_Drill_1.html")

    log = []
    all_problems = []
    all_warnings = []
    manifest = {"schema": 1, "exams": []}
    dist_rows = []
    banks = {}
    for exam_id in ["imat_mock%d" % i for i in range(1, 9)] + ["GK_Drill_100", "Repair_Drill_1"]:
        with open(src_files[exam_id], encoding="utf-8") as f:
            html = f.read()
        bank, counts, unsafe_map, scrub_totals = build_bank(html, exam_id, overrides, log)
        problems, warns = check_invariants(bank, counts, unsafe_map)
        all_problems += problems
        all_warnings += ["WARN " + w for w in warns]
        banks[exam_id] = bank
        manifest["exams"].append({
            "id": bank["id"], "title": bank["title"], "kind": bank["kind"],
            "qCount": len(bank["questions"]), "durationSec": bank["durationSec"],
            "maxTenths": bank["maxTenths"], "targetScore": bank["targetScore"],
            "sectionCount": len(bank["sections"]), "bankVersion": bank["bankVersion"],
        })
        dist_rows.append((exam_id, counts, len(unsafe_map), scrub_totals))

    if all_warnings:
        for w in all_warnings:
            print(w)
    if all_problems:
        print("INVARIANT VIOLATIONS:")
        for p in all_problems:
            print("  " + p)
        sys.exit(1)

    if args.check:
        print("check OK: all invariants pass (no files written)")
        return

    os.makedirs(args.out, exist_ok=True)
    for exam_id, bank in banks.items():
        path = os.path.join(args.out, exam_id + ".json")
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            json.dump(bank, f, ensure_ascii=False, indent=1, sort_keys=False)
            f.write("\n")
    with open(os.path.join(args.out, "exams.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)
        f.write("\n")

    report = ["# build_banks report", ""]
    report.append("| exam | A | B | C | D | E | unsafe | scrub(e/t/l) |")
    report.append("|---|---|---|---|---|---|---|---|")
    for exam_id, counts, n_unsafe, st in dist_rows:
        report.append("| %s | %d | %d | %d | %d | %d | %d | %d/%d/%d |" % (
            exam_id, counts["A"], counts["B"], counts["C"], counts["D"], counts["E"],
            n_unsafe, st["emphasisRemoved"], st["tagsRemoved"], st["linesRemoved"]))
    report.append("")
    report.append("## Change log")
    for exam_id, qn, field, msg in log:
        report.append("- %s Q%s %s: %s" % (exam_id, qn, field, msg))
    with open(os.path.join(tools_dir, "build_report.md"), "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(report) + "\n")

    for exam_id, counts, n_unsafe, st in dist_rows:
        print("%-16s dist=%s unsafe=%d scrub=%s" % (exam_id, counts, n_unsafe, st))
    print("wrote %d banks + exams.json -> %s" % (len(banks), args.out))


if __name__ == "__main__":
    main()

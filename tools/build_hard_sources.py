#!/usr/bin/env python3
"""Assemble hard-bank work JSONs (tools/hard_bank_work/<bank>__<SEC>.json) into
legacy self-contained exam HTML sources in 02_EXAMS/HTML, ready for build_banks.py.

Also writes tools/hard_bank_work/audit_manifest.json mapping each question to its
section and Annex A syllabus bullet (for the independent content auditors).

Usage: python tools/build_hard_sources.py [--check]
"""
import argparse
import json
import os
import re
import sys

TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
WORK_DIR = os.path.join(TOOLS_DIR, "hard_bank_work")
HTML_DIR = os.path.normpath(os.path.join(TOOLS_DIR, "..", "..", "IMAT_Research_2026", "02_EXAMS", "HTML"))
TEMPLATE = os.path.join(HTML_DIR, "Mock_Exam_8.html")

OLD_TITLE = 'IMAT MOCK EXAM 8 \u2014 "Final Rehearsal"'

# bank -> (html filename, id, title, durationSec standalone label, sections)
# sections: list of (code, short label, long label, expected question count)
PLAN = {
    "bank_bio_hard": ("Hard_Bank_Biology.html", "bank_bio_hard",
                      "IMAT QUESTION BANK: Biology (Medium-Hard)", 130, [
        ("A", "Molecules", "Chemistry of life and biological molecules", 18),
        ("B", "Cells", "Cells, organelles and membrane transport", 16),
        ("C", "MolGen", "Molecular genetics and biotechnology", 14),
        ("D", "Heredity", "Cell cycle, heredity and evolution", 18),
        ("E", "Tissues", "Animal tissues", 8),
        ("F", "CardioResp", "Cardiovascular, respiratory and blood physiology", 17),
        ("G", "Systems", "Digestive, endocrine, renal and nervous systems", 21),
        ("H", "BioEnergy", "Bioenergetics and muscle", 18),
    ]),
    "bank_chem_hard": ("Hard_Bank_Chemistry.html", "bank_chem_hard",
                       "IMAT QUESTION BANK: Chemistry (Medium-Hard)", 65, [
        ("A", "Organic", "Organic chemistry and isomerism", 13),
        ("B", "StoichGas", "Stoichiometry, moles and gas laws", 14),
        ("C", "AcidsBases", "Solutions, acids and bases", 13),
        ("D", "Redox", "Redox and oxidation numbers", 9),
        ("E", "Bonding", "Bonding, polarity and intermolecular forces", 10),
        ("F", "Kinetics", "Kinetics and catalysis", 6),
    ]),
    "bank_mpl_hard": ("Hard_Bank_Maths_Physics_Logic.html", "bank_mpl_hard",
                      "IMAT QUESTION BANK: Maths, Physics and Logic (Medium-Hard)", 95, [
        ("A", "Algebra", "Algebra, functions and logarithms", 16),
        ("B", "Geometry", "Geometry, trigonometry and graphs", 12),
        ("C", "Prob", "Probability and combinatorics", 8),
        ("D", "Units", "Unit conversion and arithmetic", 4),
        ("E", "Kinematics", "Kinematics and dynamics", 16),
        ("F", "FluidsThermo", "Fluids, thermal physics and electricity", 19),
        ("G", "Logic", "Logic and argument analysis", 20),
    ]),
    "imat_mock9": ("Mock_Exam_9.html", "imat_mock9",
                   "IMAT MOCK EXAM 9: Hard Calibration", 60, [
        ("A", "Reasoning", "Logical Reasoning & Reading", 9),
        ("B", "Biology", "Biology", 23),
        ("C", "Chemistry", "Chemistry", 15),
        ("D", "Mathematics", "Mathematics", 7),
        ("E", "Physics", "Physics", 6),
    ]),
    "GK_Bank_Hard": ("Hard_Bank_GK.html", "GK_Bank_Hard",
                     "IMAT QUESTION BANK: General Knowledge (Medium-Hard)", 60, [
        ("A", "History", "World and European history", 10),
        ("B", "Lit", "World literature", 8),
        ("C", "Intl", "International institutions and law", 8),
        ("D", "Civics", "Economics and citizenship", 8),
        ("E", "Italy", "Italian institutions", 6),
        ("F", "HistSci", "History of science", 7),
        ("G", "Geo", "Geography", 6),
        ("H", "Society", "Philosophy, religion and society", 5),
        ("I", "Current", "Recent settled events", 2),
    ]),
}

FORBIDDEN = [
    (re.compile("\u2014"), "em dash"),
    (re.compile("\u2013"), "en dash"),
    (re.compile(r"\*\*"), "double asterisk"),
    (re.compile(r"(?<!\*)\*(?=\S)([^*\n]+?)(?<=\S)\*(?!\*)"), "single asterisk"),
    (re.compile(r"`"), "backtick"),
    (re.compile(r"__(?=\S)([^_\n]*?\S)__"), "double underscore"),
]
UNSAFE_PATTERNS = [
    (re.compile(r"\b(all|none) of (the )?above\b", re.I), "all/none of the above"),
    (re.compile(r"\b(both|all|none)\s+(of\s+)?(options?\s+|statements?\s+|answers?\s+)?"
                r"[A-E]\s*(,|and|&|\+|or)\s*[A-E]\b", re.I), "options referenced by letter"),
]
STEM_STATEMENTS = re.compile(r"which of the following statements", re.I)
OPT_STATEMENT = re.compile(r"^\s*(statement|option)\b", re.I)


def validate_question(bank, sec, idx, q, problems):
    where = "%s %s#%d" % (bank, sec, idx)
    for field in ("stem", "ans", "exp", "topic", "lik", "syl"):
        if not q.get(field):
            problems.append("%s: missing %s" % (where, field))
    opts = q.get("options") or []
    if len(opts) != 5:
        problems.append("%s: %d options" % (where, len(opts)))
    if q.get("ans") not in "ABCDE":
        problems.append("%s: bad ans %r" % (where, q.get("ans")))
    if q.get("lik") not in ("H", "M"):
        problems.append("%s: lik must be H or M, got %r" % (where, q.get("lik")))
    texts = [q.get("stem", ""), q.get("exp", ""), q.get("topic", ""), q.get("syl", "")] + opts
    for t in texts:
        for pat, name in FORBIDDEN:
            if pat.search(t):
                problems.append("%s: forbidden marker %s in %r" % (where, name, t[:60]))
    hay = q.get("stem", "") + "\n" + "\n".join(str(o) for o in opts)
    for pat, name in UNSAFE_PATTERNS:
        if pat.search(hay):
            problems.append("%s: shuffle-unsafe %s (rewrite the options)" % (where, name))
    if STEM_STATEMENTS.search(q.get("stem", "")) and any(OPT_STATEMENT.match(str(o)) for o in opts):
        problems.append("%s: statement-labelled options under a statements stem (rewrite as full claims)" % where)


def load_work(bank, sections, problems):
    questions = []
    manifest_rows = []
    for code, short, long_label, expected in sections:
        path = os.path.join(WORK_DIR, "%s__%s.json" % (bank, code))
        if not os.path.exists(path):
            problems.append("%s: missing work file %s" % (bank, os.path.basename(path)))
            continue
        with open(path, encoding="utf-8") as f:
            work = json.load(f)
        qs = work.get("questions") or []
        if len(qs) != expected:
            problems.append("%s %s: %d questions, plan says %d" % (bank, code, len(qs), expected))
        if work.get("bank") != bank or work.get("section") != code:
            problems.append("%s %s: bank/section header mismatch" % (bank, code))
        seen = set()
        for i, q in enumerate(qs, 1):
            validate_question(bank, code, i, q, problems)
            key = re.sub(r"\s+", " ", q.get("stem", ""))[:70].lower()
            if key in seen:
                problems.append("%s %s#%d: duplicate stem within section" % (bank, code, i))
            seen.add(key)
            questions.append(q)
            manifest_rows.append({"section": code, "topic": q.get("topic"),
                                  "lik": q.get("lik"), "syl": q.get("syl"),
                                  "stem": q.get("stem", "")[:80]})
    return questions, manifest_rows


def build_html(bank_id, html_name, title, duration_min_label, sections, questions):
    with open(TEMPLATE, encoding="utf-8") as f:
        html = f.read()

    n = len(questions)
    exam = {"id": bank_id, "title": title, "questions": []}
    for i, q in enumerate(questions, 1):
        exam["questions"].append({"n": i, "stem": q["stem"], "options": q["options"],
                                  "ans": q["ans"], "exp": q["exp"], "topic": q["topic"],
                                  "lik": q["lik"]})
    exam_line = "const EXAM = " + json.dumps(exam, ensure_ascii=False, separators=(", ", ": ")) + ";"

    start = html.index("const EXAM = ")
    end = html.index("\n", start)
    html = html[:start] + exam_line + html[end:]

    # SECTION_OF .. SEC_RANGES block
    lines_of, lines_code = [], []
    ranges = []
    lo = 1
    for code, short, long_label, expected in sections:
        hi = lo + expected - 1
        lines_of.append('  qn <= %d ? "Section %s - %s"' % (hi, code, long_label))
        lines_code.append('qn <= %d ? "%s"' % (hi, code))
        ranges.append('%s: [%d, %d]' % (code, lo, hi))
        lo = hi + 1
    last_code = sections[-1][0]
    last_long = sections[-1][2]
    block = (
        "const SECTION_OF = qn =>\n" + "\n  : ".join(lines_of) + ';\n\n'
        + "const SECTION_CODE = qn => " + " : ".join(lines_code) + ";\n\n"
        + "const SECTION_LABEL = { " + ", ".join('%s: "%s"' % (c, s) for c, s, _l, _e in sections) + " };\n"
        + "const SEC_RANGES = { " + ", ".join(ranges) + " };"
    )
    s2 = html.index("const SECTION_OF = qn =>")
    e2 = html.index(";", html.index("const SEC_RANGES")) + 1
    html = html[:s2] + block + html[e2:]

    # standalone timer: 100 s per question (a 60-Q mock gets the standard 100 min)
    html = re.sub(r"let timerSec = \d+ \* 60;", "let timerSec = %d * 100;" % n, html)

    # intro subtitle "60 questions · 100 min · ..."
    html = re.sub(r'<div class="sub">\d+ questions \u00b7 \d+ min \u00b7 \+1\.5 / \u22120\.4 / 0</div>',
                  '<div class="sub">%d questions \u00b7 %s \u00b7 +1.5 / \u22120.4 / 0</div>'
                  % (n, duration_min_label), html)

    html = html.replace(OLD_TITLE, title)
    html = html.replace('<title>' + title + ' \u2014 Interactive Mock</title>',
                        '<title>' + title + ' - Interactive Mock</title>')
    path = os.path.join(HTML_DIR, html_name)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(html)
    return path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="validate only, write nothing")
    args = ap.parse_args()

    problems = []
    manifest = {}
    for bank, (html_name, bank_id, title, total, sections) in PLAN.items():
        questions, rows = load_work(bank, sections, problems)
        if len(questions) != total:
            problems.append("%s: %d questions assembled, plan says %d" % (bank, len(questions), total))
        counts = {c: sum(1 for r in rows if r["section"] == c) for c, _s, _l, _e in sections}
        h = sum(1 for r in rows if r["lik"] == "H")
        m = sum(1 for r in rows if r["lik"] == "M")
        print("%-16s Q=%2d  H/M=%d/%d (%.0f%% hard)  %s" % (
            bank, len(questions), h, m, 100.0 * h / max(1, h + m), counts))
        manifest[bank] = rows
        if not args.check and not problems:
            secs = []
            lo = 1
            for code, _short, _long, expected in sections:
                secs.append((code, _short, _long, expected))
            build_html(bank, html_name, title, "%d min" % round(total * 100 / 60), secs, questions)

    with open(os.path.join(WORK_DIR, "audit_manifest.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)

    if problems:
        print("\nPROBLEMS:")
        for p in problems:
            print("  " + p)
        sys.exit(1)
    print("\nOK" if args.check else "\nWrote %d sources + audit_manifest.json" % len(PLAN))


if __name__ == "__main__":
    main()

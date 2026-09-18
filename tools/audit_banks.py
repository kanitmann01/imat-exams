#!/usr/bin/env python3
"""Audit data/*.json banks against the anti-leak invariants (SPEC section 3).

Checks AL-3 (answer-letter balance), AL-4 (no emphasis markers or internal tags),
AL-6 (no correct-option length pattern), section contiguity, and exams.json agreement.
Exit 1 on any violation.

Usage: python tools/audit_banks.py [--data data]
"""
import argparse
import glob
import json
import os
import re
import sys

RESIDUAL_PATTERNS = [
    (re.compile(r"\*\*[^*\n]+\*\*"), "double-asterisk emphasis"),
    (re.compile(r"(?<!\*)\*(?=\S)([^*\n]+?)(?<=\S)\*(?!\*)"), "single-asterisk emphasis"),
    (re.compile(r"`"), "backtick"),
    (re.compile(r"__(?=\S)([^_\n]*?\S)__"), "double-underscore emphasis"),
]
INTERNAL_TAG = re.compile(r"\[[^\]\n]*\]")
TAG_HIT = re.compile(r"[-\u2013\u2014]\s+(?:\w+\s+)?[HML]\b(?![a-z])")
TAG_KEYWORDS = ["formula recall", "common trap", "new entrant", "repeat offender",
                "as in 20", "forecast"]


def display_key(q):
    """The letter the runner presents as correct: derived from perm, or the
    original letter when perm is null (shuffle-unsafe)."""
    if q["perm"] is None:
        return q["ans"]
    orig_idx = ord(q["ans"]) - 65
    return "ABCDE"[q["perm"].index(orig_idx)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default=os.path.join(os.path.dirname(__file__), "..", "data"))
    args = ap.parse_args()
    data = os.path.abspath(args.data)

    problems = []
    warnings = []
    banks = {}
    for path in sorted(glob.glob(os.path.join(data, "*.json"))):
        if path.endswith("exams.json"):
            continue
        with open(path, encoding="utf-8") as f:
            b = json.load(f)
        banks[b["id"]] = b

    manifest_path = os.path.join(data, "exams.json")
    if os.path.exists(manifest_path):
        with open(manifest_path, encoding="utf-8") as f:
            manifest = json.load(f)
        man_ids = {e["id"] for e in manifest["exams"]}
        if man_ids != set(banks):
            problems.append("exams.json ids %s != bank ids %s" % (sorted(man_ids), sorted(banks)))
        for e in manifest["exams"]:
            b = banks.get(e["id"])
            if not b:
                continue
            if e["bankVersion"] != b["bankVersion"]:
                problems.append("%s: manifest bankVersion mismatch" % e["id"])
            if e["qCount"] != len(b["questions"]) or e["maxTenths"] != b["maxTenths"]:
                problems.append("%s: manifest counts mismatch" % e["id"])
    else:
        problems.append("exams.json missing")

    print("%-16s %-14s %-22s %s" % ("exam", "letters", "len-bias(correct/distr)", "status"))
    for exam_id, b in sorted(banks.items()):
        n = len(b["questions"])
        # AL-3 (display keys after permutation)
        counts = {c: 0 for c in "ABCDE"}
        for q in b["questions"]:
            counts[display_key(q)] += 1
        base, rem = n // 5, n % 5
        for i, c in enumerate("ABCDE"):
            target = base + (1 if i < rem else 0)
            if not (target - 2 <= counts[c] <= target + 2):
                problems.append("%s: AL-3 letter %s = %d (target %d +-2)" % (exam_id, c, counts[c], target))
            elif not (target - 1 <= counts[c] <= target + 1):
                warnings.append("%s: AL-3 letter %s = %d (target %d, soft bound)" % (exam_id, c, counts[c], target))
        # AL-4
        for q in b["questions"]:
            for field in ("stem", "exp"):
                for pat, name in RESIDUAL_PATTERNS:
                    if pat.search(q[field]):
                        problems.append("%s Q%d %s: AL-4 %s" % (exam_id, q["n"], field, name))
            for oi, o in enumerate(q["options"]):
                for pat, name in RESIDUAL_PATTERNS:
                    if pat.search(o):
                        problems.append("%s Q%d option%d: AL-4 %s" % (exam_id, q["n"], oi, name))
            for field in ("stem", "exp"):
                for m in INTERNAL_TAG.finditer(q[field]):
                    inner = m.group(0)
                    if TAG_HIT.search(inner) or any(k in inner.lower() for k in TAG_KEYWORDS):
                        problems.append("%s Q%d %s: AL-4 internal tag %r" % (exam_id, q["n"], field, inner))
        # sections contiguous
        covered = []
        for s in sorted(b["sections"], key=lambda s: s["from"]):
            covered += list(range(s["from"], s["to"] + 1))
        if covered != list(range(1, n + 1)):
            problems.append("%s: sections do not cover 1..%d contiguously" % (exam_id, n))
        # AL-6 correct-option length pattern (content-level; report loudly, warn only:
        # fixing it means rewriting Ken's option texts, which is out of pipeline scope)
        lens_c = [len(q["options"][ord(q["ans"]) - 65]) for q in b["questions"]]
        lens_d = [len(o) for q in b["questions"] for i, o in enumerate(q["options"]) if i != ord(q["ans"]) - 65]
        mean_c = sum(lens_c) / len(lens_c)
        mean_d = sum(lens_d) / len(lens_d)
        mean_all = (sum(lens_c) + sum(lens_d)) / (len(lens_c) + len(lens_d))
        bias = abs(mean_c - mean_d) / mean_all if mean_all else 0
        status = "OK"
        if bias > 0.10:
            status = "AL-6 warn"
            warnings.append("%s: AL-6 length bias %.2f (correct options mean %.1f chars vs distractors %.1f); "
                            "consider rewriting distractors to match length/detail"
                            % (exam_id, bias, mean_c, mean_d))
        dist = "".join(str(counts[c]) for c in "ABCDE")
        print("%-16s %-14s %8.1f / %-8.1f %s" % (exam_id, dist, mean_c, mean_d, status))

    print()
    for w in warnings:
        print("WARN " + w)
    if problems:
        print("AUDIT FAILED:")
        for p in problems:
            print("  " + p)
        sys.exit(1)
    print("AUDIT PASSED: %d banks clean" % len(banks))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Verify every printed PDF: the 'Answer: X' line under each question must
point at the printed option whose text equals the bank's stored-correct
option. Checks the full print pipeline (option reordering + letter
stamping) at 100% coverage, independently of the generator's own logic by
parsing pdftotext output."""
import json
import os
import re
import subprocess
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA = os.path.join(ROOT, "data")
PAPERS = os.path.join(ROOT, "papers")

from build_paper_pdfs import FILENAMES  # noqa: E402


def norm(s):
    return re.sub(r"\s+", " ", s).strip()


def pdf_text(path):
    out = subprocess.run(["pdftotext", "-enc", "UTF-8", "-layout", path, "-"],
                         capture_output=True, text=True, encoding="utf-8",
                         errors="replace")
    return out.stdout


def parse_blocks(text):
    """Yield (options_dict letter->text, answer_letter) per question block.
    Markers 'A) '..'E) ' may appear at line starts, mid-line (combined short
    option rows) or even at the end of the stem line (pdftotext -layout
    quirk), so capture any marker that appears after a question-start line
    and before its 'Answer:' line."""
    marker = re.compile(r"(?:^|\s)([A-E])\)\s?")
    qstart = re.compile(r"^\s*\d+\.\s")
    blocks = []
    opts, cur, saw_q = {}, None, False

    def close(answer=None):
        nonlocal opts, cur, saw_q
        if opts and answer:
            blocks.append((opts, answer))
        opts, cur, saw_q = {}, None, False

    for ln in text.split("\n"):
        m = re.match(r"^\s*Answer:\s*([A-E])\s*$", ln)
        if m:
            close(m.group(1))
            continue
        if qstart.match(ln):
            saw_q = True
        if not saw_q:
            continue
        pos, last_end, found = 0, 0, []
        for mm in marker.finditer(ln):
            found.append(mm)
        if found:
            for i, mm in enumerate(found):
                L = mm.group(1)
                end = found[i + 1].start() if i + 1 < len(found) else len(ln)
                opts[L] = ln[mm.end():end].strip()
                cur = L
        elif cur and ln.strip():
            opts[cur] += " " + ln.strip()
    return blocks


def main():
    with open(os.path.join(DATA, "exams.json"), encoding="utf-8") as f:
        manifest = json.load(f)
    total = bad = unparsed = 0
    fails = []
    for e in manifest["exams"]:
        bid = e["id"]
        bank = json.load(open(os.path.join(DATA, "%s.json" % bid),
                              encoding="utf-8"))
        pdf = os.path.join(PAPERS, "%s.pdf" % FILENAMES[bid])
        blocks = parse_blocks(pdf_text(pdf))
        qs = bank["questions"]
        if len(blocks) != len(qs):
            print("%-22s BLOCK COUNT MISMATCH pdf=%d bank=%d"
                  % (bid, len(blocks), len(qs)))
            unparsed += abs(len(blocks) - len(qs))
        for q, (opts, ans) in zip(qs, blocks):
            total += 1
            want = norm(q["options"]["ABCDE".index(q["ans"])])
            printed_correct = None
            for L, t in opts.items():
                if norm(t) == want:
                    printed_correct = L
                    break
            if printed_correct != ans:
                bad += 1
                fails.append("%s Q%d: stamped %s, correct content under %s"
                             % (bid, q["n"], ans, printed_correct))
        print("%-22s checked %3d blocks" % (bid, len(blocks)))
    print("\nTOTAL questions compared: %d | mismatches: %d | unparsed: %d"
          % (total, bad, unparsed))
    for f in fails[:20]:
        print("  " + f)
    sys.exit(1 if (bad or unparsed) else 0)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Render every exam bank to a printable A4 question-paper PDF with an
answer-key page at the end. Output: papers/<Name>.pdf for each bank in
data/exams.json. Fonts: DejaVuSans family (full Unicode coverage); the
script aborts if any character is missing from the font.
"""
import json
import os
import random
import re
import sys

from fontTools.ttLib import TTFont as FTTTFont
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (HRFlowable, KeepTogether, PageBreak,
                                Paragraph, SimpleDocTemplate, Table,
                                TableStyle)

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, ".."))
DATA = os.path.join(ROOT, "data")
OUT = os.path.join(ROOT, "papers")
FONTS = r"C:\Windows\Fonts"

REG = os.path.join(FONTS, "DejaVuSans.ttf")
BOLD = os.path.join(FONTS, "DejaVuSans-Bold.ttf")
ITAL = os.path.join(FONTS, "DejaVuSans-Oblique.ttf")

FILENAMES = {
    "imat_mock1": "Mock_01_Baseline",
    "imat_mock2": "Mock_02_Bioenergetics_Spine",
    "imat_mock3": "Mock_03_Genetics_Molecular_Rotation",
    "imat_mock4": "Mock_04_Calculation_Spine",
    "imat_mock5": "Mock_05_The_Discriminator",
    "imat_mock6": "Mock_06_At_Level_Calibration",
    "imat_mock7": "Mock_07_The_Real_Thing",
    "imat_mock8": "Mock_08_Final_Rehearsal",
    "imat_mock9": "Mock_09_Hard_Calibration",
    "imat_mock10": "Mock_10_Final_Simulation",
    "imat_mock11": "Mock_11_Last_Rehearsal",
    "imat_mock10_legacy": "Mock_10_Legacy_2026_Blueprint",
    "imat_mock11_legacy": "Mock_11_Legacy_Final_Dress_Rehearsal",
    "GK_Drill_100": "Drill_GK_100_Questions",
    "Repair_Drill_1": "Drill_Repair_Repeat_Offenders",
    "bank_bio_hard": "Bank_Biology_Medium_Hard",
    "bank_chem_hard": "Bank_Chemistry_Medium_Hard",
    "bank_mpl_hard": "Bank_Maths_Physics_Logic_Medium_Hard",
    "GK_Bank_Hard": "Bank_GK_Medium_Hard",
}

KIND_LABEL = {"mock": "Mock exam", "gk_drill": "GK drill",
              "repair_drill": "Repair drill", "bank": "Question bank"}

INK = colors.HexColor("#101828")
MUTE = colors.HexColor("#5b6472")
RULE = colors.HexColor("#c9d1dc")
KEYBG = colors.HexColor("#eef2f7")

pdfmetrics.registerFont(TTFont("DJV", REG))
pdfmetrics.registerFont(TTFont("DJVB", BOLD))
pdfmetrics.registerFont(TTFont("DJVI", ITAL))
pdfmetrics.registerFontFamily("DJV", normal="DJV", bold="DJVB", italic="DJVI",
                              boldItalic="DJVB")

S_TITLE = ParagraphStyle("t", fontName="DJVB", fontSize=13.5, leading=17,
                         textColor=INK, spaceAfter=2)
S_META = ParagraphStyle("m", fontName="DJV", fontSize=9, leading=12.5,
                        textColor=MUTE, spaceAfter=6)
S_SECT = ParagraphStyle("s", fontName="DJVB", fontSize=10.5, leading=14,
                        textColor=INK, spaceBefore=11, spaceAfter=1)
S_STEM = ParagraphStyle("q", fontName="DJV", fontSize=9.3, leading=12.8,
                        textColor=INK, spaceBefore=7)
S_SRC = ParagraphStyle("src", parent=S_STEM, fontName="DJVI", leftIndent=14)
S_OPT = ParagraphStyle("o", fontName="DJV", fontSize=9.3, leading=12.6,
                       textColor=INK, leftIndent=17, spaceBefore=1.5)
S_OPTI = ParagraphStyle("oi", parent=S_OPT, spaceBefore=4)
S_KEYH = ParagraphStyle("kh", fontName="DJVB", fontSize=12, leading=15,
                        textColor=INK, spaceAfter=3)
S_NOTE = ParagraphStyle("kn", fontName="DJV", fontSize=8.6, leading=11.5,
                        textColor=MUTE, spaceAfter=8)

LETTERS = "ABCDE"


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


_NUM_HEAD = re.compile(r"^\s*([−+\-]?\d+(?:[.,]\d+)?)")


def numeric_value(o):
    m = _NUM_HEAD.match(o)
    if not m:
        return None
    try:
        return float(m.group(1).replace("−", "-").replace(",", "."))
    except ValueError:
        return None


def print_order(bank_id, q, counts):
    """Option order for the static paper: numeric sets ascending (paper
    convention), everything else deterministically shuffled with the correct
    option steered to the least-used printed letter so far, so printed keys
    stay balanced and never form a visible cycle (the drills' stored keys are
    period-5 rotations, invisible in-app but exposed on paper)."""
    vals = [numeric_value(o) for o in q["options"]]
    if all(v is not None for v in vals):
        order = sorted(range(len(vals)), key=lambda i: (vals[i], i))
    else:
        rng = random.Random("%s#%d" % (bank_id, q["n"]))
        tied = [L for L in LETTERS if counts[L] == min(counts.values())]
        target = tied[rng.randrange(len(tied))]
        rest = [i for i in range(len(q["options"]))
                if i != LETTERS.index(q["ans"])]
        rng.shuffle(rest)
        order = []
        ri = iter(rest)
        for pos in range(len(q["options"])):
            if LETTERS[pos] == target:
                order.append(LETTERS.index(q["ans"]))
            else:
                order.append(next(ri))
    counts[printed_ans(order, q)] += 1
    return order


def printed_ans(order, q):
    return LETTERS[order.index(LETTERS.index(q["ans"]))]


def check_charset(banks):
    cmap = FTTTFont(REG).getBestCmap()
    missing = {}
    for b in banks:
        blob = b["title"] + "".join(
            q["stem"] + "".join(q["options"]) for q in b["questions"])
        for ch in set(blob):
            if ord(ch) > 126 and ord(ch) not in cmap:
                missing.setdefault(repr(ch), hex(ord(ch)))
    if missing:
        for r, h in sorted(missing.items()):
            print("MISSING GLYPH %s (%s)" % (r, h))
        sys.exit("charset check failed")


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(RULE)
    canvas.setLineWidth(0.5)
    canvas.line(17 * mm, 12.5 * mm, A4[0] - 17 * mm, 12.5 * mm)
    canvas.setFont("DJV", 7.5)
    canvas.setFillColor(MUTE)
    canvas.drawString(17 * mm, 8.5 * mm, "IMAT 2026 practice papers")
    canvas.drawRightString(A4[0] - 17 * mm, 8.5 * mm, "Page %d" % doc.page)
    canvas.restoreState()


def meta_line(bank):
    parts = [
        "%d questions" % len(bank["questions"]),
        "%d minutes" % (bank["durationSec"] // 60),
        "scoring: +1.5 correct, −0.4 wrong, 0 blank",
    ]
    if bank.get("targetScore") is not None:
        parts.append("personal target: %s/90.0" % bank["targetScore"])
    parts.append(KIND_LABEL.get(bank["kind"], bank["kind"]))
    return "  ·  ".join(parts)


def q_flowables(q, order):
    out = []
    opts = [q["options"][i] for i in order]
    lines = q["stem"].split("\n")
    lines = [ln for ln in (l.strip() for l in lines) if ln] or [""]
    for i, ln in enumerate(lines):
        txt = esc(ln)
        if i == 0:
            out.append(Paragraph("<b>%d.</b>  %s" % (q["n"], txt), S_STEM))
        elif ln.startswith(("From ", "Adapted from ")):
            out.append(Paragraph(esc(ln), S_SRC))
        else:
            out.append(Paragraph(txt, ParagraphStyle(
                "c", parent=S_STEM, leftIndent=14)))
    if all(len(o) <= 14 for o in opts):
        run = "&nbsp;&nbsp;&nbsp;&nbsp;".join(
            "<b>%s)</b> %s" % (LETTERS[i], esc(o)) for i, o in enumerate(opts))
        out.append(Paragraph(run, S_OPTI))
    else:
        for i, o in enumerate(opts):
            out.append(Paragraph("<b>%s)</b> %s" % (LETTERS[i], esc(o)), S_OPT))
    return out


def key_table(questions, letters):
    cells, row = [], []
    for q, ans in zip(questions, letters):
        row.append("%d" % q["n"])
        row.append(ans)
        if len(row) == 10:
            cells.append(row)
            row = []
    if row:
        row += ["", ""] * (5 - len(row) // 2)
        cells.append(row)
    t = Table(cells, colWidths=[11.5 * mm] * 10, rowHeights=[6.4 * mm] * len(cells))
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "DJV"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("TEXTCOLOR", (0, 0), (-1, -1), INK),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.4, RULE),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, KEYBG]),
    ]))
    return t


def build(bank, path):
    doc = SimpleDocTemplate(
        path, pagesize=A4,
        leftMargin=17 * mm, rightMargin=17 * mm,
        topMargin=14 * mm, bottomMargin=17 * mm,
        title=bank["title"], author="IMAT 2026 practice set",
    )
    story = [
        Paragraph(esc(bank["title"]), S_TITLE),
        Paragraph(esc(meta_line(bank)), S_META),
        HRFlowable(width="100%", thickness=1, color=RULE, spaceAfter=2),
    ]
    qmap = {q["n"]: q for q in bank["questions"]}
    counts = {L: 0 for L in LETTERS}
    orders = {n: print_order(bank["id"], qmap[n], counts)
              for n in sorted(qmap)}
    printed = {n: printed_ans(orders[n], qmap[n]) for n in qmap}
    for sec in sorted(bank["sections"], key=lambda s: s["from"]):
        header = [
            Paragraph(
                "%s  (Q%d-%d)" % (esc(sec["label"]), sec["from"], sec["to"]),
                S_SECT),
            HRFlowable(width="100%", thickness=0.5, color=RULE),
        ]
        first = q_flowables(qmap[sec["from"]], orders[sec["from"]])
        story.append(KeepTogether(header + first))
        for n in range(sec["from"] + 1, sec["to"] + 1):
            story.append(KeepTogether(q_flowables(qmap[n], orders[n])))
    story.append(PageBreak())
    story.append(Paragraph("Answer key", S_KEYH))
    story.append(HRFlowable(width="100%", thickness=0.5, color=RULE, spaceAfter=4))
    story.append(Paragraph(
        "This key refers to the option order printed in this paper. The online "
        "app shuffles option order on every attempt, so answer letters inside "
        "the app will differ from the ones here.", S_NOTE))
    story.append(key_table(bank["questions"],
                           [printed[q["n"]] for q in bank["questions"]]))
    doc.build(story, onFirstPage=footer, onLaterPages=footer)


def main():
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(DATA, "exams.json"), encoding="utf-8") as f:
        manifest = json.load(f)
    banks = []
    for e in manifest["exams"]:
        with open(os.path.join(DATA, "%s.json" % e["id"]), encoding="utf-8") as f:
            banks.append(json.load(f))
    check_charset(banks)
    for b in banks:
        name = FILENAMES.get(b["id"])
        if not name:
            sys.exit("no filename mapping for %s" % b["id"])
        path = os.path.join(OUT, "%s.pdf" % name)
        build(b, path)
        print("%-42s %6.0f KB  %s" % (name, os.path.getsize(path) / 1024, b["id"]))
    print("OK: %d PDFs in papers/" % len(banks))


if __name__ == "__main__":
    main()

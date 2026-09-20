"""Duplicate / quality audit for the new IMAT hard banks. Read-only: reports, never edits."""
import json, re, itertools
from collections import Counter

DATA = r"D:/Dev/Flashtest/imat-exam-platform/data/"
WORK = r"D:/Dev/Flashtest/imat-exam-platform/tools/hard_bank_work/"
NEW = ["bank_bio_hard.json", "bank_chem_hard.json", "bank_mpl_hard.json", "imat_mock9.json"]
OLD = [f"imat_mock{i}.json" for i in range(1, 9)] + ["GK_Drill_100.json", "Repair_Drill_1.json"]

STOP = set("""a an the of in on at to for and or is are was were be been being which what who whom whose
this that these those it its it's as by with from into not no nor but if then than so such can could may
might must shall should will would do does did done have has had having following statement statements
question answer correct incorrect true false""".split())

def norm(s, numbers=False):
    s = s.lower()
    s = re.sub(r"\d+(?:[.,]\d+)?", "#", s) if numbers else s
    s = re.sub(r"[^a-z0-9#\s]", "", s)
    return re.sub(r"\s+", " ", s).strip()

def content(s):
    return [w for w in norm(s).split() if w not in STOP and not re.fullmatch(r"[0-9#.]+", w)]

def shingles(toks, k=4):
    if len(toks) < k:
        return {" ".join(toks)} if toks else set()
    return {" ".join(toks[i:i+k]) for i in range(len(toks)-k+1)}

def jaccard(a, b):
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)

def load(name):
    qs = json.load(open(DATA + name, encoding="utf-8"))["questions"]
    recs = []
    for q in qs:
        stem = q.get("stem", "")
        full = stem + " " + " ".join(q.get("options", []))
        toks = content(full)
        stoks = content(stem)
        recs.append({
            "bank": name, "n": q.get("n"), "stem": stem, "options": q.get("options", []),
            "ans": q.get("ans"), "exp": q.get("exp", ""), "topic": q.get("topic", ""), "lik": q.get("lik"),
            "sh": shingles(toks), "stem_sh": shingles(stoks), "ntoks": len(toks), "nstoks": len(stoks),
            "tmpl": " ".join(norm(stem, numbers=True).split()[:9]),
        })
    return recs

def main():
    new = {f: load(f) for f in NEW}
    old = {f: load(f) for f in OLD}
    all_new = [q for f in NEW for q in new[f]]
    all_old = [q for f in OLD for q in old[f]]

    flags, border, tmpls = [], [], []
    tmpl_map = {}
    for a, b in itertools.product(all_new, all_new + all_old):
        if (a["bank"], a["n"]) >= (b["bank"], b["n"]):
            continue
        # full-text similarity only meaningful when enough content tokens
        sim = jaccard(a["sh"], b["sh"]) if a["ntoks"] >= 12 and b["ntoks"] >= 12 else 0.0
        ssim = jaccard(a["stem_sh"], b["stem_sh"]) if a["nstoks"] >= 6 and b["nstoks"] >= 6 else 0.0
        tflag = a["tmpl"] == b["tmpl"] and len(a["tmpl"].split()) >= 6
        rec = {"sim": round(sim, 3), "stem_sim": round(ssim, 3), "tmpl": tflag,
               "a": {k: a[k] for k in ("bank", "n", "stem", "ans", "topic", "lik")},
               "b": {k: b[k] for k in ("bank", "n", "stem", "ans", "topic", "lik")}}
        if tflag:
            tmpls.append(rec)
            tmpl_map.setdefault(a["tmpl"], []).append(f'{a["bank"]}#{a["n"]}|{b["bank"]}#{b["n"]}')
        elif sim > 0.55 or (ssim > 0.55 and not tflag):
            flags.append(rec)
        elif sim > 0.38 or ssim > 0.42:
            border.append(rec)

    for lst in (flags, border, tmpls):
        lst.sort(key=lambda x: -max(x["sim"], x["stem_sim"]))

    json.dump({"strong": flags, "border": border, "tmpl": tmpls},
              open(WORK + "flagged_pairs.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    print(f"STRONG (sim/stem_sim>0.55, guarded): {len(flags)}")
    for f in flags:
        print(f'[{f["sim"]:0.2f}/{f["stem_sim"]:0.2f}] {f["a"]["bank"]}#{f["a"]["n"]} <-> {f["b"]["bank"]}#{f["b"]["n"]}')
        print(f'   A: {f["a"]["stem"][:120]}')
        print(f'   B: {f["b"]["stem"][:120]}')
    print(f'\nTEMPLATE-identical stems (first 9 words, numbers masked): {len(tmpls)}')
    for f in tmpls:
        print(f'  [{f["sim"]:0.2f}/{f["stem_sim"]:0.2f}] {f["a"]["bank"]}#{f["a"]["n"]} <-> {f["b"]["bank"]}#{f["b"]["n"]}')
        print(f'   A: {f["a"]["stem"][:120]}')
        print(f'   B: {f["b"]["stem"][:120]}')
    print(f'\nBORDER (sim>0.38 or stem_sim>0.42): {len(border)}')
    for f in border:
        print(f'[{f["sim"]:0.2f}/{f["stem_sim"]:0.2f}] {f["a"]["bank"]}#{f["a"]["n"]} <-> {f["b"]["bank"]}#{f["b"]["n"]}')
        print(f'   A: {f["a"]["stem"][:110]}')
        print(f'   B: {f["b"]["stem"][:110]}')

if __name__ == "__main__":
    main()

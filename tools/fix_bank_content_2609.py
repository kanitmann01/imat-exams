#!/usr/bin/env python3
"""Surgical content fixes surfaced by the 26 Sep worked-solutions solve pass.

1. imat_mock5 Q4 (queue constraints): stored key E ("F immediately in front
   of J") is not forced by the constraints; exactly two orders are admissible
   (H G F I J and H I G F J) and only "H is at the front" holds in both.
   Fix: ans E -> B, explanation rewritten with the enumeration.
2. imat_mock1 Q43: option A carried leftover draft marginalia that leaked the
   key; replaced with a proper plausible distractor.

Both banks get a recomputed bankVersion (same canonical formula as
build_banks.py) and the manifest entry is refreshed.
"""
import hashlib
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.abspath(os.path.join(HERE, "..", "data"))


def new_version(bank):
    slim = [{
        "n": q["n"], "topic": q["topic"], "lik": q["lik"], "ans": q["ans"],
        "stem": q["stem"], "exp": q["exp"], "options": q["options"],
    } for q in bank["questions"]]
    canon = json.dumps(
        {"id": bank["id"], "title": bank["title"], "sections": bank["sections"],
         "questions": slim},
        sort_keys=True, ensure_ascii=False)
    return "b" + hashlib.sha256(canon.encode("utf-8")).hexdigest()[:8]


def save(bank):
    bank["bankVersion"] = new_version(bank)
    with open(os.path.join(DATA, bank["id"] + ".json"), "w",
              encoding="utf-8", newline="\n") as f:
        json.dump(bank, f, ensure_ascii=False, indent=1, sort_keys=False)
        f.write("\n")
    with open(os.path.join(DATA, "exams.json"), encoding="utf-8") as f:
        manifest = json.load(f)
    for e in manifest["exams"]:
        if e["id"] == bank["id"]:
            e["bankVersion"] = bank["bankVersion"]
    with open(os.path.join(DATA, "exams.json"), "w", encoding="utf-8",
              newline="\n") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print("%s: patched, v=%s" % (bank["id"], bank["bankVersion"]))


m5 = json.load(open(os.path.join(DATA, "imat_mock5.json"), encoding="utf-8"))
q4 = [q for q in m5["questions"] if q["n"] == 4][0]
assert q4["ans"] == "E", "unexpected current key: " + q4["ans"]
q4["ans"] = "B"
q4["exp"] = ("J is fixed at the back and I can never take an end seat, so the "
             "front belongs to H, G or F. G cannot be first because H must be "
             "somewhere ahead of it, and F cannot be first because G is "
             "immediately ahead of F. That forces H to the front, and only two "
             "complete orders satisfy all four rules: H, G, F, I, J and H, I, "
             "G, F, J. H is first in both, while F sits immediately in front "
             "of J only in the second order, so that claim is not forced.")
save(m5)

m1 = json.load(open(os.path.join(DATA, "imat_mock1.json"), encoding="utf-8"))
q43 = [q for q in m1["questions"] if q["n"] == 43][0]
assert "wrong)" in q43["options"][0], "option A already clean?"
q43["options"][0] = "Shift the equilibrium to the left, producing more N₂ and H₂."
save(m1)
print("OK")

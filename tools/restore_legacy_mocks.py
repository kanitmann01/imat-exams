#!/usr/bin/env python3
"""Restore the pre-replacement mock10/11 (24 Sep versions) as legacy banks.

Reads the old bank JSONs from git history (parent of the 26 Sep replacement
commit), rewrites id/title, recomputes bankVersion with the same canonical
formula as build_mock1011.py, writes data/imat_mock1{0,1}_legacy.json and
inserts manifest entries right after imat_mock11. Also appends the two files
to the sw.js BANKS precache list if missing.
"""
import hashlib
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, ".."))
DATA = os.path.join(ROOT, "data")
GIT_REF = "28ab984^"

LEGACY = {
    "imat_mock10": ("imat_mock10_legacy", "IMAT MOCK EXAM 10 (Legacy): 2026 Blueprint"),
    "imat_mock11": ("imat_mock11_legacy", "IMAT MOCK EXAM 11 (Legacy): Final Dress Rehearsal"),
}


def git_show(path):
    out = subprocess.run(
        ["git", "show", "%s:%s" % (GIT_REF, path)],
        cwd=ROOT, capture_output=True, check=True,
    ).stdout
    return json.loads(out.decode("utf-8"))


def bank_version(bank_id, title, sections, questions):
    slim = []
    for q in questions:
        slim.append({
            "n": q["n"], "topic": q["topic"], "lik": q["lik"], "ans": q["ans"],
            "stem": q["stem"], "exp": q["exp"], "options": q["options"],
        })
    canon = json.dumps(
        {"id": bank_id, "title": title, "sections": sections, "questions": slim},
        sort_keys=True, ensure_ascii=False,
    )
    return "b" + hashlib.sha256(canon.encode("utf-8")).hexdigest()[:8]


def main():
    for old_id, (new_id, new_title) in LEGACY.items():
        bank = git_show("data/%s.json" % old_id)
        bank["id"] = new_id
        bank["title"] = new_title
        bank["bankVersion"] = bank_version(new_id, new_title, bank["sections"],
                                           bank["questions"])
        path = os.path.join(DATA, "%s.json" % new_id)
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            json.dump(bank, f, ensure_ascii=False, indent=1, sort_keys=False)
            f.write("\n")
        print("%s: %s (q=%d, target=%s, v=%s)"
              % (new_id, new_title, len(bank["questions"]),
                 bank["targetScore"], bank["bankVersion"]))

        entry = {
            "id": bank["id"], "title": bank["title"], "kind": bank["kind"],
            "qCount": len(bank["questions"]), "durationSec": bank["durationSec"],
            "maxTenths": bank["maxTenths"], "targetScore": bank["targetScore"],
            "sectionCount": len(bank["sections"]), "bankVersion": bank["bankVersion"],
        }
        mpath = os.path.join(DATA, "exams.json")
        with open(mpath, encoding="utf-8") as f:
            manifest = json.load(f)
        exams = [e for e in manifest["exams"] if e["id"] != new_id]
        idx = max(i for i, e in enumerate(exams) if e["id"] == "imat_mock11") + 1
        exams.insert(idx, entry)
        manifest["exams"] = exams
        with open(mpath, "w", encoding="utf-8", newline="\n") as f:
            json.dump(manifest, f, ensure_ascii=False, indent=1)
            f.write("\n")

    sw = os.path.join(ROOT, "sw.js")
    with open(sw, encoding="utf-8") as f:
        src = f.read()
    add = "".join('  "./data/%s.json",\n' % new_id
                  for _, (new_id, _) in LEGACY.items() if new_id + ".json" not in src)
    if add:
        src = src.replace(
            '  "./data/imat_mock10.json", "./data/imat_mock11.json",\n',
            '  "./data/imat_mock10.json", "./data/imat_mock11.json",\n' + add,
            1,
        )
        with open(sw, "w", encoding="utf-8", newline="\n") as f:
            f.write(src)
        print("sw.js BANKS: added legacy entries")
    else:
        print("sw.js BANKS: already present")
    print("OK")


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Assemble imat_mock10/11 from agent-authored drafts in tools/mock1011_work/.

Reuses build_banks.py scrub / unsafe / rebalance / invariant machinery so the
new banks obey the exact same contract as mocks 1-9. Updates exams.json in
place (new entries inserted after imat_mock9).
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import build_banks as bb  # noqa: E402

WORK = os.path.join(HERE, "mock1011_work")
DATA = os.path.abspath(os.path.join(HERE, "..", "data"))

SECTIONS = [
    {"code": "A", "from": 1, "to": 9,
     "label": "Section A - Reading Skills, General Knowledge & Logical Reasoning",
     "short": "Reasoning"},
    {"code": "B", "from": 10, "to": 32, "label": "Section B - Biology", "short": "Biology"},
    {"code": "C", "from": 33, "to": 47, "label": "Section C - Chemistry", "short": "Chemistry"},
    {"code": "D", "from": 48, "to": 54, "label": "Section D - Mathematics", "short": "Mathematics"},
    {"code": "E", "from": 55, "to": 60, "label": "Section E - Physics", "short": "Physics"},
]

META = {
    10: {"id": "imat_mock10", "title": "IMAT MOCK EXAM 10: 2026 Blueprint",
         "targetScore": 44},
    11: {"id": "imat_mock11", "title": "IMAT MOCK EXAM 11: Final Dress Rehearsal",
         "targetScore": 42},
}

DRAFTS = ["draft_reading_gk.json", "draft_logic.json", "draft_bio10.json",
          "draft_bio11.json", "draft_chem.json", "draft_physmath.json"]


def load_drafts():
    by_mock = {10: {}, 11: {}}
    for name in DRAFTS:
        with open(os.path.join(WORK, name), encoding="utf-8") as f:
            d = json.load(f)
        for q in d["questions"]:
            m, s = q["mock"], q["slot"]
            if s in by_mock[m]:
                raise SystemExit("duplicate slot mock%d Q%d (from %s)" % (m, s, name))
            by_mock[m][s] = q
    return by_mock


def build(mock_no, slot_map, overrides, log):
    meta = META[mock_no]
    questions = []
    for n in range(1, 61):
        q = slot_map.get(n)
        if q is None:
            raise SystemExit("mock%d missing slot %d" % (mock_no, n))
        assert q.get("lik") in ("H", "M", "L"), "mock%d Q%d bad lik" % (mock_no, n)
        assert isinstance(q["options"], list) and len(q["options"]) == 5, \
            "mock%d Q%d needs 5 options" % (mock_no, n)
        assert q["ans"] in ("A", "B", "C", "D", "E"), "mock%d Q%d bad ans" % (mock_no, n)
        assert len(set(q["options"])) == 5, "mock%d Q%d duplicate options" % (mock_no, n)
        assert q["stem"].strip() and q["exp"].strip(), "mock%d Q%d empty text" % (mock_no, n)
        item = {"n": n, "topic": q["topic"], "lik": q["lik"], "ans": q["ans"]}
        for field in ("stem", "exp"):
            new, counters, _ = bb.scrub_field(q[field], log, meta["id"], n, field)
            item[field] = new
        opts = []
        for i, o in enumerate(q["options"]):
            new, _, _ = bb.scrub_field(o, log, meta["id"], n, "option%d" % i)
            opts.append(new)
        item["options"] = opts
        questions.append(item)

    unsafe_map = {}
    for q in questions:
        reason = bb.detect_unsafe(q, overrides, meta["id"])
        if reason:
            unsafe_map[q["n"]] = reason
            log.append((meta["id"], q["n"], "shuffle", "UNSAFE: " + reason))

    canon = json.dumps({"id": meta["id"], "title": meta["title"], "sections": SECTIONS,
                        "questions": questions}, sort_keys=True, ensure_ascii=False)
    import hashlib
    bank_version = "b" + hashlib.sha256(canon.encode("utf-8")).hexdigest()[:8]

    perms, counts = bb.rebalance(meta["id"], questions, unsafe_map, attempt_seed=0,
                                 relax_bound=2)

    out_questions = []
    for q in questions:
        out_questions.append({
            "n": q["n"], "stem": q["stem"], "options": q["options"], "ans": q["ans"],
            "exp": q["exp"],
            "perm": perms[q["n"]], "shuffleSafe": q["n"] not in unsafe_map,
            "shuffleUnsafeReason": unsafe_map.get(q["n"]),
            "topic": q["topic"], "lik": q["lik"],
        })

    bank = {
        "schema": 1,
        "id": meta["id"],
        "title": meta["title"],
        "kind": "mock",
        "durationSec": 6000,
        "maxTenths": 900,
        "targetScore": meta["targetScore"],
        "sections": SECTIONS,
        "bankVersion": bank_version,
        "questions": out_questions,
    }
    return bank, counts, unsafe_map


def main():
    ov_path = os.path.join(HERE, "shuffle_overrides.json")
    overrides = {}
    if os.path.exists(ov_path):
        with open(ov_path, encoding="utf-8") as f:
            overrides = json.load(f)

    by_mock = load_drafts()
    log = []
    problems, warnings = [], []
    for mock_no, entries in sorted(by_mock.items()):
        bank, counts, unsafe_map = build(mock_no, entries, overrides, log)
        p, w = bb.check_invariants(bank, counts, unsafe_map)
        problems += p
        warnings += w
        path = os.path.join(DATA, bank["id"] + ".json")
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            json.dump(bank, f, ensure_ascii=False, indent=1, sort_keys=False)
            f.write("\n")
        print("%s: v=%s dist=%s unsafe=%d -> %s" %
              (bank["id"], bank["bankVersion"], counts, len(unsafe_map), path))

        # manifest: insert/refresh entry right after imat_mock9
        mpath = os.path.join(DATA, "exams.json")
        with open(mpath, encoding="utf-8") as f:
            manifest = json.load(f)
        entry = {
            "id": bank["id"], "title": bank["title"], "kind": bank["kind"],
            "qCount": len(bank["questions"]), "durationSec": bank["durationSec"],
            "maxTenths": bank["maxTenths"], "targetScore": bank["targetScore"],
            "sectionCount": len(bank["sections"]), "bankVersion": bank["bankVersion"],
        }
        exams = [e for e in manifest["exams"] if e["id"] != entry["id"]]
        idx = max(i for i, e in enumerate(exams) if e["id"] == "imat_mock9") + 1
        exams.insert(idx, entry)
        manifest["exams"] = exams
        with open(mpath, "w", encoding="utf-8", newline="\n") as f:
            json.dump(manifest, f, ensure_ascii=False, indent=1)
            f.write("\n")

    if warnings:
        for w in warnings:
            print("WARN " + w)
    if log:
        print("scrub/unsafe log: %d entries" % len(log))
        for row in log[:20]:
            print("  " + str(row))
    if problems:
        print("INVARIANT VIOLATIONS:")
        for p in problems:
            print("  " + p)
        sys.exit(1)
    print("OK: mocks 10-11 assembled, exams.json updated")


if __name__ == "__main__":
    main()

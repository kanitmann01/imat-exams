import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { readLegacy, planLegacyImport, LEGACY_IDS } from "../js/legacy.js";
import { gradeAttempt } from "../js/grader.js";
import { identityPermMap } from "../js/core.js";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, "..", "data");
const banks = {};
for (const id of LEGACY_IDS) banks[id] = JSON.parse(fs.readFileSync(path.join(DATA, id + ".json"), "utf-8"));

/* Tracker cross-check: her real past scores. (c, w) pairs whose 1.5c - 0.4w hits
   each score exactly with c + w <= 60. */
const TRACKER = [
  { id: "imat_mock1", total: 48.9, correct: 35, wrong: 9 },
  { id: "imat_mock3", total: 42.4, correct: 32, wrong: 14 },
  { id: "imat_mock4", total: 45.8, correct: 34, wrong: 13 },
  { id: "imat_mock5", total: 32.9, correct: 27, wrong: 19 },
];

function fixtureStorage() {
  const blob = {};
  for (const t of TRACKER) {
    const answers = {};
    const bank = banks[t.id];
    let ci = 0, wi = 0;
    for (const q of bank.questions) {
      const key = q.ans;
      if (ci < t.correct && q.n % 2 === 1) { answers[q.n] = key; ci++; }
      else if (wi < t.wrong && q.n % 3 === 0) {
        answers[q.n] = "ABCDE"[(key.charCodeAt(0) - 64) % 5]; // neighbour, wrong
        wi++;
      }
    }
    // exact counts: fill remaining correct slots / wrong slots deterministically
    for (const q of bank.questions) {
      if (ci < t.correct && !(q.n in answers)) { answers[q.n] = q.ans; ci++; }
    }
    for (const q of bank.questions) {
      if (wi < t.wrong && !(q.n in answers)) {
        answers[q.n] = "ABCDE"[(q.ans.charCodeAt(0) - 64) % 5];
        wi++;
      }
    }
    assert.equal(ci, t.correct);
    assert.equal(wi, t.wrong);
    const g = gradeAttempt(bank, answers, identityPermMap(bank));
    assert.equal(Math.abs(g.scoreTenths / 10 - t.total) < 0.001, true,
      `${t.id}: fixture gives ${g.scoreTenths / 10}, want ${t.total}`);
    blob[t.id + "_result"] = JSON.stringify({
      total: t.total, correct: t.correct, wrong: t.wrong, blank: 60 - t.correct - t.wrong,
      answers, at: "2026-08-28T10:00:00.000Z",
    });
    blob[t.id + "_history"] = JSON.stringify([
      { total: t.total, correct: t.correct, wrong: t.wrong, blank: 60 - t.correct - t.wrong, at: "2026-08-28T10:00:00.000Z" },
      { total: 10.1, correct: 9, wrong: 4, blank: 47, at: "2026-08-01T10:00:00.000Z" },
    ]);
  }
  blob.imat_mock2_answers = JSON.stringify({ "1": "A", "2": "B" }); // abandoned paper: skipped
  return blob;
}

test("readLegacy finds and parses legacy blobs", () => {
  const blob = fixtureStorage();
  const found = readLegacy((k) => (k in blob ? blob[k] : null));
  assert.deepEqual(Object.keys(found).sort(),
    ["imat_mock1", "imat_mock2", "imat_mock3", "imat_mock4", "imat_mock5"]);
});

test("legacy import round-trips the tracker scores through the grader", () => {
  const blob = fixtureStorage();
  const found = readLegacy((k) => (k in blob ? blob[k] : null));
  const plan = planLegacyImport(found, { gradeAttempt, banks });
  const byExam = Object.fromEntries(plan.attempts.map((a) => [a.examId + (a.source === "imported_legacy_history" ? ":h" : ""), a]));
  for (const t of TRACKER) {
    const rec = byExam[t.id];
    assert.ok(rec, t.id);
    assert.equal(rec.source, "imported_legacy_result");
    assert.equal(Math.abs(rec.scoreTenths / 10 - t.total) < 0.001, true, `${t.id} score`);
    assert.equal(rec.correct, t.correct);
    assert.equal(rec.status, "submitted");
    assert.equal(rec.perm[1], null, "identity permutation for imports");
  }
  // history entries dedupe same-sitting and add one aggregate each
  const aggregates = plan.attempts.filter((a) => a.source === "imported_legacy_history");
  assert.equal(aggregates.length, 4);
  assert.ok(aggregates.every((a) => a.answers === null));
  // abandoned in-progress paper is reported skipped
  assert.ok(plan.skipped.some((s) => s.examId === "imat_mock2"));
  assert.equal(plan.discrepancies.length, 0);
});

test("mismatched stored totals are flagged as discrepancies and recompute wins", () => {
  const blob = fixtureStorage();
  const raw = JSON.parse(blob.imat_mock1_result);
  raw.total = 99.9;
  blob.imat_mock1_result = JSON.stringify(raw);
  const found = readLegacy((k) => (k in blob ? blob[k] : null));
  const plan = planLegacyImport(found, { gradeAttempt, banks });
  const rec = plan.attempts.find((a) => a.examId === "imat_mock1" && a.source === "imported_legacy_result");
  assert.equal(rec.scoreTenths, 15 * 35 - 4 * 9);
  assert.equal(rec.note, "legacy reported 99.9");
  assert.equal(plan.discrepancies.length, 1);
});

test("history-only entries import as aggregates", () => {
  const found = {
    imat_mock6: {
      history: [{ total: 40.0, correct: 28, wrong: 5, blank: 27, at: "2026-09-10T09:00:00.000Z" }],
    },
  };
  const plan = planLegacyImport(found, { gradeAttempt, banks });
  assert.equal(plan.attempts.length, 1);
  assert.equal(plan.attempts[0].source, "imported_legacy_history");
  assert.equal(plan.attempts[0].scoreTenths, 400);
});

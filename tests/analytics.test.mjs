import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import {
  answeredAccuracy, blankRate, penaltyPoints, calcWall, topicErrors,
  chronological, deltaVsPrevious, fmtDelta,
} from "../js/analytics.js";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const bank = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "imat_mock4.json"), "utf-8"));

function attempt(over) {
  return Object.assign({
    attemptId: "a1", examId: "imat_mock4", status: "submitted", deleted: false,
    submittedAt: "2026-09-17T13:30:00Z", createdAt: "2026-09-17T13:30:00Z",
    scoreTenths: 458, correct: 34, wrong: 13, blank: 13,
    sections: {
      A: { correct: 5, wrong: 2, blank: 2, scoreTenths: 67 },
      B: { correct: 15, wrong: 4, blank: 4, scoreTenths: 209 },
      C: { correct: 9, wrong: 4, blank: 2, scoreTenths: 119 },
      D: { correct: 3, wrong: 1, blank: 3, scoreTenths: 41 },
      E: { correct: 2, wrong: 2, blank: 2, scoreTenths: 22 },
    },
  }, over);
}

test("answeredAccuracy is blank-safe", () => {
  assert.equal(answeredAccuracy(attempt({ correct: 34, wrong: 13 })), 34 / 47);
  assert.equal(answeredAccuracy(attempt({ correct: 0, wrong: 0 })), null);
});

test("blankRate and penaltyPoints", () => {
  assert.equal(blankRate(attempt(), 60), 13 / 60);
  assert.equal(penaltyPoints(attempt({ wrong: 12 })), 4.8);
  assert.equal(penaltyPoints(attempt({ wrong: 0 })), 0);
});

test("calcWall sums C and E blanks with points left", () => {
  const w = calcWall(attempt());
  assert.equal(w.blanks, 4);
  assert.equal(w.pointsLeft, 6);
});

test("topicErrors groups wrong and blank by topic with share", () => {
  const answers = {};
  for (const q of bank.questions) {
    if (q.topic === "Mole") answers[q.n] = null; // blank
    else if (q.topic === "Redox") answers[q.n] = "ABCDE"[(q.ans.charCodeAt(0) - 64) % 5]; // wrong
    else answers[q.n] = q.ans;
  }
  const rows = topicErrors({ answers, perm: null }, bank);
  const mole = rows.find((r) => r.topic === "Mole");
  const redox = rows.find((r) => r.topic === "Redox");
  assert.ok(mole && mole.blank > 0 && mole.wrong === 0);
  assert.ok(redox && redox.wrong > 0);
  const total = rows.reduce((s, r) => s + r.errors, 0);
  assert.ok(Math.abs(rows.reduce((s, r) => s + r.errorShare, 0) - 1) < 1e-9);
  assert.ok(rows[0].errors >= rows[rows.length - 1].errors);
});

test("deltaVsPrevious and chronological ordering", () => {
  const a1 = attempt({ attemptId: "a1", scoreTenths: 400, submittedAt: "2026-09-01T10:00:00Z" });
  const a2 = attempt({ attemptId: "a2", scoreTenths: 458, submittedAt: "2026-09-17T10:00:00Z" });
  const other = attempt({ attemptId: "z9", examId: "imat_mock1", scoreTenths: 700, submittedAt: "2026-09-16T10:00:00Z" });
  assert.equal(deltaVsPrevious(a2, [a2, a1, other]), 5.8);
  assert.equal(deltaVsPrevious(a1, [a2, a1, other]), null);
  assert.equal(fmtDelta(5.8), "+5.8");
  assert.equal(fmtDelta(-1.2), "-1.2");
  const chrono = chronological([a2, other, a1]);
  assert.deepEqual(chrono.map((a) => a.attemptId), ["a1", "z9", "a2"]);
});

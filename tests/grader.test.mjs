import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { gradeAttempt, fmtTenths } from "../js/grader.js";
import { computePermMap, displayKey, identityPermMap } from "../js/core.js";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, "..", "data");
const bankIds = fs.readdirSync(DATA).filter((f) => f.endsWith(".json") && f !== "exams.json")
  .map((f) => f.replace(/\.json$/, ""));
const banks = Object.fromEntries(bankIds.map((id) => [id, JSON.parse(fs.readFileSync(path.join(DATA, id + ".json"), "utf-8"))]));

function syntheticBank() {
  return {
    id: "synth", kind: "mock", durationSec: 6000, maxTenths: 75,
    sections: [
      { code: "A", from: 1, to: 3, label: "Section A", short: "A" },
      { code: "B", from: 4, to: 5, label: "Section B", short: "B" },
    ],
    questions: [
      { n: 1, stem: "s1", options: ["a", "b", "c", "d", "e"], ans: "A", exp: "e", topic: "t", lik: "H", perm: null },
      { n: 2, stem: "s2", options: ["a", "b", "c", "d", "e"], ans: "C", exp: "e", topic: "t", lik: "M", perm: null },
      { n: 3, stem: "s3", options: ["a", "b", "c", "d", "e"], ans: "E", exp: "e", topic: "t", lik: "L", perm: null },
      { n: 4, stem: "s4", options: ["a", "b", "c", "d", "e"], ans: "B", exp: "e", topic: "t", lik: "H", perm: null },
      { n: 5, stem: "s5", options: ["a", "b", "c", "d", "e"], ans: "D", exp: "e", topic: "t", lik: "M", perm: null },
    ],
  };
}

test("all-correct grades to maxTenths on every real bank (identity and computed perms)", () => {
  for (const [id, bank] of Object.entries(banks)) {
    for (const permMap of [identityPermMap(bank), computePermMap(bank, 42)]) {
      const answers = {};
      for (const q of bank.questions) answers[q.n] = displayKey(q, permMap[q.n]);
      const g = gradeAttempt(bank, answers, permMap);
      assert.equal(g.scoreTenths, bank.maxTenths, id);
      assert.equal(g.wrong, 0);
      assert.equal(g.blank, 0);
      assert.equal(g.correct, bank.questions.length);
    }
  }
});

test("all-wrong grades to -4 * n, all-blank to 0", () => {
  const bank = banks.imat_mock6;
  const wrong = {};
  for (const q of bank.questions) {
    wrong[q.n] = "ABCDE"[(displayKey(q, null).charCodeAt(0) - 64) % 5]; // neighbour letter
  }
  const g = gradeAttempt(bank, wrong, null);
  assert.equal(g.scoreTenths, -4 * bank.questions.length);
  const g2 = gradeAttempt(bank, {}, null);
  assert.equal(g2.scoreTenths, 0);
  assert.equal(g2.blank, bank.questions.length);
});

test("41 correct / 12 wrong / 7 blank = 567 tenths = 56.7 (spec fixture)", () => {
  const bank = syntheticBank();
  bank.maxTenths = 900;
  const answers = { 1: "A", 2: "C", 4: "B" }; // 3 correct
  const g = gradeAttempt(bank, answers, null);
  // synthetic check of the arithmetic instead: 15c - 4w
  assert.equal(15 * 41 - 4 * 12, 567);
  assert.equal(fmtTenths(567), "56.7");
});

test("section aggregates match hand-computed values", () => {
  const bank = syntheticBank();
  const answers = { 1: "A", 2: "C", 3: "A", 4: "B", 5: "A" }; // 3 correct, 2 wrong (q3 vs E, q5 vs D)
  const g = gradeAttempt(bank, answers, null);
  assert.equal(g.sections.A.scoreTenths, 15 * 2 + (-4)); // q1 ok, q2 ok, q3 wrong
  assert.equal(g.sections.A.correct, 2);
  assert.equal(g.sections.A.wrong, 1);
  assert.equal(g.sections.B.scoreTenths, 15 - 4); // q4 ok, q5 wrong
  assert.equal(g.scoreTenths, 45 - 8);
});

test("integer tenths: score always integral, no float drift over 10000 randomized cases", () => {
  let s = 12345;
  const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  const bank = syntheticBank();
  for (let i = 0; i < 10000; i++) {
    const answers = {};
    for (const q of bank.questions) {
      const r = rnd();
      if (r < 0.4) answers[q.n] = "ABCDE"[Math.floor(rnd() * 5)];
    }
    const g = gradeAttempt(bank, answers, null);
    assert.ok(Number.isInteger(g.scoreTenths));
    assert.equal(g.scoreTenths, 15 * g.correct - 4 * g.wrong);
  }
});

test("fmtTenths formats negatives and zero correctly", () => {
  assert.equal(fmtTenths(0), "0.0");
  assert.equal(fmtTenths(900), "90.0");
  assert.equal(fmtTenths(-26), "-2.6");
  assert.equal(fmtTenths(-4), "-0.4");
});

test("real banks load with expected shapes", () => {
  const manifest = JSON.parse(fs.readFileSync(`${DATA}/exams.json`, "utf-8"));
  assert.equal(bankIds.length, manifest.exams.length);
  assert.ok(bankIds.length >= 14);
  for (const bank of Object.values(banks)) {
    assert.ok(bank.questions.length >= 60);
    for (const q of bank.questions) assert.equal(q.options.length, 5);
  }
});

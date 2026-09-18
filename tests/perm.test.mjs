import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { computePermMap, displayKey, numericOrder, displayDistribution, identityPermMap, parseNumericOption } from "../js/core.js";
import { gradeAttempt } from "../js/grader.js";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, "..", "data");
const bankIds = fs.readdirSync(DATA).filter((f) => f.endsWith(".json") && f !== "exams.json")
  .map((f) => f.replace(/\.json$/, ""));
const banks = Object.fromEntries(bankIds.map((id) => [id, JSON.parse(fs.readFileSync(path.join(DATA, id + ".json"), "utf-8"))]));

test("determinism: same bank + seed gives identical perm maps", () => {
  for (const bank of Object.values(banks)) {
    const a = computePermMap(bank, 918273);
    const b = computePermMap(bank, 918273);
    assert.deepEqual(a, b);
  }
});

test("distribution bounds for all banks across 50 random seeds", () => {
  for (const bank of Object.values(banks)) {
    const n = bank.questions.length;
    const base = Math.floor(n / 5), rem = n % 5;
    for (let seed = 0; seed < 50; seed++) {
      const map = computePermMap(bank, seed * 7919 + 13);
      const dist = displayDistribution(bank, map);
      "ABCDE".split("").forEach((c, i) => {
        const target = base + (i < rem ? 1 : 0);
        assert.ok(
          target - 2 <= dist[c] && dist[c] <= target + 2,
          `${bank.id} seed ${seed}: letter ${c} = ${dist[c]}, target ${target}`);
      });
    }
  }
});

test("seed-0 bank baselines are balanced (audit agreement)", () => {
  for (const bank of Object.values(banks)) {
    const dist = displayDistribution(bank, null && null) || null;
    // bank file stores its own baseline perm per question
    const counts = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    for (const q of bank.questions) counts[displayKey(q, q.perm)] += 1;
    for (const c of "ABCDE") {
      assert.ok(Math.abs(counts[c] - bank.questions.length / 5) <= 1, `${bank.id} ${c}=${counts[c]}`);
    }
  }
});

test("permutations are bijections and preserve the option multiset", () => {
  for (const bank of Object.values(banks)) {
    const map = computePermMap(bank, 777);
    for (const q of bank.questions) {
      const p = map[q.n];
      if (p === null) continue;
      assert.deepEqual([...p].sort(), [0, 1, 2, 3, 4], `${bank.id} Q${q.n}`);
      const shown = p.map((i) => q.options[i]).sort();
      assert.deepEqual(shown, [...q.options].sort(), `${bank.id} Q${q.n} multiset`);
    }
  }
});

test("numeric option sets display in ascending order", () => {
  const bank = banks.imat_mock4;
  const map = computePermMap(bank, 1234);
  let numericSeen = 0;
  for (const q of bank.questions) {
    const order = numericOrder(q.options);
    if (!order) continue;
    numericSeen++;
    const p = map[q.n];
    assert.deepEqual(p, order, `Q${q.n} should use the fixed ascending order`);
    const vals = p.map((i) => parseNumericOption(q.options[i]).value);
    for (let i = 1; i < vals.length; i++) assert.ok(vals[i] >= vals[i - 1], `Q${q.n} ascending`);
  }
  assert.ok(numericSeen > 5, "mock4 has plenty of numeric questions");
});

test("all-correct simulation with computed perms grades to maxTenths", () => {
  for (const bank of Object.values(banks)) {
    for (const seed of [0, 1, 424242]) {
      const map = computePermMap(bank, seed);
      const answers = {};
      for (const q of bank.questions) answers[q.n] = displayKey(q, map[q.n]);
      const g = gradeAttempt(bank, answers, map);
      assert.equal(g.scoreTenths, bank.maxTenths, `${bank.id} seed ${seed}`);
    }
  }
});

test("legacy identity case: displayKey with null perm equals the bank answer letter", () => {
  const bank = banks.imat_mock1;
  for (const q of bank.questions.slice(0, 10)) {
    assert.equal(displayKey(q, null), q.ans);
    assert.equal(displayKey(q, [0, 1, 2, 3, 4]), q.ans);
  }
});

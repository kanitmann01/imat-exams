import { test } from "node:test";
import assert from "node:assert/strict";
import { advance, resume } from "../js/timer.js";

const T0 = 1726656000000; // arbitrary fixed epoch ms

test("advance decrements by real elapsed seconds", () => {
  const r = { remainingSec: 6000, lastTickAt: T0 };
  const a = advance(r, T0 + 1000);
  assert.equal(a.remainingSec, 5999);
  assert.equal(a.lastTickAt, T0 + 1000);
  assert.equal(a.expired, false);
});

test("advance is idempotent within the same second (throttled intervals)", () => {
  const r = { remainingSec: 6000, lastTickAt: T0 };
  assert.equal(advance(r, T0 + 400).remainingSec, 6000);
  assert.equal(advance(r, T0 + 999).remainingSec, 6000);
  assert.equal(advance(r, T0 + 1000).remainingSec, 5999);
});

test("kind resume forgives away time", () => {
  const r = { remainingSec: 5000, lastTickAt: T0 };
  const out = resume(r, T0 + 3600 * 1000, "kind");
  assert.equal(out.remainingSec, 5000);
  assert.equal(out.lastTickAt, T0 + 3600 * 1000);
  // next tick after resume charges only the new second
  const a = advance({ remainingSec: out.remainingSec, lastTickAt: out.lastTickAt }, T0 + 3600 * 1000 + 1000);
  assert.equal(a.remainingSec, 4999);
});

test("strict resume charges away time, capped at remaining", () => {
  const r = { remainingSec: 5000, lastTickAt: T0 };
  const out = resume(r, T0 + 1200 * 1000, "strict"); // away 20 min = 1200 s
  assert.equal(out.remainingSec, 3800);
  const r2 = { remainingSec: 500, lastTickAt: T0 };
  const out2 = resume(r2, T0 + 3600 * 1000, "strict"); // away 60 min > remaining
  assert.equal(out2.remainingSec, 0);
  assert.equal(out2.expired, true);
});

test("expired flag fires exactly once at the crossing", () => {
  const r = { remainingSec: 2, lastTickAt: T0 };
  assert.equal(advance(r, T0 + 1000).expired, false);
  assert.equal(advance({ remainingSec: 1, lastTickAt: T0 + 1000 }, T0 + 2000).expired, true);
  assert.equal(advance({ remainingSec: 0, lastTickAt: T0 + 2000 }, T0 + 3000).expired, false);
});

test("drift resistance: clock deltas, not naive decrements", () => {
  // simulate a background-throttled tab: one callback after 45 s
  const r = { remainingSec: 6000, lastTickAt: T0 };
  const out = advance(r, T0 + 45000);
  assert.equal(out.remainingSec, 5955);
});

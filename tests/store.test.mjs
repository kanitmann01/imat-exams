import { test } from "node:test";
import assert from "node:assert/strict";
import { makeMemoryAdapter, AttemptStore } from "../js/store.js";

function newStore() {
  return new AttemptStore(makeMemoryAdapter());
}

test("attempt CRUD keeps the index consistent", () => {
  const store = newStore();
  const a = store.createAttempt({ examId: "imat_mock6", maxTenths: 900 });
  const b = store.createAttempt({ examId: "imat_mock4", maxTenths: 900 });
  assert.deepEqual(store.attemptIndex(), [a.attemptId, b.attemptId]);
  assert.equal(store.getAttempt(a.attemptId).examId, "imat_mock6");
  assert.equal(store.allAttempts().length, 2);
  store.deleteAttempt(a.attemptId);
  assert.equal(store.getAttempt(a.attemptId), null); // tombstoned, hidden
  assert.equal(store.allAttempts().length, 1);
  const tomb = store.rawGet("attempt." + a.attemptId);
  assert.equal(tomb.deleted, true);
});

test("saveAttempt flags dirty and queues for sync", () => {
  const store = newStore();
  const a = store.createAttempt({ examId: "imat_mock6" });
  assert.ok(a.dirty);
  assert.deepEqual(store.syncQueue(), [a.attemptId]);
  store.dequeueSync(a.attemptId);
  assert.deepEqual(store.syncQueue(), []);
});

test("corrupted JSON record is quarantined, not thrown", () => {
  const store = newStore();
  const a = store.createAttempt({ examId: "imat_mock6" });
  store.adapter.set("attempt." + a.attemptId, "{not json");
  const got = store.getAttempt(a.attemptId);
  assert.equal(got, null);
  const log = JSON.parse(store.adapter.get("quarantine.log"));
  assert.equal(log.length, 1);
  assert.ok(store.adapter.get("quarantine.attempt." + a.attemptId).includes("{not json"));
});

test("inProgressFor finds the single open attempt per exam", () => {
  const store = newStore();
  const a = store.createAttempt({ examId: "imat_mock1" });
  store.createAttempt({ examId: "imat_mock2" });
  assert.equal(store.inProgressFor("imat_mock1").attemptId, a.attemptId);
  assert.equal(store.inProgressFor("GK_Drill_100"), null);
});

test("export / import round-trips attempts; import is last-write-wins", () => {
  const s1 = newStore();
  const a = s1.createAttempt({ examId: "imat_mock4" });
  a.scoreTenths = 458;
  a.status = "submitted";
  s1.saveAttempt(a);
  const dump = JSON.parse(JSON.stringify(s1.exportData()));
  const s2 = newStore();
  assert.equal(s2.importData(dump), 1);
  assert.equal(s2.getAttempt(a.attemptId).scoreTenths, 458);
  // older payload must not overwrite newer local state
  dump.attempts[0].scoreTenths = 1;
  dump.attempts[0].updatedAt = "2000-01-01T00:00:00Z";
  assert.equal(s2.importData(dump), 0);
  assert.equal(s2.getAttempt(a.attemptId).scoreTenths, 458);
});

test("wipe clears every namespaced key", () => {
  const store = newStore();
  store.createAttempt({ examId: "imat_mock6" });
  store.setUnlocked(true);
  store.wipe();
  assert.deepEqual(store.attemptIndex(), []);
  assert.equal(store.isUnlocked(), false);
});

test("settings round-trip", () => {
  const store = newStore();
  const s = store.settings();
  s.strictTimer.default = true;
  s.strictTimer.perExam.imat_mock4 = true;
  store.saveSettings(s);
  assert.equal(store.settings().strictTimer.perExam.imat_mock4, true);
});

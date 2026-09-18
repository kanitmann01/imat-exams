/* Legacy import: convert the old self-contained exams' localStorage keys into
   attempt records (SPEC 5.4). Pure logic: storage is injected (browser adapter
   or a plain object in tests). Legacy keys are NEVER modified or deleted.
   Legacy ids have no "imat_" prefix mapping surprises: ids are exactly
   imat_mock1..8, GK_Drill_100, Repair_Drill_1. */

export const LEGACY_IDS = ["imat_mock1", "imat_mock2", "imat_mock3", "imat_mock4",
  "imat_mock5", "imat_mock6", "imat_mock7", "imat_mock8", "GK_Drill_100", "Repair_Drill_1"];

export const LEGACY_MAX = { imat_mock1: 90, imat_mock2: 90, imat_mock3: 90, imat_mock4: 90,
  imat_mock5: 90, imat_mock6: 90, imat_mock7: 90, imat_mock8: 90,
  GK_Drill_100: 150, Repair_Drill_1: 105 };

/* Read raw legacy values from any key->string getter. Returns the found blobs. */
export function readLegacy(get) {
  const found = {};
  for (const id of LEGACY_IDS) {
    const entry = {};
    for (const suffix of ["_result", "_history", "_answers"]) {
      const raw = get(id + suffix);
      if (raw != null) {
        try { entry[suffix.slice(1)] = JSON.parse(raw); } catch (e) { /* ignore malformed */ }
      }
    }
    if (entry.result || (entry.history && entry.history.length) || entry.answers) found[id] = entry;
  }
  return found;
}

/* Build attempt records from legacy blobs. `grader` = gradeAttempt(bank, answers, permMap)
   injected by the caller (needs the bank for section aggregates); when a bank is
   unavailable the stored totals are kept and marked approximate in note. */
export function planLegacyImport(found, { gradeAttempt, banks }) {
  const attempts = [];
  const skipped = [];
  const discrepancies = [];
  for (const id of LEGACY_IDS) {
    const entry = found[id];
    if (!entry) continue;
    const seenAts = new Set();
    if (entry.result && entry.result.answers) {
      seenAts.add(entry.result.at);
      const bank = banks ? banks[id] : null;
      let scoreTenths, correct, wrong, blank, sections = null, permMap = null;
      if (bank) {
        permMap = {};
        for (const q of bank.questions) permMap[q.n] = null; // identity: legacy letters = original order
        const g = gradeAttempt(bank, entry.result.answers, permMap);
        scoreTenths = g.scoreTenths; correct = g.correct; wrong = g.wrong; blank = g.blank;
        sections = g.sections;
      } else {
        correct = entry.result.correct; wrong = entry.result.wrong; blank = entry.result.blank;
        scoreTenths = Math.round((correct * 1.5 - wrong * 0.4) * 10);
      }
      const storedTotal = typeof entry.result.total === "number" ? entry.result.total : null;
      const reTotal = scoreTenths / 10;
      let note = null;
      if (storedTotal != null && Math.abs(storedTotal - reTotal) > 0.05) {
        note = "legacy reported " + storedTotal.toFixed(1);
        discrepancies.push({ examId: id, stored: storedTotal, recomputed: reTotal });
      }
      attempts.push({
        examId: id,
        status: "submitted",
        source: "imported_legacy_result",
        createdAt: entry.result.at,
        startedAt: entry.result.at,
        submittedAt: entry.result.at,
        durationSec: 6000,
        remainingSec: 0,
        lastTickAt: entry.result.at,
        seed: 0,
        perm: permMap,
        answers: entry.result.answers,
        scoreTenths,
        maxTenths: LEGACY_MAX[id] * 10,
        correct, wrong, blank,
        sections,
        note,
        dirty: false,
        deleted: false,
      });
    }
    for (const h of entry.history || []) {
      if (!h || seenAts.has(h.at)) continue; // same sitting as the imported result
      attempts.push({
        examId: id,
        status: "submitted",
        source: "imported_legacy_history",
        createdAt: h.at,
        startedAt: h.at,
        submittedAt: h.at,
        durationSec: 6000,
        remainingSec: 0,
        lastTickAt: h.at,
        seed: 0,
        perm: null,
        answers: null,
        scoreTenths: Math.round(h.total * 10),
        maxTenths: LEGACY_MAX[id] * 10,
        correct: h.correct, wrong: h.wrong, blank: h.blank,
        sections: null,
        note: "aggregate only (from old history)",
        dirty: false,
        deleted: false,
      });
    }
    if (entry.answers && !entry.result) {
      skipped.push({ examId: id, reason: "in-progress paper without a result; cannot be resumed into the new runner" });
    }
  }
  return { attempts, skipped, discrepancies };
}

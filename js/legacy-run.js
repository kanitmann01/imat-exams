/* Browser-side legacy import runner: reads the OLD exams' unprefixed
   localStorage keys directly (they are NOT namespaced with imatex.), converts
   them, and stores an import report. Idempotent per attempt id. */

import { readLegacy, planLegacyImport } from "./legacy.js";
import { loadBank } from "./banks.js";
import { gradeAttempt } from "./grader.js";
import { el } from "./ui.js";

const RAW_LEGACY_IDS = ["imat_mock1", "imat_mock2", "imat_mock3", "imat_mock4",
  "imat_mock5", "imat_mock6", "imat_mock7", "imat_mock8", "GK_Drill_100", "Repair_Drill_1"];

function rawGet(key) {
  try { return window.localStorage.getItem(key); } catch (e) { return null; }
}

export async function runLegacyImportIfPending(ctx, { force = false } = {}) {
  const store = ctx.store;
  const prior = force ? null : store.rawGet("legacy.import");
  if (prior) return prior;
  const found = readLegacy(rawGet);
  const report = { at: new Date().toISOString(), found: [], imported: [], skipped: [], discrepancies: [] };
  if (!Object.keys(found).length) {
    store.rawSet("legacy.import", report);
    return report;
  }
  const banks = {};
  for (const id of Object.keys(found)) {
    try { banks[id] = await loadBank(id); } catch (e) { /* grade without bank */ }
  }
  const plan = planLegacyImport(found, { gradeAttempt, banks });
  for (const [id] of Object.entries(found)) report.found.push(id);
  let i = 0;
  for (const a of plan.attempts) {
    const attemptId = "legacy-" + a.examId + "-" + (a.submittedAt || String(i++)).replace(/[:.]/g, "-");
    if (store.getAttempt(attemptId)) { report.imported.push(attemptId + " (already present)"); continue; }
    store.createAttempt(Object.assign({}, a, { attemptId }));
    report.imported.push(attemptId);
  }
  report.skipped = plan.skipped;
  report.discrepancies = plan.discrepancies;
  store.rawSet("legacy.import", report);
  return report;
}

export function legacyReportSummary(report) {
  if (!report) return null;
  const lines = [];
  if (report.imported.length) lines.push("Imported " + report.imported.length + " past attempt(s) from the old exam pages.");
  for (const s of report.skipped || []) lines.push("Skipped " + s.examId + ": " + s.reason);
  for (const d of report.discrepancies || []) {
    lines.push(d.examId + ": recomputed " + d.recomputed.toFixed(1) + " vs stored " + d.stored.toFixed(1));
  }
  return lines;
}

export function legacyBanner(report) {
  const lines = legacyReportSummary(report);
  if (!lines || !lines.length) return null;
  return el("div", { class: "note-banner" }, ...lines.map((l) => el("p", { text: l })));
}

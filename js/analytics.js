/* Derived metrics shared by History, Compare and Analytics (SPEC 7.2).
   Integer tenths internally; one-decimal display. Pure module. */

import { fmtTenths } from "./grader.js";

export function scoreOf(a) {
  return a.scoreTenths == null ? null : a.scoreTenths;
}

export function answeredAccuracy(a) {
  const denom = (a.correct || 0) + (a.wrong || 0);
  return denom === 0 ? null : (a.correct || 0) / denom;
}

export function blankRate(a, qCount) {
  return qCount ? (a.blank || 0) / qCount : null;
}

/* Points lost to wrong answers, in display points (0.4 * wrong). */
export function penaltyPoints(a) {
  return Math.round(4 * (a.wrong || 0)) / 10;
}

/* Calc wall (mocks only): blanks in Chemistry + Physics. */
export function calcWall(a) {
  const c = a.sections && a.sections.C ? a.sections.C.blank : 0;
  const e = a.sections && a.sections.E ? a.sections.E.blank : 0;
  return { blanks: c + e, pointsLeft: Math.round(15 * (c + e)) / 10 };
}

/* Group wrong+blank questions by topic for one attempt against its bank.
   Returns [{topic, wrong, blank, errors, errorShare}] sorted by errors desc. */
export function topicErrors(attempt, bank) {
  if (!attempt.answers) return [];
  const topics = {};
  let totalErrors = 0;
  for (const q of bank.questions) {
    const a = attempt.answers[q.n];
    const isWrong = a && a !== attemptKeyOf(attempt, q);
    const isBlank = !a;
    if (!isWrong && !isBlank) continue;
    const t = q.topic || "Unknown";
    if (!topics[t]) topics[t] = { topic: t, wrong: 0, blank: 0, errors: 0 };
    if (isWrong) topics[t].wrong += 1; else topics[t].blank += 1;
    topics[t].errors += 1;
    totalErrors += 1;
  }
  return Object.values(topics)
    .map((t) => ({ ...t, errorShare: totalErrors ? t.errors / totalErrors : 0 }))
    .sort((a, b) => b.errors - a.errors || a.topic.localeCompare(b.topic));
}

/* The displayed key this attempt was graded against (stored at submit time). */
function attemptKeyOf(attempt, q) {
  const perm = attempt.perm && attempt.perm[q.n] !== undefined ? attempt.perm[q.n] : null;
  if (!perm) return q.ans;
  const origIdx = q.ans.charCodeAt(0) - 65;
  return "ABCDE"[perm.indexOf(origIdx)];
}

/* Attempts sorted by submittedAt (or createdAt) ascending, for trend lines. */
export function chronological(attempts) {
  return [...attempts]
    .filter((a) => a.status === "submitted" && !a.deleted)
    .sort((a, b) => new Date(a.submittedAt || a.createdAt) - new Date(b.submittedAt || b.createdAt));
}

/* Signed delta vs the previous submitted attempt of the same exam (display points). */
export function deltaVsPrevious(attempt, allAttempts) {
  const peers = chronological(allAttempts).filter((a) => a.examId === attempt.examId);
  const idx = peers.findIndex((a) => a.attemptId === attempt.attemptId);
  if (idx <= 0) return null;
  const prev = peers[idx - 1];
  if (prev.scoreTenths == null || attempt.scoreTenths == null) return null;
  return (attempt.scoreTenths - prev.scoreTenths) / 10;
}

export function fmtDelta(d) {
  if (d == null) return "";
  const s = fmtTenths(Math.round(d * 10));
  return (d >= 0 ? "+" : "") + s;
}

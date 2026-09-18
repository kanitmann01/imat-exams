/* Pure grading engine. All arithmetic in integer tenths (+15 / -4 / 0):
   no floating-point scoring anywhere. Shared by browser and node tests. */

import { displayKey } from "./core.js";

/* answers: {qn: displayLetter|null}; permMap: {qn: perm|null} */
export function gradeAttempt(bank, answers, permMap) {
  let correct = 0, wrong = 0, blank = 0;
  const sections = {};
  for (const s of bank.sections) {
    sections[s.code] = { correct: 0, wrong: 0, blank: 0, scoreTenths: 0 };
  }
  const sectionOf = {};
  for (const s of bank.sections) {
    for (let n = s.from; n <= s.to; n++) sectionOf[n] = s.code;
  }
  for (const q of bank.questions) {
    const code = sectionOf[q.n];
    const a = answers[q.n];
    if (!a) {
      blank += 1;
      sections[code].blank += 1;
    } else if (a === displayKey(q, permMap ? permMap[q.n] : null)) {
      correct += 1;
      sections[code].correct += 1;
      sections[code].scoreTenths += 15;
    } else {
      wrong += 1;
      sections[code].wrong += 1;
      sections[code].scoreTenths -= 4;
    }
  }
  const scoreTenths = 15 * correct - 4 * wrong;
  return { scoreTenths, correct, wrong, blank, sections };
}

/* tenths -> display string with exactly one decimal */
export function fmtTenths(tenths) {
  const sign = tenths < 0 ? "-" : "";
  const abs = Math.abs(tenths);
  return sign + Math.floor(abs / 10) + "." + (abs % 10);
}

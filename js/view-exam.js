/* #/exam/<id> : the runner. Resume-or-start, autosave every answer, visible-tick
   timer, navigator, submit modal. At 00:00 the clock freezes and the paper STAYS
   OPEN (no auto-submit): an expired banner asks her to submit manually.
   Anti-leak: NO topic, NO difficulty, NO explanations, NO answer structure in
   the pre-submit DOM (SPEC 2.4, AL-1/2/5/7). Options render byte-identically;
   selection is the only style state. */

import { loadBank } from "./banks.js";
import { computePermMap, optionAt } from "./core.js";
import { gradeAttempt } from "./grader.js";
import { el, clear, fmtClock, toast, confirmModal } from "./ui.js";
import { resume as timerResume, startTicker } from "./timer.js";

export async function mount(ctx, examId) {
  const store = ctx.store;
  const main = ctx.routeRoot;
  let bank;
  try {
    bank = await loadBank(examId);
  } catch (e) {
    main.append(el("div", { class: "card" },
      el("h3", { text: "Could not load this paper" }),
      el("p", { text: "You may be offline and this is the first visit, or the paper is missing." }),
      el("button", { class: "btn btn-primary", text: "Retry", onclick: () => { clear(main); mount(ctx, examId); } })));
    return null;
  }

  let attempt = store.inProgressFor(examId);
  let isNew = false;
  if (!attempt) {
    const settings = store.settings();
    const seed = new Uint32Array(1);
    crypto.getRandomValues(seed);
    const strict = !!(settings.strictTimer && (settings.strictTimer.perExam[examId] != null
      ? settings.strictTimer.perExam[examId]
      : settings.strictTimer.default));
    attempt = store.createAttempt({
      examId,
      bankVersion: bank.bankVersion,
      durationSec: bank.durationSec,
      remainingSec: bank.durationSec,
      maxTenths: bank.maxTenths,
      seed: seed[0] >>> 0,
      strictTimer: strict,
    });
    attempt.perm = mapToObj(computePermMap(bank, attempt.seed));
    store.saveAttempt(attempt);
    isNew = true;
  }
  if (isNew) toast("New attempt started");
  if (attempt.status !== "in_progress") {
    // opening a finished exam starts a fresh paper (SPEC 4.3)
    ctx.go("#/exam/" + examId);
    return null;
  }
  if (!attempt.perm) {
    // covers attempts created by Reattempt / import paths that deferred permutation
    attempt.perm = computePermMap(bank, attempt.seed || 0);
    store.saveAttempt(attempt);
  }

  const permMap = attempt.perm || {};
  const answers = Object.assign({}, attempt.answers || {});
  let stopTicker = null;
  let expiredShown = false;
  let expiredNote = null;
  let firstAnswerToastShown = Object.keys(answers).length > 0;
  const sectionOf = {};
  for (const s of bank.sections) {
    for (let n = s.from; n <= s.to; n++) sectionOf[n] = s.code;
  }

  /* ---------- timer ---------- */
  const timerChip = el("span", { id: "timer", class: "timer", text: fmtClock(attempt.remainingSec) });
  function persistTimer() {
    attempt.remainingSec = Math.max(0, attempt.remainingSec);
    attempt.lastTickAt = Date.now();
    store.saveAttempt(attempt);
  }
  function updateChip() {
    timerChip.textContent = fmtClock(attempt.remainingSec);
    timerChip.classList.toggle("warn", attempt.remainingSec <= 300);
  }
  function onExpired() {
    if (stopTicker) stopTicker();
    attempt.remainingSec = 0;
    attempt.lastTickAt = Date.now();
    store.saveAttempt(attempt);
    timerChip.textContent = fmtClock(0);
    timerChip.classList.remove("warn");
    timerChip.classList.add("expired");
    if (expiredNote && !expiredNote.isConnected) main.prepend(expiredNote);
    if (!expiredShown) {
      expiredShown = true;
      toast("Time is up. The paper stays open: submit when you are ready.");
    }
  }
  const mode = attempt.strictTimer ? "strict" : "kind";
  const resumed = timerResume({ remainingSec: attempt.remainingSec, lastTickAt: attempt.lastTickAt }, Date.now(), mode);
  attempt.remainingSec = resumed.remainingSec;
  attempt.lastTickAt = resumed.lastTickAt;
  const alreadyExpired = attempt.remainingSec <= 0;

  persistTimer();

  /* ---------- header slot ---------- */
  const answeredCount = el("b", { text: String(Object.keys(answers).length) });
  const headerNode = el("div", { class: "exam-headinfo" },
    el("span", { class: "muted" }, "Answered ", answeredCount, el("span", { text: "/" + bank.questions.length })),
    timerChip);
  ctx.setHeader(headerNode);
  updateChip();

  /* ---------- paper ---------- */
  const paper = el("div", { class: "paper" });
  let curSec = null;
  const cardEls = {};
  const cellEls = {};
  for (const q of bank.questions) {
    const code = sectionOf[q.n];
    if (code !== curSec) {
      curSec = code;
      const sec = bank.sections.find((s) => s.code === code);
      paper.append(el("div", { class: "sec-head", id: "sec-" + code },
        el("span", { text: sec.label }),
        el("span", { class: "cnt", text: "Q" + sec.from + "-" + sec.to })));
    }
    const opts = el("div", { class: "opts" });
    for (let i = 0; i < 5; i++) {
      const letter = "ABCDE"[i];
      const input = el("input", { type: "radio", name: "q" + q.n, value: letter });
      if (answers[q.n] === letter) input.checked = true;
      input.addEventListener("change", () => {
        answers[q.n] = letter;
        attempt.answers = answers;
        store.saveAttempt(attempt);
        if (!firstAnswerToastShown) { firstAnswerToastShown = true; toast("Progress autosaves - you can safely leave and resume"); }
        paintSelection(q.n);
        paintCell(q.n);
        answeredCount.textContent = String(Object.keys(answers).length);
        updateNavCounts();
      });
      opts.append(el("label", { class: "opt" }, input, el("span", { class: "key", text: letter + "." }), el("span", { text: optionAt(q, i, permMap[q.n]) })));
    }
    const card = el("div", { class: "qcard", id: "q" + q.n, dataset: { qn: q.n, sec: code } },
      el("div", { class: "qtop" }, el("span", { class: "qnum", text: "Question " + q.n })),
      el("div", { class: "stem", text: q.stem }),
      opts);
    cardEls[q.n] = card;
    paper.append(card);
  }

  /* ---------- navigator ---------- */
  const sideSum = el("div", { class: "side-sum", text: "Answered " + Object.keys(answers).length + "/" + bank.questions.length });
  const secCountEls = {};
  const navBody = el("div", { class: "nav-body" });
  for (const s of bank.sections) {
    let ansN = 0;
    const cells = el("div", { class: "cells" });
    for (let n = s.from; n <= s.to; n++) {
      const cell = el("button", {
        class: "cell", type: "button", text: String(n), title: "Question " + n,
        dataset: { qn: n },
        onclick: () => jumpTo(n),
      });
      if (answers[n]) { cell.classList.add("ans"); ansN++; }
      cellEls[n] = cell;
      cells.append(cell);
    }
    const secCount = el("span", { class: "sc", text: ansN + "/" + (s.to - s.from + 1) });
    secCountEls[s.code] = { node: secCount, from: s.from, to: s.to };
    navBody.append(el("div", { class: "sec-block" },
      el("div", { class: "sn" }, el("span", { text: s.code + " - " + s.short }), secCount),
      cells));
  }

  const side = el("aside", { class: "navside", id: "navside", "aria-label": "Question navigator" },
    el("h4", { text: "Navigator" }),
    el("div", { class: "jump-row" },
      el("input", { id: "jump-input", type: "number", min: "1", max: String(bank.questions.length), placeholder: "Go to #" }),
      el("button", { class: "btn btn-primary", text: "Go", onclick: () => {
        const v = parseInt(document.getElementById("jump-input").value, 10);
        if (v) jumpTo(v);
      } })),
    el("div", { class: "side-legend" },
      el("span", { class: "lg" }, el("span", { class: "sw sw-ans" }), "answered"),
      el("span", { class: "lg" }, el("span", { class: "sw" }), "blank")),
    navBody,
    sideSum);

  const scrim = el("div", { id: "nav-scrim", class: "nav-scrim" });
  scrim.addEventListener("click", closeDrawer);
  const sideToggle = el("button", { id: "nav-toggle", class: "btn btn-dark", text: "Nav", "aria-label": "Open question navigator" });
  sideToggle.addEventListener("click", () => {
    side.classList.contains("open") ? closeDrawer() : openDrawer();
  });
  document.getElementById("header-slot").append(sideToggle);

  const layout = el("div", { class: "exam-layout" },
    el("div", { class: "exam-main" }, paper),
    side,
    scrim);

  const submitBar = el("div", { class: "toolbar" },
    el("button", { class: "btn btn-teal btn-big", text: "Submit & see results", onclick: () => askSubmit() }));

  expiredNote = el("div", { class: "expired-note", role: "status" },
    el("strong", { text: "Time expired." }),
    el("span", { text: " The clock has stopped but the paper is still open: check anything you want, then press Submit & see results. Blanks still score 0 and wrong answers still lose 0.4." }));

  main.append(layout, submitBar);

  function openDrawer() { side.classList.add("open"); scrim.classList.add("show"); }
  function closeDrawer() { side.classList.remove("open"); scrim.classList.remove("show"); }

  function jumpTo(n) {
    const card = cardEls[n];
    if (!card) return;
    card.scrollIntoView({ behavior: "smooth", block: "start" });
    closeDrawer();
  }

  function paintSelection(qn) {
    const card = cardEls[qn];
    card.querySelectorAll(".opt").forEach((o) => o.classList.remove("sel"));
    const sel = answers[qn];
    if (sel) {
      const input = card.querySelector('input[value="' + sel + '"]');
      if (input) input.closest(".opt").classList.add("sel");
    }
  }
  function paintCell(qn) {
    const cell = cellEls[qn];
    if (cell) cell.classList.toggle("ans", !!answers[qn]);
  }
  function updateNavCounts() {
    const total = Object.keys(answers).filter(Boolean).length;
    sideSum.textContent = "Answered " + total + "/" + bank.questions.length;
    for (const code of Object.keys(secCountEls)) {
      const { node, from, to } = secCountEls[code];
      let a = 0;
      for (let n = from; n <= to; n++) if (answers[n]) a++;
      node.textContent = a + "/" + (to - from + 1);
    }
  }
  for (const qn of Object.keys(answers)) { paintSelection(qn); paintCell(qn); }
  updateNavCounts();

  /* ---------- submit ---------- */
  async function askSubmit() {
    const nBlank = bank.questions.length - Object.keys(answers).filter(Boolean).length;
    const body = el("div", {});
    body.append(el("p", { text: "You answered " + Object.keys(answers).filter(Boolean).length + " of " + bank.questions.length + ". Blank = 0 points, wrong = -0.4." }));
    const perSec = el("div", { class: "modal-secs" });
    for (const s of bank.sections) {
      let a = 0;
      for (let n = s.from; n <= s.to; n++) if (answers[n]) a++;
      perSec.append(el("span", { class: "chip", text: s.short + " " + a + "/" + (s.to - s.from + 1) }));
    }
    body.append(perSec);
    if (nBlank > 0) body.append(el("p", { class: "muted", text: nBlank + " unanswered." }));
    const ok = await confirmModal({ title: "Submit paper?", body, okLabel: "Submit", cancelLabel: "Keep working" });
    if (ok) doSubmit();
  }

  let submitted = false;
  function finalizeSubmit() {
    submitted = true;
    const g = gradeAttempt(bank, answers, permMap);
    attempt.status = "submitted";
    attempt.answers = answers;
    attempt.submittedAt = new Date().toISOString();
    attempt.autoSubmitted = false;
    attempt.remainingSec = Math.max(0, attempt.remainingSec);
    attempt.scoreTenths = g.scoreTenths;
    attempt.correct = g.correct;
    attempt.wrong = g.wrong;
    attempt.blank = g.blank;
    attempt.sections = g.sections;
    store.saveAttempt(attempt);
  }
  function doSubmit() {
    if (submitted) return;
    if (stopTicker) stopTicker();
    finalizeSubmit();
    ctx.setHeader(null);
    ctx.go("#/review/" + attempt.attemptId, true);
  }

  if (alreadyExpired) {
    onExpired();
  } else {
    stopTicker = startTicker(attempt, mode, {
      onTick: () => { updateChip(); },
      onExpire: onExpired,
      onPersist: persistTimer,
    });
  }

  return function unmount() {
    if (stopTicker) stopTicker();
    if (!submitted) persistTimer();
    ctx.setHeader(null);
  };
}

/* perm maps come from storage as plain objects {qn: perm|null} */
function mapToObj(map) {
  const out = {};
  for (const [k, v] of Object.entries(map)) out[k] = v;
  return out;
}

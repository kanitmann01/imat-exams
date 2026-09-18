/* #/review/<attemptId> : graded paper. Score panel, section stats, filters,
   correct/wrong/blank coloring, explanations, and NOW topic + difficulty badges
   (review-only, per AL-1). Also the launch point for a reattempt. */

import { loadBank } from "./banks.js";
import { displayKey, optionAt } from "./core.js";
import { el, clear, fmtScore, fmtDate, toast } from "./ui.js";

const LIK_LABEL = { H: "High yield", M: "Medium", L: "Low yield" };

export async function mount(ctx, attemptId) {
  const store = ctx.store;
  const main = ctx.routeRoot;
  const attempt = store.getAttempt(attemptId);
  if (!attempt || attempt.status !== "submitted") {
    ctx.go(attempt && attempt.status === "in_progress" ? "#/exam/" + attempt.examId : "#/history", true);
    return null;
  }
  const bank = await loadBank(attempt.examId);
  const permMap = attempt.perm || {};
  const answers = attempt.answers || {};
  const hasPerQuestion = !!attempt.answers;

  /* ---------- score panel ---------- */
  const scorePanel = el("div", { class: "score-panel" },
    el("div", { class: "big" }, fmtScore(attempt.scoreTenths), el("small", { text: " / " + fmtScore(attempt.maxTenths) })),
    el("div", { class: "sub-line", text: attempt.correct + " correct - " + attempt.wrong + " wrong - " + attempt.blank + " blank" }),
    el("div", { class: "sub-line muted", text: fmtDate(attempt.submittedAt, true) + (attempt.autoSubmitted ? " - auto-submitted at 00:00" : "") }),
    attempt.note ? el("div", { class: "sub-line muted", text: attempt.note }) : null);

  const secStats = el("div", { class: "sec-stats" });
  for (const s of bank.sections) {
    const d = (attempt.sections || {})[s.code];
    if (!d) continue;
    secStats.append(el("div", { class: "sec-stat" },
      el("div", { class: "nm", text: s.code + " - " + s.short }),
      el("div", { class: "sc" }, fmtScore(d.scoreTenths),
        el("span", { class: "ok", text: " +" + d.correct }),
        el("span", { class: "ko", text: " -" + d.wrong }))));
  }

  const actions = el("div", { class: "review-actions" },
    el("button", { class: "btn btn-teal", text: "Reattempt (fresh paper)", onclick: () => reattempt() }),
    el("button", { class: "btn btn-ghost", text: "Copy summary", onclick: () => copySummary() }),
    el("button", { class: "btn btn-ghost", text: "History", onclick: () => ctx.go("#/history") }));

  /* ---------- filters ---------- */
  const filterState = { res: "all", sec: "all" };
  const filterCount = el("span", { class: "count" });
  const fbtns = {};
  const filterbar = el("div", { class: "filterbar" },
    el("span", { class: "lbl", text: "Show:" }),
    ["all", "correct", "wrong", "blank"].map((r) => {
      const b = el("button", { class: "fbtn" + (r === "all" ? " active" : ""), text: r[0].toUpperCase() + r.slice(1) });
      b.addEventListener("click", () => {
        filterState.res = r;
        Object.values(fbtns).forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        applyFilters();
      });
      fbtns[r] = b;
      return b;
    }),
    (() => {
      const sel = el("select", { "aria-label": "Filter by section" });
      sel.append(el("option", { value: "all", text: "All sections" }));
      for (const s of bank.sections) sel.append(el("option", { value: s.code, text: s.code + " - " + s.short }));
      sel.addEventListener("change", () => { filterState.sec = sel.value; applyFilters(); });
      return sel;
    })(),
    filterCount);

  /* ---------- paper ---------- */
  const paper = el("div", { class: "paper" });
  const cardEls = {};
  const cellEls = {};
  let curSec = null;
  const sectionOf = {};
  for (const s of bank.sections) for (let n = s.from; n <= s.to; n++) sectionOf[n] = s.code;

  for (const q of bank.questions) {
    const code = sectionOf[q.n];
    if (code !== curSec) {
      curSec = code;
      const sec = bank.sections.find((s) => s.code === code);
      paper.append(el("div", { class: "sec-head", dataset: { sec: code } },
        el("span", { text: sec.label }),
        el("span", { class: "cnt", text: "Q" + sec.from + "-" + sec.to })));
    }
    const key = hasPerQuestion ? displayKey(q, permMap[q.n]) : q.ans;
    const picked = answers[q.n];
    let res = "blank";
    if (picked) res = picked === key ? "correct" : "wrong";

    const opts = el("div", { class: "opts" });
    for (let i = 0; i < 5; i++) {
      const letter = "ABCDE"[i];
      let cls = "opt";
      if (letter === key) cls += " good";
      else if (picked === letter) cls += " bad";
      else cls += " show";
      const input = el("input", { type: "radio", name: "rq" + q.n, value: letter, disabled: true });
      if (picked === letter) input.checked = true;
      opts.append(el("label", { class: cls }, input,
        el("span", { class: "key", text: letter + "." }),
        el("span", { text: optionAt(q, i, permMap ? permMap[q.n] : null) })));
    }
    const card = el("div", { class: "qcard graded " + res, id: "q" + q.n, dataset: { qn: q.n, sec: code, res } },
      el("div", { class: "qtop" },
        el("span", { class: "qnum", text: "Question " + q.n }),
        el("span", { class: "badges" },
          el("span", { class: "tag lik-" + q.lik, text: LIK_LABEL[q.lik] || q.lik }),
          el("span", { class: "tag topic", text: q.topic }))),
      el("div", { class: "stem", text: q.stem }),
      opts,
      el("div", { class: "exp" }, el("b", { text: "Answer: " + key + ". " }), q.exp));
    cardEls[q.n] = card;
    paper.append(card);
  }

  const navBody = el("div", { class: "nav-body" });
  for (const s of bank.sections) {
    const cells = el("div", { class: "cells" });
    for (let n = s.from; n <= s.to; n++) {
      const q = bank.questions.find((x) => x.n === n);
      const key = hasPerQuestion ? displayKey(q, permMap[q.n]) : q.ans;
      const picked = answers[q.n];
      const res = !picked ? "bl" : picked === key ? "ok" : "ko";
      const cell = el("button", {
        class: "cell " + res, type: "button", text: String(n),
        title: "Question " + n + " - " + res,
        onclick: () => jumpTo(n),
      });
      cellEls[n] = cell;
      cells.append(cell);
    }
    navBody.append(el("div", { class: "sec-block" },
      el("div", { class: "sn" }, el("span", { text: s.code + " - " + s.short })),
      cells));
  }
  const side = el("aside", { class: "navside", "aria-label": "Question navigator" },
    el("h4", { text: "Navigator" }),
    el("div", { class: "side-legend" },
      el("span", { class: "lg" }, el("span", { class: "sw sw-ok" }), "correct"),
      el("span", { class: "lg" }, el("span", { class: "sw sw-ko" }), "wrong"),
      el("span", { class: "lg" }, el("span", { class: "sw sw-bl" }), "blank")),
    navBody);

  const layout = el("div", { class: "exam-layout" },
    el("div", { class: "exam-main" }, scorePanel, secStats, actions, filterbar, paper),
    side);
  main.append(layout);

  ctx.setHeader(null);

  function applyFilters() {
    let shown = 0;
    for (const q of bank.questions) {
      const card = cardEls[q.n];
      const res = card.dataset.res;
      const sec = card.dataset.sec;
      const visible = (filterState.res === "all" || res === filterState.res) &&
                      (filterState.sec === "all" || sec === filterState.sec);
      card.classList.toggle("hide", !visible);
      if (visible) shown++;
    }
    paper.querySelectorAll(".sec-head").forEach((h) => {
      const code = h.dataset.sec;
      const hasVisible = paper.querySelector('.qcard[data-sec="' + code + '"]:not(.hide)');
      h.classList.toggle("hide", !hasVisible);
    });
    filterCount.textContent = "showing " + shown + " of " + bank.questions.length;
  }
  applyFilters();

  let revealTid = null;
  function jumpTo(n) {
    const card = cardEls[n];
    if (!card) return;
    if (card.classList.contains("hide")) {
      card.classList.add("reveal");
      clearTimeout(revealTid);
      revealTid = setTimeout(() => card.classList.remove("reveal"), 2500);
    }
    card.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function reattempt() {
    const seed = new Uint32Array(1);
    crypto.getRandomValues(seed);
    const settings = store.settings();
    const strict = !!(settings.strictTimer && (settings.strictTimer.perExam[attempt.examId] != null
      ? settings.strictTimer.perExam[attempt.examId]
      : settings.strictTimer.default));
    store.createAttempt({
      examId: attempt.examId,
      bankVersion: bank.bankVersion,
      durationSec: bank.durationSec,
      remainingSec: bank.durationSec,
      maxTenths: bank.maxTenths,
      seed: seed[0] >>> 0,
      strictTimer: strict,
      perm: null, // computed on mount by the exam view
    });
    ctx.go("#/exam/" + attempt.examId);
  }

  function copySummary() {
    const lines = [
      bank.title + " - results",
      "Score: " + fmtScore(attempt.scoreTenths) + " / " + fmtScore(attempt.maxTenths),
      "Correct: " + attempt.correct + " - Wrong: " + attempt.wrong + " - Blank: " + attempt.blank,
      "Date: " + fmtDate(attempt.submittedAt, true),
      "",
    ];
    for (const s of bank.sections) {
      const d = (attempt.sections || {})[s.code];
      if (d) lines.push(s.short + ": " + fmtScore(d.scoreTenths) + " pts (correct " + d.correct + " - wrong " + d.wrong + " - blank " + d.blank + ")");
    }
    const txt = lines.join("\n");
    const done = () => toast("Summary copied");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(done).catch(() => fallbackCopy(txt, done));
    } else fallbackCopy(txt, done);
  }

  function fallbackCopy(txt, done) {
    const ta = document.createElement("textarea");
    ta.value = txt;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.append(ta);
    ta.select();
    try { document.execCommand("copy"); done(); } catch (e) { toast("Copy blocked: select the text manually"); }
    ta.remove();
  }

  return null;
}

/* #/history : every attempt ever, newest first. Review / Reattempt / Delete,
   filter + sort, and the manual "log past attempt" form (covers her old
   different-origin scores). */

import { loadManifest } from "./banks.js";
import { el, fmtScore, fmtDate, toast, confirmModal } from "./ui.js";
import { chronological, deltaVsPrevious, fmtDelta } from "./analytics.js";

const SOURCE_LABEL = {
  live: "Live",
  imported_legacy_result: "Imported",
  imported_legacy_history: "Aggregate",
  manual: "Manual",
};

export async function mount(ctx) {
  const store = ctx.store;
  const main = ctx.routeRoot;
  ctx.setHeader(null);
  const manifest = await loadManifest();
  const metaOf = Object.fromEntries(manifest.exams.map((e) => [e.id, e]));
  let filterExam = "all";
  let sortBy = "date";

  const controls = el("div", { class: "controls" });
  const list = el("div", { class: "history-list" });
  const logBtn = el("button", { class: "btn btn-teal", text: "Log past attempt" });
  const logForm = el("div", { class: "card log-form", style: "display:none" });
  logBtn.addEventListener("click", () => {
    logForm.style.display = logForm.style.display === "none" ? "block" : "none";
  });

  controls.append(
    (() => {
      const sel = el("select", { "aria-label": "Filter by exam" });
      sel.append(el("option", { value: "all", text: "All papers" }));
      for (const e of manifest.exams) sel.append(el("option", { value: e.id, text: e.title }));
      sel.addEventListener("change", () => { filterExam = sel.value; render(); });
      return sel;
    })(),
    (() => {
      const sel = el("select", { "aria-label": "Sort" });
      sel.append(el("option", { value: "date", text: "Newest first" }));
      sel.append(el("option", { value: "score", text: "Highest score" }));
      sel.addEventListener("change", () => { sortBy = sel.value; render(); });
      return sel;
    })(),
    logBtn);

  main.append(
    el("div", { class: "page-head" },
      el("h1", { text: "History" }),
      el("p", { class: "page-sub", text: "Every attempt, with review, reattempt and comparison. Nothing is capped." })),
    controls,
    logForm,
    list);

  buildLogForm();

  render();

  function render() {
    list.textContent = "";
    let attempts = store.allAttempts();
    if (filterExam !== "all") attempts = attempts.filter((a) => a.examId === filterExam);
    attempts.sort((a, b) => sortBy === "score"
      ? (b.scoreTenths || 0) - (a.scoreTenths || 0)
      : new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt));
    if (!attempts.length) {
      list.append(el("div", { class: "card muted", text: "No attempts yet. Sit a paper from Home, or log a past one." }));
      return;
    }
    for (const a of attempts) {
      const meta = metaOf[a.examId];
      const inProg = a.status === "in_progress";
      const delta = a.status === "submitted" ? deltaVsPrevious(a, store.allAttempts()) : null;
      const row = el("div", { class: "history-row" + (inProg ? " inprog" : "") },
        el("div", { class: "hr-main" },
          el("div", { class: "hr-title", text: meta ? meta.title : a.examId }),
          el("div", { class: "hr-sub" },
            el("span", { text: fmtDate(a.submittedAt || a.createdAt, true) }),
            el("span", { class: "chip chip-src", text: SOURCE_LABEL[a.source] || a.source }),
            a.autoSubmitted ? el("span", { class: "chip", text: "auto-submit" }) : null,
            a.note ? el("span", { class: "muted", text: a.note }) : null)),
        inProg
          ? el("div", { class: "hr-score", text: "in progress (" + Object.values(a.answers || {}).filter(Boolean).length + " answered)" })
          : el("div", { class: "hr-score" },
              el("b", { text: a.scoreTenths != null ? fmtScore(a.scoreTenths) : "-" }),
              el("span", { class: "muted", text: "/" + (meta ? fmtScore(meta.maxTenths) : "?") }),
              el("div", { class: "muted", text: (a.correct ?? "?") + "c " + (a.wrong ?? "?") + "w " + (a.blank ?? "?") + "b" }),
              el("div", { class: "delta " + (delta > 0 ? "up" : delta < 0 ? "down" : ""), text: delta != null ? fmtDelta(delta) + " vs prev" : "" })),
        el("div", { class: "hr-actions" },
          inProg
            ? el("button", { class: "btn btn-teal", text: "Resume", onclick: () => ctx.go("#/exam/" + a.examId) })
            : el("button", { class: "btn btn-ghost", text: "Review", onclick: () => ctx.go("#/review/" + a.attemptId) }),
          el("button", {
            class: "btn btn-ghost", text: "Reattempt",
            onclick: () => {
              const seed = new Uint32Array(1);
              crypto.getRandomValues(seed);
              store.createAttempt({
                examId: a.examId,
                bankVersion: meta ? meta.bankVersion : null,
                durationSec: meta ? meta.durationSec : 6000,
                remainingSec: meta ? meta.durationSec : 6000,
                maxTenths: meta ? meta.maxTenths : null,
                seed: seed[0] >>> 0,
                perm: null,
              });
              ctx.go("#/exam/" + a.examId);
            },
          }),
          el("button", {
            class: "btn btn-ghost btn-red-text", text: "Delete",
            onclick: async () => {
              const ok = await confirmModal({
                title: "Delete attempt?",
                body: (meta ? meta.title : a.examId) + " from " + fmtDate(a.submittedAt || a.createdAt) + " will be removed.",
                okLabel: "Delete", danger: true,
              });
              if (ok) { store.deleteAttempt(a.attemptId); toast("Attempt deleted"); render(); }
            },
          })));
      list.append(row);
    }
  }

  function buildLogForm() {
    const examSel = el("select", { "aria-label": "Exam" });
    for (const e of manifest.exams) examSel.append(el("option", { value: e.id, text: e.title }));
    const dateIn = el("input", { type: "date", value: new Date().toISOString().slice(0, 10) });
    const modeCounts = el("input", { type: "radio", name: "logmode", value: "counts", checked: true });
    const modeScore = el("input", { type: "radio", name: "logmode", value: "score" });
    const cIn = el("input", { type: "number", min: "0", placeholder: "correct" });
    const wIn = el("input", { type: "number", min: "0", placeholder: "wrong" });
    const bIn = el("input", { type: "number", min: "0", placeholder: "blank (optional)" });
    const sIn = el("input", { type: "number", step: "0.1", placeholder: "score e.g. 45.8" });
    const noteIn = el("input", { type: "text", placeholder: "note (optional)" });
    const countsRow = el("div", { class: "log-row" }, cIn, wIn, bIn);
    const scoreRow = el("div", { class: "log-row" }, sIn);
    scoreRow.style.display = "none";
    for (const r of [modeCounts, modeScore]) {
      r.addEventListener("change", () => {
        countsRow.style.display = modeCounts.checked ? "flex" : "none";
        scoreRow.style.display = modeScore.checked ? "flex" : "none";
      });
    }
    const err = el("div", { class: "err" });
    logForm.append(
      el("h3", { text: "Log a past attempt" }),
      el("p", { class: "muted", text: "For papers sat outside this app (e.g. the old files on another device). It will join History, Compare and Analytics." }),
      el("div", { class: "log-row" }, examSel, dateIn),
      el("div", { class: "log-row" },
        el("label", { class: "radio" }, modeCounts, "Counts (c/w/b)"),
        el("label", { class: "radio" }, modeScore, "Score only")),
      countsRow, scoreRow, noteIn, err,
      el("button", {
        class: "btn btn-primary", text: "Save attempt",
        onclick: () => {
          err.textContent = "";
          const examId = examSel.value;
          const meta = metaOf[examId];
          const qCount = meta ? meta.qCount : 60;
          const dateVal = dateIn.value ? new Date(dateIn.value + "T13:30:00").toISOString() : new Date().toISOString();
          let fields;
          if (modeCounts.checked) {
            let c = parseInt(cIn.value, 10), w = parseInt(wIn.value, 10);
            let b = bIn.value === "" ? NaN : parseInt(bIn.value, 10);
            if (isNaN(c) || isNaN(w)) { err.textContent = "Enter correct and wrong counts."; return; }
            if (isNaN(b)) b = Math.max(0, qCount - c - w);
            if (c + w > qCount || c + b > qCount || w + b > qCount || c < 0 || w < 0 || b < 0) {
              err.textContent = "Counts exceed " + qCount + " questions."; return;
            }
            fields = {
              correct: c, wrong: w, blank: b,
              scoreTenths: 15 * c - 4 * w,
              maxTenths: meta ? meta.maxTenths : qCount * 15,
            };
          } else {
            const s = parseFloat(sIn.value);
            if (isNaN(s)) { err.textContent = "Enter a score."; return; }
            fields = {
              correct: null, wrong: null, blank: null,
              scoreTenths: Math.round(s * 10),
              maxTenths: meta ? meta.maxTenths : qCount * 15,
            };
          }
          store.createAttempt(Object.assign({
            examId,
            status: "submitted",
            source: "manual",
            createdAt: dateVal,
            startedAt: dateVal,
            submittedAt: dateVal,
            remainingSec: 0,
            lastTickAt: dateVal,
            seed: 0,
            perm: null,
            answers: null,
            sections: null,
            note: noteIn.value || null,
          }, fields));
          toast("Attempt logged");
          cIn.value = wIn.value = bIn.value = sIn.value = noteIn.value = "";
          logForm.style.display = "none";
          render();
        },
      }));
  }
}

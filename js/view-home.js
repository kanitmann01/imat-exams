/* #/home : dashboard. Resume card, exam cards with last/best/attempt counts. */

import { loadManifest } from "./banks.js";
import { el, clear, fmtScore, fmtDate, toast, confirmModal } from "./ui.js";
import { legacyBanner } from "./legacy-run.js";
import { describeSyncStatus } from "./sync.js";

const KIND_LABEL = { mock: "Mock exam", gk_drill: "GK drill", repair_drill: "Repair drill", bank: "Question bank" };

export async function mount(ctx) {
  const store = ctx.store;
  const main = ctx.routeRoot;
  ctx.setHeader(null);
  const manifest = await loadManifest();
  const attempts = store.allAttempts();

  main.append(el("div", { class: "page-head" },
    el("h1", { text: "Papers" }),
    el("p", { class: "page-sub", text: "Nine full mocks, two drills and four hard question banks. Progress autosaves; leave and resume any time." })));

  // resume card
  const inProgress = attempts
    .filter((a) => a.status === "in_progress")
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  if (inProgress.length) {
    const card = inProgress[0];
    const examMeta = manifest.exams.find((e) => e.id === card.examId);
    const answered = Object.values(card.answers || {}).filter(Boolean).length;
    main.append(el("div", { class: "resume-card" },
      el("div", {},
        el("div", { class: "resume-title", text: "Resume: " + (examMeta ? examMeta.title : card.examId) }),
        el("div", { class: "resume-sub", text: answered + " answered - " + fmtClockTxt(card.remainingSec) + " left - last touched " + fmtDate(card.updatedAt, true) })),
      el("div", { class: "resume-actions" },
        el("button", { class: "btn btn-teal", text: "Resume", onclick: () => ctx.go("#/exam/" + card.examId) }),
        inProgress.length > 1 ? el("span", { class: "muted", text: "+" + (inProgress.length - 1) + " more in progress (History)" }) : null,
        el("button", {
          class: "btn btn-ghost", text: "Discard",
          onclick: async () => {
            const ok = await confirmModal({
              title: "Discard this attempt?",
              body: "The in-progress paper will be deleted. This cannot be undone.",
              okLabel: "Discard", danger: true,
            });
            if (ok) { store.deleteAttempt(card.attemptId); toast("Attempt discarded"); clear(main); mount(ctx); }
          },
        }))));
  }

  const legacy = store.rawGet("legacy.import");
  const lb = legacyBanner(legacy);
  if (lb) main.append(lb);

  const grid = el("div", { class: "exam-grid" });
  for (const e of manifest.exams) {
    const mine = attempts.filter((a) => a.examId === e.id && a.status === "submitted");
    const last = mine.length ? mine.reduce((a, b) => (new Date(a.submittedAt) > new Date(b.submittedAt) ? a : b)) : null;
    const best = mine.length ? mine.reduce((a, b) => (a.scoreTenths >= b.scoreTenths ? a : b)) : null;
    const inProg = attempts.find((a) => a.examId === e.id && a.status === "in_progress");
    grid.append(el("div", { class: "exam-card" },
      el("div", { class: "ec-head" },
        el("span", { class: "ec-title", text: e.title }),
        el("span", { class: "chip", text: KIND_LABEL[e.kind] || e.kind })),
      el("div", { class: "ec-meta", text: e.qCount + " Q / " + Math.round(e.durationSec / 60) + " min / max " + fmtScore(e.maxTenths) + (e.targetScore ? " - target " + e.targetScore : "") }),
      el("div", { class: "ec-status" },
        inProg ? el("span", { class: "ec-resume", text: "In progress - " + Object.values(inProg.answers || {}).filter(Boolean).length + " answered" })
          : last ? el("span", {}, el("b", { text: "Last: " + fmtScore(last.scoreTenths) + "/" + fmtScore(e.maxTenths) }), el("span", { class: "muted", text: " (" + fmtDate(last.submittedAt) + ") - best " + fmtScore(best.scoreTenths) + " - " + mine.length + " attempt" + (mine.length > 1 ? "s" : "") }))
            : el("span", { class: "muted", text: "No attempt yet" })),
      el("button", { class: "btn btn-primary", text: inProg ? "Resume" : "Start", onclick: () => ctx.go("#/exam/" + e.id) })));
  }
  main.append(grid);

  main.append(el("div", { class: "home-links" },
    el("button", { class: "btn btn-ghost", text: "History & reattempts", onclick: () => ctx.go("#/history") }),
    el("button", { class: "btn btn-ghost", text: "Compare & analytics", onclick: () => ctx.go("#/analytics") })));

  const sync = describeSyncStatus(store);
  main.append(el("div", { class: "foot-note" },
    el("p", { text: "Answers save in this browser as you go; the app also works offline after your first visit." + (ctx.memoryOnly ? " WARNING: this browser blocks storage, so progress lives in memory only." : "") }),
    el("p", { class: "muted", text: sync.label })));
}

function fmtClockTxt(sec) {
  const m = Math.floor((sec || 0) / 60);
  return m + " min";
}

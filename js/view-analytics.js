/* #/analytics : trends, per-section accuracy, blank rate, calc wall, penalties,
   topic error table. All derived by js/analytics.js. */

import { loadManifest, loadBank } from "./banks.js";
import { el, fmtScore, fmtDate } from "./ui.js";
import { lineChart } from "./ui.js";
import { chronological, answeredAccuracy, calcWall, penaltyPoints, topicErrors } from "./analytics.js";

const SECTION_COLORS = { A: "#1F3864", B: "#1B9E77", C: "#2E5EAA", D: "#E69F00", E: "#CC3D3D",
  F: "#7B5EA7", G: "#0F766E", H: "#9A6B00" };

export async function mount(ctx) {
  const store = ctx.store;
  const main = ctx.routeRoot;
  ctx.setHeader(null);
  const manifest = await loadManifest();
  const metaOf = Object.fromEntries(manifest.exams.map((e) => [e.id, e]));
  const attempts = chronological(store.allAttempts());
  const submitted = attempts.filter((a) => a.status === "submitted");

  main.append(el("div", { class: "page-head" },
    el("h1", { text: "Analytics" }),
    el("p", { class: "page-sub", text: "Score trend, section deep-dives, the calc wall, and where marks leak." })));

  /* ---------- KPI row ---------- */
  const now = Date.now();
  const last30 = submitted.filter((a) => now - new Date(a.submittedAt).getTime() <= 30 * 86400 * 1000);
  const mocks = submitted.filter((a) => metaOf[a.examId] && metaOf[a.examId].kind === "mock");
  const meanMock = mocks.length ? mocks.reduce((s, a) => s + a.scoreTenths, 0) / mocks.length : null;
  const bestMock = mocks.length ? mocks.reduce((a, b) => (a.scoreTenths >= b.scoreTenths ? a : b)) : null;
  const kpis = el("div", { class: "kpi-row" },
    kpi("Attempts", String(submitted.length)),
    kpi("Last 30 days", String(last30.length)),
    kpi("Mean mock", meanMock != null ? fmtScore(Math.round(meanMock)) : "-"),
    kpi("Best mock", bestMock ? fmtScore(bestMock.scoreTenths) + (bestMock.examId ? "" : "") : "-"));
  main.append(kpis);

  /* ---------- trend (all attempts) ---------- */
  const trendCard = el("div", { class: "card" }, el("h3", { text: "Score trend - all papers" }));
  trendCard.append(lineChart([{
    label: "Score",
    color: "#1F3864",
    points: attempts.map((a) => ({
      x: new Date(a.submittedAt || a.createdAt),
      y: a.scoreTenths / 10,
      info: (metaOf[a.examId] ? metaOf[a.examId].title : a.examId) + ": " + fmtScore(a.scoreTenths) + "/" + fmtScore(a.maxTenths) + " - " + fmtDate(a.submittedAt),
    })),
  }], { height: 220 }));
  main.append(trendCard);

  /* ---------- exam picker for section analytics ---------- */
  const withSections = new Set(submitted.filter((a) => a.sections).map((a) => a.examId));
  const byExamCount = {};
  for (const a of submitted) byExamCount[a.examId] = (byExamCount[a.examId] || 0) + 1;
  const mockIds = manifest.exams.filter((e) => e.kind === "mock").map((e) => e.id);
  const ranked = mockIds.slice().sort((x, y) =>
    ((withSections.has(y) ? 2 : 0) + Math.min(byExamCount[y] || 0, 99)) -
    ((withSections.has(x) ? 2 : 0) + Math.min(byExamCount[x] || 0, 99)));
  const defaultExam = ranked[0] || mockIds[0];
  let selectedExam = defaultExam;

  const picker = el("select", { "aria-label": "Pick exam" });
  for (const e of manifest.exams) picker.append(el("option", { value: e.id, text: e.title }));
  picker.value = selectedExam;
  const sectionCards = el("div", {});

  const pickerRow = el("div", { class: "controls" },
    el("span", { class: "lbl", text: "Paper:" }), picker);
  main.append(el("div", { class: "page-head" }, el("h2", { text: "Section deep-dive" })), pickerRow, sectionCards);

  async function renderSections() {
    sectionCards.textContent = "";
    const bank = await loadBank(selectedExam);
    const mine = submitted.filter((a) => a.examId === selectedExam && a.sections);
    const meta = metaOf[selectedExam];

    const accCard = el("div", { class: "card" }, el("h3", { text: "Answered accuracy by section" }));
    const blankCard = el("div", { class: "card" }, el("h3", { text: "Blank rate by section" }));
    const accSeries = [], blankSeries = [];
    for (const s of bank.sections) {
      const accPts = [], blankPts = [];
      for (const a of mine) {
        const d = a.sections[s.code];
        if (!d) continue;
        const attempted = d.correct + d.wrong;
        accPts.push({ x: new Date(a.submittedAt), y: attempted ? Math.round((d.correct / attempted) * 1000) / 10 : 0, info: s.short + " " + (attempted ? Math.round((d.correct / attempted) * 100) + "%" : "-") + " - " + fmtDate(a.submittedAt) });
        blankPts.push({ x: new Date(a.submittedAt), y: Math.round(((d.blank / (s.to - s.from + 1)) * 1000)) / 10, info: s.short + " " + d.blank + " blank - " + fmtDate(a.submittedAt) });
      }
      if (accPts.length) accSeries.push({ label: s.short, color: SECTION_COLORS[s.code] || "#1F3864", points: accPts });
      if (blankPts.length) blankSeries.push({ label: s.short, color: SECTION_COLORS[s.code] || "#1F3864", points: blankPts });
    }
    accCard.append(accSeries.length
      ? lineChart(accSeries, { height: 220, yMin: 0, yMax: 100 })
      : el("p", { class: "muted", text: "One attempt so far: numbers below, trend lines need more." }));
    blankCard.append(blankSeries.length
      ? lineChart(blankSeries, { height: 220, yMin: 0, yMax: 100 })
      : el("p", { class: "muted", text: "Not enough attempts yet." }));
    sectionCards.append(accCard, blankCard);

    if (meta && meta.kind === "mock") {
      const wallCard = el("div", { class: "card" }, el("h3", { text: "The calc wall (Chemistry + Physics blanks)" }));
      const wallSeries = [{ label: "C+E blanks", color: "#CC3D3D",
        points: mine.map((a) => {
          const w = calcWall(a);
          return { x: new Date(a.submittedAt), y: w.blanks, info: w.blanks + " blanks = " + w.pointsLeft.toFixed(1) + " pts left on the table - " + fmtDate(a.submittedAt) };
        }) }];
      wallCard.append(wallSeries[0].points.length
        ? lineChart(wallSeries, { height: 180, yMin: 0 })
        : el("p", { class: "muted", text: "No attempts with section data." }));
      sectionCards.append(wallCard);
    }

    const penCard = el("div", { class: "card" }, el("h3", { text: "Cost of wrong answers" }));
    const penList = el("div", { class: "pen-list" });
    for (const a of mine.slice().reverse()) {
      penList.append(el("div", { class: "pen-row" },
        el("span", { text: fmtDate(a.submittedAt) }),
        el("span", { class: "muted", text: a.wrong + " wrong" }),
        el("b", { class: "ko", text: "-" + penaltyPoints(a).toFixed(1) + " pts" })));
    }
    penCard.append(penList.length ? penList : el("p", { class: "muted", text: "No attempts yet." }));
    sectionCards.append(penCard);

    /* topic errors */
    const topicCard = el("div", { class: "card" }, el("h3", { text: "Where marks leak (topics)" }));
    const table = el("table", { class: "cmp-table" });
    table.append(el("thead", {}, el("tr", {},
      el("th", { text: "Topic" }), el("th", { text: "Errors" }), el("th", { text: "Wrong" }), el("th", { text: "Blank" }), el("th", { text: "Share" }))));
    const tbody = el("tbody");
    const merged = {};
    for (const a of mine) {
      if (!a.answers) continue;
      for (const t of topicErrors(a, bank)) {
        if (!merged[t.topic]) merged[t.topic] = { topic: t.topic, wrong: 0, blank: 0, errors: 0 };
        merged[t.topic].wrong += t.wrong;
        merged[t.topic].blank += t.blank;
        merged[t.topic].errors += t.errors;
      }
    }
    const rows = Object.values(merged).sort((x, y) => y.errors - x.errors).slice(0, 12);
    const totalErrors = rows.reduce((s, r) => s + r.errors, 0);
    for (const r of rows) {
      tbody.append(el("tr", {},
        el("td", { text: r.topic }),
        el("td", { text: String(r.errors) }),
        el("td", { text: String(r.wrong) }),
        el("td", { text: String(r.blank) }),
        el("td", { text: totalErrors ? Math.round((r.errors / totalErrors) * 100) + "%" : "-" })));
    }
    table.append(tbody);
    if (rows.length) topicCard.append(el("div", { class: "tscroll" }, table));
    else topicCard.append(el("p", { class: "muted", text: "Sit this paper once and your error topics land here." }));
    sectionCards.append(topicCard);
  }

  picker.addEventListener("change", () => { selectedExam = picker.value; renderSections(); });
  await renderSections();
  return null;
}

function kpi(label, value) {
  return el("div", { class: "kpi" },
    el("div", { class: "kpi-value", text: value }),
    el("div", { class: "kpi-label", text: label }));
}

/* #/compare : pick 2-5 attempts, side-by-side section table + SVG trend. */

import { loadManifest, loadBank } from "./banks.js";
import { el, fmtScore, fmtDate } from "./ui.js";
import { lineChart } from "./ui.js";
import { chronological, fmtDelta } from "./analytics.js";

const SERIES_COLORS = ["#1F3864", "#1B9E77", "#E69F00", "#CC3D3D", "#2E5EAA"];

export async function mount(ctx) {
  const store = ctx.store;
  const main = ctx.routeRoot;
  ctx.setHeader(null);
  const manifest = await loadManifest();
  const metaOf = Object.fromEntries(manifest.exams.map((e) => [e.id, e]));
  const submitted = chronological(store.allAttempts()).reverse(); // newest first
  const selected = new Set();

  main.append(el("div", { class: "page-head" },
    el("h1", { text: "Compare" }),
    el("p", { class: "page-sub", text: "Pick 2 to 5 attempts to compare section by section." })));

  const chips = el("div", { class: "chips" });
  const tableWrap = el("div", { class: "card" });
  const chartWrap = el("div", { class: "card" });

  // default selection: two most recent attempts of the same exam, else two most recent
  (function defaultSelection() {
    const byExam = {};
    for (const a of submitted) (byExam[a.examId] = byExam[a.examId] || []).push(a);
    const pairs = Object.values(byExam).filter((l) => l.length >= 2)
      .sort((x, y) => new Date(y[0].submittedAt) - new Date(x[0].submittedAt));
    const seed = pairs.length ? pairs[0].slice(0, 2) : submitted.slice(0, 2);
    seed.forEach((a) => selected.add(a.attemptId));
  })();

  function renderChips() {
    chips.textContent = "";
    const byExam = {};
    for (const a of submitted) (byExam[a.examId] = byExam[a.examId] || []).push(a);
    for (const examId of Object.keys(byExam)) {
      const meta = metaOf[examId];
      chips.append(el("div", { class: "chip-group" },
        el("div", { class: "chip-group-title", text: meta ? meta.title : examId }),
        ...byExam[examId].map((a) => {
          const on = selected.has(a.attemptId);
          const chip = el("button", {
            class: "chip chip-btn" + (on ? " on" : ""),
            text: fmtScore(a.scoreTenths) + " - " + fmtDate(a.submittedAt),
            onclick: () => {
              if (on) selected.delete(a.attemptId);
              else {
                if (selected.size >= 5) return;
                selected.add(a.attemptId);
              }
              renderChips();
              renderTable();
              renderChart();
            },
          });
          return chip;
        })));
    }
  }

  async function renderTable() {
    tableWrap.textContent = "";
    const sel = submitted.filter((a) => selected.has(a.attemptId))
      .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));
    if (sel.length < 2) {
      tableWrap.append(el("p", { class: "muted", text: "Select at least 2 attempts." }));
      return;
    }
    const banks = {};
    for (const a of sel) {
      if (!banks[a.examId]) banks[a.examId] = await loadBank(a.examId);
    }
    const table = el("table", { class: "cmp-table" });
    const head = el("tr", {}, el("th", { text: "" }),
      ...sel.map((a, i) => el("th", {},
        el("div", { text: (metaOf[a.examId] ? metaOf[a.examId].title.replace(/^IMAT MOCK EXAM /, "Mock ") : a.examId) }),
        el("div", { class: "muted", text: fmtDate(a.submittedAt) + (i === 0 ? " (base)" : "") }))));
    table.append(el("thead", {}, head));
    const body = el("tbody");
    const first = sel[0];
    const bank0 = banks[first.examId];
    const totalRow = el("tr", { class: "cmp-total" }, el("td", { text: "Total" }));
    body.append(totalRow);
    for (const a of sel) {
      const d = a.scoreTenths - first.scoreTenths;
      totalRow.append(el("td", {},
        el("b", { text: fmtScore(a.scoreTenths) + "/" + fmtScore(a.maxTenths) }),
        el("div", { class: "muted", text: a.attemptId === first.attemptId ? "" : fmtDelta(d / 10) })));
    }
    const sectionCodes = new Set();
    for (const a of sel) for (const s of banks[a.examId].sections) sectionCodes.add(s.code + "|" + s.short);
    for (const codeStr of sectionCodes) {
      const [code, short] = codeStr.split("|");
      const row = el("tr", {}, el("td", { text: short }));
      for (const a of sel) {
        const d = (a.sections || {})[code];
        row.append(el("td", { text: d ? fmtScore(d.scoreTenths) + " (" + d.correct + "/" + d.wrong + "/" + d.blank + ")" : "-" }));
      }
      body.append(row);
    }
    table.append(body);
    tableWrap.append(table);
  }

  function renderChart() {
    chartWrap.textContent = "";
    const byExam = {};
    for (const a of submitted) {
      if (!selected.has(a.attemptId)) continue;
      (byExam[a.examId] = byExam[a.examId] || []).push(a);
    }
    const series = [];
    let i = 0;
    for (const [examId, list] of Object.entries(byExam)) {
      const meta = metaOf[examId];
      series.push({
        label: meta ? meta.title : examId,
        color: SERIES_COLORS[i++ % SERIES_COLORS.length],
        points: list.map((a) => ({
          x: new Date(a.submittedAt),
          y: a.scoreTenths / 10,
          info: fmtScore(a.scoreTenths) + "/" + fmtScore(a.maxTenths) + " - " + fmtDate(a.submittedAt),
        })),
      });
    }
    chartWrap.append(el("h3", { text: "Score trend (selected)" }));
    chartWrap.append(lineChart(series, { height: 220 }));
  }

  renderChips();
  await renderTable();
  renderChart();
  main.append(chips, chartWrap, tableWrap);
  return null;
}

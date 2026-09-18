/* #/settings : lock, timers, sync, data tools. */

import { el, toast, confirmModal } from "./ui.js";
import { loadManifest } from "./banks.js";
import { syncConfig, signIn, signOut, syncCycle, describeSyncStatus } from "./sync.js";
import { runLegacyImportIfPending, legacyReportSummary } from "./legacy-run.js";

export async function mount(ctx) {
  const store = ctx.store;
  const main = ctx.routeRoot;
  ctx.setHeader(null);
  const settings = store.settings();

  main.append(el("div", { class: "page-head" },
    el("h1", { text: "Settings" }),
    el("p", { class: "page-sub", text: "Lock, timer behaviour, cloud sync, and your data." })));

  /* ---------- lock ---------- */
  main.append(el("div", { class: "card" },
    el("h3", { text: "Lock" }),
    el("p", { class: "muted", text: "The password gate is a deterrent, not security: the paper data ships to the browser by design." }),
    el("button", {
      class: "btn btn-primary", text: "Lock now",
      onclick: () => { store.setUnlocked(false); location.reload(); },
    })));

  /* ---------- timers ---------- */
  const timerCard = el("div", { class: "card" },
    el("h3", { text: "Timer" }),
    el("p", { class: "muted", text: "Kind timer (default): the clock runs only while the paper is open and this tab is visible. Strict timer charges real time away, like the exam hall." }));
  const defChk = el("input", { type: "checkbox" });
  defChk.checked = !!(settings.strictTimer && settings.strictTimer.default);
  defChk.addEventListener("change", () => {
    const s = store.settings();
    s.strictTimer = Object.assign({ default: false, perExam: {} }, s.strictTimer);
    s.strictTimer.default = defChk.checked;
    store.saveSettings(s);
    toast(defChk.checked ? "Strict timer default ON" : "Strict timer default OFF");
  });
  timerCard.append(el("label", { class: "check-row" }, defChk, "Strict timer for all new attempts"));
  const perExamWrap = el("div", { class: "per-exam" });
  (async () => {
    const manifest = await loadManifest();
    for (const e of manifest.exams) {
      const chk = el("input", { type: "checkbox" });
      chk.checked = !!(settings.strictTimer && settings.strictTimer.perExam[e.id]);
      chk.addEventListener("change", () => {
        const s = store.settings();
        s.strictTimer = Object.assign({ default: false, perExam: {} }, s.strictTimer);
        if (chk.checked) s.strictTimer.perExam[e.id] = true;
        else delete s.strictTimer.perExam[e.id];
        store.saveSettings(s);
      });
      perExamWrap.append(el("label", { class: "check-row" }, chk, e.title));
    }
  })();
  timerCard.append(perExamWrap);
  main.append(timerCard);

  /* ---------- sync ---------- */
  const syncCard = el("div", { class: "card" },
    el("h3", { text: "Cloud sync (optional, free tier)" }),
    el("p", { class: "muted", text: "Everything works without this: data lives in this browser. Sync copies attempts to your own free Supabase project so a lost phone never loses history." }));
  const status = describeSyncStatus(store);
  const cfg = syncConfig(store);
  const urlIn = el("input", { type: "text", placeholder: "Supabase project URL", value: cfg.url || "" });
  const keyIn = el("input", { type: "text", placeholder: "Supabase anon key", value: cfg.key || "" });
  const emailIn = el("input", { type: "email", placeholder: "account email" });
  const pwIn = el("input", { type: "password", placeholder: "account password" });
  const syncErr = el("div", { class: "err" });
  const statusLine = el("p", { class: "muted", text: status.label });
  syncCard.append(statusLine, urlIn, keyIn,
    el("button", {
      class: "btn btn-ghost", text: "Save URL + key",
      onclick: () => {
        const s = store.settings();
        s.sync = Object.assign({ enabled: false }, s.sync, { url: urlIn.value.trim(), anonKey: keyIn.value.trim() });
        store.saveSettings(s);
        toast("Saved. Sign in to enable sync.");
        statusLine.textContent = describeSyncStatus(store).label;
      },
    }),
    el("div", { class: "log-row" }, emailIn, pwIn),
    el("button", {
      class: "btn btn-primary", text: "Sign in & enable sync",
      onclick: async () => {
        syncErr.textContent = "";
        try {
          const s = store.settings();
          s.sync = Object.assign({ enabled: false }, s.sync, { url: urlIn.value.trim(), anonKey: keyIn.value.trim() });
          store.saveSettings(s);
          await signIn(store, emailIn.value.trim(), pwIn.value);
          await syncCycle(store);
          statusLine.textContent = describeSyncStatus(store).label;
          toast("Sync enabled");
        } catch (e) { syncErr.textContent = e.message; }
      },
    }),
    el("button", {
      class: "btn btn-ghost", text: "Sync now",
      onclick: async () => {
        syncErr.textContent = "";
        try { await syncCycle(store); statusLine.textContent = describeSyncStatus(store).label; toast("Sync done"); }
        catch (e) { syncErr.textContent = e.message; }
      },
    }),
    el("button", {
      class: "btn btn-ghost", text: "Sign out & disable",
      onclick: async () => { await signOut(store); statusLine.textContent = describeSyncStatus(store).label; toast("Sync disabled"); },
    }),
    syncErr);
  main.append(syncCard);

  /* ---------- data ---------- */
  const dataCard = el("div", { class: "card" },
    el("h3", { text: "Data" }),
    el("p", { class: "muted", text: "Export keeps a JSON backup of every attempt (including imported ones)." }));
  const importIn = el("input", { type: "file", accept: "application/json" });
  importIn.addEventListener("change", () => {
    const f = importIn.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const n = store.importData(JSON.parse(reader.result));
        toast("Imported " + n + " attempt(s)");
      } catch (e) { toast("Import failed: " + e.message); }
    };
    reader.readAsText(f);
  });
  const legacyBtn = el("button", { class: "btn btn-ghost", text: "Re-run old-page import" });
  legacyBtn.addEventListener("click", async () => {
    const report = await runLegacyImportIfPending(ctx, { force: true });
    const lines = legacyReportSummary(report) || ["Nothing found from the old exam pages on this device."];
    toast(lines[0]);
  });
  dataCard.append(
    el("button", {
      class: "btn btn-ghost", text: "Export attempts (JSON)",
      onclick: () => {
        const blob = new Blob([JSON.stringify(store.exportData(), null, 1)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "imat-attempts-" + new Date().toISOString().slice(0, 10) + ".json";
        a.click();
        URL.revokeObjectURL(a.href);
      },
    }),
    importIn,
    legacyBtn,
    el("button", {
      class: "btn btn-red", text: "Wipe all local data",
      onclick: async () => {
        const ok = await confirmModal({
          title: "Wipe everything?",
          body: "All attempts, settings and sync queue on this device will be deleted. Export first if in doubt.",
          okLabel: "Wipe", danger: true,
        });
        if (ok) { store.wipe(); location.reload(); }
      },
    }));
  main.append(dataCard);
  return null;
}

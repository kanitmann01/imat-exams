/* App bootstrap: storage, gate, hash router, persistent header, sync loop.
   One page, hash routes; browser back never unloads the app (SPEC 4). */

import { detectAdapter, AttemptStore } from "./store.js";
import { el, clear, toast } from "./ui.js";
import { runLegacyImportIfPending } from "./legacy-run.js";
import { syncCycle, describeSyncStatus } from "./sync.js";
import * as home from "./view-home.js";
import * as exam from "./view-exam.js";
import * as review from "./view-review.js";
import * as history from "./view-history.js";
import * as compare from "./view-compare.js";
import * as analytics from "./view-analytics.js";
import * as settings from "./view-settings.js";

const ROUTES = [
  [/^#\/home$/, home],
  [/^#\/exam\/([^/]+)$/, exam],
  [/^#\/review\/([^/]+)$/, review],
  [/^#\/history$/, history],
  [/^#\/compare$/, compare],
  [/^#\/analytics$/, analytics],
  [/^#\/settings$/, settings],
];

async function boot() {
  const adapter = detectAdapter();
  const store = new AttemptStore(adapter);
  const ctx = {
    store,
    adapter,
    memoryOnly: adapter.mode === "memory",
    go(hash, replace = false) {
      if (replace) location.replace(hash);
      else location.hash = hash;
    },
    setHeader(node) {
      const slot = document.getElementById("header-slot");
      clear(slot);
      if (node) slot.append(node);
    },
    toast,
  };

  const app = document.getElementById("app");
  clear(app);
  app.append(buildShell());

  let current = null; // {view, unmount}
  let routeSeq = 0;

  async function route() {
    const mySeq = ++routeSeq;
    const hash = location.hash || "#/home";
    let matched = null, params = {};
    for (const [re, view] of ROUTES) {
      const m = re.exec(hash);
      if (m) { matched = view; params = m.slice(1); break; }
    }
    if (!matched) { location.replace("#/home"); return; }
    if (current && current.unmount) {
      try { current.unmount(); } catch (e) { console.error(e); }
      current = null;
    }
    // route-owned container: a superseded concurrent mount appends into a
    // detached node instead of polluting the live DOM
    const main = document.getElementById("main");
    clear(main);
    const container = el("div", { class: "route" });
    main.append(container);
    ctx.routeRoot = container;
    setActiveNav(hash);
    try {
      const unmount = await matched.mount(ctx, ...params);
      if (mySeq !== routeSeq) {
        if (unmount) { try { unmount(); } catch (e) { /* superseded */ } }
        return;
      }
      current = { view: matched, unmount: unmount || null };
    } catch (e) {
      if (mySeq !== routeSeq) return;
      console.error(e);
      container.append(el("div", { class: "card error-card" },
        el("h3", { text: "Something went wrong" }),
        el("p", { text: e.message || String(e) }),
        el("button", { class: "btn btn-primary", text: "Back to Home", onclick: () => ctx.go("#/home") })));
      current = null;
    }
  }

  window.addEventListener("hashchange", route);

  // gate
  function showGate() {
    const overlay = document.getElementById("gate");
    overlay.style.display = "flex";
    const input = document.getElementById("gate-pw");
    const err = document.getElementById("gate-err");
    err.textContent = "";
    input.value = "";
    input.focus();
    const btn = document.getElementById("gate-btn");
    btn.onclick = null;
    input.onkeydown = null;
    function tryUnlock() {
      const pw = (window.IMAT_CONFIG && window.IMAT_CONFIG.password) || "imat2026";
      if (input.value.trim() === pw) {
        store.setUnlocked(true);
        overlay.style.display = "none";
        afterUnlock();
      } else {
        err.textContent = "Incorrect password.";
        input.select();
      }
    }
    btn.onclick = tryUnlock;
    input.onkeydown = (e) => { if (e.key === "Enter") tryUnlock(); };
  }

  let unlockedOnce = false;
  async function afterUnlock() {
    if (unlockedOnce) return;
    unlockedOnce = true;
    await runLegacyImportIfPending(ctx);
    if (location.hash === "" || location.hash === "#") location.hash = "#/home";
    await route();
    // sync loop: 60s + on visible; silent in local mode
    setInterval(async () => {
      try { await syncCycle(store); } catch (e) { /* silent */ }
    }, 60000);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        syncCycle(store).catch(() => {});
      }
    });
  }

  if (store.isUnlocked()) {
    await afterUnlock();
  } else {
    showGate();
    // keep empty shell behind the gate
    document.getElementById("main").append(el("div", { class: "gate-behind" }));
  }

  function setActiveNav(hash) {
    const map = { "#/home": "nav-home", "#/history": "nav-history", "#/analytics": "nav-analytics", "#/settings": "nav-settings" };
    document.querySelectorAll(".topnav .navlink").forEach((b) => b.classList.remove("active"));
    const id = map[hash.split("/").slice(0, 2).join("/")];
    if (id) document.getElementById(id).classList.add("active");
  }

  function buildShell() {
    const header = el("header", { class: "topbar" },
      el("div", { class: "brand", onclick: () => ctx.go("#/home"), role: "link", tabindex: 0 },
        el("span", { class: "brand-mark", text: "IMAT" }),
        el("span", { class: "brand-name", text: "Exam Platform" })),
      el("div", { id: "header-slot", class: "header-slot" }),
      el("nav", { class: "topnav" },
        el("button", { id: "nav-home", class: "navlink", text: "Home", onclick: () => ctx.go("#/home") }),
        el("button", { id: "nav-history", class: "navlink", text: "History", onclick: () => ctx.go("#/history") }),
        el("button", { id: "nav-analytics", class: "navlink", text: "Analytics", onclick: () => ctx.go("#/analytics") }),
        el("button", { id: "nav-settings", class: "navlink", text: "Settings", onclick: () => ctx.go("#/settings") })));
    const main = el("main", { id: "main" });
    const frag = document.createDocumentFragment();
    frag.append(header, main);
    return frag;
  }
}

boot().catch((e) => {
  document.getElementById("app").textContent = "Failed to start: " + (e.message || e);
});

/* PWA-lite: offline support after first visit */
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => { /* offline is an enhancement */ });
  });
}

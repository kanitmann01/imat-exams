/* Service worker: PWA-lite. Precache the shell + banks; network-first for
   navigations, data and config so content fixes propagate; cache-first for
   versioned static assets. Never touches cross-origin (Supabase) traffic. */
const VERSION = "8490e30e";
const CACHE = "imatex-" + VERSION;
const PRECACHE = [
  "./",
  "./index.html",
  "./404.html",
  "./manifest.webmanifest",
  "./config.js?v=8490e30e",
  "./css/app.css?v=8490e30e",
  "./assets/icons/favicon.svg",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./js/app.js?v=8490e30e",
  "./js/banks.js?v=8490e30e",
  "./js/core.js?v=8490e30e",
  "./js/grader.js?v=8490e30e",
  "./js/timer.js?v=8490e30e",
  "./js/store.js?v=8490e30e",
  "./js/ui.js?v=8490e30e",
  "./js/analytics.js?v=8490e30e",
  "./js/legacy.js?v=8490e30e",
  "./js/legacy-run.js?v=8490e30e",
  "./js/sync.js?v=8490e30e",
  "./js/view-home.js?v=8490e30e",
  "./js/view-exam.js?v=8490e30e",
  "./js/view-review.js?v=8490e30e",
  "./js/view-history.js?v=8490e30e",
  "./js/view-compare.js?v=8490e30e",
  "./js/view-analytics.js?v=8490e30e",
  "./js/view-settings.js?v=8490e30e",
  "./data/exams.json",
];
const BANKS = [
  "./data/imat_mock1.json", "./data/imat_mock2.json", "./data/imat_mock3.json",
  "./data/imat_mock4.json", "./data/imat_mock5.json", "./data/imat_mock6.json",
  "./data/imat_mock7.json", "./data/imat_mock8.json", "./data/imat_mock9.json",
  "./data/GK_Drill_100.json", "./data/Repair_Drill_1.json",
  "./data/bank_bio_hard.json", "./data/bank_chem_hard.json", "./data/bank_mpl_hard.json",
  "./data/GK_Bank_Hard.json",
];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(PRECACHE);
    // banks: non-fatal if any single fetch fails on a flaky first visit
    await Promise.allSettled(BANKS.map((u) => cache.add(u)));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; // passthrough (Supabase etc.)
  const path = url.pathname;
  const isNav = e.request.mode === "navigate";
  const isFresh = isNav
    || path.includes("/data/")
    || path.endsWith("/config.js")
    || path.endsWith(".js")     // ES module imports carry no ?v= stamp: network-first
    || path.endsWith(".css")
    || path.endsWith(".webmanifest");

  if (isFresh) {
    // network-first with cache fallback (content fixes propagate; offline still works)
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const fresh = await fetch(e.request);
        if (fresh && fresh.ok) cache.put(e.request, fresh.clone());
        return fresh;
      } catch (err) {
        const cached = await cache.match(e.request, { ignoreSearch: true });
        if (cached) return cached;
        if (isNav) {
          const shell = await cache.match("./index.html", { ignoreSearch: true });
          if (shell) return shell;
        }
        throw err;
      }
    })());
    return;
  }
  // cache-first for immutable-ish assets (icons)
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(e.request);
    if (cached) return cached;
    const fresh = await fetch(e.request);
    if (fresh && fresh.ok) cache.put(e.request, fresh.clone());
    return fresh;
  })());
});

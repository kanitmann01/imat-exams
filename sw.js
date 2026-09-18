/* Service worker: PWA-lite. Precache the shell + banks; network-first for
   navigations, data and config so content fixes propagate; cache-first for
   versioned static assets. Never touches cross-origin (Supabase) traffic. */
const VERSION = "288d5e1d";
const CACHE = "imatex-" + VERSION;
const PRECACHE = [
  "./",
  "./index.html",
  "./404.html",
  "./manifest.webmanifest",
  "./config.js?v=288d5e1d",
  "./css/app.css?v=288d5e1d",
  "./assets/icons/favicon.svg",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./js/app.js?v=288d5e1d",
  "./js/banks.js?v=288d5e1d",
  "./js/core.js?v=288d5e1d",
  "./js/grader.js?v=288d5e1d",
  "./js/timer.js?v=288d5e1d",
  "./js/store.js?v=288d5e1d",
  "./js/ui.js?v=288d5e1d",
  "./js/analytics.js?v=288d5e1d",
  "./js/legacy.js?v=288d5e1d",
  "./js/legacy-run.js?v=288d5e1d",
  "./js/sync.js?v=288d5e1d",
  "./js/view-home.js?v=288d5e1d",
  "./js/view-exam.js?v=288d5e1d",
  "./js/view-review.js?v=288d5e1d",
  "./js/view-history.js?v=288d5e1d",
  "./js/view-compare.js?v=288d5e1d",
  "./js/view-analytics.js?v=288d5e1d",
  "./js/view-settings.js?v=288d5e1d",
  "./data/exams.json",
];
const BANKS = [
  "./data/imat_mock1.json", "./data/imat_mock2.json", "./data/imat_mock3.json",
  "./data/imat_mock4.json", "./data/imat_mock5.json", "./data/imat_mock6.json",
  "./data/imat_mock7.json", "./data/imat_mock8.json",
  "./data/GK_Drill_100.json", "./data/Repair_Drill_1.json",
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

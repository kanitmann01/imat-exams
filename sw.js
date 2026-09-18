/* Service worker: PWA-lite. Precache the shell + banks; network-first for
   navigations, data and config so content fixes propagate; cache-first for
   versioned static assets. Never touches cross-origin (Supabase) traffic. */
const VERSION = "bbf237a2";
const CACHE = "imatex-" + VERSION;
const PRECACHE = [
  "./",
  "./index.html",
  "./404.html",
  "./manifest.webmanifest",
  "./config.js?v=bbf237a2",
  "./css/app.css?v=bbf237a2",
  "./assets/icons/favicon.svg",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./js/app.js?v=bbf237a2",
  "./js/banks.js?v=bbf237a2",
  "./js/core.js?v=bbf237a2",
  "./js/grader.js?v=bbf237a2",
  "./js/timer.js?v=bbf237a2",
  "./js/store.js?v=bbf237a2",
  "./js/ui.js?v=bbf237a2",
  "./js/analytics.js?v=bbf237a2",
  "./js/legacy.js?v=bbf237a2",
  "./js/legacy-run.js?v=bbf237a2",
  "./js/sync.js?v=bbf237a2",
  "./js/view-home.js?v=bbf237a2",
  "./js/view-exam.js?v=bbf237a2",
  "./js/view-review.js?v=bbf237a2",
  "./js/view-history.js?v=bbf237a2",
  "./js/view-compare.js?v=bbf237a2",
  "./js/view-analytics.js?v=bbf237a2",
  "./js/view-settings.js?v=bbf237a2",
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
  const isData = url.pathname.includes("/data/");
  const isConfig = url.pathname.endsWith("/config.js");
  const isNav = e.request.mode === "navigate";

  if (isNav || isData || isConfig) {
    // network-first with cache fallback
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
  // cache-first for versioned assets
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(e.request);
    if (cached) return cached;
    const fresh = await fetch(e.request);
    if (fresh && fresh.ok) cache.put(e.request, fresh.clone());
    return fresh;
  })());
});

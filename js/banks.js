/* Bank loading: manifest + per-exam bank JSON, fetched AFTER gate unlock
   (SPEC AL-7) and held in module scope (not on window). Relative paths so the
   app works from any subpath. */

const manifestCache = { v: null };
const bankCache = new Map();

async function fetchJSON(url) {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error("fetch failed: " + url + " (" + res.status + ")");
  return res.json();
}

export async function loadManifest() {
  if (!manifestCache.v) manifestCache.v = await fetchJSON("./data/exams.json");
  return manifestCache.v;
}

export async function loadBank(examId) {
  if (!bankCache.has(examId)) {
    bankCache.set(examId, await fetchJSON("./data/" + encodeURIComponent(examId) + ".json"));
  }
  return bankCache.get(examId);
}

export function bankFromCache(examId) {
  return bankCache.get(examId) || null;
}

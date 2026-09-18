/* Storage layer: namespaced localStorage adapter with memory fallback, and the
   attempt store (CRUD + index + quarantine of corrupted records).
   The adapter is injectable so node tests can drive it with a Map. */

const NS = "imatex.";

export function makeMemoryAdapter() {
  const m = new Map();
  return {
    mode: "memory",
    get(k) { const v = m.get(k); return v === undefined ? null : v; },
    set(k, v) { m.set(k, v); },
    del(k) { m.delete(k); },
    keys() { return [...m.keys()]; },
  };
}

export function detectAdapter() {
  try {
    const t = NS + "__probe__";
    localStorage.setItem(t, "1");
    localStorage.removeItem(t);
    return {
      mode: "localStorage",
      get(k) { const v = localStorage.getItem(NS + k); return v === null ? null : v; },
      set(k, v) { localStorage.setItem(NS + k, v); },
      del(k) { localStorage.removeItem(NS + k); },
      keys() {
        const out = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(NS)) out.push(k.slice(NS.length));
        }
        return out;
      },
    };
  } catch (e) {
    return makeMemoryAdapter();
  }
}

function parseOrQuarantine(adapter, key, raw) {
  try {
    return JSON.parse(raw);
  } catch (e) {
    const log = JSON.parse(adapter.get("quarantine.log") || "[]");
    log.push({ key, at: new Date().toISOString(), raw: String(raw).slice(0, 200) });
    adapter.set("quarantine.log", JSON.stringify(log));
    adapter.set("quarantine." + key, raw);
    adapter.del(key);
    return null;
  }
}

export class AttemptStore {
  constructor(adapter) {
    this.adapter = adapter;
    this.memoryOnly = adapter.mode === "memory";
  }

  rawGet(key) {
    const v = this.adapter.get(key);
    return v === null ? null : parseOrQuarantine(this.adapter, key, v);
  }
  rawSet(key, obj) { this.adapter.set(key, JSON.stringify(obj)); }

  settings() {
    return Object.assign(
      { strictTimer: { default: false, perExam: {} }, sync: { enabled: false }, seenIntro: false },
      this.rawGet("settings") || {});
  }
  saveSettings(s) { this.rawSet("settings", s); }

  isUnlocked() { return this.rawGet("gate.unlocked") === "1"; }
  setUnlocked(v) { v ? this.rawSet("gate.unlocked", "1") : this.adapter.del("gate.unlocked"); }

  attemptKey(id) { return "attempt." + id; }

  newAttemptId() {
    const d = new Date();
    const stamp = d.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
    let rndStr;
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      const rnd = new Uint32Array(2);
      crypto.getRandomValues(rnd);
      rndStr = (rnd[0] >>> 0).toString(36) + (rnd[1] >>> 0).toString(36).slice(0, 2);
    } else {
      rndStr = Math.random().toString(36).slice(2, 10);
    }
    return "a" + stamp + "-" + rndStr;
  }

  createAttempt(fields) {
    const now = new Date().toISOString();
    const rec = Object.assign({
      v: 1,
      attemptId: this.newAttemptId(),
      examId: null,
      bankVersion: null,
      status: "in_progress",
      source: "live",
      createdAt: now,
      updatedAt: now,
      startedAt: now,
      submittedAt: null,
      autoSubmitted: false,
      durationSec: 6000,
      remainingSec: 6000,
      lastTickAt: now,
      strictTimer: false,
      seed: null,
      perm: null,
      answers: {},
      scoreTenths: null,
      maxTenths: null,
      correct: null,
      wrong: null,
      blank: null,
      sections: null,
      note: null,
      dirty: false,
      deleted: false,
    }, fields);
    this.saveAttempt(rec);
    return rec;
  }

  getAttempt(id) {
    const rec = this.rawGet(this.attemptKey(id));
    return rec && !rec.deleted ? rec : null;
  }

  saveAttempt(rec) {
    rec.updatedAt = new Date().toISOString();
    rec.dirty = true;
    this.rawSet(this.attemptKey(rec.attemptId), rec);
    const idx = this.attemptIndex();
    if (!idx.includes(rec.attemptId)) {
      idx.push(rec.attemptId);
      this.rawSet("attempts.index", idx);
    }
    this.queueForSync(rec.attemptId);
  }

  /* delete = tombstone (sync contract 8.3); hidden from all lists */
  deleteAttempt(id) {
    const rec = this.rawGet(this.attemptKey(id));
    if (!rec) return;
    rec.deleted = true;
    rec.updatedAt = new Date().toISOString();
    this.rawSet(this.attemptKey(id), rec);
    this.queueForSync(id);
  }

  purgeDeleted() {
    const cutoff = Date.now() - 30 * 86400 * 1000;
    for (const id of this.attemptIndex()) {
      const rec = this.rawGet(this.attemptKey(id));
      if (rec && rec.deleted && new Date(rec.updatedAt).getTime() < cutoff) {
        this.adapter.del(this.attemptKey(id));
        this.rawSet("attempts.index", this.attemptIndex().filter((x) => x !== id));
      }
    }
  }

  allAttempts({ includeDeleted = false } = {}) {
    const out = [];
    for (const id of this.attemptIndex()) {
      const rec = this.rawGet(this.attemptKey(id));
      if (!rec) continue;
      if (rec.deleted && !includeDeleted) continue;
      out.push(rec);
    }
    return out;
  }

  attemptIndex() {
    const v = this.rawGet("attempts.index");
    return Array.isArray(v) ? v : [];
  }

  inProgressFor(examId) {
    return this.allAttempts().find((a) => a.examId === examId && a.status === "in_progress") || null;
  }

  /* ---- sync bookkeeping ---- */
  syncQueue() {
    const v = this.rawGet("sync.queue");
    return Array.isArray(v) ? v : [];
  }
  queueForSync(id) {
    const q = this.syncQueue();
    if (!q.includes(id)) { q.push(id); this.rawSet("sync.queue", q); }
  }
  dequeueSync(id) {
    this.rawSet("sync.queue", this.syncQueue().filter((x) => x !== id));
  }
  syncMeta() {
    return this.rawGet("sync.meta") || { lastPullAt: null, lastPushAt: null };
  }
  setSyncMeta(m) { this.rawSet("sync.meta", m); }

  /* ---- export / import / wipe ---- */
  exportData() {
    const out = { exportedAt: new Date().toISOString(), attempts: [] };
    for (const id of this.attemptIndex()) {
      const rec = this.rawGet(this.attemptKey(id));
      if (rec) out.attempts.push(rec);
    }
    return out;
  }
  importData(data) {
    let n = 0;
    for (const rec of (data.attempts || [])) {
      if (!rec || !rec.attemptId || !rec.examId) continue;
      const existing = this.rawGet(this.attemptKey(rec.attemptId));
      if (existing && (existing.updatedAt || "") >= (rec.updatedAt || "")) continue;
      this.rawSet(this.attemptKey(rec.attemptId), rec);
      const idx = this.attemptIndex();
      if (!idx.includes(rec.attemptId)) { idx.push(rec.attemptId); this.rawSet("attempts.index", idx); }
      n += 1;
    }
    return n;
  }
  wipe() {
    for (const k of this.adapter.keys()) this.adapter.del(k);
  }
}

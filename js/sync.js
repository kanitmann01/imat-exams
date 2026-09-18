/* Optional cloud sync (free-tier Supabase, REST only, no SDK dependency).
   Local mode (no credentials) is fully functional and every entry point no-ops.
   Offline-first: push/pull never blocks grading, autosave or navigation.
   Contract: SPEC section 8. */

export function syncConfig(store) {
  const cfg = (window.IMAT_CONFIG || {});
  const s = store.settings();
  const url = (s.sync && s.sync.url) || cfg.SUPABASE_URL || "";
  const key = (s.sync && s.sync.anonKey) || cfg.SUPABASE_ANON_KEY || "";
  return { url: url.replace(/\/+$/, ""), key, enabled: !!(s.sync && s.sync.enabled && url && key) };
}

export function syncSession(store) {
  return (store.settings().sync && store.settings().sync.session) || null;
}

async function sbFetch(cfg, path, opts = {}) {
  const headers = {
    "apikey": cfg.key,
    "Authorization": "Bearer " + (opts.token || cfg.key),
    "Content-Type": "application/json",
  };
  if (opts.headers) Object.assign(headers, opts.headers);
  const res = await fetch(cfg.url + path, Object.assign({}, opts, { headers }));
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error("supabase " + res.status + " " + path + ": " + body.slice(0, 200));
  }
  return res.status === 204 ? null : res.json();
}

export async function signIn(store, email, password) {
  const cfg = syncConfig(store);
  if (!cfg.url || !cfg.key) throw new Error("sync is not configured");
  const data = await sbFetch(cfg, "/auth/v1/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const s = store.settings();
  s.sync = Object.assign({}, s.sync, { enabled: true, session: { access_token: data.access_token, refresh_token: data.refresh_token, user_id: data.user.id, email } });
  store.saveSettings(s);
  return s.sync.session;
}

export async function signOut(store) {
  const s = store.settings();
  s.sync = Object.assign({}, s.sync, { enabled: false, session: null });
  store.saveSettings(s);
}

export async function refreshToken(store) {
  const cfg = syncConfig(store);
  const sess = syncSession(store);
  if (!cfg.enabled || !sess) return null;
  const data = await sbFetch(cfg, "/auth/v1/token?grant_type=refresh_token", {
    method: "POST",
    body: JSON.stringify({ refresh_token: sess.refresh_token }),
  });
  const s = store.settings();
  s.sync.session = { access_token: data.access_token, refresh_token: data.refresh_token, user_id: data.user.id, email: sess.email };
  store.saveSettings(s);
  return s.sync.session;
}

/* Push every queued attempt; returns number pushed. Throws on auth/config errors. */
export async function pushPending(store) {
  const cfg = syncConfig(store);
  if (!cfg.enabled) return 0;
  const queue = store.syncQueue();
  if (!queue.length) return 0;
  let sess = syncSession(store);
  const rows = [];
  for (const id of queue) {
    const rec = store.rawGet("attempt." + id);
    if (!rec) { store.dequeueSync(id); continue; }
    rows.push({
      attempt_id: rec.attemptId,
      user_id: sess.user_id,
      exam_id: rec.examId,
      schema_v: rec.v || 1,
      data: rec,
      deleted: !!rec.deleted,
      updated_at: rec.updatedAt,
    });
  }
  if (!rows.length) return 0;
  await sbFetch(cfg, "/rest/v1/attempts?on_conflict=attempt_id", {
    method: "POST",
    token: sess.access_token,
    headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows),
  });
  for (const r of rows) { store.dequeueSync(r.attempt_id); }
  const rec0 = rows.map((r) => store.rawGet("attempt." + r.attempt_id)).filter(Boolean);
  for (const rec of rec0) { rec.dirty = false; store.rawSet("attempt." + rec.attemptId, rec); }
  const meta = store.syncMeta();
  meta.lastPushAt = new Date().toISOString();
  store.setSyncMeta(meta);
  return rows.length;
}

/* Pull remote rows updated since lastPullAt and apply last-write-wins. */
export async function pullRemote(store) {
  const cfg = syncConfig(store);
  if (!cfg.enabled) return 0;
  let sess = syncSession(store);
  const meta = store.syncMeta();
  const since = meta.lastPullAt || "1970-01-01T00:00:00Z";
  const rows = await sbFetch(cfg,
    "/rest/v1/attempts?select=*&updated_at=gt." + encodeURIComponent(since) + "&order=updated_at.asc",
    { method: "GET", token: sess.access_token });
  let applied = 0;
  for (const row of rows || []) {
    const local = store.rawGet("attempt." + row.attempt_id);
    if (!local || (local.updatedAt || "") <= (row.updated_at || "")) {
      if (row.deleted) {
        if (local) { store.adapter.del("attempt." + row.attempt_id); }
        const idx = store.attemptIndex().filter((x) => x !== row.attempt_id);
        store.rawSet("attempts.index", idx);
      } else {
        const rec = row.data;
        rec.dirty = false;
        store.rawSet("attempt." + row.attempt_id, rec);
        const idx = store.attemptIndex();
        if (!idx.includes(rec.attemptId)) { idx.push(rec.attemptId); store.rawSet("attempts.index", idx); }
      }
      applied += 1;
    }
    const m = store.syncMeta();
    m.lastPullAt = row.updated_at;
    store.setSyncMeta(m);
  }
  return applied;
}

/* One sync cycle: refresh token, push, pull. Safe to call from anywhere. */
export async function syncCycle(store) {
  const cfg = syncConfig(store);
  if (!cfg.enabled) return { pushed: 0, pulled: 0, pending: store.syncQueue().length };
  const sess = await refreshToken(store);
  if (!sess) return { pushed: 0, pulled: 0, pending: store.syncQueue().length };
  const pushed = await pushPending(store);
  const pulled = await pullRemote(store);
  return { pushed, pulled, pending: store.syncQueue().length };
}

export function pendingCount(store) {
  return store.syncQueue().length;
}

export function describeSyncStatus(store) {
  const cfg = syncConfig(store);
  if (!cfg.url || !cfg.key) return { state: "not_configured", label: "Not configured (local only)" };
  if (!cfg.enabled) return { state: "disabled", label: "Configured, sync off" };
  const pending = pendingCount(store);
  const sess = syncSession(store);
  return {
    state: "on",
    label: "Sync on" + (sess && sess.email ? " (" + sess.email + ")" : "") + (pending ? " - " + pending + " pending" : ""),
    pending,
  };
}

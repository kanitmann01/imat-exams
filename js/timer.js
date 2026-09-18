/* Pure timer accounting for the exam runner.

   Contract (SPEC 6.5): remainingSec is persisted on the attempt and is the
   single source of truth. A 1s interval runs only while the exam route is
   mounted and the tab is visible. Kind mode (default) freezes the clock while
   away; strict mode subtracts away-time. The math here is clock-delta based so
   throttled intervals cannot inflate time. Injectable now() for node tests. */

/* Advance a record's remaining seconds by real elapsed time since lastTickAt.
   Always subtracts: while the exam is open and visible this is the 1s ticker;
   away-time charging is decided by resume(), not here.
   Returns {remainingSec, lastTickAt, expired}. */
export function advance(record, nowMs) {
  const nowSec = Math.floor(nowMs / 1000);
  const lastSec = Math.floor((record.lastTickAt || nowMs) / 1000);
  const elapsed = Math.max(0, nowSec - lastSec);
  const remaining = Math.max(0, record.remainingSec - elapsed);
  return {
    remainingSec: remaining,
    lastTickAt: nowMs,
    expired: remaining <= 0 && record.remainingSec > 0,
  };
}

/* Resume bookkeeping when the exam route mounts again.
   kind mode (default): clock unchanged, lastTickAt reset so away time is forgiven.
   strict mode: away time is charged via advance (lastTickAt kept from before). */
export function resume(record, nowMs, mode) {
  if (mode === "strict") return advance(record, nowMs);
  return { remainingSec: record.remainingSec, lastTickAt: nowMs, expired: false };
}

/* Browser interval driver (not unit-tested; the math above is). */
export function startTicker(record, mode, { onTick, onExpire, onPersist }) {
  let stopped = false;
  const iv = setInterval(() => {
    if (stopped || document.visibilityState !== "visible") return;
    const r = advance(record, Date.now());
    record.remainingSec = r.remainingSec;
    record.lastTickAt = r.lastTickAt;
    onTick(r.remainingSec);
    onPersist();
    if (r.expired) { stop(); onExpire(); }
    if (r.remainingSec <= 0) { stop(); }
  }, 1000);
  function stop() { stopped = true; clearInterval(iv); }
  return stop;
}

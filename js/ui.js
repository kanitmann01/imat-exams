/* DOM helpers. Content-bearing strings are ALWAYS inserted via textContent
   (createElement/append); innerHTML is never used with dynamic data. */

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (k === "dataset") Object.assign(node.dataset, v);
    else node.setAttribute(k, v === true ? "" : String(v));
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

export function fmtScore(tenths) {
  if (tenths == null) return "-";
  const sign = tenths < 0 ? "-" : "";
  const abs = Math.abs(tenths);
  return sign + Math.floor(abs / 10) + "." + (abs % 10);
}

export function fmtClock(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

export function fmtDate(iso, withTime = false) {
  if (!iso) return "-";
  const d = new Date(iso);
  const opts = { day: "numeric", month: "short", year: "numeric" };
  if (withTime) { opts.hour = "2-digit"; opts.minute = "2-digit"; }
  return d.toLocaleString(undefined, opts);
}

let toastTid = null;
export function toast(msg) {
  let t = document.getElementById("toast");
  if (!t) {
    t = el("div", { id: "toast" });
    document.body.append(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTid);
  toastTid = setTimeout(() => t.classList.remove("show"), 1800);
}

/* Accessible modal; resolves true (ok) or false (cancel/dismiss). */
export function confirmModal({ title, body, okLabel = "OK", cancelLabel = "Cancel", danger = false }) {
  return new Promise((resolve) => {
    const scrim = el("div", { class: "modal-scrim", onclick: (e) => { if (e.target === scrim) done(false); } });
    function done(v) {
      scrim.remove();
      document.removeEventListener("keydown", esc);
      resolve(v);
    }
    function esc(e) { if (e.key === "Escape") done(false); }
    document.addEventListener("keydown", esc);
    const box = el("div", { class: "modal", role: "dialog", "aria-modal": "true" },
      el("h3", { text: title }),
      typeof body === "string" ? el("p", { text: body }) : body,
      el("div", { class: "modal-actions" },
        el("button", { class: "btn btn-ghost", text: cancelLabel, onclick: () => done(false) }),
        el("button", { class: "btn " + (danger ? "btn-red" : "btn-primary"), text: okLabel, onclick: () => done(true) })));
    scrim.append(box);
    document.body.append(scrim);
  });
}

/* Minimal SVG multi-series line chart. series: [{label, color, points:[{x:Date, y, info}]}] */
export function lineChart(series, { height = 200, yMin = null, yMax = null } = {}) {
  const pts = series.flatMap((s) => s.points);
  if (!pts.length) return el("div", { class: "chart-empty", text: "No attempts yet" });
  const W = 600, H = height, padL = 34, padR = 10, padT = 12, padB = 24;
  const xs = pts.map((p) => p.x.getTime());
  const ys = pts.map((p) => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const y0 = yMin != null ? yMin : Math.min(...ys, 0);
  const y1 = yMax != null ? yMax : Math.max(...ys);
  const X = (t) => (x1 === x0 ? W / 2 : padL + ((t - x0) / (x1 - x0)) * (W - padL - padR));
  const Y = (v) => padT + (1 - (v - y0) / ((y1 - y0) || 1)) * (H - padT - padB);
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 " + W + " " + H);
  svg.setAttribute("class", "chart");
  svg.setAttribute("role", "img");
  // y gridlines (4)
  for (let i = 0; i <= 4; i++) {
    const v = y0 + ((y1 - y0) * i) / 4;
    const y = Y(v);
    const line = document.createElementNS(NS, "line");
    line.setAttribute("x1", padL); line.setAttribute("x2", W - padR);
    line.setAttribute("y1", y); line.setAttribute("y2", y);
    line.setAttribute("class", "chart-grid");
    svg.append(line);
    const lbl = document.createElementNS(NS, "text");
    lbl.setAttribute("x", padL - 5); lbl.setAttribute("y", y + 3);
    lbl.setAttribute("text-anchor", "end");
    lbl.setAttribute("class", "chart-tick");
    lbl.textContent = String(Math.round(v * 10) / 10);
    svg.append(lbl);
  }
  for (const s of series) {
    if (s.points.length < 1) continue;
    if (s.points.length > 1) {
      const pl = document.createElementNS(NS, "polyline");
      pl.setAttribute("points", s.points.map((p) => X(p.x.getTime()) + "," + Y(p.y)).join(" "));
      pl.setAttribute("fill", "none");
      pl.setAttribute("stroke", s.color);
      pl.setAttribute("stroke-width", "2");
      svg.append(pl);
    }
    for (const p of s.points) {
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", X(p.x.getTime())); c.setAttribute("cy", Y(p.y));
      c.setAttribute("r", 3.5);
      c.setAttribute("fill", s.color);
      const t = document.createElementNS(NS, "title");
      t.textContent = (s.label ? s.label + " - " : "") + p.info;
      c.append(t);
      svg.append(c);
    }
  }
  return svg;
}

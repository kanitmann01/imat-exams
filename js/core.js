/* Pure helpers: PRNG, hashing, per-attempt option permutations.
   No DOM here: this module is shared by the browser app and node:test suites. */

export const LETTERS = "ABCDE";

/* xmur3-style string hash -> 32-bit int (deterministic across engines) */
export function hash32(...parts) {
  let h = 1779033703 ^ parts.join("|").length;
  const str = parts.join("|");
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/* mulberry32 PRNG -> () => float in [0,1) */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SUP = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6",
              "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "-" };
const SCI_RE = /[×x*]\s*10\s*(⁻?[⁰¹²³⁴⁵⁶⁷⁸⁹]+|\^?[-+]?\d+)/;
const NUM_RE = /^([+-]?(?:\d+(?:\.\d+)?|\.\d+))(?:\s*\/\s*([+-]?\d+(?:\.\d+)?))?(?:\s*e([+-]?\d+))?\s*(.*)$/;

export function parseNumericOption(o) {
  let s = SCI_RE.test(o)
    ? o.replace(new RegExp(SCI_RE.source, "g"), (m, exp) =>
        "e" + exp.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]/g, (c) => SUP[c]).replace(/^\+/, ""))
    : o;
  s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]/g, (c) => SUP[c]);
  const m = NUM_RE.exec(s);
  if (!m) return null;
  let base = parseFloat(m[1]);
  if (isNaN(base)) return null;
  if (m[2] !== undefined) {
    const denom = parseFloat(m[2]);
    if (denom === 0) return null;
    base = base / denom;
  }
  if (m[3] !== undefined) base = base * Math.pow(10, parseInt(m[3], 10));
  return { value: base, unit: m[4].trim() };
}

/* Ascending display order when all five options are the same numeric quantity
   (real IMAT lists numeric options ascending, so their correct letter is fixed
   by rank). Returns array of original indices, or null when not numeric. */
export function numericOrder(options) {
  const parsed = options.map(parseNumericOption);
  if (parsed.some((p) => p === null)) return null;
  const units = new Set(parsed.map((p) => p.unit));
  if (units.size !== 1) return null;
  return parsed
    .map((p, i) => [p, i])
    .sort((a, b) => a[0].value - b[0].value || a[1] - b[1])
    .map(([, i]) => i);
}

/* Shuffle-unsafe: options referencing other options, "all/none of the above". */
export function shuffleUnsafeReason(q) {
  if (q.shuffleSafe === false) return q.shuffleUnsafeReason || "marked unsafe in bank";
  const hay = (q.stem + "\n" + q.options.join("\n")).toLowerCase();
  if (/\b(all|none) of (the )?above\b/.test(hay)) return "all/none of the above";
  if (/\b(both|all|none)\s+(of\s+)?(options?\s+|statements?\s+|answers?\s+)?[a-e]\s*(,|and|&|\+|or)\s*[a-e]\b/.test(hay)) {
    return "options reference each other";
  }
  return null;
}

/* Permutation for one free question so the correct original option lands on
   `letter`; remaining originals fill the other slots in seeded-shuffled order. */
export function permForLetter(q, letter, rnd) {
  const correctIdx = q.ans.charCodeAt(0) - 65;
  const targetPos = letter.charCodeAt(0) - 65;
  const others = [0, 1, 2, 3, 4].filter((i) => i !== correctIdx);
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [others[i], others[j]] = [others[j], others[i]];
  }
  const perm = new Array(5);
  perm[targetPos] = correctIdx;
  const fill = [0, 1, 2, 3, 4].filter((p) => p !== targetPos);
  fill.forEach((pos, k) => { perm[pos] = others[k]; });
  return perm;
}

/* Full per-attempt permutation map {qn: perm|null} for a bank.
   Numeric questions: fixed ascending. Unsafe: null (identity).
   Free questions: greedily assigned to the letter furthest below target,
   ties broken by seeded PRNG. */
export function computePermMap(bank, seed) {
  const map = {};
  const target = {};
  const n = bank.questions.length;
  const base = Math.floor(n / 5);
  const rem = n % 5;
  LETTERS.split("").forEach((c, i) => { target[c] = base + (i < rem ? 1 : 0); });
  const assigned = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  const free = [];
  for (const q of bank.questions) {
    const unsafe = shuffleUnsafeReason(q);
    if (unsafe) { map[q.n] = null; assigned[q.ans] += 1; continue; }
    const order = numericOrder(q.options);
    if (order) {
      map[q.n] = order;
      const correctIdx = q.ans.charCodeAt(0) - 65;
      assigned[LETTERS[order.indexOf(correctIdx)]] += 1;
    } else {
      free.push(q);
    }
  }
  for (const q of free) {
    const need = LETTERS.split("").map((c) => ({ c, need: target[c] - assigned[c] }));
    const best = Math.max(...need.map((x) => x.need));
    const cands = need.filter((x) => x.need === best).map((x) => x.c);
    const rnd = mulberry32(hash32(bank.id, q.n, seed));
    const letter = cands[Math.floor(rnd() * cands.length) % cands.length];
    const rnd2 = mulberry32(hash32(bank.id, q.n, seed, "perm"));
    map[q.n] = permForLetter(q, letter, rnd2);
    assigned[letter] += 1;
  }
  return map;
}

/* Displayed correct letter for question q under perm (null perm = identity). */
export function displayKey(q, perm) {
  if (!perm) return q.ans;
  const origIdx = q.ans.charCodeAt(0) - 65;
  return LETTERS[perm.indexOf(origIdx)];
}

/* Displayed option text at 0-based position i. */
export function optionAt(q, i, perm) {
  return q.options[perm ? perm[i] : i];
}

export function displayDistribution(bank, permMap) {
  const counts = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  for (const q of bank.questions) counts[displayKey(q, permMap ? permMap[q.n] : null)] += 1;
  return counts;
}

/* Identity perm map (imports / manual attempts). */
export function identityPermMap(bank) {
  const map = {};
  for (const q of bank.questions) map[q.n] = null;
  return map;
}

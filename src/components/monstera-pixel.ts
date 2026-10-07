// Procedural monstera artwork supplied by the artist. Keep the seeded geometry
// and palette stable so every instance displays the same reference leaf.
export const DEFAULT_PALETTE = {
  out: "#173f22",
  g0: "#245c2e",
  g1: "#357a39",
  g2: "#4f9a45",
  vein: "#86bf63",
  mint: "#b7d49a",
  vcr: "#d6e4b0",
  cr: "#f2edcc",
  cr2: "#d8d5a6",
  crOut: "#8f8f62",
};

type Color = keyof typeof DEFAULT_PALETTE;
type Point = { x: number; y: number };
type Grid = (Color | null)[][];

function rng(s: number) {
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeNoise(rand: () => number) {
  const P = new Float32Array(1024);
  for (let i = 0; i < 1024; i++) P[i] = rand();
  const h = (a: number, b: number) => P[(Math.imul(a, 73856093) ^ Math.imul(b, 19349663)) & 1023]!;
  const sm = (t: number) => t * t * (3 - 2 * t);
  return (x: number, y: number) => {
    const xi = Math.floor(x),
      yi = Math.floor(y),
      xf = sm(x - xi),
      yf = sm(y - yi);
    const a = h(xi, yi),
      b = h(xi + 1, yi),
      c = h(xi, yi + 1),
      d = h(xi + 1, yi + 1);
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  };
}

function hash(x: number, y: number, s: number) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1103515245);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export function buildLeaf(N: number, seed: number, refBias: boolean): Grid {
  const D = Math.PI / 180,
    rand = rng(seed * 9973 + 1),
    noise = makeNoise(rand);
  const C = { x: 0.5, y: 0.49 };
  const ad = (a: number, b: number) => {
    let d = a - b;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return d;
  };
  const R = (th: number) => {
    let r = 0.455,
      d = ad(th, -90 * D);
    r -= 0.22 * Math.exp(-((d / 0.2) ** 2));
    d = ad(th, 96 * D);
    r += 0.035 * Math.exp(-((d / 0.12) ** 2));
    return r + 0.006 * Math.sin(th * 11 + 1);
  };
  const A = { x: 0.505, y: 0.27 },
    Q = { x: 0.49, y: 0.62 },
    Tt = 96 * D;
  const T = { x: C.x + R(Tt) * 0.97 * Math.cos(Tt), y: C.y + R(Tt) * 0.97 * Math.sin(Tt) };
  const M = (t: number) => ({
    x: (1 - t) * (1 - t) * A.x + 2 * (1 - t) * t * Q.x + t * t * T.x,
    y: (1 - t) * (1 - t) * A.y + 2 * (1 - t) * t * Q.y + t * t * T.y,
  });
  const midAtY = (y: number) => M(Math.max(0.03, Math.min(0.9, (y - A.y) / (T.y - A.y))));
  const edge = (a: number, k: number) => ({
    x: C.x + R(a) * k * Math.cos(a),
    y: C.y + R(a) * k * Math.sin(a),
  });
  const seg = (p: Point, a: Point, b: Point) => {
    const vx = b.x - a.x,
      vy = b.y - a.y,
      L = vx * vx + vy * vy;
    let t = ((p.x - a.x) * vx + (p.y - a.y) * vy) / L;
    t = Math.max(0, Math.min(1, t));
    return { d: Math.hypot(p.x - a.x - t * vx, p.y - a.y - t * vy), t };
  };

  const right = [-66, -44, -21, 2, 25, 48, 71],
    left = [121, 143, 165, 187, 209, 231, 250];
  const veins = right.concat(left).map((a) => {
    const E = edge(a * D, 0.98);
    return { O: midAtY(E.y + 0.13), E };
  });
  const sa: number[] = [];
  for (let i = 0; i < right.length; i++)
    sa.push((right[i]! + (i + 1 < right.length ? right[i + 1]! : 96)) / 2);
  for (let i = 0; i < left.length; i++) sa.push(((i === 0 ? 96 : left[i - 1]!) + left[i]!) / 2);

  const hw0 = Math.max(0.022, 0.6 / N),
    hw1 = Math.max(0.013, 0.5 / N);
  const slits: { S: Point; P: Point }[] = [];
  const holes: { x: number; y: number; ux: number; uy: number; a: number; b: number }[] = [];
  sa.forEach((s) => {
    const a = s * D,
      S = edge(a, 1.06),
      O = midAtY(S.y + 0.13);
    let f = 0.55 + 0.12 * rand();
    if (s > 75 && s < 115) f *= 0.8;
    slits.push({ S, P: { x: S.x + f * (O.x - S.x), y: S.y + f * (O.y - S.y) } });
    if (rand() < 0.45) {
      const L = Math.hypot(O.x - S.x, O.y - S.y),
        g = f + 0.16;
      holes.push({
        x: S.x + g * (O.x - S.x),
        y: S.y + g * (O.y - S.y),
        ux: (O.x - S.x) / L,
        uy: (O.y - S.y) / L,
        a: Math.max(0.024, 1.1 / N),
        b: Math.max(0.012, 0.55 / N),
      });
    }
  });

  const mid: Point[] = [];
  for (let i = 0; i <= 40; i++) mid.push(M(i / 40));
  const b1 = refBias ? 2.0 : rand() * 2 * Math.PI - Math.PI;
  const b2 = refBias ? -1.4 : rand() * 2 * Math.PI - Math.PI;

  const inside: boolean[][] = [],
    grid: Grid = [];
  for (let y = 0; y < N; y++) {
    const insideRow: boolean[] = [],
      row: (Color | null)[] = [];
    inside.push(insideRow);
    grid.push(row);
    for (let x = 0; x < N; x++) {
      const p = { x: ((x + 0.5) / N) * 1.04 - 0.02, y: ((y + 0.5) / N) * 1.04 - 0.02 };
      const dx = p.x - C.x,
        dy = p.y - C.y,
        r = Math.hypot(dx, dy),
        th = Math.atan2(dy, dx);
      let ok = r <= R(th);

      if (ok)
        for (const slit of slits) {
          const q = seg(p, slit.S, slit.P);
          if (q.d < hw0 + (hw1 - hw0) * q.t) {
            ok = false;
            break;
          }
        }
      if (ok)
        for (const h of holes) {
          const ox = p.x - h.x,
            oy = p.y - h.y;
          const u = ox * h.ux + oy * h.uy,
            w = -ox * h.uy + oy * h.ux;
          if ((u / h.a) ** 2 + (w / h.b) ** 2 < 1) {
            ok = false;
            break;
          }
        }

      insideRow[x] = ok;
      if (!ok) {
        row[x] = null;
        continue;
      }

      let md = 1e9,
        mt = 0;
      for (let k = 0; k < 40; k++) {
        const q = seg(p, mid[k]!, mid[k + 1]!);
        if (q.d < md) {
          md = q.d;
          mt = (k + q.t) / 40;
        }
      }
      const isMid = md < (0.95 - 0.4 * mt) / N;
      let isVein = false;
      if (!isMid)
        for (const vein of veins) {
          const q = seg(p, vein.O, vein.E);
          if (q.d < 0.55 / N && q.t < 0.94) {
            isVein = true;
            break;
          }
        }

      const ang = Math.atan2(dx, dy),
        rn = r / R(th);
      const n1 = noise(ang * 5.5 + 3, rn * 1.6),
        n2 = noise(ang * 1.6 + 20, rn * 0.9 + 5);
      const v =
        0.5 * n1 +
        0.5 * n2 +
        0.3 * Math.exp(-((ad(ang, b1) / 0.38) ** 2)) +
        0.16 * Math.exp(-((ad(ang, b2) / 0.3) ** 2)) * rn;
      const thr = 0.64,
        cream = v > thr;
      const tone = 0.55 * noise(p.x * 7 + 40, p.y * 7) + 0.45 * (1.1 - p.y * 0.6 - p.x * 0.5);
      let c: Color;
      if (cream) {
        c = v < thr + 0.035 ? "cr2" : "cr";
        if (hash(x, y, seed + 5) < 0.025) c = "g2";
      } else if (v > thr - 0.05 && (x + y) & 1) {
        c = "mint";
      } else {
        c = tone > 0.62 ? "g2" : tone < 0.4 ? "g0" : "g1";
        if (hash(x, y, seed) < 0.035 + 0.25 * Math.max(0, v - 0.45)) c = "cr";
      }
      if (isMid || isVein) c = cream ? "vcr" : "vein";
      row[x] = c;
    }
  }

  const out = (xx: number, yy: number) => xx < 0 || yy < 0 || xx >= N || yy >= N || !inside[yy]![xx];
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      if (!inside[y]![x]) continue;
      if (out(x - 1, y) || out(x + 1, y) || out(x, y - 1) || out(x, y + 1)) {
        const cc = grid[y]![x];
        grid[y]![x] = cc === "cr" || cc === "cr2" || cc === "vcr" ? "crOut" : "out";
      }
    }
  return grid;
}

interface DrawOptions {
  size?: number;
  seed?: number;
  matchReference?: boolean;
  palette?: Partial<Record<Color, string>>;
  grid?: boolean;
}

export function draw(canvas: HTMLCanvasElement, opts: DrawOptions = {}) {
  const N = opts.size || 48;
  const seed = opts.seed ?? 7;
  const ref = opts.matchReference ?? opts.seed == null;
  const pal = { ...DEFAULT_PALETTE, ...opts.palette };
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const g = buildLeaf(N, seed, ref),
    S = canvas.width / N;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const c = g[y]![x];
      if (!c) continue;
      ctx.fillStyle = pal[c];
      ctx.fillRect(Math.floor(x * S), Math.floor(y * S), Math.ceil(S), Math.ceil(S));
    }
  if (opts.grid) {
    ctx.strokeStyle = "rgba(128,128,128,0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const k = Math.round(i * S) + 0.5;
      ctx.moveTo(k, 0);
      ctx.lineTo(k, canvas.height);
      ctx.moveTo(0, k);
      ctx.lineTo(canvas.width, k);
    }
    ctx.stroke();
  }
  return canvas;
}

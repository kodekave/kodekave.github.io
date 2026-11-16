/**
 * The background patterns, drawn on a canvas.
 *
 * Each is a pure function of a rectangle and a seed: it draws once into the
 * rectangle it is given, nothing moves, and the same seed gives the same
 * drawing. They are canvas, not SVG or an image, on purpose: a large decorative
 * image counts as the page's largest paint and delays it, a canvas does not,
 * and nothing extra is downloaded. See components/Pattern.tsx for how they are
 * scheduled (after the page has painted, and again only if the frame resizes).
 *
 * The eleven drawings are the ones picked from the pattern galleries kept in
 * docs/redesign/reference/. The plus grid is the page's base layer (globals.css)
 * and is not drawn here.
 *
 *   harmonograph  home          the line of two damped pendulums
 *   voronoi       ventures      the boundaries between the nearest of N points
 *   chladni       research      nodal lines of a vibrating plate
 *   rule90        about         a cellular automaton growing triangles
 *   halftone      writing       dots that swell along a diagonal wave
 *   schotter      services      order dissolving row by row (Georg Nees, 1968)
 *   ridges        bookshelf     stacked, occluding terrain lines
 *   julia         cross-border  contour lines of a Julia set's border
 *   penrose       guide         a tiling with five-fold symmetry, never repeating
 *   clifford      comparison    a strange attractor, 420,000 faint points
 */

export type PatternKind =
  | "harmonograph"
  | "voronoi"
  | "chladni"
  | "rule90"
  | "halftone"
  | "schotter"
  | "ridges"
  | "julia"
  | "penrose"
  | "clifford";

/** The ink, as a CSS colour channel triple. */
const INK = "31, 43, 39";
const PAPER = "#f6f5ef";

/** A small seeded random, so a page's pattern is the same on every load. */
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Smooth value noise on a seeded lattice. */
function noiseFn(seed: number) {
  const r = rng(seed);
  const G = 256;
  const p = Array.from({ length: G * G }, () => r());
  const g = (a: number, b: number) => p[(b & 255) * G + (a & 255)];
  return (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    return (
      (g(xi, yi) * (1 - u) + g(xi + 1, yi) * u) * (1 - v) +
      (g(xi, yi + 1) * (1 - u) + g(xi + 1, yi + 1) * u) * v
    );
  };
}

type Ctx = CanvasRenderingContext2D;
type Pt = [number, number];

/** Contour lines of a scalar field, by marching squares. */
function iso(
  ctx: Ctx,
  W: number,
  H: number,
  field: (x: number, y: number) => number,
  levels: number[],
  cell: number,
  alphaFn?: (levelIndex: number) => number
) {
  const nx = Math.ceil(W / cell) + 2;
  const ny = Math.ceil(H / cell) + 2;
  const v = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) v[j * nx + i] = field(i * cell, j * cell);

  levels.forEach((L, li) => {
    ctx.beginPath();
    ctx.strokeStyle = `rgba(${INK},${alphaFn ? alphaFn(li) : 0.5})`;
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const a = v[j * nx + i];
        const b = v[j * nx + i + 1];
        const c = v[(j + 1) * nx + i + 1];
        const d = v[(j + 1) * nx + i];
        const idx = (a > L ? 8 : 0) + (b > L ? 4 : 0) + (c > L ? 2 : 0) + (d > L ? 1 : 0);
        if (idx === 0 || idx === 15) continue;
        const x = i * cell;
        const y = j * cell;
        const t = (p: number, q: number) => (L - p) / (q - p);
        const top: Pt = [x + cell * t(a, b), y];
        const right: Pt = [x + cell, y + cell * t(b, c)];
        const bottom: Pt = [x + cell * t(d, c), y + cell];
        const left: Pt = [x, y + cell * t(a, d)];
        const seg = (p: Pt, q: Pt) => {
          ctx.moveTo(p[0], p[1]);
          ctx.lineTo(q[0], q[1]);
        };
        switch (idx) {
          case 1: case 14: seg(left, bottom); break;
          case 2: case 13: seg(bottom, right); break;
          case 3: case 12: seg(left, right); break;
          case 4: case 11: seg(top, right); break;
          case 5: seg(left, top); seg(bottom, right); break;
          case 6: case 9: seg(top, bottom); break;
          case 7: case 8: seg(left, top); break;
          case 10: seg(top, right); seg(left, bottom); break;
        }
      }
    }
    ctx.stroke();
  });
}

/* ------------------------------------------------------------ the patterns */

/** The line a pair of damped pendulums would draw. */
function harmonograph(ctx: Ctx, W: number, H: number, seed: number) {
  const r = rng(seed);
  // Seed 0 is the drawing from the redesign notes. Any other seed nudges the
  // frequencies and phases a little, which gives a different, related figure.
  const j = (amount: number) => (seed === 0 ? 0 : (r() - 0.5) * 2 * amount);
  const f = [2.01 + j(0.02), 3.0 + j(0.02), 3.0 + j(0.02), 2.0 + j(0.02)];
  const p = [j(1.5), 1 + j(1.5), 0.5 + j(1.5), j(1.5)];
  const d = [0.0042, 0.003, 0.003, 0.0042];
  const k = 0.62;
  const narrow = W < 768;
  const A = Math.min(W * (narrow ? 0.62 : 0.42), H * 0.5) * 0.77;
  const cx = W * (narrow ? 0.5 : 0.74);
  const cy = H * (narrow ? 0.3 : 0.42);

  const at = (t: number): Pt => [
    cx + A * (Math.sin(f[0] * t + p[0]) * Math.exp(-d[0] * t) + k * Math.sin(f[1] * t + p[1]) * Math.exp(-d[1] * t)),
    cy + A * (Math.sin(f[2] * t + p[2]) * Math.exp(-d[2] * t) + k * Math.sin(f[3] * t + p[3]) * Math.exp(-d[3] * t)),
  ];

  // One stroke per segment, so the line darkens where it crosses itself.
  ctx.lineWidth = 0.55;
  ctx.lineCap = "round";
  ctx.strokeStyle = `rgba(${INK}, 0.26)`;
  let [px, py] = at(0);
  for (let t = 0.012; t <= 110; t += 0.012) {
    const [x, y] = at(t);
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(x, y);
    ctx.stroke();
    px = x;
    py = y;
  }
}

/** Order dissolving row by row: Georg Nees's Schotter. */
function schotter(ctx: Ctx, W: number, H: number, seed: number) {
  const r = rng(7 + seed);
  const s = 24;
  const cols = Math.ceil(W / s) + 1;
  const rows = Math.ceil(H / s) + 1;
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = `rgba(${INK},.55)`;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const t = j / rows;
      const jit = t * t * s * 0.95;
      const rot = t * 0.9 * (r() - 0.5) * 2;
      ctx.save();
      ctx.translate(i * s + s / 2 + (r() - 0.5) * jit, j * s + s / 2 + (r() - 0.5) * jit);
      ctx.rotate(rot);
      ctx.strokeRect(-s * 0.4, -s * 0.4, s * 0.8, s * 0.8);
      ctx.restore();
    }
  }
}

/** Dots that swell along a diagonal wave, fading from the top-right corner. */
function halftone(ctx: Ctx, W: number, H: number, seed: number) {
  const s = 9;
  ctx.fillStyle = `rgba(${INK},.62)`;
  for (let y = s / 2; y < H; y += s) {
    for (let x = s / 2; x < W; x += s) {
      const d = Math.hypot(x - W, y) / Math.hypot(W, H);
      const w = 0.5 + 0.5 * Math.sin(d * 14 - x * 0.004 + seed);
      const r = Math.max(0.15, (1 - d) * (0.4 + 0.6 * w) * 3.4);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 7);
      ctx.fill();
    }
  }
}

/** Rule 90: simple rules growing triangles from three seeds. */
function rule90(ctx: Ctx, W: number, H: number, seed: number) {
  const r = rng(3 + seed);
  const s = 4;
  const cols = Math.ceil(W / s);
  const rows = Math.ceil(H / s);
  let row = new Uint8Array(cols);
  [0.3, 0.72, 0.93].forEach((f) => {
    row[Math.min(cols - 2, Math.max(1, Math.floor(cols * (f + (seed ? (r() - 0.5) * 0.08 : 0)))))] = 1;
  });
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      if (row[i]) {
        ctx.fillStyle = `rgba(${INK},${0.55 * (1 - Math.abs(i / cols - 0.5) * 0.6)})`;
        ctx.fillRect(i * s, j * s, s - 1, s - 1);
      }
    }
    const nx = new Uint8Array(cols);
    for (let i = 1; i < cols - 1; i++) nx[i] = row[i - 1] ^ row[i + 1];
    row = nx;
  }
}

/** Voronoi: the boundary between the nearest of N points. */
function voronoi(ctx: Ctx, W: number, H: number, seed: number) {
  const r = rng(21 + seed);
  const count = Math.max(30, Math.min(120, Math.round((W * H) / 3200)));
  const pts: Pt[] = Array.from({ length: count }, () => [r() * W, r() * H]);
  const step = 2;
  ctx.fillStyle = `rgba(${INK},.5)`;
  const near = (x: number, y: number) => {
    let b = 0;
    let bd = 1e9;
    for (let k = 0; k < pts.length; k++) {
      const dx = x - pts[k][0];
      const dy = y - pts[k][1];
      const d = dx * dx + dy * dy;
      if (d < bd) {
        bd = d;
        b = k;
      }
    }
    return b;
  };
  const w = Math.ceil(W / step) + 1;
  const ids = new Int16Array(w * (Math.ceil(H / step) + 1));
  for (let j = 0; j * step < H; j++) for (let i = 0; i < w; i++) ids[j * w + i] = near(i * step, j * step);
  for (let j = 0; j * step < H - step; j++) {
    for (let i = 0; i < w - 1; i++) {
      if (ids[j * w + i] !== ids[j * w + i + 1] || ids[j * w + i] !== ids[(j + 1) * w + i]) {
        ctx.fillRect(i * step, j * step, 1.1, 1.1);
      }
    }
  }
  pts.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p[0], p[1], 1.6, 0, 7);
    ctx.fill();
  });
}

/** Chladni: the lines where a vibrating plate stays still. */
function chladni(ctx: Ctx, W: number, H: number, seed: number) {
  const S = Math.max(H, W * 0.5) * 1.05;
  const modes: [number, number, number][] = [
    [3 + (seed % 3), 5, 1],
    [4, 7 + (seed % 2), 0.8],
    [2, 9, 0.6],
    [6, 11, 0.35],
  ];
  const f = (x: number, y: number) => {
    const u = (x / S) * Math.PI;
    const v = (y / S) * Math.PI;
    let s = 0;
    for (const [n, m, w] of modes) s += w * (Math.cos(n * u) * Math.cos(m * v) - Math.cos(m * u) * Math.cos(n * v));
    return s;
  };
  ctx.lineWidth = 0.8;
  iso(ctx, W, H, f, [-1.6, -1.2, -0.8, -0.4, -0.14, 0, 0.14, 0.4, 0.8, 1.2, 1.6], 3, (k) =>
    k === 5 ? 0.85 : k === 4 || k === 6 ? 0.45 : 0.22
  );
}

/** Clifford attractor: a strange attractor from 420,000 faint points. */
function clifford(ctx: Ctx, W: number, H: number, seed: number) {
  const a = -1.4 + seed * 0.04;
  const b = 1.6;
  const c = 1.0;
  const d = 0.7 - seed * 0.02;
  const dens = new Float32Array(W * H);
  let x = 0.1;
  let y = 0.1;
  const sc = Math.min(W, H) / 5.2;
  for (let i = 0; i < 420000; i++) {
    const nx = Math.sin(a * y) + c * Math.cos(a * x);
    const ny = Math.sin(b * x) + d * Math.cos(b * y);
    x = nx;
    y = ny;
    if (i < 20) continue;
    const px = Math.floor(W * 0.66 + x * sc);
    const py = Math.floor(H * 0.5 + y * sc);
    if (px >= 0 && px < W && py >= 0 && py < H) dens[py * W + px]++;
  }
  // putImageData ignores the canvas scale, so the density map is drawn on a
  // canvas of its own at CSS size and then scaled in.
  const off = document.createElement("canvas");
  off.width = W;
  off.height = H;
  const octx = off.getContext("2d");
  if (!octx) return;
  const img = octx.createImageData(W, H);
  const dat = img.data;
  for (let i = 0; i < W * H; i++) {
    dat[i * 4] = 31;
    dat[i * 4 + 1] = 43;
    dat[i * 4 + 2] = 39;
    dat[i * 4 + 3] = Math.round((1 - Math.exp(-dens[i] * 0.14)) * 165);
  }
  octx.putImageData(img, 0, 0);
  ctx.drawImage(off, 0, 0, W, H);
}

/** Ridge lines: stacked terrain slices, each hiding the one behind. */
function ridges(ctx: Ctx, W: number, H: number, seed: number) {
  const n = noiseFn(8 + seed);
  const rows = 34;
  const r = rng(13 + seed);
  const bumps = Array.from({ length: 9 }, () => [W * (0.3 + r() * 0.5), 6 + r() * 14, 18 + r() * 42]);
  ctx.lineWidth = 0.9;
  for (let q = 0; q < rows; q++) {
    const y0 = 34 + q * ((H - 44) / rows);
    const pts: Pt[] = [];
    for (let x = 0; x <= W; x += 3) {
      let h = 0;
      for (const [bx, w, a] of bumps) {
        const dd = (x - bx) / (w * 2.2);
        h += a * Math.exp(-dd * dd);
      }
      h *= 0.55 + n(x * 0.02 + q * 0.35, q * 0.7) * 0.9;
      h *= Math.sin(Math.PI * Math.min(1, x / W)) ** 0.6;
      pts.push([x, y0 - h * 0.6]);
    }
    ctx.beginPath();
    ctx.moveTo(0, H + 5);
    pts.forEach((p) => ctx.lineTo(p[0], p[1]));
    ctx.lineTo(W, H + 5);
    ctx.closePath();
    ctx.fillStyle = PAPER;
    ctx.fill();
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.strokeStyle = `rgba(${INK},.62)`;
    ctx.stroke();
  }
}

/** Penrose tiling: five-fold symmetry that never repeats. */
function penrose(ctx: Ctx, W: number, H: number, seed: number) {
  const phi = (1 + Math.sqrt(5)) / 2;
  const cx = W * 0.8;
  const cy = H * 0.3;
  const R = Math.hypot(W, H) * 1.1;
  const rot = seed * 0.31;
  type Tri = [number, Pt, Pt, Pt];
  let tri: Tri[] = [];
  for (let i = 0; i < 10; i++) {
    let B: Pt = [Math.cos(((2 * i - 1) * Math.PI) / 10), Math.sin(((2 * i - 1) * Math.PI) / 10)];
    let C: Pt = [Math.cos(((2 * i + 1) * Math.PI) / 10), Math.sin(((2 * i + 1) * Math.PI) / 10)];
    if (i % 2 === 0) [B, C] = [C, B];
    tri.push([0, [0, 0], B, C]);
  }
  const lerp = (p: Pt, q: Pt, t: number): Pt => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  for (let g = 0; g < 6; g++) {
    const out: Tri[] = [];
    for (const [c, A, B, C] of tri) {
      if (c === 0) {
        const Pp = lerp(A, B, 1 / phi);
        out.push([0, C, Pp, B], [1, Pp, C, A]);
      } else {
        const Q = lerp(B, A, 1 / phi);
        const Rr = lerp(B, C, 1 / phi);
        out.push([1, Rr, C, A], [1, Q, Rr, B], [0, Rr, Q, A]);
      }
    }
    tri = out;
  }
  const cs = Math.cos(rot);
  const sn = Math.sin(rot);
  const m = (p: Pt): Pt => [cx + (p[0] * cs - p[1] * sn) * R, cy + (p[0] * sn + p[1] * cs) * R];
  ctx.lineWidth = 0.6;
  ctx.strokeStyle = `rgba(${INK},.5)`;
  ctx.beginPath();
  for (const [, A, B, C] of tri) {
    const a = m(A);
    const b = m(B);
    const c = m(C);
    if (a[0] < -20 && b[0] < -20 && c[0] < -20) continue;
    if (a[0] > W + 20 && b[0] > W + 20 && c[0] > W + 20) continue;
    if (a[1] > H + 20 && b[1] > H + 20 && c[1] > H + 20) continue;
    ctx.moveTo(c[0], c[1]);
    ctx.lineTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
  }
  ctx.stroke();
}

/** Julia set: contour lines of the border of a famous fractal. */
function julia(ctx: Ctx, W: number, H: number, seed: number) {
  const cr = -0.4 + seed * 0.025;
  const ci = 0.6;
  const asp = W / H;
  const mx = 60;
  const f = (px: number, py: number) => {
    let x = (px / W - 0.5) * 3.2 * asp * 0.62 + 0.1;
    let y = (py / H - 0.5) * 2.5 * 0.62;
    let i = 0;
    while (i < mx && x * x + y * y < 16) {
      const t = x * x - y * y + cr;
      y = 2 * x * y + ci;
      x = t;
      i++;
    }
    if (i === mx) return mx;
    return i + 1 - Math.log(Math.log(Math.sqrt(x * x + y * y))) / Math.LN2;
  };
  const lv: number[] = [];
  for (let l = 3; l < 30; l += 1.5) lv.push(l);
  ctx.lineWidth = 0.7;
  iso(ctx, W, H, f, lv, 3, (k) => 0.18 + 0.14 * (k % 3 === 0 ? 1 : 0));
}

const DRAW: Record<PatternKind, (ctx: Ctx, W: number, H: number, seed: number) => void> = {
  harmonograph,
  voronoi,
  chladni,
  rule90,
  halftone,
  schotter,
  ridges,
  julia,
  penrose,
  clifford,
};

/**
 * How strongly each is shown. The harmonograph is drawn faint to begin with;
 * the rest are drawn at the gallery's strength and shown at 60% of it.
 */
export const PATTERN_OPACITY: Record<PatternKind, number> = {
  harmonograph: 1,
  voronoi: 0.6,
  chladni: 0.6,
  rule90: 0.6,
  halftone: 0.6,
  schotter: 0.6,
  ridges: 0.6,
  julia: 0.6,
  penrose: 0.6,
  clifford: 0.6,
};

/** Draws `kind` into a W x H (CSS pixel) area of an already-scaled context. */
export function drawPattern(ctx: Ctx, kind: PatternKind, W: number, H: number, seed = 0) {
  DRAW[kind](ctx, W, H, seed);
}

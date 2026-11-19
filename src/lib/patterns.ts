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
 * Each page's drawing is used twice: once behind its opening, and again in
 * plates down the page's margins as you scroll (components/PatternTrail.tsx),
 * where `focus` is "edge" and a few drawings adapt to sit at the page edge.
 *
 * Ten are from the pattern galleries kept in docs/redesign/reference/; guilloche
 * was added for the About page. The plus grid is the page's base layer
 * (globals.css) and is not drawn here.
 *
 *   lorenz        home          the butterfly of the Lorenz attractor, in thin strands
 *   harmonograph  about         the line of two damped pendulums (was the home page's)
 *   contours      research      isolines of a hilly field, a stronger line every fifth: a topographic map
 *   voronoi       ventures      the boundaries between the nearest of N points
 *   chladni       (spare)       nodal lines of a vibrating plate; was Research's
 *   guilloche     (spare)       the engraved rosette on a banknote, was About's for a day
 *   rule90        (spare)       a cellular automaton growing triangles; was About's
 *   halftone      writing       dots that swell along a diagonal wave
 *   schotter      services      order dissolving row by row (Georg Nees, 1968)
 *   ridges        bookshelf     stacked, occluding terrain lines
 *   julia         cross-border  contour lines of a Julia set's border
 *   penrose       guide         a tiling with five-fold symmetry, never repeating
 *   clifford      comparison    a strange attractor, 420,000 faint points
 */

export type PatternKind =
  | "lorenz"
  | "contours"
  | "harmonograph"
  | "voronoi"
  | "chladni"
  | "guilloche"
  | "rule90"
  | "halftone"
  | "schotter"
  | "ridges"
  | "julia"
  | "penrose"
  | "clifford";

/**
 * A pattern can be centred on something in the page instead of on its own
 * frame. "portrait" is the portrait card of a page opening (Masthead with
 * `plate`): where the card sits in that layout is worked out from the frame's
 * width, so the drawing stays behind it at every screen size. It has to follow
 * the layout in Masthead.tsx; if the card moves, change this too.
 */
export type PatternFocus = "portrait" | "edge";

function focusPoint(focus: PatternFocus | undefined, W: number, H: number): [number, number] | null {
  // "edge" is a plate in the page margin (PatternTrail), which is drawn facing
  // the page edge on its right-hand side: centre the figure there.
  if (focus === "edge") return [W * 0.72, H * 0.46];
  if (focus !== "portrait") return null;
  const rem = 16;
  const ratio = 1161 / 900;
  const edge = Math.min(W, 72 * rem); // the section's max-w-6xl
  if (W >= 1024) {
    // Two columns, the card at the bottom of the right one: pb-24, px-10.
    const inner = edge - 80;
    const w = Math.min(21 * rem, (inner - 32) * 0.325);
    return [(W + edge) / 2 - 40 - w / 2, H - 96 - (w * ratio) / 2];
  }
  // One column, the card under the text at the left.
  const pad = W >= 768 ? 40 : 24;
  const w = Math.min(19 * rem, W - 2 * pad);
  return [pad + w / 2, H - (W >= 768 ? 96 : 64) - (w * ratio) / 2];
}

/** The ink, as a CSS colour channel triple. */
export let INK = "31, 43, 39";
let PAPER = "#f6f5ef";

/**
 * The page's ink and paper for the theme now showing (lib/theme.ts). Set it
 * before a drawing is made; the drawings read it as they go.
 */
export function setPatternColours(ink: string, paper: string) {
  INK = ink;
  PAPER = paper;
}

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
function harmonograph(ctx: Ctx, W: number, H: number, seed: number, focus?: PatternFocus) {
  const r = rng(seed);
  // Seed 0 is the drawing from the redesign notes. Any other seed nudges the
  // frequencies and phases a little, which gives a different, related figure.
  const j = (amount: number) => (seed === 0 ? 0 : (r() - 0.5) * 2 * amount);
  const f = [2.01 + j(0.02), 3.0 + j(0.02), 3.0 + j(0.02), 2.0 + j(0.02)];
  const p = [j(1.5), 1 + j(1.5), 0.5 + j(1.5), j(1.5)];
  const d = [0.0042, 0.003, 0.003, 0.0042];
  const k = 0.62;
  const narrow = W < 768;
  const anchor = focusPoint(focus, W, H);
  const A = Math.min(W * (narrow ? 0.62 : 0.42), H * 0.5) * 0.77;
  const cx = anchor ? anchor[0] : W * (narrow ? 0.5 : 0.74);
  const cy = anchor ? anchor[1] : H * (narrow ? 0.3 : 0.42);

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

/**
 * The Lorenz attractor from a slant: the butterfly, as a few strands of thin
 * line. Each strand is a separate trajectory from its own start, so together
 * they fill out the two wings. It is the same system the homepage's scroll
 * journey flies through (lib/lorenz.ts), here as a flat drawing.
 */
/**
 * A strand of the Lorenz drawing as data: its points (x then y, in CSS pixels)
 * and the distance along it at each one. The drawing strokes them, and the
 * home page's moving points ride along the same ones (lib/pattern-flow.ts).
 */
export type Strand = { xy: Float32Array; arc: Float32Array };

const LORENZ_STRANDS = 5;
const LORENZ_CHUNK = 24;
/** Each strand's start, then 209 strokes of 24 steps. */
const LORENZ_POINTS = 1 + Math.ceil(5000 / LORENZ_CHUNK) * LORENZ_CHUNK;

/** The strands `lorenz` draws, for the same rectangle, seed and focus. */
export function lorenzStrands(
  W: number,
  H: number,
  seed: number,
  focus?: PatternFocus
): Strand[] {
  const r = rng(seed + 41);
  const narrow = W < 768;
  const anchor = focusPoint(focus, W, H);
  const cx = anchor ? anchor[0] : W * (narrow ? 0.5 : 0.72);
  const cy = anchor ? anchor[1] : H * (narrow ? 0.3 : 0.46);
  // Seen from a slant the attractor is about 54 wide and 52 tall.
  const s = Math.min(
    (W * (narrow ? 0.95 : 0.5)) / 54,
    (H * (anchor ? 0.9 : narrow ? 0.5 : 0.92)) / 52
  );
  const yaw = 0.45 + (r() - 0.5) * 0.5;
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);

  // One classical RK4 step of dx = 10(y-x), dy = x(28-z)-y, dz = xy-(8/3)z.
  const rk = (p: number[], h: number) => {
    const d = (x: number, y: number, z: number) => [10 * (y - x), x * (28 - z) - y, x * y - (8 / 3) * z];
    const a = d(p[0], p[1], p[2]);
    const b = d(p[0] + 0.5 * h * a[0], p[1] + 0.5 * h * a[1], p[2] + 0.5 * h * a[2]);
    const c = d(p[0] + 0.5 * h * b[0], p[1] + 0.5 * h * b[1], p[2] + 0.5 * h * b[2]);
    const e = d(p[0] + h * c[0], p[1] + h * c[1], p[2] + h * c[2]);
    for (let i = 0; i < 3; i++) p[i] += (h / 6) * (a[i] + 2 * b[i] + 2 * c[i] + e[i]);
  };
  const at = (p: number[]): Pt => [cx + s * (p[0] * cos + p[1] * sin), cy - s * (p[2] - 24)];

  const h = 0.006;
  const strands: Strand[] = [];
  for (let k = 0; k < LORENZ_STRANDS; k++) {
    const p = [(r() - 0.5) * 30, (r() - 0.5) * 36, 5 + r() * 40];
    for (let i = 0; i < 900; i++) rk(p, h);
    const xy = new Float32Array(LORENZ_POINTS * 2);
    const arc = new Float32Array(LORENZ_POINTS);
    [xy[0], xy[1]] = at(p);
    for (let i = 1; i < LORENZ_POINTS; i++) {
      rk(p, h);
      [xy[i * 2], xy[i * 2 + 1]] = at(p);
      arc[i] = arc[i - 1] + Math.hypot(xy[i * 2] - xy[i * 2 - 2], xy[i * 2 + 1] - xy[i * 2 - 1]);
    }
    strands.push({ xy, arc });
  }
  return strands;
}

function lorenz(ctx: Ctx, W: number, H: number, seed: number, focus?: PatternFocus) {
  ctx.lineWidth = 0.55;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = `rgba(${INK}, 0.3)`;
  for (const { xy } of lorenzStrands(W, H, seed, focus)) {
    for (let i = 0; i + 1 < LORENZ_POINTS; i += LORENZ_CHUNK) {
      ctx.beginPath();
      ctx.moveTo(xy[i * 2], xy[i * 2 + 1]);
      for (let j = 1; j <= LORENZ_CHUNK; j++) ctx.lineTo(xy[(i + j) * 2], xy[(i + j) * 2 + 1]);
      ctx.stroke();
    }
  }
}

/**
 * Contours: the isolines of a smooth, hilly field, with a stronger line every
 * fifth level, like a topographic map. Measured and calm. (Pattern B of the
 * first gallery.)
 */
function contours(ctx: Ctx, W: number, H: number, seed: number) {
  const n = noiseFn(11 + seed);
  const fbm = (x: number, y: number) => n(x, y) * 0.55 + n(x * 2, y * 2) * 0.28 + n(x * 4, y * 4) * 0.17;
  const levels: number[] = [];
  for (let l = 0.2; l < 0.85; l += 0.035) levels.push(l);
  ctx.lineWidth = 0.8;
  const cell = W * H > 700000 ? 6 : 5;
  iso(ctx, W, H, (x, y) => fbm(x / 150 + 3, y / 150 + 1), levels, cell, (k) => (k % 5 === 0 ? 0.8 : 0.42));
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

/**
 * Guilloche: the engraved rosette that frames a portrait on a banknote. Dozens
 * of closed, gently waved rings, each a little further round than the last, so
 * where they cross they weave a lattice no single ring draws. It is the same
 * engraver's craft as the portrait, so the two sit together.
 */
function guilloche(ctx: Ctx, W: number, H: number, seed: number, focus?: PatternFocus) {
  const at = focus === "portrait" ? focusPoint(focus, W, H) : null;
  const cx = at ? at[0] : W * 0.5;
  const cy = at ? at[1] : H * 0.5;
  // Seed 0 is the About page's rosette; other seeds change the lobe count and
  // how fast the weave turns, so each plate down the page is its own rosette.
  const lobes = [14, 11, 17, 9, 13][seed % 5];
  const turn = [0.19, 0.27, 0.15, 0.31, 0.22][seed % 5];
  // Behind a portrait it is a medallion, close round the card; on a plate of
  // its own it fills most of the frame.
  const R = at ? Math.min(215, H * 0.4) : Math.min(W, H) * 0.46;
  const rings = 54;
  const steps = 540;

  ctx.lineWidth = 0.5;
  ctx.lineJoin = "round";
  for (let m = 0; m < rings; m++) {
    const t = m / (rings - 1);
    // The rings swell and shrink about a middle radius, so the rosette has a
    // full body with a hollow heart rather than a disc of equal lines.
    const base = R * (0.46 + 0.5 * Math.sin(Math.PI * (0.18 + 0.64 * t)) ** 1.5);
    const amp = R * 0.085;
    const phase = m * turn;
    ctx.beginPath();
    for (let s = 0; s <= steps; s++) {
      const a = (s / steps) * Math.PI * 2;
      const r = base + amp * Math.sin(lobes * a + phase) + amp * 0.35 * Math.sin(2 * lobes * a - phase * 1.7);
      const x = cx + r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      if (s === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(${INK}, ${0.3 + 0.2 * Math.sin(Math.PI * t)})`;
    ctx.stroke();
  }
}

/** Clifford attractor: a strange attractor from 420,000 faint points. */
function clifford(ctx: Ctx, W: number, H: number, seed: number, focus?: PatternFocus) {
  // On a margin plate the attractor is drawn larger, with more points to keep
  // it as dense, so it fills the plate instead of sitting small in it. Nudging
  // the parameters a little, as the page opening does, can land on a thin,
  // faint attractor, so each plate takes a known good set instead.
  const edge = focus === "edge";
  const sets: [number, number, number, number][] = [
    [-1.4, 1.6, 1.0, 0.7],
    [1.6, -0.6, -1.2, 1.6],
    [1.7, 1.7, 0.6, 1.2],
    [1.5, -1.8, 1.6, 0.9],
    [-1.7, 1.3, -0.1, -1.21],
  ];
  const [a, b, c, d] = edge
    ? sets[seed % sets.length]
    : [-1.4 + seed * 0.04, 1.6, 1.0, 0.7 - seed * 0.02];
  const dens = new Float32Array(W * H);
  let x = 0.1;
  let y = 0.1;
  const at = focusPoint(focus, W, H);
  const sc = edge ? Math.max(W, H) / 4.4 : Math.min(W, H) / 5.2;
  const cx = at ? at[0] : W * 0.66;
  const cy = at ? at[1] : H * 0.5;
  for (let i = 0; i < (edge ? 900000 : 420000); i++) {
    const nx = Math.sin(a * y) + c * Math.cos(a * x);
    const ny = Math.sin(b * x) + d * Math.cos(b * y);
    x = nx;
    y = ny;
    if (i < 20) continue;
    const px = Math.floor(cx + x * sc);
    const py = Math.floor(cy + y * sc);
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
function ridges(ctx: Ctx, W: number, H: number, seed: number, focus?: PatternFocus) {
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
    // Each ridge hides the ones behind it. On a page opening that is a fill of
    // paper; on a margin plate the fill erases instead, so the page's own
    // paper, grid and panels show through the plate.
    if (focus === "edge") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "#000";
    } else {
      ctx.fillStyle = PAPER;
    }
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
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

const DRAW: Record<
  PatternKind,
  (ctx: Ctx, W: number, H: number, seed: number, focus?: PatternFocus) => void
> = {
  lorenz,
  contours,
  harmonograph,
  voronoi,
  chladni,
  guilloche,
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
  lorenz: 1,
  contours: 0.75,
  harmonograph: 1,
  voronoi: 0.6,
  chladni: 0.6,
  guilloche: 0.5,
  rule90: 0.6,
  halftone: 0.6,
  schotter: 0.6,
  ridges: 0.6,
  julia: 0.6,
  penrose: 0.6,
  clifford: 0.6,
};

/** Draws `kind` into a W x H (CSS pixel) area of an already-scaled context. */
export function drawPattern(
  ctx: Ctx,
  kind: PatternKind,
  W: number,
  H: number,
  seed = 0,
  focus?: PatternFocus
) {
  DRAW[kind](ctx, W, H, seed, focus);
}

/**
 * Which pattern runs down each page, by the first part of its address. It is
 * the same drawing as the page's opening (the `pattern` given to Masthead, or
 * the Lorenz butterfly on the home page), so keep the two in step. Blog posts take
 * the blog's.
 */
const PAGE_PATTERN: Record<string, PatternKind> = {
  "": "lorenz",
  about: "harmonograph",
  work: "voronoi",
  research: "contours",
  blog: "halftone",
  services: "schotter",
  bookshelf: "ridges",
  "cross-border-operations": "julia",
  "founders-office-guide": "penrose",
  "fractional-coo-vs-founders-office": "clifford",
};

export function patternForPath(pathname: string | null): PatternKind | null {
  const first = (pathname ?? "").split("/").filter(Boolean)[0] ?? "";
  return PAGE_PATTERN[first] ?? null;
}

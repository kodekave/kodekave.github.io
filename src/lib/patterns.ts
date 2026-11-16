/**
 * The background patterns, drawn on a canvas.
 *
 * Each is a pure function of a square size and a seed: it draws once, nothing
 * moves, and the same seed gives the same drawing. They are canvas, not SVG or
 * an image, on purpose: a large decorative image counts as the page's largest
 * paint and delays it, a canvas does not, and nothing extra is downloaded.
 *
 * The first is the harmonograph, the line a pair of damped pendulums would
 * draw. Two sine waves per axis, each slowly dying away:
 *
 *   x = A (sin(f1 t + p1) e^(-d1 t) + k sin(f2 t + p2) e^(-d2 t))
 *   y = A (sin(f3 t + p3) e^(-d3 t) + k sin(f4 t + p4) e^(-d4 t))
 */

export type PatternKind = "harmonograph";

/** The ink, as a CSS colour channel triple. */
const INK = "31, 43, 39";

/** A small seeded random, so a page's pattern is the same on every load. */
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function harmonograph(ctx: CanvasRenderingContext2D, size: number, seed: number) {
  const r = rng(seed);
  // Seed 0 is the drawing from the redesign notes. Any other seed nudges the
  // frequencies and phases a little, which gives a different, related figure.
  const j = (amount: number) => (seed === 0 ? 0 : (r() - 0.5) * 2 * amount);
  const f = [2.01 + j(0.02), 3.0 + j(0.02), 3.0 + j(0.02), 2.0 + j(0.02)];
  const p = [j(1.5), 1 + j(1.5), 0.5 + j(1.5), j(1.5)];
  const d = [0.0042, 0.003, 0.003, 0.0042];
  const k = 0.62;
  const A = (size / 2) * 0.6;
  const c = size / 2;

  const at = (t: number): [number, number] => [
    c +
      A *
        (Math.sin(f[0] * t + p[0]) * Math.exp(-d[0] * t) +
          k * Math.sin(f[1] * t + p[1]) * Math.exp(-d[1] * t)),
    c +
      A *
        (Math.sin(f[2] * t + p[2]) * Math.exp(-d[2] * t) +
          k * Math.sin(f[3] * t + p[3]) * Math.exp(-d[3] * t)),
  ];

  // One stroke per segment, so the line darkens where it crosses itself.
  ctx.lineWidth = Math.max(0.5, size / 1900);
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

const DRAW: Record<PatternKind, typeof harmonograph> = { harmonograph };

/** Clears the canvas and draws `kind` into its full (square) area. */
export function drawPattern(
  canvas: HTMLCanvasElement,
  kind: PatternKind,
  seed = 0
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  DRAW[kind](ctx, canvas.width, seed);
}

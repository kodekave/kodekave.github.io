/**
 * The elbow channel of the paper's tutorial case, as a wireframe in 3D.
 *
 * The case the paper runs (OpenFOAM's icoFoam elbow) is a flat channel with a
 * quarter-turn in it. A flat case is still a mesh one cell thick, so here the
 * channel is given some depth and drawn as the mesh it is: rings across the
 * flow at even steps, and rails along it. Brass points travel down it in lanes.
 * Nothing here draws anything; it makes the geometry and projects it, for the
 * phone on the research page (components/ResearchPhone.tsx), which draws it
 * live on a canvas and, with no script or reduced motion, as a still SVG.
 *
 * Units are those of the drawing's box (200 by 170).
 */

export type V3 = [number, number, number];

export const VIEW_W = 200;
export const VIEW_H = 170;

/** The straight run in, the quarter-turn about (100, 84), and the drop. */
const RUN_A = 94;
const RADIUS = 50;
const ARC = (Math.PI / 2) * RADIUS;
const RUN_B = 40;
/** Length of the centreline, inlet to outlet. */
export const LENGTH = RUN_A + ARC + RUN_B;

/** Half the channel's width across the flow, and its depth through the page. */
export const HALF_W = 21;
export const DEPTH = 20;

/** The middle of the channel's box in the plane, so the model is centred. */
const CX = 88.5;
const CY = 68.5;

/**
 * A point at arc length `s` along the channel, `d` across it (positive is the
 * outside of the bend) and `y` through its depth. x is along the page, z up.
 */
export function at(s: number, d: number, y: number): V3 {
  let px: number;
  let py: number;
  if (s <= RUN_A) {
    px = 6 + s;
    py = 34 - d;
  } else if (s <= RUN_A + ARC) {
    const a = (s - RUN_A) / RADIUS;
    px = 100 + (RADIUS + d) * Math.sin(a);
    py = 84 - (RADIUS + d) * Math.cos(a);
  } else {
    px = 150 + d;
    py = 84 + (s - RUN_A - ARC);
  }
  return [px - CX, y, CY - py];
}

export type Line = { pts: V3[]; edge: boolean };

function buildWire(): Line[] {
  const out: Line[] = [];
  // Rings across the flow: a rectangle of the channel's section at each step.
  const rings = 17;
  const corner: [number, number][] = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
    [-1, -1],
  ];
  for (let i = 0; i < rings; i++) {
    const s = (i / (rings - 1)) * LENGTH;
    out.push({
      pts: corner.map(([a, b]) => at(s, a * HALF_W, (b * DEPTH) / 2)),
      edge: i === 0 || i === rings - 1,
    });
  }
  // Rails along the flow, on the top and the bottom face of the channel.
  const steps = 72;
  for (const d of [-HALF_W, -HALF_W / 3, HALF_W / 3, HALF_W]) {
    for (const y of [-DEPTH / 2, DEPTH / 2]) {
      const pts: V3[] = [];
      for (let i = 0; i <= steps; i++) pts.push(at((i / steps) * LENGTH, d, y));
      out.push({ pts, edge: Math.abs(d) === HALF_W });
    }
  }
  return out;
}

/** The mesh lines, built once. */
export const WIRE: Line[] = buildWire();

/** Eight lanes of points: four across the channel, two through its depth. */
export const LANES = [-15, -5, 5, 15].flatMap((d, i) =>
  [-5, 5].map((y, j) => ({ d, y, phase: (i * 2 + j) * 0.53 }))
);
/** Points to a lane, and how fast they travel (units a second). */
export const COMETS = 5;
export const SPEED = 15;

/** Where on the centreline the k-th point of a lane is at time t (seconds). */
export function cometAt(lane: { phase: number }, k: number, t: number): number {
  const s = (k / COMETS) * LENGTH + lane.phase * 20 + t * SPEED;
  return ((s % LENGTH) + LENGTH) % LENGTH;
}

/** The view: resting angle, how far the camera sways either side, and tilt. */
export const REST_YAW = 0.62;
export const SWAY = 0.3;
export const PITCH = 0.42;
const FOCAL = 420;
const SCALE = 1.08;
/** The nearest and farthest depth the model reaches, to shade by distance. */
export const DEPTH_NEAR = -110;
export const DEPTH_FAR = 110;

export type P2 = { x: number; y: number; depth: number; k: number };

/**
 * Turns the model about the vertical by `yaw`, tilts the camera down by `pitch`
 * and projects with a mild perspective into the drawing's box. `k` is the
 * perspective scale at that point, for sizing a dot.
 */
export function project(p: V3, yaw: number, pitch = PITCH): P2 {
  const [X, Y, Z] = p;
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const x1 = X * cy - Y * sy;
  const y1 = X * sy + Y * cy;
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const up = Z * cp + y1 * sp;
  const depth = y1 * cp - Z * sp;
  const k = FOCAL / (FOCAL + depth);
  return {
    x: VIEW_W / 2 + x1 * k * SCALE,
    y: VIEW_H / 2 - up * k * SCALE,
    depth,
    k,
  };
}

/** 0 for the farthest point of the model, 1 for the nearest. */
export function nearness(depth: number): number {
  return Math.min(1, Math.max(0, (DEPTH_FAR - depth) / (DEPTH_FAR - DEPTH_NEAR)));
}

const f1 = (n: number) => n.toFixed(1);

/**
 * The still picture for the server and for reduced motion: the mesh at its
 * resting angle as two SVG path strings (the heavier edges, then the rest), and
 * the nearer lanes of points, one frozen frame.
 */
export function stillPicture(): {
  edge: string;
  inner: string;
  dots: { x: string; y: string; r: string }[];
} {
  let edge = "";
  let inner = "";
  for (const line of WIRE) {
    const d = line.pts
      .map((p, i) => {
        const q = project(p, REST_YAW);
        return `${i === 0 ? "M" : "L"}${f1(q.x)} ${f1(q.y)}`;
      })
      .join("");
    if (line.edge) edge += d;
    else inner += d;
  }
  const dots: { x: string; y: string; r: string }[] = [];
  for (const lane of LANES) {
    if (lane.y < 0) continue;
    for (let k = 0; k < COMETS; k++) {
      const q = project(at(cometAt(lane, k, 0), lane.d, lane.y), REST_YAW);
      dots.push({ x: f1(q.x), y: f1(q.y), r: f1(1.5 * q.k) });
    }
  }
  return { edge, inner, dots };
}

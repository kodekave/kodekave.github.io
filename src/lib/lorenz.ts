/**
 * The Lorenz attractor, as data for the homepage's scroll journey.
 *
 *   dx/dt = sigma (y - x)      dy/dt = x (rho - z) - y      dz/dt = x y - beta z
 *
 * with the classic sigma = 10, rho = 28, beta = 8/3 (the butterfly). Nothing
 * here touches the page: it integrates the equations, scatters the result into
 * a cloud of points, and hands back a camera path to fly along. The renderer
 * is in components/JourneyScene.tsx.
 *
 * Two layers of points share one buffer:
 *   - dust:  several trajectories from different starts, so the attractor
 *            reads as a volume and not as one line;
 *   - path:  the one trajectory the camera travels, dense enough to read as a
 *            curve, with each point's place along it (for the trail).
 * The head (the point the camera is chasing) is drawn separately.
 *
 * All coordinates are centred on the attractor and scaled so it sits inside
 * about +-1.4 units.
 */

const SIGMA = 10;
const RHO = 28;
const BETA = 8 / 3;

/** Scene units per Lorenz unit, and the z the attractor is centred on. */
const SCALE = 1 / 18;
const Z_CENTRE = RHO - 1;

/** Seconds of the path the camera actually travels, and a tail for look-ahead. */
export const PATH_TIME = 15;
const PAD_TIME = 3;
const TOTAL_TIME = PATH_TIME + PAD_TIME;
export const DT = 0.004;

/** Floats per vertex: x y z, along (0..1 of the path) or a random, kind. */
export const FLOATS = 5;

export type Cloud = {
  vertices: Float32Array;
  count: number;
  /** Camera and look-at positions, one xyz per sample, sampled every DT. */
  eye: Float32Array;
  look: Float32Array;
  /** The raw path, for the head. */
  path: Float32Array;
  samples: number;
  /** Samples that belong to the journey (the rest is look-ahead padding). */
  used: number;
  /** How many of the vertices are dust (they come first); the rest are the path. */
  dust: number;
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One classical RK4 step of the Lorenz system, in place on s = [x, y, z]. */
function rk4(s: number[], h: number) {
  const [x, y, z] = s;
  const k1x = SIGMA * (y - x);
  const k1y = x * (RHO - z) - y;
  const k1z = x * y - BETA * z;
  const x2 = x + 0.5 * h * k1x;
  const y2 = y + 0.5 * h * k1y;
  const z2 = z + 0.5 * h * k1z;
  const k2x = SIGMA * (y2 - x2);
  const k2y = x2 * (RHO - z2) - y2;
  const k2z = x2 * y2 - BETA * z2;
  const x3 = x + 0.5 * h * k2x;
  const y3 = y + 0.5 * h * k2y;
  const z3 = z + 0.5 * h * k2z;
  const k3x = SIGMA * (y3 - x3);
  const k3y = x3 * (RHO - z3) - y3;
  const k3z = x3 * y3 - BETA * z3;
  const x4 = x + h * k3x;
  const y4 = y + h * k3y;
  const z4 = z + h * k3z;
  const k4x = SIGMA * (y4 - x4);
  const k4y = x4 * (RHO - z4) - y4;
  const k4z = x4 * y4 - BETA * z4;
  s[0] = x + (h / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
  s[1] = y + (h / 6) * (k1y + 2 * k2y + 2 * k3y + k4y);
  s[2] = z + (h / 6) * (k1z + 2 * k2z + 2 * k3z + k4z);
}

/** A centred moving average of an xyz array, `radius` samples each side. */
function smooth(src: Float32Array, radius: number): Float32Array {
  const n = src.length / 3;
  const out = new Float32Array(src.length);
  const pre = new Float64Array((n + 1) * 3);
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < 3; c++) pre[(i + 1) * 3 + c] = pre[i * 3 + c] + src[i * 3 + c];
  }
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - radius);
    const b = Math.min(n - 1, i + radius);
    const len = b - a + 1;
    for (let c = 0; c < 3; c++) {
      out[i * 3 + c] = (pre[(b + 1) * 3 + c] - pre[a * 3 + c]) / len;
    }
  }
  return out;
}

/**
 * Build the cloud. `density` is 1 on a desktop and about half on a phone; it
 * scales the point counts only, so the shape is the same.
 */
export function buildCloud(density = 1): Cloud {
  const rand = mulberry32(20261117);

  // The camera's trajectory: settle onto the attractor, then record.
  const s = [-5.9, -7.2, 24.5];
  for (let i = 0; i < 1500; i++) rk4(s, DT);
  const samples = Math.round(TOTAL_TIME / DT);
  const used = Math.round(PATH_TIME / DT);
  const path = new Float32Array(samples * 3);
  for (let i = 0; i < samples; i++) {
    rk4(s, DT);
    path[i * 3] = s[0] * SCALE;
    path[i * 3 + 1] = s[1] * SCALE;
    path[i * 3 + 2] = (s[2] - Z_CENTRE) * SCALE;
  }

  // The camera rides a lightly smoothed copy of the path (so it sweeps round
  // each wing without the tight corkscrew) and looks at a more smoothed copy,
  // a little further on.
  const eye = smooth(path, Math.round(0.55 / DT));
  const lookRaw = smooth(path, Math.round(1.5 / DT));
  const lead = Math.round(1.1 / DT);
  const look = new Float32Array(samples * 3);
  for (let i = 0; i < samples; i++) {
    const j = Math.min(samples - 1, i + lead);
    look[i * 3] = lookRaw[j * 3];
    look[i * 3 + 1] = lookRaw[j * 3 + 1];
    look[i * 3 + 2] = lookRaw[j * 3 + 2];
  }

  // Dust: trajectories from scattered starts.
  const trajectories = 12;
  const perTrajectory = Math.round(7000 * density);
  const pathPoints = Math.round(20000 * density);
  const count = trajectories * perTrajectory + pathPoints;
  const vertices = new Float32Array(count * FLOATS);
  let v = 0;

  const t = [0, 0, 0];
  for (let k = 0; k < trajectories; k++) {
    t[0] = (rand() - 0.5) * 30;
    t[1] = (rand() - 0.5) * 36;
    t[2] = 5 + rand() * 40;
    for (let i = 0; i < 900; i++) rk4(t, DT);
    for (let i = 0; i < perTrajectory; i++) {
      for (let q = 0; q < 4; q++) rk4(t, DT * 1.1);
      vertices[v++] = t[0] * SCALE;
      vertices[v++] = t[1] * SCALE;
      vertices[v++] = (t[2] - Z_CENTRE) * SCALE;
      vertices[v++] = rand();
      vertices[v++] = 0;
    }
  }

  // The path itself, spread evenly across the whole recording.
  for (let i = 0; i < pathPoints; i++) {
    const idx = Math.floor((i / pathPoints) * samples);
    vertices[v++] = path[idx * 3];
    vertices[v++] = path[idx * 3 + 1];
    vertices[v++] = path[idx * 3 + 2];
    vertices[v++] = idx / samples;
    vertices[v++] = 1;
  }

  return { vertices, count, eye, look, path, samples, used, dust: trajectories * perTrajectory };
}

/**
 * Moves `n` evenly spread dust points to the front of the vertex buffer, and
 * returns how many it moved. Those are the points that can fly into the world
 * map (see JourneyScene), so the map can be drawn from the first `n` vertices
 * alone once the rest of the cloud has faded.
 */
export function pickMapPoints(cloud: Cloud, n: number): number {
  const v = cloud.vertices;
  const m = Math.min(n, cloud.dust);
  const tmp = new Float32Array(FLOATS);
  for (let k = 0; k < m; k++) {
    const s = Math.floor((k * cloud.dust) / m);
    if (s === k) continue;
    const a = k * FLOATS;
    const b = s * FLOATS;
    tmp.set(v.subarray(a, a + FLOATS));
    v.copyWithin(a, b, b + FLOATS);
    v.set(tmp, b);
  }
  return m;
}

/** Linear sample of an xyz array at a fractional index. */
export function sampleAt(arr: Float32Array, index: number, out: number[]) {
  const n = arr.length / 3;
  const f = Math.min(n - 1, Math.max(0, index));
  const i = Math.floor(f);
  const j = Math.min(n - 1, i + 1);
  const w = f - i;
  out[0] = arr[i * 3] * (1 - w) + arr[j * 3] * w;
  out[1] = arr[i * 3 + 1] * (1 - w) + arr[j * 3 + 1] * w;
  out[2] = arr[i * 3 + 2] * (1 - w) + arr[j * 3 + 2] * w;
}

/**
 * View-projection matrix (column-major, for WebGL) for an eye looking at a
 * target with z up. `out` is a 16-float array.
 */
export function viewProjection(
  out: Float32Array,
  eye: number[],
  target: number[],
  aspect: number,
  fovY: number,
  near = 0.015,
  far = 14
) {
  let fx = target[0] - eye[0];
  let fy = target[1] - eye[1];
  let fz = target[2] - eye[2];
  const fl = Math.hypot(fx, fy, fz) || 1;
  fx /= fl;
  fy /= fl;
  fz /= fl;

  // Right = forward x up. If we are looking straight up or down, borrow y.
  let ux = 0;
  let uy = 0;
  let uz = 1;
  if (Math.abs(fz) > 0.98) {
    uy = 1;
    uz = 0;
  }
  let rx = fy * uz - fz * uy;
  let ry = fz * ux - fx * uz;
  let rz = fx * uy - fy * ux;
  const rl = Math.hypot(rx, ry, rz) || 1;
  rx /= rl;
  ry /= rl;
  rz /= rl;
  // True up = right x forward.
  ux = ry * fz - rz * fy;
  uy = rz * fx - rx * fz;
  uz = rx * fy - ry * fx;

  const f = 1 / Math.tan(fovY / 2);
  const nf = 1 / (near - far);
  const ex = rx * eye[0] + ry * eye[1] + rz * eye[2];
  const ey = ux * eye[0] + uy * eye[1] + uz * eye[2];
  const ez = fx * eye[0] + fy * eye[1] + fz * eye[2];

  // proj * view, written out.
  out[0] = (f / aspect) * rx;
  out[4] = (f / aspect) * ry;
  out[8] = (f / aspect) * rz;
  out[12] = -(f / aspect) * ex;

  out[1] = f * ux;
  out[5] = f * uy;
  out[9] = f * uz;
  out[13] = -f * ey;

  out[2] = (far + near) * nf * -fx;
  out[6] = (far + near) * nf * -fy;
  out[10] = (far + near) * nf * -fz;
  out[14] = (far + near) * nf * ez + 2 * far * near * nf;

  out[3] = fx;
  out[7] = fy;
  out[11] = fz;
  out[15] = -ez;
}

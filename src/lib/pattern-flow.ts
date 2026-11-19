import { INK, type Strand } from "@/lib/patterns";

/**
 * Points that travel along the strands of a drawn pattern, so the home page's
 * butterfly behind the portrait is alive: a yellow point with a long tail, a
 * few smaller ones with short tails, and a scatter of specks, each riding one of
 * the strands that `lorenzStrands` drew (lib/patterns.ts), never leaving it.
 *
 * Each point goes by distance along its strand, at its own even pace, so the
 * Lorenz system's quick and slow stretches do not make it jerk. A strand is
 * long (about 30,000 px on a wide screen), so a point takes minutes to reach
 * the end; if it does, it fades out and comes back in at the start.
 *
 * The layer is a canvas of its own over the drawing. It draws only while it can
 * be seen: the tab is visible, the frame is on screen, and the opening that
 * holds it has not faded away (the scroll scene fades it as you leave the top).
 * Reduced motion never calls this.
 */

type Rider = {
  strand: number;
  /** Distance along the strand at time 0, in px. */
  start: number;
  /** px a second. */
  speed: number;
  /** Length of the tail, in px. 0 for a speck. */
  tail: number;
  kind: "lead" | "point" | "speck";
};

/** Fixed layout, so the page opens the same way each time. */
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const POINTS = 8;
const SPECKS = 34;
/** px from either end of a strand over which a point fades. */
const EDGE = 700;
const TAIL_BUCKETS = 6;

const smooth = (x: number) => {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
};

/** Index i with arc[i] <= d < arc[i + 1] (the last index when d is past the end). */
function indexAt(arc: Float32Array, d: number) {
  let lo = 0;
  let hi = arc.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (arc[mid] <= d) lo = mid;
    else hi = mid;
  }
  return lo;
}

const at: [number, number] = [0, 0];
/** The point d px along a strand, into `at`. */
function pointAt(s: Strand, d: number) {
  const i = indexAt(s.arc, d);
  const span = s.arc[i + 1] - s.arc[i] || 1;
  const k = Math.max(0, Math.min(1, (d - s.arc[i]) / span));
  at[0] = s.xy[i * 2] + (s.xy[i * 2 + 2] - s.xy[i * 2]) * k;
  at[1] = s.xy[i * 2 + 1] + (s.xy[i * 2 + 3] - s.xy[i * 2 + 1]) * k;
}

/**
 * Starts the points on `cv`, a canvas laid over a W x H (CSS pixels) frame
 * that `strands` were made for. `opening` is how visible the opening that holds
 * it is, from 0 to 1. Returns a function that stops it.
 */
export function startFlow(
  cv: HTMLCanvasElement,
  W: number,
  H: number,
  strands: Strand[],
  opts: { accent: string; opening: () => number }
): () => void {
  const ctx = cv.getContext("2d");
  if (!ctx || strands.length === 0) return () => {};

  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  cv.width = Math.round(W * dpr);
  cv.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // ----- who rides where
  const r = mulberry32(7);
  const n = strands.length;
  const riders: Rider[] = [];
  const along = (k: number) => strands[k].arc[strands[k].arc.length - 1];
  riders.push({ strand: 1 % n, start: along(1 % n) * 0.3, speed: 130, tail: 300, kind: "lead" });
  for (let i = 0; i < POINTS; i++) {
    const k = i % n;
    riders.push({
      strand: k,
      start: along(k) * (0.08 + 0.84 * r()),
      speed: 85 + 70 * r(),
      tail: 150 + 70 * r(),
      kind: "point",
    });
  }
  for (let i = 0; i < SPECKS; i++) {
    const k = Math.floor(r() * n);
    riders.push({
      strand: k,
      start: along(k) * (0.05 + 0.9 * r()),
      speed: 60 + 130 * r(),
      tail: 0,
      kind: "speck",
    });
  }

  // ----- drawing
  const ink = INK;
  const tailPts: number[] = [];

  function draw(t: number) {
    ctx!.clearRect(0, 0, W, H);
    for (const kind of ["speck", "point", "lead"] as const) {
      for (const p of riders) {
        if (p.kind !== kind) continue;
        const s = strands[p.strand];
        const L = s.arc[s.arc.length - 1];
        const d = (p.start + p.speed * t) % L;
        const env = smooth(d / EDGE) * smooth((L - d) / EDGE);
        if (env < 0.01) continue;

        if (p.tail > 0) {
          // The tail: samples back along the strand, older ones fainter.
          const back = Math.min(p.tail, d);
          const m = Math.max(TAIL_BUCKETS * 3, Math.ceil(back / 5));
          tailPts.length = 0;
          for (let j = 0; j <= m; j++) {
            pointAt(s, d - back + (back * j) / m);
            tailPts.push(at[0], at[1]);
          }
          const per = m / TAIL_BUCKETS;
          for (let b = 0; b < TAIL_BUCKETS; b++) {
            const a = Math.floor(b * per);
            const z = Math.min(m, Math.ceil((b + 1) * per));
            const age = (b + 1) / TAIL_BUCKETS;
            ctx!.beginPath();
            ctx!.moveTo(tailPts[a * 2], tailPts[a * 2 + 1]);
            for (let j = a + 1; j <= z; j++) ctx!.lineTo(tailPts[j * 2], tailPts[j * 2 + 1]);
            const base = p.kind === "lead" ? 0.72 : 0.62;
            ctx!.strokeStyle = `rgba(${ink},${(base * Math.pow(age, 1.6) * env).toFixed(3)})`;
            ctx!.lineWidth = (p.kind === "lead" ? 1.0 : 0.7) + (p.kind === "lead" ? 0.9 : 0.6) * age;
            ctx!.stroke();
          }
        }

        pointAt(s, d);
        const x = at[0];
        const y = at[1];
        if (p.kind === "speck") {
          ctx!.fillStyle = `rgba(${ink},${(0.5 * env).toFixed(3)})`;
          ctx!.beginPath();
          ctx!.arc(x, y, 1.25, 0, Math.PI * 2);
          ctx!.fill();
        } else if (p.kind === "point") {
          ctx!.fillStyle = `rgba(${ink},${(0.82 * env).toFixed(3)})`;
          ctx!.beginPath();
          ctx!.arc(x, y, 2.5, 0, Math.PI * 2);
          ctx!.fill();
        } else {
          // The yellow point: a soft halo, the dot, a ring.
          const halo = ctx!.createRadialGradient(x, y, 0, x, y, 30);
          halo.addColorStop(0, opts.accent);
          halo.addColorStop(1, "rgba(247,239,150,0)");
          ctx!.globalAlpha = 0.5 * env;
          ctx!.fillStyle = halo;
          ctx!.beginPath();
          ctx!.arc(x, y, 30, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.globalAlpha = env;
          ctx!.fillStyle = opts.accent;
          ctx!.beginPath();
          ctx!.arc(x, y, 7, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.lineWidth = 1.8;
          ctx!.strokeStyle = `rgba(${ink},0.9)`;
          ctx!.stroke();
          ctx!.globalAlpha = 1;
        }
      }
    }
  }

  // ----- the loop, only while it can be seen
  let raf = 0;
  let last = 0;
  let time = 0;
  let onScreen = true;
  let settle = 0;

  const live = () => !document.hidden && onScreen && opts.opening() > 0.02;
  const mark = (on: boolean) => {
    cv.dataset.flow = on ? "on" : "off";
  };

  const frame = (now: number) => {
    raf = 0;
    if (!live()) {
      last = 0;
      mark(false);
      return;
    }
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    time += dt;
    draw(time);
    raf = requestAnimationFrame(frame);
  };
  const start = () => {
    if (raf || !live()) return;
    mark(true);
    raf = requestAnimationFrame(frame);
  };

  // The scene sets the opening's opacity a frame after the scroll, so on a
  // scroll the check waits until the scroll has settled.
  const onScroll = () => {
    window.clearTimeout(settle);
    settle = window.setTimeout(start, 140);
  };

  const io = new IntersectionObserver(
    ([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) start();
    },
    { threshold: 0 }
  );
  io.observe(cv);
  document.addEventListener("visibilitychange", start);
  window.addEventListener("scroll", onScroll, { passive: true });

  // It arrives with a fade rather than a pop.
  cv.style.opacity = "0";
  cv.style.transition = "opacity 1.6s ease";
  draw(0);
  requestAnimationFrame(() => requestAnimationFrame(() => (cv.style.opacity = "1")));
  start();

  return () => {
    if (raf) cancelAnimationFrame(raf);
    window.clearTimeout(settle);
    io.disconnect();
    document.removeEventListener("visibilitychange", start);
    window.removeEventListener("scroll", onScroll);
    ctx.clearRect(0, 0, W, H);
    mark(false);
  };
}

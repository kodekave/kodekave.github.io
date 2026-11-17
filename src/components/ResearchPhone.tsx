"use client";

import { useLayoutEffect, useRef } from "react";
import {
  COMETS,
  LANES,
  LENGTH,
  REST_YAW,
  SWAY,
  VIEW_H,
  VIEW_W,
  WIRE,
  at,
  cometAt,
  nearness,
  project,
  stillPicture,
} from "@/lib/elbow3d";

/**
 * The commands the paper has you type, in order: the three setup commands from
 * its section 3.1, then the solver it runs. Nothing here is output from a run;
 * it is the procedure, typed out.
 */
const COMMANDS = ["pkg update", "pkg upgrade", "termux-setup-storage", "icoFoam"];

/** Each command types once the one before it has finished. */
const TIMED = (() => {
  let t = 0.4;
  return COMMANDS.map((c) => {
    const delay = t;
    t += c.length * 0.055 + 0.4;
    return { c, delay };
  });
})();

/** The mesh at rest, drawn by the server. See lib/elbow3d.ts. */
const STILL = stillPicture();

type Ink = { wire: string; dot: string };
type Dot = { x: number; y: number; depth: number; r: number; a: number };

/** The mesh is stroked in this many strengths, so a frame is a few strokes. */
const STRENGTHS = 5;
const segments: number[][] = Array.from({ length: STRENGTHS }, () => []);
const dots: Dot[] = [];

/**
 * One frame of the elbow at time t: the mesh as lines that fade with distance,
 * then the points travelling down it, far ones first. The camera sways slowly
 * either side of its resting angle, so the channel is seen turning in depth.
 */
function drawElbow(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, ink: Ink) {
  const k = w / VIEW_W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.clearRect(0, 0, VIEW_W, h / k);
  const yaw = REST_YAW + SWAY * Math.sin(t * 0.45);

  for (const g of segments) g.length = 0;
  for (const line of WIRE) {
    const weight = line.edge ? 1 : 0.62;
    let prev = project(line.pts[0], yaw);
    for (let i = 1; i < line.pts.length; i++) {
      const cur = project(line.pts[i], yaw);
      const near = nearness((prev.depth + cur.depth) / 2) * weight;
      segments[Math.min(STRENGTHS - 1, Math.floor(near * STRENGTHS))].push(
        prev.x,
        prev.y,
        cur.x,
        cur.y
      );
      prev = cur;
    }
  }
  ctx.lineWidth = 0.7;
  ctx.lineJoin = "round";
  ctx.strokeStyle = ink.wire;
  for (let b = 0; b < STRENGTHS; b++) {
    const g = segments[b];
    if (!g.length) continue;
    ctx.globalAlpha = 0.08 + 0.55 * ((b + 0.5) / STRENGTHS);
    ctx.beginPath();
    for (let i = 0; i < g.length; i += 4) {
      ctx.moveTo(g[i], g[i + 1]);
      ctx.lineTo(g[i + 2], g[i + 3]);
    }
    ctx.stroke();
  }

  // Each point leaves a short fading tail behind it; all fade in at the inlet
  // and out at the outlet.
  dots.length = 0;
  for (const lane of LANES) {
    for (let c = 0; c < COMETS; c++) {
      const head = cometAt(lane, c, t);
      const edge = Math.min(1, head / 12, (LENGTH - head) / 12);
      for (let j = 0; j < 3; j++) {
        const s = head - j * 3.6;
        if (s < 0) break;
        const p = project(at(s, lane.d, lane.y), yaw);
        dots.push({
          x: p.x,
          y: p.y,
          depth: p.depth,
          r: (1.4 - j * 0.34) * p.k,
          a: edge * (1 - j * 0.32) * (0.45 + 0.55 * nearness(p.depth)),
        });
      }
    }
  }
  dots.sort((a, b) => b.depth - a.depth);
  ctx.fillStyle = ink.dot;
  for (const d of dots) {
    ctx.globalAlpha = d.a;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/**
 * The paper's subject drawn as an object: a phone with a terminal typing the
 * procedure, the elbow channel the paper simulates drawn as a 3D wireframe mesh
 * with brass points flowing down it, and a simulated-time counter stepping 0 to
 * 10 seconds, the length of the run in the paper.
 *
 * It is a schematic, and says so to a screen reader. The typing and the counter
 * are CSS; the channel is a canvas that turns slowly and runs only while the
 * phone is on screen. With no script, or with reduced motion, nothing runs and
 * the channel is the still SVG the server drew: the finished picture.
 */
export default function ResearchPhone({ courant }: { courant: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  // Armed before paint so nothing flashes, and started on view. The server
  // HTML carries neither attribute, so with no JavaScript it is the finished
  // picture.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    el.dataset.armed = "true";

    const cv = canvas.current;
    const ctx = cv?.getContext("2d") ?? null;
    let ink: Ink = { wire: "#f6f5ef", dot: "#f7ef96" };
    let clock = 0;
    let last = 0;
    let raf = 0;
    let running = false;
    const paint = () => {
      if (cv && ctx) drawElbow(ctx, cv.width, cv.height, clock, ink);
    };
    const fit = () => {
      if (!cv) return;
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.max(1, Math.round(r.width * dpr));
      cv.height = Math.max(1, Math.round(r.height * dpr));
      paint();
    };

    let resize: ResizeObserver | undefined;
    if (cv && ctx) {
      const cs = getComputedStyle(el);
      ink = {
        wire: cs.getPropertyValue("--color-paper").trim() || ink.wire,
        dot: cs.getPropertyValue("--color-brass").trim() || ink.dot,
      };
      // From here the canvas replaces the still SVG (see .phone-elbow).
      el.dataset.canvas = "true";
      fit();
      resize = new ResizeObserver(fit);
      resize.observe(cv);
    }

    const tick = (now: number) => {
      raf = 0;
      if (!running) return;
      clock += Math.min(0.1, (now - last) / 1000);
      last = now;
      paint();
      raf = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.live = "true";
          if (ctx && !running) {
            running = true;
            last = performance.now();
            raf = requestAnimationFrame(tick);
          }
        } else {
          running = false;
          if (raf) cancelAnimationFrame(raf);
          raf = 0;
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      observer.disconnect();
      resize?.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className="phone"
      role="img"
      aria-label="A schematic of a phone running OpenFOAM in a terminal, with streamlines running through an elbow-shaped channel."
    >
      <span className="phone-notch" aria-hidden="true" />
      <div className="phone-screen" aria-hidden="true">
        <div className="phone-term">
          {TIMED.map(({ c, delay }) => (
            <p key={c} className="flex gap-2">
              <span className="cmd">$</span>
              <span>
                <span
                  className="phone-type"
                  style={
                    { "--n": c.length, "--d": `${delay}s` } as React.CSSProperties
                  }
                >
                  {c}
                </span>
              </span>
            </p>
          ))}
        </div>

        <div className="phone-elbow">
          <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} focusable="false">
            <path className="wire" d={STILL.inner} />
            <path className="wire wire-edge" d={STILL.edge} />
            {STILL.dots.map((d, i) => (
              <circle key={i} className="wire-dot" cx={d.x} cy={d.y} r={d.r} />
            ))}
          </svg>
          <canvas ref={canvas} />
        </div>

        <p className="phone-readout">
          <span>
            t = <span className="phone-clock" /> s
          </span>
          <span>Co &lt; {courant}</span>
        </p>
      </div>
    </div>
  );
}

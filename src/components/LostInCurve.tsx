"use client";

import { useEffect, useRef } from "react";
import { onTheme } from "@/lib/theme";

/**
 * The 404's picture: a live Lorenz butterfly with a yellow point wandering it,
 * leaving a long ribbon behind. Five faint points start almost on top of it,
 * and drift apart as the system amplifies the smallest difference, which is the
 * whole idea of the butterfly effect and, here, of being lost. After a while
 * they fade and the five start again from the same spot.
 *
 * The view turns slowly round the attractor and leans a little with the pointer.
 * It is decoration only (the canvas is hidden from assistive technology), draws
 * only while on screen, and with reduced motion it is one still frame.
 */

const SIGMA = 10;
const RHO = 28;
const BETA = 8 / 3;
const DT = 0.004;
const STEPS_PER_FRAME = 2;

/** Points kept in the main ribbon and in each follower's short trail. */
const RIBBON = 2600;
const TRAIL = 260;
const FOLLOWERS = 5;
/** Points of the faint cloud the whole attractor is drawn from. */
const DUST = 2800;
/** Seconds before the followers fade and start again. */
const CYCLE = 38;
const STARS = 64;

type State = [number, number, number];

function rk4(s: State, h: number) {
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

/** A ring of xyz points: the newest is at `head`, the oldest just after it. */
class Ribbon {
  xyz: Float32Array;
  size: number;
  head = 0;
  filled = 0;
  constructor(size: number) {
    this.size = size;
    this.xyz = new Float32Array(size * 3);
  }
  push(s: State) {
    this.head = (this.head + 1) % this.size;
    this.xyz[this.head * 3] = s[0];
    this.xyz[this.head * 3 + 1] = s[1];
    this.xyz[this.head * 3 + 2] = s[2];
    if (this.filled < this.size) this.filled++;
  }
  clear() {
    this.filled = 0;
  }
}

export default function LostInCurve() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const css = getComputedStyle(document.documentElement);
    const inkRaw = css.getPropertyValue("--color-ink").trim() || "#0e2419";
    const brass = css.getPropertyValue("--color-brass").trim() || "#e9ff3e";
    // "#rrggbb" to an "r,g,b" string so alphas can be set per stroke.
    const rgb = (hex: string) => {
      const h = hex.replace("#", "");
      const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
      return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
    };
    let ink = rgb(inkRaw);
    // The theme can change while the curve runs: the next frame is in the new ink.
    const offTheme = onTheme(() => {
      ink = rgb(getComputedStyle(document.documentElement).getPropertyValue("--color-ink").trim() || inkRaw);
    });

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ----- the system
    const lead: State = [(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, 20 + Math.random() * 10];
    for (let i = 0; i < 1500; i++) rk4(lead, DT);
    const ribbon = new Ribbon(RIBBON);
    const followers = Array.from({ length: FOLLOWERS }, () => ({
      s: [0, 0, 0] as State,
      trail: new Ribbon(TRAIL),
    }));
    let cycleStart = 0;
    const seedFollowers = () => {
      for (const f of followers) {
        f.s = [
          lead[0] + (Math.random() - 0.5) * 0.9,
          lead[1] + (Math.random() - 0.5) * 0.9,
          lead[2] + (Math.random() - 0.5) * 0.9,
        ];
        f.trail.clear();
      }
    };
    seedFollowers();

    // The faint cloud: a long run of the system from another start, so both
    // wings are always there for the point to be lost in.
    const dust = new Float32Array(DUST * 3);
    {
      const d: State = [3 + Math.random(), -4 + Math.random(), 18 + Math.random() * 6];
      for (let i = 0; i < 1500; i++) rk4(d, DT);
      for (let i = 0; i < DUST; i++) {
        for (let q = 0; q < 3; q++) rk4(d, DT * 3);
        dust[i * 3] = d[0];
        dust[i * 3 + 1] = d[1];
        dust[i * 3 + 2] = d[2];
      }
    }

    const stars = Array.from({ length: STARS }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.6 + Math.random() * 1.1,
      p: Math.random() * Math.PI * 2,
      f: 0.25 + Math.random() * 0.6,
    }));

    // ----- the view
    let w = 0;
    let h = 0;
    let dpr = 1;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = r.width;
      h = r.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) draw(0, 0);
    });
    ro.observe(canvas);

    let tiltX = 0;
    let tiltY = 0;
    let wantX = 0;
    let wantY = 0;
    const onMove = (e: PointerEvent) => {
      wantX = (e.clientX / window.innerWidth - 0.5) * 2;
      wantY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    if (!reduce) window.addEventListener("pointermove", onMove, { passive: true });

    /** Project a Lorenz point for the current turn; returns [x, y, depth 0..1]. */
    const out: [number, number, number] = [0, 0, 0];
    let cosT = 1;
    let sinT = 0;
    let cosP = 1;
    let sinP = 0;
    let cx = 0;
    let cy = 0;
    let scale = 1;
    const project = (x: number, y: number, z: number) => {
      const xr = x * cosT - y * sinT;
      const yr = x * sinT + y * cosT;
      const zc = z - 25;
      const depth = yr / 30;
      const persp = 1 / (1 - depth * 0.28);
      out[0] = cx + xr * scale * persp;
      out[1] = cy - (zc * cosP + yr * sinP) * scale * persp;
      out[2] = Math.max(0, Math.min(1, 0.5 - depth * 0.5));
    };

    const strokeRibbon = (r: Ribbon, base: number, width: number, fade: number) => {
      const n = r.filled;
      if (n < 2) return;
      const buckets = 28;
      const per = Math.ceil(n / buckets);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (let b = 0; b < buckets; b++) {
        const a = b * per;
        const z = Math.min(n - 1, a + per);
        if (a >= n - 1) break;
        // Index 0 is the oldest point; older buckets are fainter.
        const age = (a + per / 2) / n;
        let depthSum = 0;
        ctx.beginPath();
        for (let i = a; i <= z; i++) {
          const k = (r.head - (n - 1 - i) + r.size * 2) % r.size;
          project(r.xyz[k * 3], r.xyz[k * 3 + 1], r.xyz[k * 3 + 2]);
          if (i === a) ctx.moveTo(out[0], out[1]);
          else ctx.lineTo(out[0], out[1]);
          depthSum += out[2];
        }
        const depth = depthSum / (z - a + 1);
        const alpha = base * Math.pow(age, 1.6) * (0.45 + 0.55 * depth) * fade;
        ctx.strokeStyle = `rgba(${ink},${alpha.toFixed(3)})`;
        ctx.lineWidth = width * (0.6 + 0.6 * age);
        ctx.stroke();
      }
    };

    function draw(t: number, cycleFade: number) {
      ctx!.clearRect(0, 0, w, h);

      // The frame: the butterfly sits to the right on a wide screen, below the
      // words on a narrow one.
      const wide = w >= 760;
      cx = wide ? w * 0.66 : w * 0.5;
      cy = wide ? h * 0.52 : h * 0.74;
      scale = Math.min(wide ? w * 0.62 : w * 1.0, wide ? h * 1.12 : h * 0.5) / 46;

      const turn = 0.35 + t * 0.07 + tiltX * 0.35;
      const lean = 0.2 + tiltY * 0.14;
      cosT = Math.cos(turn);
      sinT = Math.sin(turn);
      cosP = Math.cos(lean);
      sinP = Math.sin(lean);

      // A few faint stars, so there is a sky.
      for (const s of stars) {
        const a = 0.06 + 0.16 * (0.5 + 0.5 * Math.sin(t * s.f + s.p));
        ctx!.fillStyle = `rgba(${ink},${a.toFixed(3)})`;
        ctx!.beginPath();
        ctx!.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      // The cloud: the whole butterfly as a haze of points, nearer ones darker.
      ctx!.fillStyle = `rgb(${ink})`;
      for (let i = 0; i < DUST; i++) {
        project(dust[i * 3], dust[i * 3 + 1], dust[i * 3 + 2]);
        ctx!.globalAlpha = 0.04 + 0.16 * out[2];
        ctx!.fillRect(out[0], out[1], 1.2, 1.2);
      }
      ctx!.globalAlpha = 1;

      // The long ribbon the yellow point leaves.
      strokeRibbon(ribbon, 0.62, 1.5, 1);

      // The five that started beside it and have wandered off.
      for (const f of followers) {
        strokeRibbon(f.trail, 0.3, 1, cycleFade);
        if (f.trail.filled > 0) {
          const k = f.trail.head;
          project(f.trail.xyz[k * 3], f.trail.xyz[k * 3 + 1], f.trail.xyz[k * 3 + 2]);
          ctx!.fillStyle = `rgba(${ink},${(0.55 * cycleFade).toFixed(3)})`;
          ctx!.beginPath();
          ctx!.arc(out[0], out[1], 2.3, 0, Math.PI * 2);
          ctx!.fill();
        }
      }

      // The yellow point: a halo, the dot, a ring.
      if (ribbon.filled > 0) {
        const k = ribbon.head;
        project(ribbon.xyz[k * 3], ribbon.xyz[k * 3 + 1], ribbon.xyz[k * 3 + 2]);
        const halo = ctx!.createRadialGradient(out[0], out[1], 0, out[0], out[1], 34);
        halo.addColorStop(0, `${brass}`);
        halo.addColorStop(1, "rgba(247,239,150,0)");
        ctx!.globalAlpha = 0.55;
        ctx!.fillStyle = halo;
        ctx!.beginPath();
        ctx!.arc(out[0], out[1], 34, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.globalAlpha = 1;
        ctx!.fillStyle = brass;
        ctx!.beginPath();
        ctx!.arc(out[0], out[1], 8, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.lineWidth = 2;
        ctx!.strokeStyle = `rgba(${ink},0.92)`;
        ctx!.stroke();
      }
    }

    const advance = (n: number) => {
      for (let i = 0; i < n; i++) {
        rk4(lead, DT);
        ribbon.push(lead);
        for (const f of followers) {
          rk4(f.s, DT);
          f.trail.push(f.s);
        }
      }
    };

    // ----- still frame (reduced motion): the ribbon a while on, no animation
    if (reduce) {
      advance(RIBBON);
      draw(0, 1);
      return () => ro.disconnect();
    }

    // It arrives with a fade rather than a pop.
    canvas.style.opacity = "0";
    canvas.style.transition = "opacity 1.6s ease";
    requestAnimationFrame(() => requestAnimationFrame(() => (canvas.style.opacity = "1")));

    // ----- the loop, only while the canvas is on screen and the tab is visible
    let raf = 0;
    let onScreen = true;
    let t0 = 0;
    const frame = (now: number) => {
      raf = 0;
      if (!onScreen || document.hidden) return;
      if (!t0) t0 = now;
      const t = (now - t0) / 1000;

      tiltX += (wantX - tiltX) * 0.04;
      tiltY += (wantY - tiltY) * 0.04;

      advance(STEPS_PER_FRAME);

      // The followers fade out at the end of a cycle and start again from where
      // the lead is then.
      const into = t - cycleStart;
      let fade = 1;
      if (into > CYCLE - 2) fade = Math.max(0, (CYCLE - into) / 2);
      if (into > CYCLE) {
        cycleStart = t;
        seedFollowers();
        fade = 0;
      } else if (into < 1.5) {
        fade = Math.min(fade, into / 1.5);
      }
      draw(t, fade);
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (!raf && onScreen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    // A head start, so the ribbon is already long when the page arrives.
    advance(RIBBON);
    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen) start();
      },
      { threshold: 0 }
    );
    io.observe(canvas);
    document.addEventListener("visibilitychange", start);
    start();

    return () => {
      offTheme();
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", start);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="lost-curve pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}

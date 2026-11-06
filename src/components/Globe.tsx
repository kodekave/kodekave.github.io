"use client";

import { useEffect, useRef, useState } from "react";
import { LAND } from "@/lib/globe-dots";
import RouteMap from "./RouteMap";

type Pin = {
  code: string;
  label: string;
  place: string;
  years: string;
  lat: number;
  lon: number;
};
type Vec = [number, number, number];
/** What the page's buttons can ask the running globe to do. */
type Controls = { focus: (i: number) => void; setPaused: (p: boolean) => void };

const RAD = Math.PI / 180;
const MIN_TILT = -40 * RAD;
const MAX_TILT = 70 * RAD;

/** Latitude / longitude in degrees to a point on the unit sphere. */
function vec(lat: number, lon: number): Vec {
  const la = lat * RAD;
  const lo = lon * RAD;
  return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)];
}

/** Shortest signed difference between two longitudes, in degrees. */
function wrap(deg: number): number {
  return ((((deg + 180) % 360) + 360) % 360) - 180;
}

/** `from` moved `t` of the way toward `to`, both `#rrggbb`; else `from`. */
function mix(from: string, to: string, t: number): string {
  const ok = /^#[0-9a-f]{6}$/i;
  if (!ok.test(from) || !ok.test(to)) return from;
  const ch = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  const c = [0, 1, 2].map((i) => Math.round(ch(from, i) + (ch(to, i) - ch(from, i)) * t));
  return `rgb(${c.join(",")})`;
}

/**
 * A dot-matrix Earth with a brass pin for each place worked, joined in the
 * order they were worked by bright arcs with a point of light travelling along
 * each one.
 *
 * It turns slowly on its own. Drag it to turn it by hand (it coasts when you
 * let go, and takes up its own turning again after a moment); click a pin, or
 * a place in the strip beneath, and it swings round to face that place. A
 * Pause button stops all of its motion.
 *
 * Drawn on a plain 2D canvas from a pre-computed list of land dots (see
 * scripts/generate-globe-dots.mjs), so there is no map library and no
 * geometry on the page. It only animates while it is on screen and the tab is
 * visible. With reduced motion it never turns by itself: it moves only when
 * you move it, and jumps rather than swings.
 */
export default function Globe({
  pins,
  label,
}: {
  pins: Pin[];
  label: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controls = useRef<Controls>({ focus() {}, setPaused() {} });
  const [selected, setSelected] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const root = getComputedStyle(document.documentElement);
    const token = (name: string, fallback: string) =>
      root.getPropertyValue(name).trim() || fallback;
    const ink = token("--color-ink", "#0e2a22");
    const paper = token("--color-paper", "#eeeadf");
    const brass = token("--color-brass", "#bc9660");
    const brassLight = mix(brass, paper, 0.38);
    const mono = token("--font-mono-stack", "monospace");

    const land: Vec[] = [];
    for (let i = 0; i < LAND.length; i += 2) {
      land.push(vec(LAND[i] / 10, LAND[i + 1] / 10));
    }

    // Graticule: a meridian every 30 degrees and a parallel every 30.
    const lines: Vec[][] = [];
    for (let lon = -180; lon < 180; lon += 30) {
      const line: Vec[] = [];
      for (let lat = -80; lat <= 80; lat += 4) line.push(vec(lat, lon));
      lines.push(line);
    }
    for (const lat of [-60, -30, 0, 30, 60]) {
      const line: Vec[] = [];
      for (let lon = -180; lon <= 180; lon += 6) line.push(vec(lat, lon));
      lines.push(line);
    }

    // Great-circle arcs between consecutive pins, lifted off the surface by
    // more the farther they travel.
    const points = pins.map((p) => vec(p.lat, p.lon));
    const ARC_STEPS = 64;
    const arcs: Vec[][] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const [a, b] = [points[i], points[i + 1]];
      const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
      const angle = Math.acos(dot);
      const lift = 0.07 + 0.12 * (angle / Math.PI);
      const arc: Vec[] = [];
      for (let s = 0; s <= ARC_STEPS; s++) {
        const t = s / ARC_STEPS;
        const k1 = Math.sin((1 - t) * angle) / Math.sin(angle);
        const k2 = Math.sin(t * angle) / Math.sin(angle);
        const r = 1 + lift * Math.sin(Math.PI * t);
        arc.push([
          (a[0] * k1 + b[0] * k2) * r,
          (a[1] * k1 + b[1] * k2) * r,
          (a[2] * k1 + b[2] * k2) * r,
        ]);
      }
      arcs.push(arc);
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const SPEED = 7; // degrees of longitude per second

    // View state.
    let centerLon = 42;
    let tilt = 22 * RAD;
    let lonVel = 0; // coasting speed after a drag, degrees per second
    let target: { lon: number; tilt: number } | null = null;
    let paused = false;
    let idleUntil = 0; // auto-turning resumes after this time
    let resume = 0; // ramps 0 to 1 so auto-turning eases back in
    let hover = -1;
    let chosen = -1;

    // Pointer state.
    let dragging = false;
    let travelled = 0;
    let downAt = 0;
    let lastX = 0;
    let lastY = 0;
    let lastT = 0;

    // Frame state.
    let size = 0;
    let rafId = 0;
    let onScreen = false;
    let lastTime = 0;
    let clock = 0;
    const hits: { i: number; x: number; y: number }[] = [];
    const buckets: number[][] = [[], [], [], []];
    const ALPHA = [0.16, 0.34, 0.6, 0.92];

    function resize() {
      if (!canvas || !ctx) return;
      size = canvas.clientWidth;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      if (!ctx || size === 0) return;
      const u = Math.max(0.85, size / 360); // line weights scale with the globe
      const R = size * 0.42;
      const cx = size / 2;
      const cy = size / 2;
      const a = -centerLon * RAD;
      const cosA = Math.cos(a);
      const sinA = Math.sin(a);
      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);

      // Rotate a point to the view, returning [x, y, depth] in unit-sphere
      // terms; depth > 0 faces the viewer.
      const view = (v: Vec): Vec => {
        const x1 = v[0] * cosA + v[2] * sinA;
        const z1 = -v[0] * sinA + v[2] * cosA;
        return [x1, v[1] * cosT - z1 * sinT, v[1] * sinT + z1 * cosT];
      };

      ctx.clearRect(0, 0, size, size);

      // The sphere, its rim, and a faint outer ring.
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = brass;
      ctx.globalAlpha = 0.55;
      ctx.stroke();
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.045, 0, Math.PI * 2);
      ctx.stroke();

      // Graticule.
      ctx.globalAlpha = 0.13;
      ctx.strokeStyle = paper;
      ctx.lineWidth = 0.7;
      for (const line of lines) {
        ctx.beginPath();
        let pen = false;
        for (const p of line) {
          const [x, y, z] = view(p);
          if (z <= 0) {
            pen = false;
            continue;
          }
          if (pen) ctx.lineTo(cx + x * R, cy - y * R);
          else ctx.moveTo(cx + x * R, cy - y * R);
          pen = true;
        }
        ctx.stroke();
      }

      // Land, in four depth bands so the limb falls away into the dark.
      for (const b of buckets) b.length = 0;
      for (const p of land) {
        const [x, y, z] = view(p);
        if (z <= 0.02) continue;
        buckets[Math.min(3, Math.floor(z * 4))].push(cx + x * R, cy - y * R, z);
      }
      ctx.fillStyle = paper;
      const base = size / 150;
      buckets.forEach((b, band) => {
        ctx.globalAlpha = ALPHA[band];
        ctx.beginPath();
        for (let i = 0; i < b.length; i += 3) {
          const s = base * (0.6 + 0.5 * b[i + 2]);
          ctx.rect(b[i] - s / 2, b[i + 1] - s / 2, s, s);
        }
        ctx.fill();
      });

      // The arcs: a wide soft glow, then a bright dashed line whose dashes
      // run in the direction of travel, then a bead of light moving along it.
      const trace = () => {
        for (const arc of arcs) {
          ctx.beginPath();
          let pen = false;
          for (const p of arc) {
            const [x, y, z] = view(p);
            if (z <= 0.04) {
              pen = false;
              continue;
            }
            if (pen) ctx.lineTo(cx + x * R, cy - y * R);
            else ctx.moveTo(cx + x * R, cy - y * R);
            pen = true;
          }
          ctx.stroke();
        }
      };
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = brass;
      ctx.globalAlpha = 0.2;
      ctx.lineWidth = 7 * u;
      trace();
      ctx.strokeStyle = brassLight;
      ctx.globalAlpha = 1;
      ctx.lineWidth = 2.2 * u;
      ctx.setLineDash([7 * u, 5 * u]);
      ctx.lineDashOffset = -clock * 22 * u;
      trace();
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;
      ctx.lineCap = "butt";

      if (!reduceMotion && !paused) {
        arcs.forEach((arc, i) => {
          const t = (clock * 0.16 + i * 0.31) % 1;
          const [x, y, z] = view(arc[Math.round(t * ARC_STEPS)]);
          if (z <= 0.1) return;
          const px = cx + x * R;
          const py = cy - y * R;
          ctx.fillStyle = brassLight;
          ctx.globalAlpha = 0.3;
          ctx.beginPath();
          ctx.arc(px, py, 7 * u, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.arc(px, py, 3 * u, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Pins, each with a slow ring and its label; the one under the pointer
      // or chosen gets its years and a backing plate.
      hits.length = 0;
      ctx.font = `11px ${mono}`;
      ctx.textBaseline = "middle";
      pins.forEach((pin, i) => {
        const [x, y, z] = view(points[i]);
        if (z <= 0.06) return;
        const px = cx + x * R;
        const py = cy - y * R;
        const fade = Math.min(1, z * 2.4);
        const active = i === hover || i === chosen;
        hits.push({ i, x: px, y: py });

        const phase = reduceMotion || paused ? 0.35 : (clock * 0.55 + i * 0.27) % 1;
        ctx.globalAlpha = (1 - phase) * 0.75 * fade;
        ctx.strokeStyle = brass;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(px, py, 5 + phase * 16, 0, Math.PI * 2);
        ctx.stroke();

        ctx.globalAlpha = fade;
        if (active) {
          ctx.strokeStyle = brassLight;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(px, py, 11, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = ink;
        ctx.fillRect(px - 6, py - 6, 12, 12);
        ctx.fillStyle = active ? brassLight : brass;
        ctx.fillRect(px - 4, py - 4, 8, 8);

        const text = active
          ? `${pin.place.toUpperCase()}  ${pin.years}`
          : pin.place.toUpperCase();
        const flip = px > cx + R * 0.3;
        const tx = px + (flip ? -14 : 14);
        const width = ctx.measureText(text).width;
        if (active) {
          const bx = flip ? tx - width - 6 : tx - 6;
          ctx.fillStyle = ink;
          ctx.globalAlpha = 0.9 * fade;
          ctx.fillRect(bx, py - 10, width + 12, 20);
          ctx.strokeStyle = brass;
          ctx.lineWidth = 1;
          ctx.strokeRect(bx + 0.5, py - 9.5, width + 11, 19);
          ctx.globalAlpha = fade;
        }
        ctx.fillStyle = paper;
        ctx.textAlign = flip ? "right" : "left";
        ctx.fillText(text, tx, py);
      });
      ctx.globalAlpha = 1;
    }

    function tick(now: number) {
      rafId = 0;
      const dt = lastTime ? Math.min(0.05, (now - lastTime) / 1000) : 0;
      lastTime = now;
      if (!paused && !reduceMotion) clock += dt;

      let moving = false;
      if (target) {
        // Swinging round to a chosen place.
        const dLon = wrap(target.lon - centerLon);
        const dTilt = target.tilt - tilt;
        const k = 1 - Math.exp(-dt * 5.5);
        centerLon = wrap(centerLon + dLon * k);
        tilt += dTilt * k;
        moving = true;
        if (Math.abs(dLon) < 0.15 && Math.abs(dTilt) < 0.002) {
          centerLon = target.lon;
          tilt = target.tilt;
          target = null;
          idleUntil = now + 5000;
        }
        resume = 0;
      } else if (dragging) {
        resume = 0;
      } else {
        if (Math.abs(lonVel) > 0.6) {
          // Coasting after a drag.
          centerLon = wrap(centerLon + lonVel * dt);
          lonVel *= Math.exp(-dt * 2.8);
          moving = true;
        } else {
          lonVel = 0;
        }
        if (!reduceMotion && !paused && now > idleUntil) {
          resume = Math.min(1, resume + dt * 0.8);
          centerLon = wrap(centerLon - SPEED * resume * dt);
        }
      }

      draw();
      const animating = (!reduceMotion && !paused) || moving || dragging;
      if (animating && onScreen && !document.hidden) {
        rafId = requestAnimationFrame(tick);
      }
    }

    /** Draw again soon: needed for anything that is not a running animation. */
    function kick() {
      if (rafId || !onScreen || document.hidden) return;
      lastTime = 0;
      rafId = requestAnimationFrame(tick);
    }

    function pinAt(e: PointerEvent): number {
      const box = canvas!.getBoundingClientRect();
      const x = e.clientX - box.left;
      const y = e.clientY - box.top;
      let best = -1;
      let bestD = 18 * 18;
      for (const h of hits) {
        const d = (h.x - x) ** 2 + (h.y - y) ** 2;
        if (d < bestD) {
          bestD = d;
          best = h.i;
        }
      }
      return best;
    }

    function focus(i: number) {
      const pin = pins[i];
      if (!pin) return;
      chosen = i;
      setSelected(i);
      lonVel = 0;
      const to = {
        lon: pin.lon,
        tilt: Math.max(MIN_TILT, Math.min(MAX_TILT, pin.lat * 0.6 * RAD)),
      };
      if (reduceMotion) {
        centerLon = to.lon;
        tilt = to.tilt;
        target = null;
      } else {
        target = to;
        idleUntil = Infinity; // until the swing ends
      }
      kick();
    }
    controls.current = {
      focus,
      setPaused: (p: boolean) => {
        paused = p;
        if (!p) idleUntil = performance.now() + 800;
        kick();
      },
    };

    function release() {
      dragging = false;
      canvas!.style.cursor = hover >= 0 ? "pointer" : "grab";
    }

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      dragging = true;
      travelled = 0;
      downAt = performance.now();
      lastX = e.clientX;
      lastY = e.clientY;
      lastT = downAt;
      lonVel = 0;
      target = null;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = "grabbing";
      kick();
    };
    const onMove = (e: PointerEvent) => {
      if (dragging) {
        const R = size * 0.42;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        const now = performance.now();
        centerLon = wrap(centerLon - dx / R / RAD);
        // Vertical drag tilts the globe, with a mouse; on touch it is left to
        // scroll the page.
        if (e.pointerType === "mouse") {
          tilt = Math.max(MIN_TILT, Math.min(MAX_TILT, tilt + dy / R));
        }
        travelled += Math.abs(dx) + Math.abs(dy);
        const seconds = Math.max(8, now - lastT) / 1000;
        const speed = Math.max(-260, Math.min(260, -(dx / R / RAD) / seconds));
        lonVel = lonVel * 0.6 + speed * 0.4;
        lastX = e.clientX;
        lastY = e.clientY;
        lastT = now;
        if (travelled > 4 && chosen >= 0) {
          chosen = -1;
          setSelected(null);
        }
        kick();
      } else if (e.pointerType === "mouse") {
        const h = pinAt(e);
        if (h !== hover) {
          hover = h;
          canvas.style.cursor = h >= 0 ? "pointer" : "grab";
          kick();
        }
      }
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      const wasClick = travelled < 5 && performance.now() - downAt < 450;
      release();
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
      if (wasClick) {
        lonVel = 0;
        const h = pinAt(e);
        if (h >= 0) focus(h);
      } else {
        // Let go while still moving: coast, then take up turning again.
        if (reduceMotion) lonVel = 0;
        idleUntil = performance.now() + 2500;
      }
      kick();
    };
    const onCancel = () => {
      release();
      lonVel = 0;
      idleUntil = performance.now() + 2500;
      kick();
    };
    const onLeave = () => {
      if (hover !== -1) {
        hover = -1;
        if (!dragging) canvas.style.cursor = "grab";
        kick();
      }
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onCancel);
    canvas.addEventListener("pointerleave", onLeave);

    resize();
    draw();

    const sizeObserver = new ResizeObserver(() => {
      resize();
      draw();
    });
    sizeObserver.observe(canvas);

    const viewObserver = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen) kick();
      },
      { threshold: 0.05 }
    );
    viewObserver.observe(canvas);

    const onVisibility = () => {
      if (!document.hidden) kick();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(rafId);
      sizeObserver.disconnect();
      viewObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onCancel);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [pins]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={label}
        className="globe-canvas mx-auto block aspect-square w-full max-w-[480px]"
      />
      <div className="mt-3 flex items-center justify-between gap-4">
        <p className="label text-ink-faint">
          Drag to turn
          <span className="hidden sm:inline"> · choose a place</span>
        </p>
        <button
          type="button"
          aria-pressed={paused}
          aria-label={paused ? "Resume the globe turning" : "Pause the globe turning"}
          onClick={() => {
            const next = !paused;
            setPaused(next);
            controls.current.setPaused(next);
          }}
          className="label link-rule whitespace-nowrap text-ink-soft hover:text-ink motion-reduce:hidden"
        >
          {paused ? "Resume" : "Pause"}
        </button>
      </div>
      <div className="mt-8">
        <RouteMap
          selected={selected}
          onSelect={(i) => controls.current.focus(i)}
        />
      </div>
    </div>
  );
}

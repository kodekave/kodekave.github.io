"use client";

import { useEffect, useRef } from "react";
import { LAND } from "@/lib/globe-dots";

type Pin = { code: string; place: string; lat: number; lon: number };
type Vec = [number, number, number];

const RAD = Math.PI / 180;

/** Latitude / longitude in degrees to a point on the unit sphere. */
function vec(lat: number, lon: number): Vec {
  const la = lat * RAD;
  const lo = lon * RAD;
  return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)];
}

/**
 * A dot-matrix Earth with a brass pin for each place worked, joined in the
 * order they were worked by arcs lifted off the surface.
 *
 * Drawn on a plain 2D canvas from a pre-computed list of land dots (see
 * scripts/generate-globe-dots.mjs), so there is no map library and no
 * geometry on the page. It turns slowly on its own and does nothing with the
 * pointer. It only runs while it is on screen and the tab is visible, and with
 * reduced motion it is a single still frame.
 */
export default function Globe({
  pins,
  label,
}: {
  pins: Pin[];
  label: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    const arcs: Vec[][] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const [a, b] = [points[i], points[i + 1]];
      const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
      const angle = Math.acos(dot);
      const lift = 0.05 + 0.1 * (angle / Math.PI);
      const arc: Vec[] = [];
      for (let s = 0; s <= 56; s++) {
        const t = s / 56;
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

    const TILT = 22 * RAD;
    const START_LON = 42;
    const SPEED = 7; // degrees of longitude per second
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let size = 0;
    let dpr = 1;
    let rafId = 0;
    let onScreen = false;
    let lastTime = 0;
    let centerLon = START_LON;
    let clock = 0;

    const buckets: number[][] = [[], [], [], []];
    const ALPHA = [0.16, 0.34, 0.6, 0.92];

    function resize() {
      if (!canvas || !ctx) return;
      size = canvas.clientWidth;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      if (!ctx || size === 0) return;
      const R = size * 0.42;
      const cx = size / 2;
      const cy = size / 2;
      const a = -centerLon * RAD;
      const cosA = Math.cos(a);
      const sinA = Math.sin(a);
      const cosT = Math.cos(TILT);
      const sinT = Math.sin(TILT);

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

      // Arcs between the places, in the order they were worked.
      ctx.strokeStyle = brass;
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = 0.9;
      ctx.setLineDash([4, 3]);
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
      ctx.setLineDash([]);

      // Pins, each with a slow ring and its label.
      ctx.font = `11px ${mono}`;
      ctx.textBaseline = "middle";
      pins.forEach((pin, i) => {
        const [x, y, z] = view(points[i]);
        if (z <= 0.06) return;
        const px = cx + x * R;
        const py = cy - y * R;
        const fade = Math.min(1, z * 2.4);

        const phase = reduceMotion ? 0.35 : (clock * 0.55 + i * 0.27) % 1;
        ctx.globalAlpha = (1 - phase) * 0.7 * fade;
        ctx.strokeStyle = brass;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(px, py, 4 + phase * 15, 0, Math.PI * 2);
        ctx.stroke();

        ctx.globalAlpha = fade;
        ctx.fillStyle = ink;
        ctx.fillRect(px - 5, py - 5, 10, 10);
        ctx.fillStyle = brass;
        ctx.fillRect(px - 3.5, py - 3.5, 7, 7);

        const flip = px > cx + R * 0.3;
        ctx.fillStyle = paper;
        ctx.textAlign = flip ? "right" : "left";
        ctx.fillText(pin.place.toUpperCase(), px + (flip ? -12 : 12), py);
      });
      ctx.globalAlpha = 1;
    }

    function tick(now: number) {
      rafId = 0;
      if (!onScreen || document.hidden) return;
      const dt = lastTime ? Math.min(0.1, (now - lastTime) / 1000) : 0;
      lastTime = now;
      clock += dt;
      centerLon -= SPEED * dt; // the surface moves west to east
      draw();
      rafId = requestAnimationFrame(tick);
    }

    function start() {
      if (reduceMotion || rafId || !onScreen) return;
      lastTime = 0;
      rafId = requestAnimationFrame(tick);
    }

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
        if (onScreen) start();
      },
      { threshold: 0.05 }
    );
    viewObserver.observe(canvas);

    const onVisibility = () => {
      if (!document.hidden) start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(rafId);
      sizeObserver.disconnect();
      viewObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [pins]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={label}
      className="mx-auto block aspect-square w-full max-w-[480px]"
    />
  );
}

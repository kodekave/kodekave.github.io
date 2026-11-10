"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MAP_GRID } from "@/lib/map-grid";

/** One stop on a place's timeline: a year, what happened, and where to read more. */
export type Station = {
  year: string;
  title: string;
  role?: string;
  period?: string;
  category?: string;
  current?: boolean;
  href?: string;
  hrefLabel?: string;
};

export type AtlasPin = {
  code: string;
  label: string;
  place: string;
  years: string;
  lat: number;
  lon: number;
  /** Country-level rather than a named city: shown to the nearest degree. */
  approx?: boolean;
  /** What happened here, oldest first. Shown under the map when selected. */
  stations: Station[];
};

type Api = { focus: (i: number) => void; setPaused: (p: boolean) => void };

const { cols: COLS, rows: ROWS, step: STEP, latTop: LAT_TOP, lonLeft: LON_LEFT } =
  MAP_GRID;

/** The band of latitudes on show. Everything worked is in the north. */
const LAT_SHOWN_TOP = 76;
const LAT_SHOWN_BOTTOM = -42;
const ROW_FROM = Math.round((LAT_TOP - LAT_SHOWN_TOP) / STEP);
const ROW_TO = Math.min(ROWS, Math.round((LAT_TOP - LAT_SHOWN_BOTTOM) / STEP));
const SHOWN_ROWS = ROW_TO - ROW_FROM;

/** Drift speed in grid columns per second: a full lap takes about a minute and a half. */
const DRIFT = 2.6;
/** How long the sweep takes to cross the screen, and how far its glow trails. */
const SWEEP_MS = 9000;
const SWEEP_TAIL = 150;

const colOf = (lon: number) => (lon - LON_LEFT) / STEP;
const rowOf = (lat: number) => (LAT_TOP - lat) / STEP - ROW_FROM;
const mod = (n: number, m: number) => ((n % m) + m) % m;
const wrapDeg = (d: number) => mod(d + 180, 360) - 180;

function decode(): Uint8Array {
  const bin = atob(MAP_GRID.bits);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** `from` moved `t` of the way toward `to`, both `#rrggbb`. */
function mix(from: string, to: string, t: number): string {
  const ch = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  const c = [0, 1, 2].map((i) => Math.round(ch(from, i) + (ch(to, i) - ch(from, i)) * t));
  return `rgb(${c.join(",")})`;
}

export function formatCoord(lat: number, lon: number, approx = false): string {
  const d = approx ? 0 : 1;
  const la = `${Math.abs(lat).toFixed(d)}°${lat >= 0 ? "N" : "S"}`;
  const lo = `${Math.abs(lon).toFixed(d)}°${lon >= 0 ? "E" : "W"}`;
  return `${approx ? "≈" : ""}${la} ${lo}`;
}

/**
 * A flat world map built from square lamps, drifting sideways like the
 * message board in a departures hall. A graticule marks every 15 degrees, a
 * bright sweep crosses it every few seconds, and a pin sits on each place
 * worked, joined in the order they were worked by dashed arcs with a point of
 * light travelling along each.
 *
 * Drag it to scrub; it coasts, then takes up its drift again. Hover for a
 * coordinate readout. Click a pin, or a place in the list beneath, and the
 * map slides to centre it. The list is the accessible version of the map, and
 * the Pause button stops all of the movement.
 *
 * Drawn on a plain 2D canvas from a ~3 KB land bitmap (see
 * scripts/generate-map-grid.mjs): no map library, no geometry on the page. It
 * only animates while on screen and the tab is visible. With reduced motion
 * it never drifts or sweeps; it moves only when you move it.
 */
export default function Atlas({
  pins,
  label,
}: {
  pins: AtlasPin[];
  label: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const api = useRef<Api | null>(null);
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!wrap || !canvas || !ctx || pins.length === 0) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const bits = decode();
    const style = getComputedStyle(wrap);
    const read = (name: string, fallback: string) => {
      const v = style.getPropertyValue(name).trim();
      return /^#[0-9a-f]{6}$/i.test(v) ? v : fallback;
    };
    const INK = read("--color-ink", "#0e2a22");
    const PAPER = read("--color-paper", "#eeeadf");
    const BRASS = read("--color-brass", "#bc9660");
    const mono = getComputedStyle(canvas).fontFamily || "monospace";

    const land = [
      mix(INK, PAPER, 0.36),
      mix(mix(INK, PAPER, 0.36), BRASS, 0.4),
      mix(mix(INK, PAPER, 0.36), BRASS, 0.75),
      mix(BRASS, PAPER, 0.4),
    ];
    const brassA = (a: number) => {
      const c = mix(INK, BRASS, 1).replace("rgb(", "").replace(")", "");
      return `rgba(${c},${a})`;
    };
    const paperA = (a: number) => {
      const c = mix(INK, PAPER, 1).replace("rgb(", "").replace(")", "");
      return `rgba(${c},${a})`;
    };
    const inkA = (a: number) => {
      const c = mix(INK, INK, 0).replace("rgb(", "").replace(")", "");
      return `rgba(${c},${a})`;
    };

    let W = 0;
    let H = 0;
    let cell = 7;
    let vis = 0;
    let off = 0;
    let sized = false;
    let vel = 0;
    let dragging = false;
    let lastX = 0;
    let lastT = 0;
    let moved = 0;
    let idleUntil = 0;
    let target: number | null = null;
    let userPaused = false;
    let sel = 0;
    let pointer: { x: number; y: number } | null = null;
    let running = false;
    let onScreen = false;
    let raf = 0;
    const t0 = performance.now();
    let prev = t0;

    function resize() {
      const w = Math.round(wrap!.getBoundingClientRect().width);
      if (w < 10) return;
      W = w;
      cell = Math.min(7, Math.max(3.4, W / 170));
      H = Math.round(SHOWN_ROWS * cell);
      vis = W / cell;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(W * dpr);
      canvas!.height = Math.round(H * dpr);
      canvas!.style.height = `${H}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!sized) {
        // Open on the Atlantic and Indian Ocean, so London and the
        // subcontinent are both on the first screen.
        off = colOf(34) - vis / 2;
        sized = true;
      }
      redraw();
    }

    /** Pixel position of a column on the lap, with the lap repeated. */
    const screenX = (u: number) => mod(u - off, COLS) * cell;

    function label2(text: string, x: number, y: number, align: CanvasTextAlign, color: string, size = 10.5) {
      ctx!.font = `400 ${size}px ${mono}`;
      ctx!.textAlign = align;
      ctx!.fillStyle = color;
      ctx!.fillText(text, x, y);
    }

    function draw(now: number) {
      if (W === 0) return;
      const c = ctx!;
      c.clearRect(0, 0, W, H);
      c.textBaseline = "alphabetic";
      const sweeping = !reduce && !userPaused;
      const sweepX = sweeping ? (((now - t0) / SWEEP_MS) % 1) * (W + SWEEP_TAIL) : -1e9;

      // Graticule: every 15 degrees of latitude, every 30 of longitude.
      c.lineWidth = 1;
      for (let lat = 60; lat >= -30; lat -= 15) {
        const y = Math.round(rowOf(lat) * cell) + 0.5;
        c.strokeStyle = paperA(lat === 0 ? 0.22 : 0.07);
        c.setLineDash(lat === 0 ? [3, 5] : []);
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(W, y);
        c.stroke();
        label2(`${Math.abs(lat)}°${lat > 0 ? "N" : lat < 0 ? "S" : ""}`, 6, y - 4, "left", paperA(0.38), 9.5);
      }
      c.setLineDash([]);
      for (let lon = -180; lon < 180; lon += 30) {
        const x = Math.round(screenX(colOf(lon))) + 0.5;
        if (x > W) continue;
        c.strokeStyle = paperA(0.07);
        c.beginPath();
        c.moveTo(x, 0);
        c.lineTo(x, H);
        c.stroke();
        const l = Math.abs(lon);
        label2(`${String(l).padStart(3, "0")}°${lon < 0 ? "W" : lon > 0 ? "E" : ""}`, x + 5, 12, "left", paperA(0.38), 9.5);
      }

      // Land: one square lamp per grid cell, brightened under the sweep.
      const size = cell * 0.74;
      const pad = (cell - size) / 2;
      const c0 = Math.floor(off);
      const c1 = Math.ceil(off + vis) + 1;
      let level = -1;
      for (let col = c0; col <= c1; col++) {
        const x = (col - off) * cell;
        let lv = 0;
        if (sweeping) {
          const d = sweepX - x;
          if (d >= 0 && d < SWEEP_TAIL) lv = d < SWEEP_TAIL * 0.1 ? 3 : d < SWEEP_TAIL * 0.4 ? 2 : 1;
        }
        const cm = mod(col, COLS);
        for (let r = ROW_FROM; r < ROW_TO; r++) {
          const i = r * COLS + cm;
          if (!((bits[i >> 3] >> (i & 7)) & 1)) continue;
          if (lv !== level) {
            c.fillStyle = land[lv];
            level = lv;
          }
          c.fillRect(x + pad, (r - ROW_FROM) * cell + pad, size, size);
        }
      }

      if (sweeping && sweepX > 0 && sweepX < W) {
        c.strokeStyle = brassA(0.5);
        c.beginPath();
        c.moveTo(Math.round(sweepX) + 0.5, 0);
        c.lineTo(Math.round(sweepX) + 0.5, H);
        c.stroke();
      }

      // Arcs between the places, in the order they were worked.
      const worldW = COLS * cell;
      for (let i = 0; i < pins.length - 1; i++) {
        const a = pins[i];
        const b = pins[i + 1];
        const dl = wrapDeg(b.lon - a.lon) / STEP;
        const ya = rowOf(a.lat) * cell;
        const yb = rowOf(b.lat) * cell;
        const span = Math.abs(dl) * cell;
        const lift = Math.min(120, span * 0.22 + 18);
        for (const k of [0, -1]) {
          const xs = screenX(colOf(a.lon)) + k * worldW;
          const xe = xs + dl * cell;
          if (Math.max(xs, xe) < -20 || Math.min(xs, xe) > W + 20) continue;
          const pt = (t: number): [number, number] => [
            xs + (xe - xs) * t,
            ya + (yb - ya) * t - Math.sin(Math.PI * t) * lift,
          ];
          const path = () => {
            c.beginPath();
            for (let s = 0; s <= 56; s++) {
              const [x, y] = pt(s / 56);
              if (s === 0) c.moveTo(x, y);
              else c.lineTo(x, y);
            }
          };
          c.setLineDash([]);
          c.lineWidth = 5;
          c.strokeStyle = brassA(0.1);
          path();
          c.stroke();
          c.lineWidth = 1.25;
          c.strokeStyle = mix(BRASS, PAPER, 0.35);
          c.setLineDash([5, 5]);
          c.lineDashOffset = reduce ? 0 : -((now - t0) / 40);
          path();
          c.stroke();
          c.setLineDash([]);
          if (!reduce && !userPaused) {
            const [bx, by] = pt((((now - t0) / 3400 + i * 0.3) % 1));
            c.fillStyle = brassA(0.25);
            c.beginPath();
            c.arc(bx, by, 7, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = mix(BRASS, PAPER, 0.7);
            c.beginPath();
            c.arc(bx, by, 2.4, 0, Math.PI * 2);
            c.fill();
          }
        }
      }
      c.lineWidth = 1;

      // Pins and their labels.
      pins.forEach((p, i) => {
        const y = rowOf(p.lat) * cell;
        for (const k of [0, -1]) {
          const x = screenX(colOf(p.lon)) + k * worldW;
          if (x < -230 || x > W + 14) continue;
          const isSel = i === sel;

          if (!reduce && !userPaused) {
            const ph = ((now - t0) / 1800 + i * 0.23) % 1;
            c.strokeStyle = brassA((1 - ph) * 0.55);
            c.beginPath();
            c.arc(x, y, 5 + ph * 17, 0, Math.PI * 2);
            c.stroke();
          }
          c.fillStyle = BRASS;
          c.fillRect(Math.round(x) - 3.5, Math.round(y) - 3.5, 7, 7);
          c.strokeStyle = PAPER;
          c.strokeRect(Math.round(x) - 5.5, Math.round(y) - 5.5, 11, 11);

          if (isSel) {
            c.strokeStyle = brassA(0.9);
            const q = 13;
            const d = 4;
            for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
              c.beginPath();
              c.moveTo(x + sx * q, y + sy * (q - d));
              c.lineTo(x + sx * q, y + sy * q);
              c.lineTo(x + sx * (q - d), y + sy * q);
              c.stroke();
            }
          }

          const name = p.place.toUpperCase();
          const coord = formatCoord(p.lat, p.lon, p.approx);
          c.font = `500 11.5px ${mono}`;
          const w = Math.max(c.measureText(name).width, c.measureText(coord).width * 0.92) + 14;
          const left = x + 20 + w > W;
          const bx = left ? x - 18 - w : x + 18;
          c.fillStyle = inkA(0.82);
          c.fillRect(bx, y - 17, w, 34);
          c.strokeStyle = paperA(isSel ? 0.5 : 0.22);
          c.strokeRect(Math.round(bx) + 0.5, Math.round(y) - 16.5, Math.round(w), 33);
          c.strokeStyle = paperA(0.3);
          c.beginPath();
          c.moveTo(left ? x - 8 : x + 8, y);
          c.lineTo(left ? bx + w : bx, y);
          c.stroke();
          label2(name, bx + 7, y - 3, "left", PAPER, 11.5);
          label2(coord, bx + 7, y + 11, "left", mix(BRASS, PAPER, 0.15), 10);
        }
      });

      // Cursor readout.
      if (pointer && !dragging) {
        const { x, y } = pointer;
        c.strokeStyle = paperA(0.35);
        c.setLineDash([2, 4]);
        c.beginPath();
        c.moveTo(x + 0.5, 0);
        c.lineTo(x + 0.5, H);
        c.moveTo(0, y + 0.5);
        c.lineTo(W, y + 0.5);
        c.stroke();
        c.setLineDash([]);
        const lon = wrapDeg(LON_LEFT + (off + x / cell) * STEP);
        const lat = LAT_TOP - (y / cell + ROW_FROM) * STEP;
        const text = formatCoord(lat, lon).replace("°N", "°N ").replace("°S", "°S ");
        c.font = `400 10.5px ${mono}`;
        const tw = c.measureText(text).width + 12;
        const tx = x + 12 + tw > W ? x - 12 - tw : x + 12;
        const ty = y + 12 + 20 > H ? y - 32 : y + 12;
        c.fillStyle = inkA(0.85);
        c.fillRect(tx, ty, tw, 20);
        label2(text, tx + 6, ty + 14, "left", PAPER, 10.5);
      }
    }

    function redraw() {
      if (!running) draw(performance.now());
    }

    function step(dt: number, now: number) {
      if (dragging) return;
      if (target !== null) {
        const d = target - off;
        if (Math.abs(d) < 0.03) {
          off = target;
          target = null;
        } else {
          off += d * Math.min(1, dt * 4.5);
        }
        return;
      }
      if (Math.abs(vel) > 0.05) {
        off += vel * dt;
        vel *= Math.pow(0.04, dt);
      } else if (!reduce && !userPaused && now >= idleUntil) {
        off += DRIFT * dt;
      }
    }

    function frame(now: number) {
      if (!running) return;
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      step(dt, now);
      draw(now);
      raf = requestAnimationFrame(frame);
    }

    function sync() {
      const should = onScreen && !document.hidden && !reduce;
      if (should && !running) {
        running = true;
        prev = performance.now();
        raf = requestAnimationFrame(frame);
      } else if (!should && running) {
        running = false;
        cancelAnimationFrame(raf);
        draw(performance.now());
      }
    }

    function focus(i: number) {
      const p = pins[i];
      if (!p) return;
      sel = i;
      setSelected(i);
      let t = colOf(p.lon) - vis / 2;
      t += Math.round((off - t) / COLS) * COLS;
      vel = 0;
      if (reduce) {
        off = t;
        target = null;
        redraw();
      } else {
        target = t;
        idleUntil = performance.now() + 4500;
      }
    }

    api.current = {
      focus,
      setPaused: (p) => {
        userPaused = p;
        redraw();
      },
    };

    const nearestPin = (px: number, py: number): number => {
      const worldW = COLS * cell;
      let best = -1;
      let bestD = 28;
      pins.forEach((p, i) => {
        const y = rowOf(p.lat) * cell;
        for (const k of [0, -1]) {
          const x = screenX(colOf(p.lon)) + k * worldW;
          const d = Math.hypot(x - px, y - py);
          if (d < bestD) {
            bestD = d;
            best = i;
          }
        }
      });
      return best;
    };

    const local = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const onDown = (e: PointerEvent) => {
      dragging = true;
      moved = 0;
      vel = 0;
      target = null;
      lastX = e.clientX;
      lastT = performance.now();
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      pointer = local(e);
      if (dragging) {
        const dx = e.clientX - lastX;
        const t = performance.now();
        const dtm = Math.max(8, t - lastT) / 1000;
        lastX = e.clientX;
        lastT = t;
        moved += Math.abs(dx);
        off -= dx / cell;
        vel = Math.max(-70, Math.min(70, vel * 0.5 + (-dx / cell / dtm) * 0.5));
      }
      redraw();
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      idleUntil = performance.now() + 2600;
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
      if (moved < 5) {
        const p = local(e);
        const i = nearestPin(p.x, p.y);
        if (i >= 0) focus(i);
      }
      redraw();
    };
    const onLeave = () => {
      pointer = null;
      redraw();
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("pointerleave", onLeave);

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        sync();
      },
      { threshold: 0.05 }
    );
    io.observe(wrap);
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    document.addEventListener("visibilitychange", sync);
    resize();
    document.fonts?.ready.then(redraw);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", sync);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
      api.current = null;
    };
  }, [pins]);

  return (
    <figure className="atlas" aria-label={label}>
      <div className="atlas-bar label">
        <span>Atlas · equirectangular · 1.5° grid</span>
        <span className="hidden sm:inline">Drag to scrub</span>
        <button
          type="button"
          className="atlas-pause label"
          aria-pressed={paused}
          onClick={() => {
            const next = !paused;
            setPaused(next);
            api.current?.setPaused(next);
          }}
        >
          {paused ? "Resume" : "Pause"}
        </button>
      </div>

      <div ref={wrapRef} className="atlas-screen">
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="atlas-canvas font-mono"
        />
      </div>

      <ul className="atlas-stops">
        {pins.map((p, i) => (
          <li key={p.code}>
            <button
              type="button"
              className="atlas-stop"
              aria-pressed={selected === i}
              onClick={() => api.current?.focus(i)}
            >
              <span className="label atlas-code">{p.code}</span>
              <span className="atlas-place">{p.place}</span>
              <span className="label atlas-meta">
                {formatCoord(p.lat, p.lon, p.approx)}
              </span>
              <span className="label atlas-meta">{p.years}</span>
            </button>
          </li>
        ))}
      </ul>

      {/* The timeline for the selected place. Remounted on each change so it
          fades in, and announced politely to screen readers. */}
      <div
        className="atlas-dossier"
        role="region"
        aria-live="polite"
        aria-label={`${pins[selected]?.place ?? ""}: timeline`}
      >
        <ol key={selected} className="atlas-stations">
          {(pins[selected]?.stations ?? []).map((s) => (
            <li key={`${s.year}-${s.title}`} className="atlas-station">
              <span className="font-display tabular atlas-year">{s.year}</span>
              <span className="font-display atlas-station-title">
                {s.title}
                {s.current && (
                  <span className="stamp stamp-brass label ml-3 align-middle">
                    Current
                  </span>
                )}
              </span>
              {s.role && <span className="atlas-station-role">{s.role}</span>}
              {(s.period || s.category) && (
                <span className="label atlas-meta">
                  {[s.period, s.category].filter(Boolean).join(" · ")}
                </span>
              )}
              {s.href && (
                <Link href={s.href} className="label link-rule atlas-link">
                  {s.hrefLabel ?? "Open the record"}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </div>
    </figure>
  );
}

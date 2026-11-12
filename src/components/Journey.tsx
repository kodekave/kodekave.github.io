"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { MAP_GRID } from "@/lib/map-grid";
import StopArt, { type Motif } from "./StopArt";

export type Stop = {
  /** The year, written as a memory address: 0x2025. */
  addr: string;
  /** The stage as an instruction and its operand. */
  op: string;
  arg: string;
  year: string;
  title: string;
  role?: string;
  meta?: string;
  current?: boolean;
  href?: string;
  hrefLabel?: string;
  motif: Motif;
  /** The route code of the place it happened. */
  place: string;
  /** Running totals by this stop, for the registers. */
  countries: number;
  ventures: number;
};

export type Pin = {
  code: string;
  label: string;
  years: string;
  lat: number;
  lon: number;
};

const STEP_MS = 340;
const pad = (n: number) => String(n).padStart(2, "0");

/** True from the wide breakpoint up, where the detail has its own pane. */
function useWide() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia("(min-width: 1024px)");
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia("(min-width: 1024px)").matches,
    () => false
  );
}

/**
 * The journey as a program listing and a debugger.
 *
 * Every stop is one line of the listing: year, opcode, title. The line that is
 * selected drives one detail: a flat map showing where the program has jumped
 * so far, the PC / CTRY / VENT registers, and the stop's year, title, role,
 * dates, link and drawing. On first view the program runs once, a line every
 * third of a second, and stops on the last stop: the registers hold their
 * final values and the D1 lamp comes on. After that any line can be chosen by
 * hover, focus, click or the arrow keys, and STEP and RUN are real controls.
 * Nothing is pinned and nothing hijacks the scroll.
 *
 * What the server sends is the finished state: the last stop selected, the
 * registers at their final values. That is also what anyone with reduced motion sees, and
 * every stop's detail is in the HTML whether or not it is open.
 */
export default function Journey({ stops, pins }: { stops: Stop[]; pins: Pin[] }) {
  const N = stops.length;
  const rootRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const timers = useRef<number[]>([]);
  const wide = useWide();

  const [pc, setPc] = useState(N - 1);
  const [done, setDone] = useState(true);
  const [running, setRunning] = useState(false);

  const stopTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  /** Go to a line. Reaching the last stop ends the run. */
  const goto = (i: number) => {
    setPc(i);
    if (i >= N - 1) {
      setDone(true);
      setRunning(false);
    }
  };

  const run = () => {
    stopTimers();
    setDone(false);
    setRunning(true);
    setPc(0);
    for (let i = 1; i < N; i++) later(() => goto(i), i * STEP_MS);
  };

  const select = (i: number) => {
    stopTimers();
    setRunning(false);
    goto(i);
  };

  const step = () => {
    stopTimers();
    setRunning(false);
    if (done || pc >= N - 1) {
      setDone(false);
      setPc(0);
    } else goto(pc + 1);
  };

  // Arm the run just before the listing scrolls into view, and start it once
  // it is mostly on screen. Both fire from observer callbacks, so the server's
  // finished state is only replaced while the listing is still off screen.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let armed = false;
    const arm = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || armed) return;
        armed = true;
        setDone(false);
        setPc(-1);
        arm.disconnect();
      },
      { rootMargin: "0px 0px 600px 0px" }
    );
    const start = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        start.disconnect();
        run();
      },
      { threshold: 0.45 }
    );
    arm.observe(el);
    start.observe(el);
    return () => {
      arm.disconnect();
      start.disconnect();
      stopTimers();
    };
    // run and stopTimers only touch refs and state setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onKey = (e: React.KeyboardEvent) => {
    const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const cur = rowRefs.current.findIndex((b) => b === document.activeElement);
    const last = N - 1;
    const next =
      e.key === "Home" ? 0 : e.key === "End" ? last
      : e.key === "ArrowDown" ? Math.min(last, cur + 1) : Math.max(0, cur - 1);
    rowRefs.current[next]?.focus();
  };

  const at = Math.max(0, Math.min(pc, N - 1));
  const shown = stops[at];
  const final = stops[N - 1];
  // The registers follow the program while it runs and hold when it ends.
  const regs = done
    ? { pc: final.addr, countries: final.countries, ventures: final.ventures, lit: N }
    : { pc: pc < 0 ? "0x0000" : shown.addr, countries: pc < 0 ? 0 : shown.countries, ventures: pc < 0 ? 0 : shown.ventures, lit: pc + 1 };

  return (
    <div ref={rootRef} className="jl corners">
      <noscript>
        <style>{`.jl-inline,.jl-inline[hidden]{display:block!important}.jl-pane{display:none!important}`}</style>
      </noscript>
      <div className="jl-bar label">
        <span>Program listing · {N} instructions</span>
        <span className="jl-ctl">
          <button type="button" className="jl-btn" onClick={step}>
            Step
          </button>
          <button type="button" className="jl-btn" data-on={running} onClick={run}>
            Run
          </button>
        </span>
      </div>

      <div className="jl-cols">
        {/* The map and the registers: the program's state. */}
        <div className="jl-top">
          <JourneyMap stops={stops} pins={pins} at={at} started={pc >= 0} />
          <div className="jl-regs label" aria-hidden="true">
            <span>
              PC <b>{regs.pc}</b>
            </span>
            <span>
              CTRY <b>{pad(regs.countries)}</b>
            </span>
            <span>
              VENT <b>{pad(regs.ventures)}</b>
            </span>
            <span className="jl-lamps">
              {stops.map((s, i) => (
                <i key={s.addr} data-lit={i < regs.lit} />
              ))}
              <i className="jl-done-lamp" data-lit={done} />
              <span className="desig ml-1">D1</span>
            </span>
          </div>
        </div>

        <ol className="jl-list" aria-label="The journey, as a program listing" onKeyDown={onKey}>
          {stops.map((s, i) => {
            const active = pc === i;
            return (
              <li key={s.addr}>
                <button
                  type="button"
                  ref={(el) => {
                    rowRefs.current[i] = el;
                  }}
                  id={`jl-row-${i}`}
                  className="jl-row"
                  data-active={active}
                  data-done={pc > i}
                  aria-expanded={wide ? undefined : active}
                  aria-controls={wide ? "jl-pane" : `jl-detail-${i}`}
                  aria-current={wide && active ? "true" : undefined}
                  onClick={() => select(i)}
                  onFocus={() => {
                    if (pc !== i) select(i);
                  }}
                  onMouseEnter={() => {
                    if (!running && pc !== i) select(i);
                  }}
                >
                  <i className="jl-mk" aria-hidden="true" />
                  <span>
                    <span className="jl-l1">
                      <span>
                        {s.addr}
                        <span className="jl-op">{s.op}</span>
                        {s.arg}
                      </span>
                      <span className="jl-yr">{s.year}</span>
                    </span>
                    <span className="jl-l2 block">{s.title}</span>
                  </span>
                </button>
                <div
                  id={`jl-detail-${i}`}
                  className="jl-inline jl-detail"
                  hidden={!active}
                >
                  <Detail s={s} />
                </div>
              </li>
            );
          })}
        </ol>

        {/* The detail, on wide screens. Narrow screens open it under the line. */}
        <div id="jl-pane" className="jl-pane">
          <div className="jl-detail">
            <Detail s={shown} />
          </div>
        </div>
      </div>

    </div>
  );
}

function Detail({ s }: { s: Stop }) {
  return (
    <>
      <div>
        <p className="jl-year" aria-hidden="true">{s.year}</p>
        <h3 className="font-display jl-title">
          {s.title}
          {s.current && (
            <span className="stamp stamp-brass label ml-3 align-middle">Current</span>
          )}
        </h3>
        {s.role && <p className="jl-role">{s.role}</p>}
        {s.meta && <p className="label jl-meta">{s.meta}</p>}
        {s.href && (
          <Link href={s.href} className="label link-rule jl-link">
            {s.hrefLabel ?? "Open the record"}
          </Link>
        )}
      </div>
      <StopArt motif={s.motif} />
    </>
  );
}

/* --------------------------------------------------------------- the map */

const { cols: COLS, rows: ROWS, step: STEP, latTop: LAT_TOP, lonLeft: LON_LEFT } = MAP_GRID;
const LAT_SHOWN_TOP = 76;
const LAT_SHOWN_BOTTOM = -42;
const ROW_FROM = Math.round((LAT_TOP - LAT_SHOWN_TOP) / STEP);
const ROW_TO = Math.min(ROWS, Math.round((LAT_TOP - LAT_SHOWN_BOTTOM) / STEP));
const SHOWN_ROWS = ROW_TO - ROW_FROM;

function decode(): Uint8Array {
  const bin = atob(MAP_GRID.bits);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * A flat dot-matrix world map showing the route so far. Places already
 * reached are solid, the next ones hollow. Arcs join the places in the order
 * they were worked, and the arc into the current place is drawn in as the
 * program steps. The land is drawn once to an offscreen canvas; a frame is
 * only drawn when something changes. With reduced motion the arc is simply
 * there.
 */
function JourneyMap({
  stops,
  pins,
  at,
  started,
}: {
  stops: Stop[];
  pins: Pin[];
  at: number;
  started: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef<(i: number, t: number) => void>(() => {});
  const atRef = useRef(at);
  const rafRef = useRef(0);

  // Build the canvas: size it to its box, paint the land, expose `draw`.
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!wrap || !canvas || !ctx) return;

    const css = getComputedStyle(wrap);
    const read = (name: string, fallback: string) =>
      css.getPropertyValue(name).trim() || fallback;
    const BRASS = read("--color-brass", "#bc9660");
    const HOT = read("--color-brass-hot", "#e0b36a");
    const PAPER = read("--color-paper", "#eeeadf");
    const mono = getComputedStyle(canvas).fontFamily || "monospace";
    const bits = decode();
    const places = stops.map((s) => s.place);
    const pinOf = Object.fromEntries(pins.map((p) => [p.code, p]));
    // The jumps, in order: [from, to, index of the stop that made it].
    const jumps: [string, string, number][] = [];
    places.forEach((p, i) => {
      if (i > 0 && p !== places[i - 1]) jumps.push([places[i - 1], p, i]);
    });
    const firstStop = (code: string) => places.indexOf(code);

    let W = 0;
    let H = 0;
    let cell = 3;
    let land: HTMLCanvasElement | null = null;
    const px = (lat: number, lon: number): [number, number] => [
      ((lon - LON_LEFT) / STEP) * cell,
      ((LAT_TOP - lat) / STEP - ROW_FROM) * cell,
    ];

    function buildLand(dpr: number) {
      land = document.createElement("canvas");
      land.width = Math.round(W * dpr);
      land.height = Math.round(H * dpr);
      const c = land.getContext("2d")!;
      c.scale(dpr, dpr);
      c.strokeStyle = "rgba(238,234,223,0.08)";
      c.lineWidth = 1;
      for (let lat = 60; lat >= -30; lat -= 15) {
        const y = Math.round(((LAT_TOP - lat) / STEP - ROW_FROM) * cell) + 0.5;
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(W, y);
        c.stroke();
      }
      for (let lon = -180; lon < 180; lon += 30) {
        const x = Math.round(((lon - LON_LEFT) / STEP) * cell) + 0.5;
        c.beginPath();
        c.moveTo(x, 0);
        c.lineTo(x, H);
        c.stroke();
      }
      c.fillStyle = "#6f8a7c";
      const size = cell * 0.74;
      const pd = (cell - size) / 2;
      for (let r = ROW_FROM; r < ROW_TO; r++) {
        for (let q = 0; q < COLS; q++) {
          const i = r * COLS + q;
          if ((bits[i >> 3] >> (i & 7)) & 1) {
            c.fillRect(q * cell + pd, (r - ROW_FROM) * cell + pd, size, size);
          }
        }
      }
    }

    const arcPt = (a: string, b: string, t: number): [number, number] => {
      const [xa, ya] = px(pinOf[a].lat, pinOf[a].lon);
      const [xb, yb] = px(pinOf[b].lat, pinOf[b].lon);
      const lift = Math.min(0.5 * H, Math.abs(xb - xa) * 0.22 + 10);
      return [xa + (xb - xa) * t, ya + (yb - ya) * t - Math.sin(Math.PI * t) * lift];
    };
    const trace = (a: string, b: string, upTo: number) => {
      ctx!.beginPath();
      const n = Math.max(2, Math.round(60 * upTo));
      for (let s = 0; s <= n; s++) {
        const [x, y] = arcPt(a, b, (s / n) * upTo);
        if (s === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
    };

    /** Draw the route as it stands at stop `i`, the arc into it `t` of the way. */
    function draw(i: number, t: number) {
      if (!land || W === 0) return;
      const c = ctx!;
      const dpr = canvas!.width / W;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, W, H);
      c.drawImage(land, 0, 0, W, H);

      for (const [a, b, idx] of jumps) {
        if (idx < i || (idx === i && t >= 1)) {
          // Already flown.
          const isNow = idx === i;
          c.setLineDash(isNow ? [] : [5, 6]);
          c.lineWidth = isNow ? 2.5 : 1.3;
          c.strokeStyle = isNow ? HOT : "rgba(188,150,96,0.6)";
          trace(a, b, 1);
          c.stroke();
        } else if (idx === i) {
          c.setLineDash([]);
          c.lineWidth = 2.5;
          c.strokeStyle = HOT;
          trace(a, b, Math.max(0.02, t));
          c.stroke();
        } else {
          c.setLineDash([2, 7]);
          c.lineWidth = 1.2;
          c.strokeStyle = "rgba(238,234,223,0.28)";
          trace(a, b, 1);
          c.stroke();
        }
      }
      c.setLineDash([]);

      const here = places[i];
      for (const p of pins) {
        const [x, y] = px(p.lat, p.lon);
        const reached = firstStop(p.code) <= i;
        const now = p.code === here;
        c.fillStyle = now ? HOT : BRASS;
        if (reached) c.fillRect(x - 4.5, y - 4.5, 9, 9);
        c.strokeStyle = reached ? PAPER : "rgba(238,234,223,0.5)";
        c.lineWidth = 1;
        c.strokeRect(Math.round(x) - 7.5, Math.round(y) - 7.5, 15, 15);
        c.font = `500 11px ${mono}`;
        c.textAlign = "left";
        c.fillStyle = now ? HOT : reached ? "#d6d1c3" : "rgba(238,234,223,0.55)";
        c.fillText(p.code, x + 12, y + 4);
        if (now) {
          c.strokeStyle = HOT;
          c.lineWidth = 1.6;
          for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
            c.beginPath();
            c.moveTo(x + sx * 12, y + sy * 8);
            c.lineTo(x + sx * 12, y + sy * 12);
            c.lineTo(x + sx * 8, y + sy * 12);
            c.stroke();
          }
        }
      }
    }
    drawRef.current = draw;

    function resize() {
      const w = Math.round(wrap!.getBoundingClientRect().width);
      if (w < 10) return;
      W = w;
      cell = W / COLS;
      H = Math.round(SHOWN_ROWS * cell);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(W * dpr);
      canvas!.height = Math.round(H * dpr);
      canvas!.style.height = `${H}px`;
      buildLand(dpr);
      draw(atRef.current, 1);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [stops, pins]);

  // When the stop changes, draw the new arc in over about 450 ms.
  useEffect(() => {
    atRef.current = at;
    cancelAnimationFrame(rafRef.current);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      drawRef.current(at, 1);
      return;
    }
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / 450);
      drawRef.current(at, t);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [at]);

  const here = pins.find((p) => p.code === stops[at]?.place);
  return (
    <div
      ref={wrapRef}
      className="jl-mapbox"
      role="img"
      aria-label={`A flat dot-matrix world map of the route so far, now at ${here?.label ?? "the start"}.`}
    >
      <canvas ref={canvasRef} />
      <span className="jl-cap jl-cap-top desig" aria-hidden="true">
        Atlas · {pins.map((p) => p.code).join(" → ")}
      </span>
      {started && here && (
        <span className="jl-cap jl-cap-bot label" aria-hidden="true">
          {here.code} · {here.label} · {here.years}
        </span>
      )}
    </div>
  );
}

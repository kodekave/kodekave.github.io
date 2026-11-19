"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { buildCloud, FLOATS, type Cloud } from "@/lib/lorenz";
import { cssRgb, onTheme } from "@/lib/theme";
import {
  type LandCell,
  LAT_T,
  LON_L,
  SPAN_X,
  SPAN_Y,
  VIEW_COLS,
  formatCoord,
  landCells,
} from "@/lib/world-dots";

export type MapStop = {
  year: string;
  title: string;
  line: string;
  href?: string;
  hrefLabel?: string;
};

export type MapPlace = {
  code: string;
  label: string;
  place: string;
  years: string;
  lat: number;
  lon: number;
  /** Country-level rather than a named city: shown to the nearest degree. */
  approx?: boolean;
  stops: MapStop[];
};

/**
 * The places worked, on a world map made of dots, joined in the order they were
 * worked by dotted arcs. Point at a place (or a name in the list beside it) to
 * read what happened there along the foot of the card; click to hold it.
 *
 * On its own (the /journey page, or the homepage without its scroll scene) the
 * dots are drawn here on a 2D canvas: they start as the Lorenz butterfly and
 * settle into the continents. In the homepage's scroll scene the canvas is
 * hidden: the scene's own point cloud flies into these same dots (see
 * JourneyScene and lib/world-dots.ts), so only the card's furniture is here: the
 * graticule, the arcs, the places, the list and the details. Those are real
 * buttons and text, so it works by keyboard and screen reader, and with reduced
 * motion the map simply appears as it is.
 */

const LONS = [-120, -90, -60, -30, 0, 30, 60, 90, 120, 150];
const LATS = [60, 30, 0, -30];


const pct = (v: number, span: number) => `${((v / span) * 100).toFixed(3)}%`;

/** An arc between two places, in degree space, bowed towards the north. */
function arc(a: MapPlace, b: MapPlace): string {
  const x1 = a.lon - LON_L;
  const y1 = LAT_T - a.lat;
  const x2 = b.lon - LON_L;
  const y2 = LAT_T - b.lat;
  const d = Math.hypot(x2 - x1, y2 - y1);
  const cy = Math.max(3, (y1 + y2) / 2 - d * 0.28);
  return `M${x1.toFixed(2)} ${y1.toFixed(2)} Q${((x1 + x2) / 2).toFixed(2)} ${cy.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

export default function JourneyMap({
  places,
  cardNumber,
}: {
  places: MapPlace[];
  /**
   * Where this card sits among the home page's cards ("01/04"). Without it the
   * header counts the places instead (India, Maldives, ...), which is what the
   * stand-alone journey page shows.
   */
  cardNumber?: string;
}) {
  const pan = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  // It opens on the first place, where the journey started; each click lights
  // the next leg of the route.
  const [selected, setSelected] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? selected;
  const here = places[shown];

  useEffect(() => {
    const box = stage.current;
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!box || !cv || !ctx) return;
    const card = box.closest<HTMLElement>(".jmap");
    const scene = card?.closest<HTMLElement>(".journey") ?? null;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // The dots are drawn in the theme's ink.
    let ink = cssRgb("--color-ink", "31, 43, 39");

    // The dots are built only when they are first drawn, not at page load.
    let ready = false;
    let cells: LandCell[] = [];
    let cloud: Cloud | null = null;
    let total = 0;
    let delay: number[] = [];
    const ensure = () => {
      if (ready) return;
      ready = true;
      cells = landCells();
      // Where the dots begin: points on the Lorenz attractor, so the butterfly
      // from the homepage is what settles into the map.
      cloud = buildCloud(0.25);
      total = cloud.count;
      delay = cells.map((_, i) => ((i * 2654435761) % 1000) / 1000);
    };

    let W = 0;
    let H = 0;
    let raf = 0;
    let start = 0;
    let animating = false;

    const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

    const paint = (u: number) => {
      const c0 = cloud;
      if (!ready || !c0 || !W || !H) return;
      ctx.clearRect(0, 0, W, H);
      const cs = W / VIEW_COLS;

      // The land, as two batches of dots: the coast, then the inside.
      const inner = cs * 0.27;
      const rim = cs * 0.36;
      for (const coastPass of [false, true]) {
        ctx.beginPath();
        for (let i = 0; i < cells.length; i++) {
          const cell = cells[i];
          if (cell.coast !== coastPass) continue;
          const tx = (cell.c + 0.5) * cs;
          const ty = (cell.r + 0.5) * cs;
          let x = tx;
          let y = ty;
          if (u < 1) {
            const p = ease((u - delay[i] * 0.4) / 0.6);
            const v = c0.vertices;
            const k = (((i * 7919) % total) * FLOATS) | 0;
            const sx = W * (0.5 + v[k] * 0.27);
            const sy = H * (0.52 - v[k + 2] * 0.36);
            x = sx + (tx - sx) * p;
            y = sy + (ty - sy) * p;
          }
          const r = coastPass ? rim : inner;
          ctx.moveTo(x + r, y);
          ctx.arc(x, y, r, 0, Math.PI * 2);
        }
        const fade = u < 1 ? 0.45 + 0.55 * ease(u) : 1;
        ctx.fillStyle = `rgba(${ink}, ${(coastPass ? 0.72 : 0.26) * fade})`;
        ctx.fill();
      }
    };

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = box.getBoundingClientRect();
      W = Math.round(r.width);
      H = Math.round(r.height);
      if (!W || !H) return;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint(animating ? Math.min(1, (performance.now() - start) / 1800) : 1);
    };

    const tick = (now: number) => {
      const u = Math.min(1, (now - start) / 1800);
      paint(u);
      if (u < 1) raf = requestAnimationFrame(tick);
      else animating = false;
    };

    const play = () => {
      ensure();
      size();
      if (reduce) {
        paint(1);
        return;
      }
      cancelAnimationFrame(raf);
      animating = true;
      start = performance.now();
      raf = requestAnimationFrame(tick);
    };

    // On a phone the map is wider than the card and swipes; start it centred
    // on the places worked.
    const p = pan.current;
    if (p) p.scrollLeft = (p.scrollWidth - p.clientWidth) * 0.5;

    size();
    const ro = new ResizeObserver(size);
    ro.observe(box);
    const offTheme = onTheme(() => {
      ink = cssRgb("--color-ink", "31, 43, 39");
      if (W && H) paint(animating ? Math.min(1, (performance.now() - start) / 1800) : 1);
    });

    // On its own page the dots are drawn once the browser is idle. In the
    // homepage's scroll scene a wider screen never draws them here (the cloud
    // forms the map), and a phone draws them when the scene reveals the card.
    // Without the scene running (reduced motion), when the card is scrolled to.
    let idle = 0;
    let io: IntersectionObserver | null = null;
    if (!scene) {
      if ("requestIdleCallback" in window) idle = window.requestIdleCallback(play, { timeout: 600 });
      else idle = setTimeout(play, 100) as unknown as number;
    } else {
      io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting) && scene.dataset.scene !== "live") {
          io?.disconnect();
          play();
        }
      });
      io.observe(box);
    }
    card?.addEventListener("jmap-show", play);
    return () => {
      offTheme();
      cancelAnimationFrame(raf);
      ro.disconnect();
      io?.disconnect();
      if (idle && "cancelIdleCallback" in window) window.cancelIdleCallback(idle);
      card?.removeEventListener("jmap-show", play);
    };
  }, []);

  return (
    <div className="jmap">
      <div className="jmap-bar label">
        <span className="flex items-center gap-3 text-ink-faint">
          <span className="text-brass-deep tabular">
            {cardNumber ?? `${String(shown + 1).padStart(2, "0")}/${String(places.length).padStart(2, "0")}`}
          </span>
          <span>Journey</span>
        </span>
        <span className="tabular text-ink-faint">
          {formatCoord(here.lat, here.lon, here.approx)}
        </span>
      </div>

      <div className="jmap-top">
        <div ref={pan} className="jmap-pan">
          <div ref={stage} data-map-stage className="jmap-stage">
            <canvas ref={canvas} aria-hidden="true" className="jmap-canvas" />
            <svg
              aria-hidden="true"
              focusable="false"
              viewBox={`0 0 ${SPAN_X} ${SPAN_Y}`}
              preserveAspectRatio="none"
              className="jmap-svg"
            >
              {/* The graticule, every 30 degrees, with its degrees at the edges. */}
              <g className="jmap-grat">
                {LONS.map((lon) => (
                  <path key={`x${lon}`} d={`M${lon - LON_L} 0V${SPAN_Y}`} />
                ))}
                {LATS.map((lat) => (
                  <path
                    key={`y${lat}`}
                    d={`M0 ${LAT_T - lat}H${SPAN_X}`}
                    className={lat === 0 ? "is-equator" : undefined}
                  />
                ))}
              </g>
              <g className="jmap-ticks">
                {LONS.map((lon) => (
                  <text key={`tx${lon}`} x={lon - LON_L + 1} y={SPAN_Y - 1.6}>
                    {Math.abs(lon)}°{lon === 0 ? "" : lon < 0 ? "W" : "E"}
                  </text>
                ))}
                {LATS.map((lat) => (
                  <text key={`ty${lat}`} x={1.4} y={LAT_T - lat - 1.2}>
                    {Math.abs(lat)}°{lat === 0 ? "" : lat < 0 ? "S" : "N"}
                  </text>
                ))}
              </g>

              {/* The aim: a faint cross through the place shown. */}
              <path
                className="jmap-aim"
                d={`M${here.lon - LON_L} 0V${SPAN_Y}M0 ${LAT_T - here.lat}H${SPAN_X}`}
              />
              {places.slice(0, -1).map((pl, i) => (
                <path
                  key={pl.code}
                  d={arc(pl, places[i + 1])}
                  className={`jmap-arc${i < shown ? " is-travelled" : ""}`}
                />
              ))}
            </svg>

            {places.map((pl, i) => (
              <button
                key={pl.code}
                type="button"
                aria-current={i === shown}
                aria-label={`${pl.label}, ${pl.years}`}
                onPointerEnter={(e) => e.pointerType === "mouse" && setHover(i)}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                onClick={() => setSelected(i)}
                className="jspot"
                style={{ left: pct(pl.lon - LON_L, SPAN_X), top: pct(LAT_T - pl.lat, SPAN_Y) }}
              >
                <span aria-hidden="true" className="jspot-dot" />
                <span aria-hidden="true" className="jspot-label label">
                  {pl.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <ol className="jplaces" aria-label="Places worked">
          {places.map((pl, i) => (
            <li key={pl.code}>
              <button
                type="button"
                aria-current={i === shown}
                onPointerEnter={(e) => e.pointerType === "mouse" && setHover(i)}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                onClick={() => setSelected(i)}
                className="jplace"
              >
                <span className="label tabular text-ink-faint">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-display jplace-name">{pl.label}</span>
                <span className="label tabular text-ink-faint">{pl.years}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="jmap-detail" aria-live="polite">
        {places.map((pl, i) => (
          <div key={pl.code} hidden={i !== shown} className="jmap-panel">
            <div className="jmap-place">
              <p className="label text-ink-faint">{pl.years}</p>
              <h2 className="font-display mt-2 text-[clamp(1.9rem,3.4vw,2.6rem)] leading-none">
                {pl.label}
              </h2>
              <p className="label tabular mt-3 text-ink-faint">{pl.place}</p>
            </div>
            <ol className="jstops">
              {pl.stops.map((s) => (
                <li key={`${s.year}-${s.title}`} className="jstop">
                  <p className="label tabular pt-1.5 text-ink-faint">{s.year}</p>
                  <div>
                    <h3 className="font-display-text text-[1.25rem] leading-snug">{s.title}</h3>
                    <p className="mt-1 max-w-[32em] text-[0.9375rem] leading-relaxed text-ink-soft">{s.line}</p>
                    {s.href && (
                      <Link href={s.href} className="label link-rule hit mt-2 inline-block text-ink">
                        {s.hrefLabel ?? "Open the record"}
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}

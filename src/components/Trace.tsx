"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import TraceArt, { type Motif } from "./TraceArt";

export type TraceStation = {
  /** The year, written as a memory address: 0x2019. */
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
  /** Running totals by this stage, for the registers. */
  countries: number;
  ventures: number;
};

const pad = (n: number) => String(n).padStart(2, "0");
const clamp = (n: number) => Math.min(1, Math.max(0, n));

/**
 * The journey as a program being stepped through.
 *
 * A brass line runs down the left edge and fills as the page scrolls. At each
 * stage it branches to a station: one line of an assembly listing, the year,
 * what happened, and an instrument that draws itself as the station crosses
 * the screen (see TraceArt). A register bar stays pinned under the navigation
 * and counts up: the program counter is the year being read, and the country
 * and venture registers hold the running totals. The last instruction is HCF.
 *
 * Scrolling drives everything through two CSS variables: `--p` on each
 * station (its own 0-to-1 progress) and `--sp` on the whole listing (how much
 * of the line is filled). The server HTML sets neither, and both default to 1,
 * so without JavaScript, and with reduced motion, the page is simply the
 * finished journey with the final totals.
 */
export default function Trace({ stations }: { stations: TraceStation[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pcRef = useRef<HTMLElement>(null);
  const ctryRef = useRef<HTMLElement>(null);
  const ventRef = useRef<HTMLElement>(null);
  const last = stations[stations.length - 1];

  useEffect(() => {
    const root = rootRef.current;
    if (!root || stations.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const els = Array.from(root.querySelectorAll<HTMLElement>("[data-station]"));
    const halt = root.querySelector<HTMLElement>("[data-halt]");
    const list = root.querySelector<HTMLElement>(".trace-list");
    const lamps = Array.from(root.querySelectorAll<HTMLElement>(".trace-lamps i"));
    let raf = 0;

    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      let active = -1;

      els.forEach((el, i) => {
        const top = el.getBoundingClientRect().top;
        // 0 as the station enters at the bottom of the screen, 1 by the time
        // its top has climbed to about a third of the way down.
        const p = clamp((vh * 0.9 - top) / (vh * 0.6));
        el.style.setProperty("--p", p.toFixed(3));
        const on = p > 0.1;
        el.dataset.on = String(on);
        if (on) active = i;
      });

      let halted = false;
      if (halt) {
        halted = halt.getBoundingClientRect().top < vh * 0.8;
        halt.dataset.on = String(halted);
      }
      if (list) {
        const r = list.getBoundingClientRect();
        root.style.setProperty("--sp", clamp((vh * 0.62 - r.top) / r.height).toFixed(4));
      }

      const s = active >= 0 ? stations[active] : null;
      if (pcRef.current) pcRef.current.textContent = halted ? "0xFFFF" : (s?.addr ?? "0x0000");
      if (ctryRef.current) ctryRef.current.textContent = pad(s?.countries ?? 0);
      if (ventRef.current) ventRef.current.textContent = pad(s?.ventures ?? 0);
      lamps.forEach((l, i) => (l.dataset.lit = String(i <= active)));
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [stations]);

  return (
    <div ref={rootRef} className="trace">
      {/* The registers. Decoration for the eye; the stations carry the facts. */}
      <div className="trace-reg label" aria-hidden="true">
        <span>
          PC <b ref={pcRef}>{last?.addr}</b>
        </span>
        <span>
          CTRY <b ref={ctryRef}>{pad(last?.countries ?? 0)}</b>
        </span>
        <span>
          VENT <b ref={ventRef}>{pad(last?.ventures ?? 0)}</b>
        </span>
        <span className="trace-lamps">
          {stations.map((s) => (
            <i key={s.addr} data-lit="true" />
          ))}
        </span>
      </div>

      <ol className="trace-list">
        {stations.map((s) => (
          <li key={s.addr} data-station className="trace-station">
            <div className="trace-copy">
              <p className="trace-op" aria-hidden="true">
                <span>{s.addr}</span>
                <span className="trace-ins">{s.op}</span>
                <span>{s.arg}</span>
              </p>
              <p className="font-display tabular trace-year">{s.year}</p>
              <h3 className="font-display trace-title">
                {s.title}
                {s.current && (
                  <span className="stamp stamp-brass label ml-3 align-middle">
                    Current
                  </span>
                )}
              </h3>
              {s.role && <p className="trace-role">{s.role}</p>}
              {s.meta && <p className="label trace-meta">{s.meta}</p>}
              {s.href && (
                <Link href={s.href} className="label link-rule trace-link">
                  {s.hrefLabel ?? "Open the record"}
                </Link>
              )}
            </div>
            <div className="trace-art">
              <TraceArt motif={s.motif} />
            </div>
          </li>
        ))}

        <li data-halt className="trace-halt" aria-hidden="true">
          <p className="trace-op">
            <span>0xFFFF</span>
            <span className="trace-ins">HCF</span>
            <span>; halt and catch fire</span>
            <span className="caret" />
          </p>
        </li>
      </ol>
    </div>
  );
}

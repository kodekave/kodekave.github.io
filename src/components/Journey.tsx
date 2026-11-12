"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
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
  href?: string;
  hrefLabel?: string;
  motif: Motif;
  /** The route code of the place it happened. */
  place: string;
};

export type Pin = { code: string; label: string };

const STEP_MS = 340;

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
 * The journey as a program listing.
 *
 * Every stop is one line: year, opcode, title. The selected line drives one
 * detail, the stop's year, title, role, dates, link and drawing, and one thin
 * route line that shows which of the four places has been reached. On first
 * view the listing runs once, a line every third of a second, and stops on the
 * last stop. After that any line can be chosen by hover, focus, click or the
 * arrow keys. Nothing is pinned and nothing hijacks the scroll.
 *
 * What the server sends is the finished state, the last stop selected. That is
 * also what anyone with reduced motion sees, and every stop's detail is in the
 * HTML whether or not it is open.
 */
export default function Journey({ stops, pins }: { stops: Stop[]; pins: Pin[] }) {
  const N = stops.length;
  const rootRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const timers = useRef<number[]>([]);
  const wide = useWide();

  const [pc, setPc] = useState(N - 1);
  const [running, setRunning] = useState(false);

  const stopTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const goto = (i: number) => {
    setPc(i);
    if (i >= N - 1) setRunning(false);
  };

  const run = () => {
    stopTimers();
    setRunning(true);
    setPc(0);
    for (let i = 1; i < N; i++) later(() => goto(i), i * STEP_MS);
  };

  const select = (i: number) => {
    stopTimers();
    setRunning(false);
    goto(i);
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

  return (
    <div ref={rootRef} className="jl">
      <noscript>
        <style>{`.jl-inline,.jl-inline[hidden]{display:block!important}.jl-pane{display:none!important}`}</style>
      </noscript>

      <div className="jl-cols">
        <div className="jl-top">
          <Route stops={stops} pins={pins} at={at} />
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
                  <span className="jl-l1">
                    <span>
                      {s.addr}
                      <span className="jl-op">{s.op}</span>
                      {s.arg}
                    </span>
                    <span className="jl-yr">{s.year}</span>
                  </span>
                  <span className="jl-l2 block">{s.title}</span>
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
        <h3 className="font-display jl-title">{s.title}</h3>
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

/**
 * The four places as one hairline: reached places are solid, the next ones
 * hollow, and the line between them turns brass once it has been crossed.
 */
function Route({ stops, pins, at }: { stops: Stop[]; pins: Pin[]; at: number }) {
  const places = stops.map((s) => s.place);
  const first = (code: string) => places.indexOf(code);
  const here = pins.find((p) => p.code === places[at]);
  return (
    <div
      className="jl-route"
      role="img"
      aria-label={`The route so far, now at ${here?.label ?? "the start"}.`}
    >
      <ol aria-hidden="true">
        {pins.map((p, i) => {
          const reached = first(p.code) <= at;
          const next = pins[i + 1];
          return (
            <li
              key={p.code}
              data-s={p.code === places[at] ? "now" : reached ? "reached" : "next"}
              data-seg={next && first(next.code) <= at ? "on" : "off"}
            >
              <span className="jl-node" />
              <span className="label sm:hidden">{p.code}</span>
              <span className="label hidden sm:block">{p.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

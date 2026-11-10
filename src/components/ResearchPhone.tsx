"use client";

import { useLayoutEffect, useRef } from "react";

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

/** Streamline offsets across the channel, and the wall offset either side. */
const STREAMS = [-15, -5, 5, 15];
const WALL = 21;

/** An elbow: a straight run, a quarter-turn about (100, 84), then a drop. */
const elbow = (d: number) =>
  `M6 ${34 - d} H100 A${50 + d} ${50 + d} 0 0 1 ${150 + d} 84 V124`;

/**
 * The paper's subject drawn as an object: a phone with a terminal typing the
 * procedure, the elbow channel the paper simulates with brass streamlines
 * running through it, and a simulated-time counter stepping 0 to 10 seconds,
 * the length of the run in the paper.
 *
 * It is a schematic, and says so to a screen reader. Everything is CSS: the
 * typing, the flow and the counter start when the phone scrolls into view and
 * do not run at all with reduced motion.
 */
export default function ResearchPhone({ courant }: { courant: number }) {
  const ref = useRef<HTMLDivElement>(null);

  // Armed before paint so nothing flashes, and started on view. The server
  // HTML carries neither attribute, so with no JavaScript it is the finished
  // picture.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    el.dataset.armed = "true";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.live = "true";
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
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

        <svg className="phone-elbow" viewBox="0 0 200 130" focusable="false">
          <path className="flow-wall" d={elbow(WALL)} />
          <path className="flow-wall" d={elbow(-WALL)} />
          {STREAMS.map((d, i) => (
            <path
              key={d}
              className="flow-line"
              d={elbow(d)}
              style={{ animationDelay: `${-i * 0.45}s` }}
            />
          ))}
        </svg>

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

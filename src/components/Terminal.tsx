"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The Signal section's terminal: a modem handshake that types itself once and
 * ends on a prompt awaiting input. The handshake is decoration; the address on
 * the dial line is the profile's real LinkedIn address.
 *
 * The server sends every line, which is what no-script visitors and anyone
 * with reduced motion get. Otherwise the lines are held back just before the
 * terminal scrolls into view and then arrive one at a time.
 */
export default function Terminal({ address }: { address: string }) {
  const lines = [
    { k: "cmd", t: "ATZ" },
    { k: "out", t: "OK" },
    { k: "cmd", t: `ATD ${address}` },
    { k: "out", t: "CONNECT 1200" },
    { k: "cmd", t: "" },
  ];
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(lines.length);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timers: number[] = [];
    const arm = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        arm.disconnect();
        setShown(0);
      },
      { rootMargin: "0px 0px 500px 0px" }
    );
    const start = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        start.disconnect();
        for (let i = 1; i <= 5; i++) {
          timers.push(window.setTimeout(() => setShown(i), 250 + i * 420));
        }
      },
      { threshold: 0.6 }
    );
    arm.observe(el);
    start.observe(el);
    return () => {
      arm.disconnect();
      start.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  return (
    <div ref={ref} className="term">
      <div className="term-bar label">
        <span>Terminal</span>
        <span className="desig">U4</span>
      </div>
      <div className="term-body">
        {lines.map((l, i) => (
          <p key={i} className="term-line" data-hide={i >= shown}>
            {l.k === "cmd" ? (
              <>
                <span className="term-p">&gt;</span> {l.t}
                {i === lines.length - 1 && <span className="caret" aria-hidden="true" />}
              </>
            ) : (
              <span className={l.t === "OK" ? "term-ok" : ""}>{l.t}</span>
            )}
          </p>
        ))}
      </div>
    </div>
  );
}

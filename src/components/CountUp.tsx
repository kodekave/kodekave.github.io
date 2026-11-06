"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * A figure that counts up to its value the first time it scrolls into view.
 *
 * The server renders the final value, so crawlers, no-JS visitors and anyone
 * who prefers reduced motion get the real number and nothing else. Only an
 * element confirmed to start in a motion-allowed browser is rewound — and it
 * is rewound in a layout effect, before paint, so the final value never
 * flashes before the count begins.
 */
const PATTERN = /^([^\d]*)(\d[\d,]*(?:\.\d+)?)(.*)$/;

export default function CountUp({
  value,
  duration = 1500,
  className = "",
}: {
  value: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const match = PATTERN.exec(value);
    if (!el || !match) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const [, prefix, rawNumber, suffix] = match;
    const target = Number(rawNumber.replace(/,/g, ""));
    const decimals = rawNumber.includes(".") ? rawNumber.split(".")[1].length : 0;
    const grouped = rawNumber.includes(",");

    const format = (n: number) =>
      prefix +
      n.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        useGrouping: grouped,
      }) +
      suffix;

    // Written straight to the node: a counter that re-rendered React sixty
    // times a second would be doing the DOM's job through the slowest route.
    const write = (text: string) => {
      el.textContent = text;
    };

    let frame = 0;
    write(format(0));

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          // Ease-out quart: quick off the mark, a long settle onto the figure.
          const eased = 1 - Math.pow(1 - t, 4);
          write(t === 1 ? value : format(target * eased));
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.6 }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}

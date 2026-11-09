"use client";

import { useId, useLayoutEffect, useRef } from "react";

/**
 * A 5x7 dot-matrix glyph set: the lamps of a 1970s scoreboard or a bank's
 * rate board, set in the site's brass. Only the characters the figures on the
 * site use are drawn; anything else renders as a blank cell.
 *
 * Each glyph is seven rows of equal-width strings, `1` for a lit lamp.
 */
const GLYPHS: Record<string, string[]> = {
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  $: ["00100", "01111", "10100", "01110", "00101", "11110", "00100"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  ".": ["00", "00", "00", "00", "00", "11", "11"],
  ",": ["00", "00", "00", "00", "11", "11", "10"],
  " ": ["000", "000", "000", "000", "000", "000", "000"],
};

type Lamp = { x: number; y: number; col: number };

/** Lay a string out as a list of lit lamps, plus the grid's overall size. */
function layout(text: string): { lamps: Lamp[]; cols: number } {
  const lamps: Lamp[] = [];
  let x = 0;
  for (const ch of text.toUpperCase()) {
    const glyph = GLYPHS[ch] ?? GLYPHS[" "];
    const width = glyph[0].length;
    glyph.forEach((row, y) => {
      for (let i = 0; i < width; i++) {
        if (row[i] === "1") lamps.push({ x: x + i, y, col: x + i });
      }
    });
    x += width + 1; // one blank column between glyphs
  }
  return { lamps, cols: Math.max(0, x - 1) };
}

/**
 * A figure drawn as a panel of lamps. Unlit lamps are visible as a faint
 * grid, lit ones are brass with a soft halo, and when the figure first
 * scrolls into view the lamps switch on from left to right.
 *
 * The text is the accessible name; the lamps are decoration. The server
 * renders every lamp already lit, so crawlers, no-JS visitors and anyone who
 * prefers reduced motion get the finished figure.
 */
export default function DotMatrix({
  text,
  className = "",
  label,
}: {
  text: string;
  className?: string;
  /** Spoken name, where it differs from the characters shown. */
  label?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const patternId = useId();
  const { lamps, cols } = layout(text);

  // Attributes are written straight onto the element rather than through
  // state: the server HTML has none, so every lamp is lit until this runs.
  // Rewound before paint, and only for a figure that starts below the fold in
  // a browser that allows motion; one already in view just plays.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    el.dataset.armed = "true";
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92) {
      el.dataset.on = "true";
      return;
    }

    el.dataset.on = "false";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.on = "true";
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Cell pitch 10, lamp radius 3.4: a gap you can see between lamps.
  const w = cols * 10 + 4;
  const h = 7 * 10 + 4;

  return (
    <svg
      ref={ref}
      role="img"
      aria-label={label ?? text}
      viewBox={`0 0 ${w} ${h}`}
      // Left-aligned when the width is clamped by a narrow cell.
      preserveAspectRatio="xMinYMid meet"
      className={`dot-matrix ${className}`}
    >
      <defs>
        <pattern
          id={patternId}
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
          x="2"
          y="2"
        >
          <circle cx="5" cy="5" r="1.1" fill="currentColor" opacity="0.16" />
        </pattern>
      </defs>
      <rect width={w} height={h} fill={`url(#${patternId})`} />
      {lamps.map((l) => (
        <circle
          key={`${l.x}-${l.y}`}
          className="lamp"
          cx={l.x * 10 + 7}
          cy={l.y * 10 + 7}
          r="3.4"
          fill="currentColor"
          style={{ "--c": l.col } as React.CSSProperties}
        />
      ))}
    </svg>
  );
}

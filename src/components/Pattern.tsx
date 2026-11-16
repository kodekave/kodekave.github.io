"use client";

import { useEffect, useRef } from "react";
import {
  drawPattern,
  PATTERN_OPACITY,
  type PatternKind,
} from "@/lib/patterns";

/**
 * One generated background pattern, behind a page's opening. The frame fills
 * its section and is masked (`.patt` in globals.css) so the pattern is strong
 * towards the right and gone before it reaches the text. The canvas inside is
 * drawn once, when the browser is idle after the page has painted, and drawn
 * again only if the frame changes size. Nothing moves.
 */
export default function Pattern({
  kind,
  seed = 0,
  tight = false,
}: {
  kind: PatternKind;
  seed?: number;
  /** A tighter fade for page openings, which have long headings and leads. */
  tight?: boolean;
}) {
  const frame = useRef<HTMLSpanElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = frame.current;
    const cv = canvas.current;
    if (!el || !cv) return;

    let wait = 0;
    let idle = 0;
    let drawn = "";

    const draw = () => {
      const { width, height } = el.getBoundingClientRect();
      const W = Math.round(width);
      const H = Math.round(height);
      if (!W || !H || drawn === `${W}x${H}`) return;
      drawn = `${W}x${H}`;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawPattern(ctx, kind, W, H, seed);
    };

    const schedule = () => {
      window.clearTimeout(wait);
      wait = window.setTimeout(() => {
        if ("requestIdleCallback" in window) {
          idle = window.requestIdleCallback(draw, { timeout: 800 });
        } else {
          draw();
        }
      }, 80);
    };

    schedule();
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    return () => {
      ro.disconnect();
      window.clearTimeout(wait);
      if ("cancelIdleCallback" in window) window.cancelIdleCallback(idle);
    };
  }, [kind, seed]);

  return (
    <span
      ref={frame}
      aria-hidden="true"
      className={`patt${tight ? " patt-tight" : ""}`}
    >
      <canvas
        ref={canvas}
        className="patt-canvas"
        style={{ opacity: PATTERN_OPACITY[kind] }}
      />
    </span>
  );
}

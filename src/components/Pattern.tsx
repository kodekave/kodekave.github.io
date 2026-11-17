"use client";

import { useEffect, useRef, useState } from "react";
import {
  drawPattern,
  PATTERN_OPACITY,
  type PatternFocus,
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
  focus,
  lazy = false,
  boost = 1,
  className = "",
}: {
  kind: PatternKind;
  seed?: number;
  /** A tighter fade for page openings, which have long headings and leads. */
  tight?: boolean;
  /** Centre the drawing on something in the page (see PatternFocus). */
  focus?: PatternFocus;
  /**
   * Draw only once the frame is within about a screen of the viewport, and
   * mark it `data-drawn` when it has been, so it can fade in. For the plates
   * down a page (PatternTrail), most of which are never reached.
   */
  lazy?: boolean;
  /** Multiplies the pattern's usual strength (PATTERN_OPACITY), up to full. */
  boost?: number;
  className?: string;
}) {
  const frame = useRef<HTMLSpanElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = frame.current;
    const cv = canvas.current;
    if (!el || !cv) return;

    let wait = 0;
    let idle = 0;
    let drawn = "";
    let started = !lazy;

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
      drawPattern(ctx, kind, W, H, seed, focus);
      setShown(true);
    };

    const schedule = () => {
      if (!started) return;
      window.clearTimeout(wait);
      wait = window.setTimeout(() => {
        if ("requestIdleCallback" in window) {
          idle = window.requestIdleCallback(draw, { timeout: lazy ? 300 : 800 });
        } else {
          draw();
        }
      }, 80);
    };

    let io: IntersectionObserver | undefined;
    if (lazy) {
      io = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          started = true;
          io?.disconnect();
          schedule();
        },
        { rootMargin: "800px 0px" }
      );
      io.observe(el);
    } else {
      schedule();
    }
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    return () => {
      io?.disconnect();
      ro.disconnect();
      window.clearTimeout(wait);
      if ("cancelIdleCallback" in window) window.cancelIdleCallback(idle);
    };
  }, [kind, seed, focus, lazy]);

  return (
    <span
      ref={frame}
      aria-hidden="true"
      data-drawn={lazy ? shown : undefined}
      className={`patt${tight ? " patt-tight" : ""}${focus === "portrait" ? " patt-focus" : ""}${
        className ? ` ${className}` : ""
      }`}
    >
      <canvas
        ref={canvas}
        className="patt-canvas"
        style={{ opacity: Math.min(1, PATTERN_OPACITY[kind] * boost) }}
      />
    </span>
  );
}

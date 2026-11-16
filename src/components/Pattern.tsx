"use client";

import { useEffect, useRef } from "react";
import { drawPattern, type PatternKind } from "@/lib/patterns";

/**
 * One generated background pattern, behind a page's opening. The outer span
 * is the faded frame (`.patt` in globals.css masks it to nothing before it
 * reaches the text); the canvas inside is a square that is drawn once, after
 * the page has painted, and never again unless the screen is resized.
 */
export default function Pattern({
  kind,
  seed = 0,
}: {
  kind: PatternKind;
  seed?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    let raf = 0;
    let idle = 0;
    const draw = () => {
      const css = canvas.getBoundingClientRect().width;
      if (!css) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const px = Math.round(css * dpr);
      if (canvas.width !== px) {
        canvas.width = px;
        canvas.height = px;
      }
      drawPattern(canvas, kind, seed);
    };
    const later = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        window.clearTimeout(idle);
        idle = window.setTimeout(draw, 60);
      });
    };

    later();
    window.addEventListener("resize", later);
    return () => {
      window.removeEventListener("resize", later);
      cancelAnimationFrame(raf);
      window.clearTimeout(idle);
    };
  }, [kind, seed]);

  return (
    <span aria-hidden="true" className="patt">
      <canvas ref={ref} className="patt-canvas" />
    </span>
  );
}

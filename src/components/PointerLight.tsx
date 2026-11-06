"use client";

import { useEffect, useRef } from "react";

/**
 * Lights the engraving under the cursor.
 *
 * Renders nothing itself. It finds its parent (the hero) and the second,
 * brighter copy of the portrait inside it, and feeds the pointer position to
 * that copy as CSS variables; the mask in globals.css does the rest. The
 * layer only exists for a fine pointer without a reduced-motion preference —
 * on touch it is `display: none` and none of this runs.
 */
export default function PointerLight({
  target = ".plate-lit",
}: {
  target?: string;
}) {
  const marker = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const host = marker.current?.parentElement;
    const lit = host?.querySelector<HTMLElement>(target);
    if (!host || !lit) return;
    if (
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let frame = 0;
    let x = 0;
    let y = 0;

    const paint = () => {
      frame = 0;
      const box = lit.getBoundingClientRect();
      lit.style.setProperty("--mx", `${x - box.left}px`);
      lit.style.setProperty("--my", `${y - box.top}px`);
      // The bloom is positioned against the hero itself, not the portrait.
      const hostBox = host.getBoundingClientRect();
      host.style.setProperty("--gx", `${x - hostBox.left}px`);
      host.style.setProperty("--gy", `${y - hostBox.top}px`);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX;
      y = e.clientY;
      lit.style.setProperty("--lit", "1");
      host.style.setProperty("--glow", "1");
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const leave = () => {
      lit.style.setProperty("--lit", "0");
      host.style.setProperty("--glow", "0");
    };

    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);
    return () => {
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(frame);
    };
  }, [target]);

  return <span ref={marker} aria-hidden="true" hidden />;
}

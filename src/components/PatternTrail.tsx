"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Pattern from "./Pattern";
import { patternForPath } from "@/lib/patterns";

/**
 * The page's own pattern, carried down the page as you scroll.
 *
 * A page opens with one drawing behind its heading. Below that the page was
 * plain paper, so this lays a plate of the same drawing in the margin every
 * screen or so, alternating left and right like the plates in a book, each a
 * different seed so no two match. It sits behind the content (the page's main
 * element is its own stacking context, see the site layout) and every plate is
 * masked so it is strongest at the page edge and gone before it reaches the
 * text.
 *
 * Plates are drawn only when they come within a screen of the viewport and
 * fade in once drawn (see `lazy` on Pattern), so a long page costs nothing for
 * the parts nobody scrolls to, and nothing is drawn on the first paint.
 */

/** Distance from the top of the page to the first plate: below the opening. */
const FIRST = 780;
/** Distance between plates. */
const STEP = 1040;
/** Room a plate needs below its top, so none runs into the footer. */
const ROOM = 520;

export default function PatternTrail() {
  const pathname = usePathname();
  const kind = patternForPath(pathname);
  const root = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const page = root.current?.parentElement;
    if (!page) return;
    const measure = () => setHeight(Math.round(page.getBoundingClientRect().height));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(page);
    return () => ro.disconnect();
  }, []);

  const count = kind && height > FIRST + ROOM ? Math.floor((height - FIRST - ROOM) / STEP) + 1 : 0;

  return (
    <div ref={root} aria-hidden="true" className="trail">
      {kind &&
        Array.from({ length: count }, (_, i) => {
          const left = i % 2 === 0;
          return (
            <div
              key={`${kind}-${i}`}
              className={`trail-plate ${left ? "trail-plate-left" : "trail-plate-right"}`}
              style={{ top: FIRST + i * STEP + ((i * 3) % 4) * 36 }}
            >
              <Pattern kind={kind} seed={i + 1} lazy boost={1.7} focus="edge" className="patt-plate" />
            </div>
          );
        })}
    </div>
  );
}

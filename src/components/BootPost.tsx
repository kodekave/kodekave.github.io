"use client";

import { useEffect } from "react";

/**
 * The boot sequence: a POST screen that runs for about a second on the first
 * homepage visit of a session and resolves into the hero's status strip.
 *
 * It is CSS-only to show and to leave. The server HTML always contains it,
 * hidden; a tiny script in the document head (see layout.tsx) sets
 * `data-post` on <html> for a first visit with motion allowed, and only then
 * does `.post` display. Crawlers, visitors without scripting and anyone with
 * reduced motion never see it. The stylesheet removes it by itself at 1.3 s.
 *
 * This component only adds the way out: any key, click, tap or scroll ends it
 * on the spot, and the attribute is cleared once the hero has settled so a
 * later client-side return to the homepage does not replay it.
 */
export default function BootPost() {
  useEffect(() => {
    const root = document.documentElement;
    if (!root.hasAttribute("data-post")) return;
    const end = () => root.removeAttribute("data-post");
    const done = window.setTimeout(end, 3400);
    const events = ["keydown", "pointerdown", "wheel", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, end, { once: true, passive: true }));
    return () => {
      window.clearTimeout(done);
      events.forEach((e) => window.removeEventListener(e, end));
    };
  }, []);

  const line = (d: number) => ({ "--d": `${d}s` }) as React.CSSProperties;

  return (
    <div className="post" aria-hidden="true">
      <div className="post-inner">
        <p className="post-line" style={line(0.1)}>SYS-1 &nbsp;ROM 1.0</p>
        <p className="post-line" style={line(0.34)}>
          MEMORY ........ <span className="post-ok">OK</span>
        </p>
        <p className="post-line" style={line(0.56)}>
          PROFILE ....... <span className="post-ok">OK</span>
        </p>
        <p className="post-line" style={line(0.78)}>
          LINK .......... <span className="post-ok">UP</span>
        </p>
        <p className="post-line post-strip" style={line(0.94)}>
          <span className="text-brass">&#9646; Online</span>
          <span>UTC</span>
          <span>Base · India</span>
        </p>
      </div>
      <span className="post-skip">Esc to skip</span>
    </div>
  );
}

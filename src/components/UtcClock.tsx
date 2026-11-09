"use client";

import { useEffect, useState } from "react";

/**
 * A running UTC clock for the hero's status line. It renders placeholder
 * dashes on the server and until the first tick, so the static page never
 * claims a time it cannot know.
 */
export default function UtcClock({ className = "" }: { className?: string }) {
  const [time, setTime] = useState("--:--:--");

  useEffect(() => {
    const tick = () => setTime(new Date().toISOString().slice(11, 19));
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  return (
    <time className={`tabular ${className}`} suppressHydrationWarning>
      {time}
    </time>
  );
}

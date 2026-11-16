"use client";

import { useEffect, useState } from "react";

/**
 * The time where the work is based, India Standard Time, to the minute. It
 * renders a placeholder on the server and until the first tick, so the static
 * page never claims a time it cannot know.
 */
const format = () =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());

export default function LocalTime({ className = "" }: { className?: string }) {
  const [time, setTime] = useState("--:--");

  useEffect(() => {
    const tick = () => setTime(format());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 10_000);
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

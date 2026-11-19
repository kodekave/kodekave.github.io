"use client";

import { useEffect, useSyncExternalStore } from "react";
import { currentTheme, onTheme, setTheme, syncThemeColor, type Theme } from "@/lib/theme";

const subscribe = (notify: () => void) => onTheme(notify);
const server = (): Theme => "light";

/**
 * The switch for the dark theme: one icon button. It shows the moon on the light
 * page and the sun on the dark one, and which of the two is drawn is the
 * stylesheet's call (`.theme-toggle` in globals.css), read off <html>, so the
 * right icon is there on the first paint and the server's markup never differs
 * from the browser's. As a switch it is announced as "Dark mode", on or off.
 */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, currentTheme, server);
  const dark = theme === "dark";

  // The phone's address bar takes the page colour, also on the first load.
  useEffect(() => {
    syncThemeColor();
  }, [theme]);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark mode"
      title={dark ? "Switch to the light page" : "Switch to the dark page"}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className={`theme-toggle flex items-center justify-center text-ink-soft transition-colors hover:text-ink ${className}`}
    >
      <svg
        className="theme-moon"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.5 14.2A8.6 8.6 0 0 1 9.8 3.5a8.6 8.6 0 1 0 10.7 10.7z" />
      </svg>
      <svg
        className="theme-sun"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
      </svg>
    </button>
  );
}

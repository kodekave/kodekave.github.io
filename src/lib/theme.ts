/**
 * The colour theme: light (the paper) or dark. It is one attribute on <html>,
 * `data-theme`, and the palette in globals.css does the rest; nothing here
 * knows a colour except where a canvas or the cloud has to be told one.
 *
 * Which theme a visitor sees: the one they last chose with the toggle in the
 * nav, kept in this browser; until they choose, the one their device is set to.
 * `themeInit` runs in the page's head, before anything paints, so a dark page
 * never flashes light first. The admin editor is left light on purpose.
 */

export type Theme = "light" | "dark";

export const THEME_KEY = "theme";

/** Inline in <head>, ahead of first paint. Plain ES5 on purpose. */
export const themeInit = `(function(){try{
var d=document.documentElement,t=null;
try{t=localStorage.getItem("${THEME_KEY}")}catch(e){}
if(t!=="dark"&&t!=="light")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";
if(location.pathname.indexOf("/admin")===0)t="light";
d.setAttribute("data-theme",t);
}catch(e){}})();`;

const EVENT = "themechange";

export function currentTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

/** The page colour, so a phone's address bar follows the theme. */
export function syncThemeColor() {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  const paper = getComputedStyle(document.documentElement).getPropertyValue("--color-paper").trim();
  if (meta && paper) meta.content = paper;
}

/**
 * Switches the theme and remembers it. The colours of the page's own elements
 * ease across; a canvas hears `onTheme` and draws itself again.
 */
export function setTheme(next: Theme) {
  const root = document.documentElement;
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!calm) {
    root.classList.add("theme-anim");
    window.setTimeout(() => root.classList.remove("theme-anim"), 400);
  }
  root.dataset.theme = next;
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    // Private windows can refuse storage; the choice then lasts for the visit.
  }
  syncThemeColor();
  window.dispatchEvent(new CustomEvent<Theme>(EVENT, { detail: next }));
}

/** Calls `cb` whenever the theme changes. Returns the way to stop. */
export function onTheme(cb: (t: Theme) => void): () => void {
  const on = (e: Event) => cb((e as CustomEvent<Theme>).detail);
  window.addEventListener(EVENT, on);
  return () => window.removeEventListener(EVENT, on);
}

/** A custom property as the stylesheet has it, or `fallback` where it is unset. */
export function cssValue(name: string, fallback: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

/**
 * A palette colour as an "r, g, b" string, so a canvas can set its own alpha.
 * Reads the custom property as the stylesheet has it (a #rrggbb), so the theme
 * is the one place the colour is written.
 */
export function cssRgb(name: string, fallback: string): string {
  const hex = cssValue(name, "").replace("#", "");
  if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(hex)) return fallback;
  const n = parseInt(hex.length === 3 ? hex.replace(/./g, "$&$&") : hex, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

/** The same, as three 0 to 1 numbers, for a shader. */
export function cssUnit(name: string, fallback: [number, number, number]): [number, number, number] {
  const parts = cssRgb(name, "").split(",").map((v) => parseInt(v, 10) / 255);
  return parts.length === 3 && parts.every((v) => Number.isFinite(v))
    ? [parts[0], parts[1], parts[2]]
    : fallback;
}

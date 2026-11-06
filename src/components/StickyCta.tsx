"use client";

import { useEffect, useState } from "react";
import Arrow from "./Arrow";

/**
 * A persistent way to act, shown only when it is not redundant.
 *
 * The page already asks in its first screen and again in its close; between
 * the two, a visitor who has made up their mind has nothing to click. This
 * floats in after the opening card and steps aside whenever one of the named
 * sections (the card, the closing band, the newsletter) is on screen.
 */
export default function StickyCta({
  href,
  label,
  hideWhileVisible,
}: {
  href: string;
  label: string;
  /** Element ids whose visibility should hide the button. */
  hideWhileVisible: string[];
}) {
  const [show, setShow] = useState(false);
  const key = hideWhileVisible.join("|");

  useEffect(() => {
    const els = key
      .split("|")
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    const onScreen = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) onScreen.add(entry.target);
          else onScreen.delete(entry.target);
        }
        setShow(onScreen.size === 0);
      },
      { threshold: 0.08 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [key]);

  return (
    <a
      href={href}
      tabIndex={show ? 0 : -1}
      aria-hidden={!show}
      className={`sticky-cta label ${show ? "is-on" : ""}`}
    >
      {label}
      <Arrow className="btn-arrow" />
    </a>
  );
}

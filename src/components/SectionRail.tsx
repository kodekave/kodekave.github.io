"use client";

import { useEffect, useState } from "react";

type RailItem = { id: string; label: string; tone: "ink" | "paper" };

/**
 * A ruler down the left edge of wide screens: a tick and a numeral for each
 * section, with the current one lit in brass. It tells a reader where they are
 * in a long page and doubles as a way to jump.
 *
 * It colours itself for the field it is over (the sections alternate between
 * dark and light), and stays out of sight while the opening card or the
 * footer is on screen. Below the xl breakpoint the page has no side margin to
 * put it in, so it is not shown.
 */
export default function SectionRail({
  items,
  hideWhileVisible,
}: {
  items: RailItem[];
  /** Element ids that hide the rail while they are mid-screen. */
  hideWhileVisible: string[];
}) {
  const [active, setActive] = useState<string | null>(null);
  const [off, setOff] = useState(true);
  const itemKey = items.map((i) => i.id).join("|");
  const hideKey = hideWhileVisible.join("|");

  useEffect(() => {
    const itemIds = itemKey.split("|");
    const hideIds = hideKey.split("|");
    const els = [...itemIds, ...hideIds]
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    // A thin band across the middle of the screen: whichever section is in it
    // is the one being read.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (hideIds.includes(entry.target.id)) {
            setOff(entry.isIntersecting);
          } else if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [itemKey, hideKey]);

  const current = items.find((i) => i.id === active);

  return (
    <nav
      aria-label="Page sections"
      data-tone={current?.tone ?? "paper"}
      className={`section-rail hidden xl:block ${off ? "is-off" : ""}`}
    >
      <ol>
        {items.map((item, i) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={item.id === active ? "true" : undefined}
              className={`rail-link ${item.id === active ? "is-active" : ""}`}
            >
              <span aria-hidden="true" className="rail-tick" />
              <span aria-hidden="true" className="rail-num label tabular">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="sr-only">{item.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

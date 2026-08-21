"use client";

import { useLayoutEffect, useRef, useState } from "react";

export default function Reveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  /** Stagger delay in ms, applied only once the element is visible. */
  delay?: number;
  direction?: "up" | "none";
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Content is visible by default so it works with JS disabled and for
  // crawlers that don't render JS. useLayoutEffect below may flip this to
  // false — before the browser paints — only for elements confirmed to
  // start off-screen, so there's no flash of hidden-then-shown content.
  const [visible, setVisible] = useState(true);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const rect = el.getBoundingClientRect();
    const alreadyInView = rect.top < window.innerHeight * 0.9;
    if (alreadyInView) return;

    setVisible(false);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const hidden = direction === "up" ? "opacity-0 translate-y-5" : "opacity-0";

  return (
    <div
      ref={ref}
      id={id}
      className={`transition-[opacity,transform] duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : hidden
      } ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

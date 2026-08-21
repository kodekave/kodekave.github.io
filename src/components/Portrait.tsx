"use client";

import { useEffect, useRef, useState } from "react";

export default function Portrait({
  src,
  alt,
  initials = "KK",
  className = "",
  rounded = "rounded-3xl",
  objectPosition = "50% 30%",
  tinted = true,
  kenBurns = false,
}: {
  src: string;
  alt: string;
  initials?: string;
  className?: string;
  rounded?: string;
  /** CSS object-position for the crop, e.g. "50% 20%" to favor the top of the frame. */
  objectPosition?: string;
  /** Blend the photo toward the brand palette (navy shadows, khaki highlights). */
  tinted?: boolean;
  /** Slow, subtle zoom for a more immersive feel. Use sparingly — one hero shot, not every thumbnail. */
  kenBurns?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // An <img> that 404s before React hydrates fires its error event with no
  // listener attached yet, so check the already-settled state on mount too.
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth === 0) {
      setFailed(true);
    }
  }, []);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-accent-soft via-cream to-accent/20 ${rounded} ${className}`}
      >
        <span className="font-display text-5xl text-accent-deep/70">
          {initials}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${rounded} ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        onError={() => setFailed(true)}
        style={{
          objectPosition,
          filter: tinted ? "saturate(0.8) contrast(1.05)" : undefined,
        }}
        className={`absolute inset-0 h-full w-full object-cover ${
          kenBurns ? "animate-slow-zoom" : ""
        }`}
      />
      {tinted && (
        <>
          <div
            className="absolute inset-0 mix-blend-multiply"
            style={{ background: "var(--color-accent-deep)", opacity: 0.22 }}
          />
          <div
            className="absolute inset-0 mix-blend-soft-light"
            style={{
              background:
                "linear-gradient(155deg, transparent 40%, #c0b283 100%)",
              opacity: 0.55,
            }}
          />
        </>
      )}
    </div>
  );
}

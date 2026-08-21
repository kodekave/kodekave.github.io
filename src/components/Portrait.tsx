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
  windowGrid = false,
  sizes = "(max-width: 768px) 90vw, 430px",
  priority = false,
}: {
  /**
   * Base path with no extension or density suffix, e.g. "/images/hero".
   * The component expects pre-generated variants beside it:
   *   <base>-1x.avif  <base>-2x.avif
   *   <base>-1x.webp  <base>-2x.webp
   *   <base>-1x.jpg   <base>-2x.jpg   (fallback)
   * `output: "export"` disables the Next image optimiser, so variants are
   * generated at commit time rather than on request. See README.
   */
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
  /** Thin architectural mullion lines over the photo. Use sparingly — one hero shot, not every thumbnail. */
  windowGrid?: boolean;
  /** Rendered width at each breakpoint, so the browser picks the right file. */
  sizes?: string;
  /** Set on the above-the-fold hero only — this is the LCP element there. */
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // An <img> that 404s before React hydrates fires its error event with no
  // listener attached yet, so the already-settled state has to be checked on
  // mount too. But "complete with no intrinsic width" is ambiguous inside a
  // <picture>: it also describes an image whose selected <source> simply has
  // not finished decoding. Treating that as a failure hid the photo behind
  // the initials placeholder, so confirm with a probe before giving up.
  useEffect(() => {
    const el = imgRef.current;
    if (!el || !el.complete || el.naturalWidth !== 0) return;

    const url = el.currentSrc || el.src;
    if (!url) return;

    let cancelled = false;
    const probe = new Image();
    probe.onerror = () => {
      if (!cancelled) setFailed(true);
    };
    probe.src = url;

    return () => {
      cancelled = true;
    };
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
      <picture>
        <source
          type="image/avif"
          sizes={sizes}
          srcSet={`${src}-1x.avif 416w, ${src}-2x.avif 832w`}
        />
        <source
          type="image/webp"
          sizes={sizes}
          srcSet={`${src}-1x.webp 416w, ${src}-2x.webp 832w`}
        />
        <img
          ref={imgRef}
          src={`${src}-2x.jpg`}
          srcSet={`${src}-1x.jpg 416w, ${src}-2x.jpg 832w`}
          sizes={sizes}
          alt={alt}
          width={832}
          height={1248}
          decoding={priority ? "sync" : "async"}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          onError={() => setFailed(true)}
          style={{
            objectPosition,
            filter: tinted
              ? "grayscale(1) contrast(1.15) brightness(1.1)"
              : undefined,
          }}
          className={`absolute inset-0 h-full w-full object-cover ${
            kenBurns ? "animate-slow-zoom" : ""
          }`}
        />
      </picture>
      {tinted && (
        <>
          <div
            className="absolute inset-0 mix-blend-color"
            style={{
              background:
                "linear-gradient(160deg, #192231 0%, #404a42 45%, #c0b283 100%)",
            }}
          />
          <div className="absolute inset-0 bg-cream/15" />
        </>
      )}
      {windowGrid && (
        <svg
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
          aria-hidden
        >
          <line
            x1="23%"
            y1="0"
            x2="23%"
            y2="100%"
            stroke="var(--color-cream)"
            strokeOpacity="0.4"
          />
          <line
            x1="70%"
            y1="0"
            x2="70%"
            y2="100%"
            stroke="var(--color-cream)"
            strokeOpacity="0.25"
          />
          <line
            x1="0"
            y1="17%"
            x2="100%"
            y2="17%"
            stroke="var(--color-cream)"
            strokeOpacity="0.3"
          />
        </svg>
      )}
    </div>
  );
}

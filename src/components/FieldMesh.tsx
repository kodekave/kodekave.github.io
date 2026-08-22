import { STREAMLINES } from "@/lib/mesh-streamlines";

/**
 * Hero backdrop: a structured computational mesh deformed by an invisible
 * body. Geometry and the reasoning behind it live in
 * `scripts/generate-mesh.py`.
 *
 * Split in two on purpose:
 *
 * - The static grid is a cached SVG file, art-directed into landscape and
 *   portrait variants. One landscape file under `object-fit: cover` showed
 *   only ~20% of its width on a phone, and that slice missed the void
 *   entirely.
 * - The three animated streamlines are inlined so page CSS drives them.
 *   Animation inside an `<img>`-referenced SVG is inconsistent across engines
 *   and the dashes were reported static on mobile; inline, the behaviour is
 *   unambiguous and `prefers-reduced-motion` applies. Only these three paths
 *   are inlined — the heavy static grid stays a cached file.
 *
 * Both layers use the same viewBox and `slice`/`cover` behaviour, so they
 * stay registered with each other at any size.
 *
 * Entirely decorative: aria-hidden, empty alt, pointer-events-none.
 */
export default function FieldMesh({ className = "" }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <picture>
        <source
          media="(min-width: 768px)"
          srcSet="/images/field-mesh.svg"
          width={1200}
          height={760}
        />
        <img
          src="/images/field-mesh-portrait.svg"
          alt=""
          width={640}
          height={1100}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </picture>

      {(["portrait", "landscape"] as const).map((key) => (
        <svg
          key={key}
          viewBox={STREAMLINES[key].viewBox}
          preserveAspectRatio="xMidYMid slice"
          focusable="false"
          className={`absolute inset-0 h-full w-full ${
            key === "landscape"
              ? "fm-fade-x hidden md:block"
              : "fm-fade-y block md:hidden"
          }`}
        >
          <g
            fill="none"
            stroke="var(--color-ink-soft)"
            strokeWidth="1.4"
            strokeOpacity="0.5"
          >
            {STREAMLINES[key].paths.map((d, i) => (
              <path
                key={i}
                d={d}
                className="fm-stream"
                style={{ animationDelay: `${i * -6}s` }}
              />
            ))}
          </g>
        </svg>
      ))}
    </div>
  );
}

import { useId } from "react";

const PITCH = 10;
/** Dot radius for each row, smallest at the top. The last rows overlap, so the
    band closes up solid against the section beneath it. */
const RADII = [0.5, 1, 1.6, 2.3, 3, 3.7, 4.4, 5.1, 5.8];

/**
 * A band between two sections where dots swell until they merge into the
 * field below — the halftone screen from the portrait engraving, used as the
 * seam where one field hands over to the next.
 *
 * `field` is the colour of the section above; `dot` is the colour of the
 * section below, which the dots grow into. The band carries the same grain as
 * the sections, so it does not show as a stripe.
 */
export default function HalftoneDivider({
  field,
  dot,
}: {
  field: "paper" | "mist" | "ink";
  dot: "paper" | "ink";
}) {
  const id = useId();
  const surface =
    field === "ink" ? "on-ink" : field === "paper" ? "on-paper" : "bg-mist";

  return (
    <div aria-hidden="true" className={`${surface} grain`}>
      <svg
        width="100%"
        height={RADII.length * PITCH}
        className={`block ${dot === "ink" ? "text-ink" : "text-paper"}`}
      >
        <defs>
          {RADII.map((r, i) => (
            <pattern
              key={i}
              id={`${id}-${i}`}
              width={PITCH}
              height={PITCH}
              patternUnits="userSpaceOnUse"
              patternTransform={`translate(${i % 2 ? PITCH / 2 : 0} 0)`}
            >
              <circle cx={PITCH / 2} cy={PITCH / 2} r={r} fill="currentColor" />
            </pattern>
          ))}
        </defs>
        {RADII.map((_, i) => (
          <rect
            key={i}
            x="0"
            y={i * PITCH}
            width="100%"
            height={PITCH}
            fill={`url(#${id}-${i})`}
          />
        ))}
        <rect x="0" y={RADII.length * PITCH - 1} width="100%" height="1" fill="currentColor" />
      </svg>
    </div>
  );
}

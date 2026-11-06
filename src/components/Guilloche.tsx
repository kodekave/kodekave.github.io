import { useId } from "react";

/**
 * A guilloche rosette — the interlaced fine-line pattern engraved onto
 * banknotes, share certificates and the lining of good envelopes.
 *
 * One closed hypotrochoid is drawn once and stamped around the centre at
 * even angles; the overlap of the stamped copies is what weaves the pattern,
 * so the whole rosette costs a few kilobytes however dense it looks. Drawn
 * from currentColor with a non-scaling hairline, so it takes its colour from
 * whatever field it sits on and stays a hairline at any size.
 */
function curve(): string {
  // Hypotrochoid, R=8 r=3: closes after three turns, five-lobed.
  const R = 8;
  const r = 3;
  const d = 3.1;
  const steps = 540;
  const k = (R - r) / r;
  const scale = 46 / (R - r + d);
  let path = "";
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 6;
    const x = ((R - r) * Math.cos(t) + d * Math.cos(k * t)) * scale;
    const y = ((R - r) * Math.sin(t) - d * Math.sin(k * t)) * scale;
    path += `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return path + "Z";
}

const PATH = curve();

export default function Guilloche({
  className = "",
  copies = 36,
}: {
  className?: string;
  /** How many rotated copies weave the rosette. */
  copies?: number;
}) {
  const id = useId();
  return (
    <svg
      viewBox="-50 -50 100 100"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        <path
          id={id}
          d={PATH}
          stroke="currentColor"
          strokeWidth="0.55"
          vectorEffect="non-scaling-stroke"
        />
      </defs>
      {Array.from({ length: copies }, (_, i) => (
        <use
          key={i}
          href={`#${id}`}
          transform={`rotate(${((360 / copies / 5) * i).toFixed(3)})`}
        />
      ))}
    </svg>
  );
}

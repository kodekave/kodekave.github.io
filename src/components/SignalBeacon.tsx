import LinkedInMark from "./LinkedInMark";

/**
 * The way to LinkedIn, drawn as a radar. A sweep turns inside four range
 * rings, a few blips come and go, and the name and the invitation run round
 * the outside edge on a slowly turning ring. The whole instrument is one link
 * to the profile, with an "in" mark at its centre that fills with brass when
 * it is pointed at or focused.
 *
 * Pure SVG and CSS: nothing here needs JavaScript, and with reduced motion
 * everything stops where it is.
 */
export default function SignalBeacon({
  href,
  name,
  className = "",
}: {
  href: string;
  name: string;
  className?: string;
}) {
  const ring = `${name.toUpperCase()} · CONNECT ON LINKEDIN · OPEN A CHANNEL · `;
  // Ten-degree wedges, brightest at the leading edge, so the sweep leaves a
  // fading trail without a conic gradient (which SVG does not have).
  const wedges = Array.from({ length: 9 }, (_, i) => i);
  const R = 150;
  const wedge = (i: number) => {
    const a0 = (-(i + 1) * 9 * Math.PI) / 180;
    const a1 = (-i * 9 * Math.PI) / 180;
    const p = (a: number) => `${220 + R * Math.cos(a)} ${220 + R * Math.sin(a)}`;
    return `M220 220 L${p(a1)} A${R} ${R} 0 0 0 ${p(a0)} Z`;
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="me noopener noreferrer"
      aria-label={`Connect with ${name} on LinkedIn (opens in a new tab)`}
      className={`beacon block ${className}`}
    >
      <svg
        viewBox="0 0 440 440"
        className="h-full w-full"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <path
            id="beacon-ring"
            d="M220 220 m-188 0 a188 188 0 1 1 376 0 a188 188 0 1 1 -376 0"
          />
        </defs>

        {/* Range rings and the cross */}
        {[50, 90, 130, 150].map((r) => (
          <circle
            key={r}
            cx="220"
            cy="220"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeOpacity={r === 150 ? 0.34 : 0.16}
            strokeDasharray={r === 90 ? "2 5" : undefined}
          />
        ))}
        <path
          d="M220 56v328M56 220h328"
          stroke="currentColor"
          strokeOpacity="0.14"
        />
        {/* Tick marks every 15 degrees on the outer range ring */}
        {Array.from({ length: 24 }, (_, i) => {
          const a = (i * 15 * Math.PI) / 180;
          const long = i % 6 === 0;
          const r0 = 150;
          const r1 = long ? 140 : 144;
          return (
            <line
              key={i}
              x1={220 + r0 * Math.cos(a)}
              y1={220 + r0 * Math.sin(a)}
              x2={220 + r1 * Math.cos(a)}
              y2={220 + r1 * Math.sin(a)}
              stroke="currentColor"
              strokeOpacity={long ? 0.5 : 0.28}
            />
          );
        })}

        {/* The sweep */}
        <g className="beacon-sweep">
          {wedges.map((i) => (
            <path
              key={i}
              d={wedge(i)}
              className="text-brass"
              fill="currentColor"
              fillOpacity={0.3 * (1 - i / 9)}
            />
          ))}
          <line
            x1="220"
            y1="220"
            x2={220 + R}
            y2="220"
            className="text-brass"
            stroke="currentColor"
            strokeOpacity="0.9"
          />
        </g>

        {/* Blips */}
        {[
          [300, 140, 0],
          [150, 285, 1.3],
          [268, 296, 2.4],
          [172, 168, 3.2],
        ].map(([x, y, d]) => (
          <rect
            key={`${x}-${y}`}
            x={x - 2.5}
            y={y - 2.5}
            width="5"
            height="5"
            className="beacon-blip text-brass"
            fill="currentColor"
            style={{ animationDelay: `${d}s` }}
          />
        ))}

        {/* The turning ring of type */}
        <g className="beacon-text">
          <text className="beacon-ring-text" fill="currentColor">
            {/* 2 * pi * 188: the string is stretched to close the circle. */}
            <textPath
              href="#beacon-ring"
              startOffset="0"
              textLength="1180"
              lengthAdjust="spacing"
            >
              {ring.repeat(2)}
            </textPath>
          </text>
        </g>

        {/* The centre: the connect button */}
        <circle
          cx="220"
          cy="220"
          r="38"
          className="beacon-core"
          strokeWidth="1.2"
        />
      </svg>

      <span className="beacon-mark" aria-hidden="true">
        <LinkedInMark className="h-7 w-7" />
      </span>
    </a>
  );
}

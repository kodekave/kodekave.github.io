export type Motif =
  | "orbit"
  | "blink"
  | "flow"
  | "stars"
  | "ledger"
  | "arm"
  | "braille";

/**
 * The seven instruments the trace turns into, one per stage of the journey.
 *
 * Each is a small line drawing on a 300 x 200 field, and each is driven by a
 * single number: `--p`, the 0-to-1 progress of its station through the screen,
 * set by Trace.tsx as the page scrolls. Lines draw themselves (`.draw`), parts
 * fade in (`.fade`), and a few things move (the planet, the asteroid, the arm).
 * `.s1` / `.s2` / `.s3` stage a part into the first, middle or last third of
 * the scroll. With `--p` at 1, which is the default, every drawing is complete,
 * so nothing here needs JavaScript to be seen.
 *
 * They are schematics. Nothing in them is data.
 */
export default function TraceArt({ motif }: { motif: Motif }) {
  return (
    <svg
      viewBox="0 0 300 200"
      className="trace-art-svg"
      aria-hidden="true"
      focusable="false"
    >
      {ART[motif]}
    </svg>
  );
}

/** The elbow used by the flow drawing: a run, a quarter-turn, a drop. */
const elbow = (d: number) =>
  `M30 ${70 - d} H150 A${60 + d} ${60 + d} 0 0 1 ${210 + d} 130 V185`;

/** Braille cells for T (dots 2-3-4-5) and H (dots 1-2-5): Travel Hands. */
const CELLS: { letter: string; x: number; dots: number[] }[] = [
  { letter: "T", x: 92, dots: [2, 3, 4, 5] },
  { letter: "H", x: 178, dots: [1, 2, 5] },
];
/** Dot number to column and row: 1-2-3 down the left, 4-5-6 down the right. */
const dotAt = (n: number) => ({ col: n > 3 ? 1 : 0, row: (n - 1) % 3 });

const ART: Record<Motif, React.ReactNode> = {
  /* 2019 — space education: two orbits draw, and a planet runs round one. */
  orbit: (
    <>
      <ellipse className="draw guide" cx="150" cy="100" rx="70" ry="30" pathLength={1} />
      <ellipse className="draw" cx="150" cy="100" rx="118" ry="50" pathLength={1} />
      <circle className="solid" cx="150" cy="100" r="6" />
      {/* The outer orbit is a circle of radius 118 squashed to 50 high, so the
          planet can simply turn about the centre. Its own shape is stretched
          and counter-turned so it still reads as round. */}
      <g transform="translate(150 100) scale(1 0.4237)">
        <g className="orbit-spin">
          <ellipse className="solid orbit-planet" cx="118" cy="0" rx="7" ry="16.5" />
        </g>
      </g>
      <path className="guide" d="M150 30V44M150 156V170M20 100H34M266 100H280" />
    </>
  ),

  /* 2020 — the asteroid search: fixed stars, and one dot that moves between frames. */
  blink: (
    <>
      <rect className="guide" x="26" y="22" width="248" height="156" />
      {[
        [58, 52], [102, 132], [140, 70], [186, 150], [222, 48],
        [246, 112], [70, 104], [164, 108], [118, 40],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} className="dim" cx={x} cy={y} r="1.8" />
      ))}
      <path className="draw dashed" d="M84 142 L204 92" pathLength={1} />
      <g className="blink-move">
        <circle className="solid" cx="84" cy="142" r="4" />
        <path d="M72 134V130H76M96 134V130H92M72 150V154H76M96 150V154H92" />
      </g>
      <text className="note" x="34" y="170">A</text>
      <text className="note fade s3" x="258" y="38">B</text>
    </>
  ),

  /* 2021 — CFD on a phone: streamlines through the elbow, and the continuity equation. */
  flow: (
    <>
      <path className="guide" d={elbow(26)} />
      <path className="guide" d={elbow(-26)} />
      <path className="draw s1" d={elbow(16)} pathLength={1} />
      <path className="draw s1" d={elbow(-16)} pathLength={1} />
      <path className="draw s2" d={elbow(5)} pathLength={1} />
      <path className="draw s2" d={elbow(-5)} pathLength={1} />
      <text className="eq fade s3" x="30" y="150">∇·U = 0</text>
    </>
  ),

  /* 2022 — space-tech and stargazing: a constellation joins up, star by star. */
  stars: (
    <>
      <circle className="guide" cx="150" cy="100" r="86" />
      <path className="guide" d="M150 14V30M150 170V186M64 100H80M220 100H236" />
      <path
        className="draw"
        d="M70 138 L108 84 L150 112 L188 58 L230 96 L208 148"
        pathLength={1}
      />
      {(
        [
          [70, 138, "s1"], [108, 84, "s1"], [150, 112, "s2"],
          [188, 58, "s2"], [230, 96, "s3"], [208, 148, "s3"],
        ] as const
      ).map(([x, y, s]) => (
        <circle key={`${x}-${y}`} className={`solid fade ${s}`} cx={x} cy={y} r="4.5" />
      ))}
    </>
  ),

  /* 2023 — the ledger: bars climb, the last one in brass, with the figure it reached. */
  ledger: (
    <>
      <path className="guide" d="M36 172H264" />
      {(
        [
          [56, 34, "s1"], [100, 52, "s1"], [144, 76, "s2"], [188, 104, "s2"],
        ] as const
      ).map(([x, h, s]) => (
        <rect key={x} className={`bar ${s}`} x={x} y={172 - h} width="26" height={h} />
      ))}
      <rect className="bar bar-top s3" x="232" y="42" width="26" height="130" />
      <path
        className="draw dashed"
        d="M69 132 L113 114 L157 90 L201 62 L245 36"
        pathLength={1}
      />
      <text className="figure fade s3" x="36" y="56">250%</text>
    </>
  ),

  /* 2025 — AI and robotics: an arm unfolds joint by joint; the books close beside it. */
  arm: (
    <>
      <path className="guide" d="M30 176H270" />
      <rect className="solid" x="52" y="160" width="44" height="16" />
      <g className="arm-1">
        <path d="M74 160H154" />
        <circle className="solid" cx="74" cy="160" r="5" />
        <g className="arm-2">
          <path d="M154 160H222" />
          <circle className="solid" cx="154" cy="160" r="5" />
          <g className="arm-3">
            <circle className="solid" cx="222" cy="160" r="4" />
            <path d="M222 160H240M240 152V168M240 152H250M240 168H250" />
          </g>
        </g>
      </g>
      <text className="note fade s3" x="36" y="40">₹ ⇄ $</text>
      <text className="note fade s3" x="36" y="58">CLOSE 100%</text>
    </>
  ),

  /* 2026 — accessibility tech: the lamps settle into braille. T, H: Travel Hands. */
  braille: (
    <>
      {CELLS.map((cell, c) => (
        <g key={cell.letter}>
          <rect className="guide" x={cell.x - 22} y="34" width="74" height="112" />
          {[1, 2, 3, 4, 5, 6].map((n) => {
            const { col, row } = dotAt(n);
            const i = cell.dots.indexOf(n);
            // The first cell lights early, the second late, two dots at a time.
            const stage = c === 0 ? (i < 2 ? "s1" : "s2") : i < 2 ? "s2" : "s3";
            return (
              <circle
                key={n}
                className={i >= 0 ? `solid fade ${stage}` : "dim"}
                cx={cell.x + col * 30}
                cy={58 + row * 32}
                r={i >= 0 ? 8 : 3}
              />
            );
          })}
          <text className="note fade s3" x={cell.x + 9} y="172">
            {cell.letter}
          </text>
        </g>
      ))}
    </>
  ),
};

export type Motif =
  | "orbit"
  | "blink"
  | "flow"
  | "stars"
  | "ledger"
  | "arm"
  | "braille";

/**
 * The seven small line drawings, one per stop of the journey: an orbit, an
 * asteroid between two frames, streamlines through an elbow, a constellation,
 * a ledger, a robot arm and two braille cells. All are drawn on one 300 x 200
 * field with one stroke weight (see `.stop-art` in globals.css), so they read
 * as a set. They are schematics: nothing in them is data.
 */
export default function StopArt({ motif }: { motif: Motif }) {
  return (
    <svg
      viewBox="0 0 300 200"
      className="stop-art"
      aria-hidden="true"
      focusable="false"
    >
      {ART[motif]}
    </svg>
  );
}

const elbow = (d: number) =>
  `M30 ${70 - d} H150 A${60 + d} ${60 + d} 0 0 1 ${210 + d} 130 V185`;

/** Braille cells for T (dots 2-3-4-5) and H (dots 1-2-5): Travel Hands. */
const CELLS: { letter: string; x: number; dots: number[] }[] = [
  { letter: "T", x: 92, dots: [2, 3, 4, 5] },
  { letter: "H", x: 178, dots: [1, 2, 5] },
];
const dotAt = (n: number) => ({ col: n > 3 ? 1 : 0, row: (n - 1) % 3 });

const ART: Record<Motif, React.ReactNode> = {
  orbit: (
    <>
      <ellipse className="g" cx="150" cy="100" rx="70" ry="30" />
      <ellipse cx="150" cy="100" rx="118" ry="50" />
      <circle className="s" cx="150" cy="100" r="6" />
      <ellipse className="s" cx="232" cy="136" rx="7" ry="16" transform="rotate(-18 232 136)" />
      <path className="g" d="M150 30V44M150 156V170M20 100H34M266 100H280" />
    </>
  ),
  blink: (
    <>
      <rect className="g" x="26" y="22" width="248" height="156" />
      {[
        [58, 52], [102, 132], [140, 70], [186, 150], [222, 48],
        [246, 112], [70, 104], [164, 108], [118, 40],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} className="d" cx={x} cy={y} r="1.8" />
      ))}
      <path d="M84 142 L204 92" strokeDasharray="4 5" />
      <circle className="s" cx="84" cy="142" r="4" />
      <circle className="s" cx="204" cy="92" r="4" />
      <text x="34" y="170">A</text>
      <text x="258" y="38">B</text>
    </>
  ),
  flow: (
    <>
      <path className="g" d={elbow(26)} />
      <path className="g" d={elbow(-26)} />
      <path d={elbow(16)} />
      <path d={elbow(-16)} />
      <path d={elbow(5)} />
      <path d={elbow(-5)} />
      <text className="big" x="30" y="150">∇·U = 0</text>
    </>
  ),
  stars: (
    <>
      <circle className="g" cx="150" cy="100" r="86" />
      <path className="g" d="M150 14V30M150 170V186M64 100H80M220 100H236" />
      <path d="M70 138 L108 84 L150 112 L188 58 L230 96 L208 148" />
      {[
        [70, 138], [108, 84], [150, 112], [188, 58], [230, 96], [208, 148],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} className="s" cx={x} cy={y} r="4.5" />
      ))}
    </>
  ),
  ledger: (
    <>
      <path className="g" d="M36 172H264" />
      {[
        [56, 34], [100, 52], [144, 76], [188, 104],
      ].map(([x, h]) => (
        <rect key={x} className="g" x={x} y={172 - h} width="26" height={h} />
      ))}
      <rect className="s" x="232" y="42" width="26" height="130" />
      <path d="M69 132 L113 114 L157 90 L201 62 L245 36" strokeDasharray="4 5" />
      <text className="big" x="36" y="56">250%</text>
    </>
  ),
  arm: (
    <>
      <path className="g" d="M30 176H270" />
      <rect className="s" x="52" y="160" width="44" height="16" />
      <path d="M74 160 L128 112 L196 120" />
      <circle className="s" cx="74" cy="160" r="5" />
      <circle className="s" cx="128" cy="112" r="5" />
      <circle className="s" cx="196" cy="120" r="4" />
      <path d="M196 120 L214 112 M214 104 V120 M214 104 H226 M214 120 H226" />
      <text x="36" y="40">₹ ⇄ $</text>
      <text x="36" y="58">CLOSE 100%</text>
    </>
  ),
  braille: (
    <>
      {CELLS.map((cell) => (
        <g key={cell.letter}>
          <rect className="g" x={cell.x - 22} y="34" width="74" height="112" />
          {[1, 2, 3, 4, 5, 6].map((n) => {
            const { col, row } = dotAt(n);
            const on = cell.dots.includes(n);
            return (
              <circle
                key={n}
                className={on ? "s" : "d"}
                cx={cell.x + col * 30}
                cy={58 + row * 32}
                r={on ? 8 : 3}
              />
            );
          })}
          <text x={cell.x + 9} y="172">{cell.letter}</text>
        </g>
      ))}
    </>
  ),
};

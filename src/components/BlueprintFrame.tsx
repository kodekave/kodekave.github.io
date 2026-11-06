/**
 * The hero's technical drawing: a hairline grid, a brass frame with
 * registration crosshairs at its corners, and a measuring scale ticked along
 * the top and left edges. It frames the first screen the way the social card
 * is framed, and is purely decorative.
 *
 * It sits above the scrims but below the content, so the lines read across the
 * dark field without ever crossing the type.
 */
export default function BlueprintFrame() {
  const corners = [
    "left-3 top-3 md:left-5 md:top-5",
    "right-3 top-3 md:right-5 md:top-5",
    "bottom-3 left-3 md:bottom-5 md:left-5",
    "bottom-3 right-3 md:bottom-5 md:right-5",
  ];

  return (
    <div aria-hidden="true" className="blueprint pointer-events-none absolute inset-0">
      <span className="blueprint-grid absolute inset-0" />
      <span className="absolute inset-3 border border-brass/30 md:inset-5" />
      <span className="blueprint-ticks-x absolute left-3 right-3 top-3 md:left-5 md:right-5 md:top-5" />
      <span className="blueprint-ticks-y absolute bottom-3 left-3 top-3 md:bottom-5 md:left-5 md:top-5" />
      {corners.map((pos) => (
        <span key={pos} className={`absolute h-5 w-5 ${pos} -translate-x-1/2 -translate-y-1/2`}>
          <span className="absolute left-0 top-1/2 h-px w-full bg-brass" />
          <span className="absolute left-1/2 top-0 h-full w-px bg-brass" />
        </span>
      ))}
    </div>
  );
}

import { route } from "@/lib/content";

/**
 * The four countries in the order they were operated in, set as a ruled
 * itinerary: a square mark per stop, the route code in the display face, the
 * country and years beneath. Drawn from currentColor throughout so the same
 * component sits on ink or on paper without a variant.
 *
 * Each stop is a button that turns the globe to face that place, so the
 * strip is the keyboard-reachable way to steer it.
 *
 * The connecting rule draws itself as the map scrolls into view, in browsers
 * that support scroll-driven animation; elsewhere it is simply already drawn.
 */
export default function RouteMap({
  selected = null,
  onSelect,
}: {
  /** Index of the stop the globe is facing, if the reader has chosen one. */
  selected?: number | null;
  /** Called with a stop's index when it is chosen. */
  onSelect?: (index: number) => void;
}) {
  return (
    <ol
      className="route"
      aria-label="Countries operated in, in chronological order"
    >
      {route.map((stop, i) => {
        const isLast = i === route.length - 1;
        return (
          <li
            key={stop.code}
            className={`route-stop ${selected === i ? "is-selected" : ""}`}
          >
            <button
              type="button"
              className="route-btn"
              aria-pressed={selected === i}
              aria-label={`Show ${stop.label} on the globe`}
              onClick={() => onSelect?.(i)}
            >
            <div className="flex items-center">
              {/* Square marks, not dots — the current stop is filled. */}
              <span
                aria-hidden="true"
                className={`route-mark h-2.5 w-2.5 flex-none border border-current ${
                  isLast ? "bg-current" : ""
                }`}
              />
              {!isLast && (
                <span
                  aria-hidden="true"
                  className="route-line ml-3 h-px flex-1 bg-current opacity-30"
                />
              )}
            </div>
            <span className="route-code font-display mt-6 block text-4xl leading-none sm:text-5xl">
              {stop.code}
            </span>
            {/* Years first: the country name can wrap in a narrow column,
                and the last line is the one that may safely run long. */}
            <span className="label mt-4 block leading-none opacity-55">
              {stop.years}
            </span>
            <span className="label mt-2 block leading-snug">{stop.label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

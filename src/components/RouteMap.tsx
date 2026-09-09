import { route } from "@/lib/content";

/**
 * The four countries in the order they were operated in. Drawn from
 * currentColor throughout so the same component sits on ink or on paper
 * without a variant.
 */
export default function RouteMap() {
  return (
    <ol
      className="flex items-start"
      aria-label="Countries operated in, in chronological order"
    >
      {route.map((stop, i) => {
        const isLast = i === route.length - 1;
        return (
          <li
            key={stop.code}
            className={`flex items-start ${isLast ? "flex-none" : "flex-1"}`}
          >
            <div className="flex flex-none flex-col gap-2.5">
              {/* Square marks, not dots — the current stop is filled. */}
              <span
                aria-hidden="true"
                className={`h-2 w-2 border border-current ${
                  isLast ? "bg-current" : ""
                }`}
              />
              <span className="label leading-none">{stop.code}</span>
              <span className="label leading-none opacity-55">
                {stop.years}
              </span>
              <span className="sr-only">{stop.label}</span>
            </div>
            {!isLast && (
              <span
                aria-hidden="true"
                className="mt-1 h-px flex-1 bg-current opacity-25"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

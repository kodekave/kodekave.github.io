import { route } from "@/lib/content";

export default function RouteMap() {
  return (
    <div
      className="flex items-start"
      role="list"
      aria-label="Countries operated in, in chronological order"
    >
      {route.map((stop, i) => {
        const isLast = i === route.length - 1;
        return (
          <div
            key={stop.code}
            className={`flex items-start ${isLast ? "flex-none" : "flex-1"}`}
          >
            <div
              role="listitem"
              className="flex flex-none flex-col items-center gap-2 text-center"
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isLast
                    ? "bg-khaki ring-2 ring-khaki/40 ring-offset-2 ring-offset-ink"
                    : "border-2 border-khaki bg-transparent"
                }`}
                aria-hidden
              />
              <span className="font-mono text-xs tracking-[0.2em] text-cream sm:text-sm">
                {stop.code}
              </span>
              <span className="text-[0.65rem] text-cream/50 sm:text-xs">
                {stop.years}
              </span>
            </div>
            {!isLast && (
              <div
                className="mt-[5px] h-px flex-1 border-t border-dashed border-cream/25"
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

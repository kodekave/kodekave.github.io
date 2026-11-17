import type { MapPlace } from "@/components/JourneyMap";
import { milestones, route, ventures } from "@/lib/content";

/**
 * The places worked, each with the stops that happened there, for the journey
 * map. They are the ones already on the Ventures page (`route` and `milestones`
 * in lib/content.ts); nothing here is new copy. A stage that is a venture
 * carries its role from the venture record, so that is written once.
 */
export function buildPlaces(): MapPlace[] {
  return route.map((r) => ({
    code: r.code,
    label: r.label,
    place: r.place,
    years: r.years,
    lat: r.lat,
    lon: r.lon,
    approx: r.approx,
    stops: milestones
      .filter((m) => m.place === r.code)
      .map((m) => {
        const v = m.slug ? ventures.find((x) => x.slug === m.slug) : undefined;
        return {
          year: m.year,
          title: v?.company ?? m.title,
          line: v?.role ?? m.note,
          href: v ? `/work#${v.slug}` : m.href,
          hrefLabel: v ? "Open the record" : m.hrefLabel,
        };
      }),
  }));
}

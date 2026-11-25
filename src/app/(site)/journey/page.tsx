import JourneyMap from "@/components/JourneyMap";
import { buildPlaces } from "@/lib/journey-places";
import {
  breadcrumbSchema,
  buildMetadata,
  jsonLdGraph,
  jsonLdScript,
} from "@/lib/seo";

export const metadata = buildMetadata({
  path: "/journey",
  title: "Journey: India, the Maldives, the US and the UK",
  description:
    "Four ventures across India, the Maldives, the US and the UK in more than six years, mapped place by place with the work done at each stop.",
});

/**
 * The journey, place by place, on its own page: the same card the homepage's
 * scroll scene forms from its point cloud. The places and the stops in each are
 * the ones already on the homepage and the Ventures page; nothing here is new
 * copy.
 */
export default function JourneyPage() {
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          jsonLdGraph(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Journey", path: "/journey" },
            ])
          )
        )}
      />

      <section className="on-paper">
        <div className="settle mx-auto max-w-6xl px-6 pb-24 pt-10 md:px-10 md:pt-14">
          <h1 className="sr-only">The journey</h1>
          <JourneyMap places={buildPlaces()} />
        </div>
      </section>
    </div>
  );
}

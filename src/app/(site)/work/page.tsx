import Reveal from "@/components/Reveal";
import Stamp from "@/components/Stamp";
import { countryCode, ventures } from "@/lib/content";
import { absoluteUrl } from "@/lib/site";
import {
  PERSON_ID,
  breadcrumbSchema,
  buildMetadata,
  jsonLdGraph,
  jsonLdScript,
} from "@/lib/seo";

export const metadata = buildMetadata({
  path: "/work",
  title: "Four Ventures, Four Countries: AI, Space-Tech, Hospitality",
  description:
    "The four early-stage ventures I have run a founder's office for — AI/robotics, space-tech, hospitality and investments, and accessibility tech."
});

export default function WorkPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          jsonLdGraph(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Work", path: "/work" },
            ]),
            {
              "@type": "ItemList",
              "@id": `${absoluteUrl("/work")}#ventures`,
              name: "Ventures operated for",
              itemListOrder: "https://schema.org/ItemListOrderDescending",
              numberOfItems: ventures.length,
              itemListElement: ventures.map((v, i) => ({
                "@type": "ListItem",
                position: i + 1,
                item: {
                  "@type": "Organization",
                  name: v.company,
                  description: v.summary,
                  ...(v.url ? { url: v.url } : {}),
                  address: {
                    "@type": "PostalAddress",
                    addressCountry: v.country,
                  },
                },
              })),
            },
            ...ventures.map((v) => ({
              "@type": "OrganizationRole",
              roleName: v.role,
              startDate: v.period,
              member: { "@id": PERSON_ID },
              memberOf: {
                "@type": "Organization",
                name: v.company,
                ...(v.url ? { url: v.url } : {}),
              },
            }))
          )
        )}
      />

      <Reveal>
        <p className="text-sm font-medium uppercase tracking-wide text-accent-deep">
          Work
        </p>
        <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">
          4 ventures, 4 countries.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-ink-soft">
          Every one of these is a founder who needed someone in the room from
          early on — for GTM, operations, fundraising, or all three.
        </p>
      </Reveal>

      <div className="mt-16 space-y-20">
        {ventures.map((v, i) => (
          <Reveal
            key={v.slug}
            id={v.slug}
            delay={i * 60}
            className="grid scroll-mt-24 gap-6 border-t border-line pt-10 md:grid-cols-[220px_1fr]"
          >
            <div>
              <Stamp>{countryCode(v.country)}</Stamp>
              <p className="mt-3 font-mono text-sm font-medium text-ink-faint">
                {v.period}
              </p>
              <p className="mt-1 text-sm text-ink-faint">{v.location}</p>
              {v.current && <Stamp className="mt-3">Current</Stamp>}
            </div>

            <div>
              <Stamp>{v.category}</Stamp>
              <h2 className="mt-4 font-display text-2xl text-ink sm:text-3xl">
                {v.url ? (
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-accent-deep"
                  >
                    {v.company}
                  </a>
                ) : (
                  v.company
                )}
              </h2>
              <p className="mt-1 text-ink-faint">{v.role}</p>
              <p className="mt-4 text-lg leading-relaxed text-ink-soft">
                {v.summary}
              </p>
              <ul className="mt-5 space-y-3">
                {v.highlights.map((h) => (
                  <li key={h} className="flex gap-3 text-sm text-ink-soft">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <span className="leading-relaxed">{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

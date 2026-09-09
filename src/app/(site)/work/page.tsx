import Masthead from "@/components/Masthead";
import Reveal from "@/components/Reveal";
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
    <div>
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
                  ...(v.links?.length
                    ? { sameAs: v.links.map((l) => l.url) }
                    : {}),
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

      <Masthead
        label="Work"
        ghost="Ventures"
        title={<>4 ventures, 4 countries.</>}
        lead={
          <>
            Every one of these is a founder who needed someone in the room from
            early on — for GTM, operations, fundraising, or all three.
          </>
        }
      />

      {/*
        The full record, most recent first. Numbered because the order is the
        information: it is a career read backwards, not a ranked list.
      */}
      <section className="on-paper grain">
        <div className="mx-auto max-w-5xl px-6 py-20 md:px-10">
          <ol>
            {ventures.map((v, i) => (
              <Reveal
                key={v.slug}
                id={v.slug}
                delay={i * 60}
                className="scroll-mt-20"
              >
                <li className="grid gap-x-10 gap-y-6 border-t border-hair py-14 md:grid-cols-[3.5rem_11rem_1fr]">
                  <span className="label tabular text-ink-faint md:pt-2">
                    #{i + 1}
                  </span>

                  <div className="flex flex-col items-start gap-3">
                    <span className="stamp">{countryCode(v.country)}</span>
                    <p className="label text-ink-soft">{v.period}</p>
                    <p className="label text-ink-faint">{v.location}</p>
                    {v.current && <span className="stamp">Current</span>}
                  </div>

                  <div>
                    <span className="stamp">{v.category}</span>
                    <h2 className="font-display mt-5 text-[clamp(1.7rem,3.6vw,2.6rem)] leading-tight">
                      {v.url ? (
                        <a
                          href={v.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ref"
                        >
                          {v.company}
                        </a>
                      ) : (
                        v.company
                      )}
                    </h2>
                    <p className="font-display-text mt-3 text-lg text-ink-faint">
                      {v.role}
                    </p>
                    <p className="mt-6 text-lg leading-[1.75] text-ink-soft">
                      {v.summary}
                    </p>

                    {v.links && v.links.length > 0 && (
                      <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
                        {v.links.map((l) => (
                          <li key={l.url}>
                            <a
                              href={l.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="label ref text-ink-soft"
                            >
                              {l.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}

                    <ul className="mt-8 flex flex-col gap-4 border-t border-hair pt-7">
                      {v.highlights.map((h) => (
                        <li key={h} className="flex gap-4 text-ink-soft">
                          <span
                            aria-hidden="true"
                            className="mt-2.5 h-1.5 w-1.5 shrink-0 bg-ink-faint"
                          />
                          <span className="leading-relaxed">{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}

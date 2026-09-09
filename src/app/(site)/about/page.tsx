import Masthead from "@/components/Masthead";
import Reveal from "@/components/Reveal";
import {
  distinctions,
  earlierRoles,
  education,
  journey,
  profile,
  publication,
  recognition,
} from "@/lib/content";
import {
  PERSON_ID,
  breadcrumbSchema,
  buildMetadata,
  jsonLdGraph,
  jsonLdScript,
} from "@/lib/seo";

export const metadata = buildMetadata({
  path: "/about",
  type: "profile",
  title: "About Komal Kedarnath: Cross-Border Startup Operator",
  description:
    "How Komal Kedarnath became a founder's-office operator across four countries — from CFD research at IIT Bombay to running GTM and ops for four ventures.",
});

export default function AboutPage() {
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          jsonLdGraph(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "About", path: "/about" },
            ]),
            {
              // A DOI is a persistent identifier, which makes this the most
              // durable corroboration on the site. Worth stating explicitly
              // so the Person entity is linked to a citable output.
              "@type": "Report",
              "@id": publication.url,
              name: publication.title,
              headline: publication.title,
              description: publication.description,
              author: { "@id": PERSON_ID },
              datePublished: publication.datePublished,
              publisher: { "@type": "Organization", name: publication.publisher },
              identifier: {
                "@type": "PropertyValue",
                propertyID: "DOI",
                value: publication.doi,
              },
              url: publication.url,
              license: publication.license,
              inLanguage: "en",
            }
          )
        )}
      />

      <Masthead
        label="About"
        plate
        title={
          <>A founder&rsquo;s-office operator across four countries.</>
        }
        lead={
          <>
            I&rsquo;m {profile.shortName} — a founder&rsquo;s-office operator
            and GTM strategist who has spent the last 6+ years turning
            early-stage ambition into go-to-market execution, revenue, and
            working systems, across four countries and four very different
            kinds of businesses. Here&rsquo;s where that&rsquo;s taken me.
          </>
        }
      />

      {/* The narrative. Ruled sections rather than cards — this is one
          continuous account, not a set of separate objects. */}
      <section className="on-paper grain">
        <div className="mx-auto max-w-3xl px-6 py-24 md:py-28">
          {journey.map((section, i) => (
            <Reveal key={section.heading} delay={i * 70}>
              <div className="border-t border-hair py-10 first:border-t-0 first:pt-0">
                <h2 className="font-display text-[clamp(1.6rem,3.2vw,2.2rem)] leading-tight">
                  {section.heading}
                </h2>
                <p className="mt-5 text-lg leading-[1.75] text-ink-soft">
                  {section.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* The record: roles, recognition, distinctions. Each block is a ruled
          entry in one document rather than a panel of its own. */}
      <section className="grain border-t border-hair bg-mist">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <Reveal>
            <div className="border-t border-hair pt-8">
              <h2 className="label text-ink-faint">Earlier roles</h2>
              <div className="mt-8 flex flex-col gap-8">
                {earlierRoles.map((role) => (
                  <div key={role.company}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                      <h3 className="font-display-text text-xl">
                        {role.url ? (
                          <a
                            href={role.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ref"
                          >
                            {role.company}
                          </a>
                        ) : (
                          role.company
                        )}
                      </h3>
                      <p className="label text-ink-faint">{role.period}</p>
                    </div>
                    <p className="mt-3 leading-relaxed text-ink-soft">
                      {role.description}
                    </p>
                    {role.reference && (
                      <p className="mt-3">
                        <a
                          href={role.reference.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="label ref text-ink-soft"
                        >
                          {role.reference.label}
                        </a>
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-8 border-t border-hair pt-6 text-ink-soft">
                Engineering degree from{" "}
                <a
                  href={education.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ref"
                >
                  {education.institution}
                </a>
                .
              </p>
            </div>
          </Reveal>

          <Reveal delay={60}>
            <div className="mt-16 border-t border-hair pt-8">
              <h2 className="label text-ink-faint">Recognition &amp; research</h2>
              <ul className="mt-8 flex flex-col gap-8">
                {recognition.map((r) => (
                  <li key={r.title}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                      <h3 className="font-display-text text-xl">{r.title}</h3>
                      <p className="label text-ink-faint">{r.period}</p>
                    </div>
                    <p className="label mt-2 text-ink-faint">{r.org}</p>
                    <p className="mt-3 leading-relaxed text-ink-soft">
                      {r.detail}
                    </p>
                    {r.url && (
                      <p className="mt-3">
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="label ref text-ink-soft"
                        >
                          {r.linkLabel ?? "Reference"}
                        </a>
                      </p>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-8 max-w-xl text-sm leading-relaxed text-ink-faint">
                Certificates for each of the above are available on request.
                They are not published here because they carry third-party
                names and contact details.
              </p>
            </div>
          </Reveal>

          <Reveal delay={90}>
            <div className="mt-16 border-t border-hair pt-8">
              <h2 className="label text-ink-faint">Distinctions &amp; mobility</h2>
              <ul className="mt-8 flex flex-col gap-4">
                {distinctions.map((d) => (
                  <li key={d.text} className="flex gap-4 text-ink-soft">
                    {/* Square compositor's mark, matching the prose lists. */}
                    <span
                      aria-hidden="true"
                      className="mt-2.5 h-1.5 w-1.5 shrink-0 bg-ink-faint"
                    />
                    <span className="leading-relaxed">
                      {d.text}
                      {d.url && (
                        <>
                          {" "}
                          <a
                            href={d.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ref"
                          >
                            {d.linkLabel ?? "Reference"}
                          </a>
                        </>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="mt-16 border-t border-hair pt-8">
              <h2 className="label text-ink-faint">Off the clock</h2>
              <p className="mt-6 text-lg leading-relaxed text-ink-soft">
                Sketching &amp; design · music — piano, guitar, and songwriting
                · competitive basketball &amp; distance running · Formula 1.
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

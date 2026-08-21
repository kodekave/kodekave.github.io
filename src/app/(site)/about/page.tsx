import Portrait from "@/components/Portrait";
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
    <div className="mx-auto max-w-3xl px-6 py-16">
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

      <Reveal>
        <p className="text-sm font-medium uppercase tracking-wide text-accent-deep">
          About
        </p>
        <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">
          A founder&rsquo;s-office operator across four countries.
        </h1>
      </Reveal>

      <Reveal delay={100}>
        <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-start">
          <Portrait
            src="/images/hero"
            alt={`${profile.name}, ${profile.role}`}
            className="h-40 w-40 shrink-0"
            rounded="rounded-2xl"
            objectPosition="50% 20%"
            sizes="160px"
          />
          <p className="text-lg leading-relaxed text-ink-soft">
            I&rsquo;m {profile.shortName} — a founder&rsquo;s-office operator
            and GTM strategist who has spent the last 6+ years turning
            early-stage ambition into go-to-market execution, revenue, and
            working systems, across four countries and four very different
            kinds of businesses. Here&rsquo;s where that&rsquo;s taken me.
          </p>
        </div>
      </Reveal>

      <div className="mt-14 space-y-12">
        {journey.map((section, i) => (
          <Reveal key={section.heading} delay={i * 80}>
            <h2 className="font-display text-2xl text-ink">
              {section.heading}
            </h2>
            <p className="mt-3 text-lg leading-relaxed text-ink-soft">
              {section.body}
            </p>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <div className="mt-16 rounded-xl border border-line bg-paper p-8 transition hover:border-accent/60">
          <h2 className="font-display text-xl text-ink">Earlier roles</h2>
          <div className="mt-5 space-y-5">
            {earlierRoles.map((role) => (
              <div key={role.company}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium text-ink">
                    {role.url ? (
                      <a
                        href={role.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-accent-deep"
                      >
                        {role.company}
                      </a>
                    ) : (
                      role.company
                    )}
                  </p>
                  <p className="text-xs text-ink-faint">{role.period}</p>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  {role.description}
                </p>
                {role.reference && (
                  <p className="mt-2 text-sm">
                    <a
                      href={role.reference.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-deep underline underline-offset-2 hover:text-ink"
                    >
                      {role.reference.label}
                    </a>
                  </p>
                )}
              </div>
            ))}
          </div>
          <p className="mt-6 border-t border-line pt-5 text-sm text-ink-soft">
            Engineering degree from{" "}
            <a
              href={education.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-deep underline underline-offset-2 hover:text-ink"
            >
              {education.institution}
            </a>
            .
          </p>
        </div>
      </Reveal>

      <Reveal delay={60}>
        <div className="mt-10 rounded-xl border border-line bg-paper p-8 transition hover:border-accent/60">
          <h2 className="font-display text-xl text-ink">
            Recognition & research
          </h2>
          <ul className="mt-5 space-y-6">
            {recognition.map((r) => (
              <li key={r.title}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium text-ink">{r.title}</p>
                  <p className="font-mono text-xs text-ink-faint">{r.period}</p>
                </div>
                <p className="mt-0.5 text-sm text-ink-faint">{r.org}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  {r.detail}
                </p>
                {r.url && (
                  <p className="mt-1.5 text-sm">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-deep underline underline-offset-2 hover:text-ink"
                    >
                      {r.linkLabel ?? "Reference"}
                    </a>
                  </p>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs leading-relaxed text-ink-faint">
            Certificates for each of the above are available on request.
            They are not published here because they carry third-party names
            and contact details.
          </p>
        </div>
      </Reveal>

      <Reveal delay={80}>
        <div className="mt-10 rounded-xl border border-line bg-paper p-8 transition hover:border-accent/60">
          <h2 className="font-display text-xl text-ink">
            Distinctions & mobility
          </h2>
          <ul className="mt-5 space-y-3">
            {distinctions.map((d) => (
              <li key={d.text} className="flex gap-3 text-sm text-ink-soft">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span>
                  {d.text}
                  {d.url && (
                    <>
                      {" "}
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-deep underline underline-offset-2 hover:text-ink"
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

      <Reveal delay={160}>
        <div className="mt-10 rounded-xl border border-line bg-paper p-8 transition hover:border-accent/60">
          <h2 className="font-display text-xl text-ink">Off the clock</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Sketching & design · music — piano, guitar, and songwriting ·
            competitive basketball & distance running · Formula 1.
          </p>
        </div>
      </Reveal>
    </div>
  );
}

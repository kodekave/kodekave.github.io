import Link from "next/link";
import Masthead from "@/components/Masthead";
import Reveal from "@/components/Reveal";
import { engagements, profile, ventures } from "@/lib/content";
import { absoluteUrl } from "@/lib/site";
import {
  PERSON_ID,
  breadcrumbSchema,
  buildMetadata,
  faqSchema,
  jsonLdGraph,
  jsonLdScript,
} from "@/lib/seo";

export const metadata = buildMetadata({
  path: "/services",
  title: "Work With Me: Founder's Office & GTM Operator for Startups",
  description:
    "How founders work with me: founder's-office operations, go-to-market execution, cross-border market entry, and financial operations for early-stage companies.",
});

const faqs = [
  {
    q: "What does a founder's office operator actually do?",
    a: "A founder's office operator takes a founder's priorities and turns them into executed work. In practice that means owning go-to-market launches, cross-border operations, financial operations and fundraising support end to end — not advising on them. The distinguishing trait is closing the loop: staying with a plan until it produces a result, rather than handing it off after planning.",
  },
  {
    q: "How is this different from hiring a consultant?",
    a: "A consultant delivers a recommendation and leaves. A founder's office operator executes and stays accountable for the outcome. The engagement is measured in shipped launches, closed customers and working systems rather than deliverables and decks.",
  },
  {
    q: "What size of company is this for?",
    a: "Early-stage: pre-seed through Series A, roughly two to thirty people. The four ventures I have done this for ranged from a two-person founding team to a twenty-person VC-backed company. Below that there is not enough to operate; well above it, you need a functional head rather than a founder's office.",
  },
  {
    q: "Do you work remotely and across time zones?",
    a: "Yes — every engagement so far has spanned at least two countries, and the current one is run fully remote from India for a London-based company. Cross-border and asynchronous operation is the normal case here, not an exception.",
  },
  {
    q: "What does an engagement cost?",
    a: "It depends on scope and whether the work is ongoing or a defined project. The fastest way to a number is to describe the situation and what needs to be true in ninety days.",
  },
];

export default function ServicesPage() {
  const graph = jsonLdGraph(
    {
      "@type": "Service",
      "@id": `${absoluteUrl("/services")}#service`,
      name: "Founder's Office & GTM Operations",
      serviceType: "Startup operations and go-to-market execution",
      provider: { "@id": PERSON_ID },
      url: absoluteUrl("/services"),
      description:
        "Founder's-office operations, go-to-market execution, cross-border market entry and fundraise support for early-stage companies.",
      areaServed: [
        { "@type": "Country", name: "India" },
        { "@type": "Country", name: "United Kingdom" },
        { "@type": "Country", name: "United States" },
        { "@type": "Country", name: "Maldives" },
      ],
      audience: {
        "@type": "Audience",
        audienceType: "Early-stage startup founders (pre-seed to Series A)",
      },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Engagement types",
        itemListElement: engagements.map((e) => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: e.name,
            description: e.summary,
          },
        })),
      },
    },
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Work with me", path: "/services" },
    ]),
    faqSchema(faqs)
  );

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(graph)}
      />

      <Masthead
        label="Work with me"
        ghost="Office"
        title={<>A founder&rsquo;s office, without hiring one.</>}
        /*
          Answer-first opening: this paragraph is written to stand alone as a
          quotable answer to "what does a founder's office operator do",
          because that is the unit an answer engine or snippet extracts. It
          stays the first paragraph of body copy on the page.
        */
        lead={
          <>
            A founder&rsquo;s office operator is the person a founder hands a
            half-formed idea to and trusts that it comes back as a working
            business. I do that work: go-to-market execution, cross-border
            operations, financial operations, and fundraise support — owned
            end to end, not advised on. Over six years I have done it for{" "}
            <Link href="/work" className="ref">
              four ventures across four countries
            </Link>
            , from a two-person founding team to a twenty-person VC-backed
            company.
          </>
        }
      />

      {/* The engagements, numbered to match the homepage's offering. */}
      <section className="on-paper grain">
        <div className="mx-auto max-w-5xl px-6 py-24 md:px-10">
          <Reveal>
            <p className="label text-ink-faint">What I take off your plate</p>
            <h2 className="font-display mt-5 max-w-2xl text-[clamp(1.8rem,4vw,2.8rem)] leading-[1.08]">
              Most engagements are one of these, or an ongoing
              founder&rsquo;s office that absorbs several.
            </h2>
          </Reveal>

          <ol className="mt-16">
            {engagements.map((e, i) => (
              <Reveal key={e.name} delay={i * 60}>
                <li className="grid gap-x-10 gap-y-5 border-t border-hair py-12 md:grid-cols-[3.5rem_1fr]">
                  <span className="label tabular text-ink-faint md:pt-2">
                    #{i + 1}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
                      <h3 className="font-display text-[clamp(1.6rem,3.2vw,2.3rem)] leading-tight">
                        {e.name}
                      </h3>
                      <span className="stamp">{e.stamp}</span>
                    </div>
                    <p className="mt-5 max-w-2xl text-lg leading-[1.75] text-ink-soft">
                      {e.summary}
                    </p>
                    <ul className="mt-8 flex flex-col gap-3.5 border-t border-hair pt-7">
                      {e.includes.map((item) => (
                        <li key={item} className="flex gap-4 text-ink-soft">
                          <span
                            aria-hidden="true"
                            className="mt-2.5 h-1.5 w-1.5 shrink-0 bg-ink-faint"
                          />
                          <span className="leading-relaxed">{item}</span>
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

      {/* Why founders bring me in */}
      <section className="grain border-t border-hair bg-mist">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <Reveal>
            <h2 className="font-display text-[clamp(1.7rem,3.6vw,2.5rem)] leading-tight">
              Why founders bring me in
            </h2>
            <p className="mt-6 text-lg leading-[1.75] text-ink-soft">
              The pattern across all four ventures was the same: a founder
              with more validated priorities than executing capacity, in a
              situation where the next step crossed a border, a currency, or a
              function nobody on the team had run before. What I bring is
              judgment under ambiguity in that exact situation —{" "}
              <Link
                href="/blog/what-a-founders-office-actually-is"
                className="ref"
              >
                which is the part of the role people underestimate
              </Link>
              .
            </p>
          </Reveal>

          <Reveal delay={70}>
            <ul className="mt-12">
              {ventures.map((v) => (
                <li key={v.slug} className="border-t border-hair py-6">
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <Link
                      href={`/work#${v.slug}`}
                      className="font-display-text link-rule text-xl"
                    >
                      {v.company}
                    </Link>
                    <span className="label text-ink-faint">
                      {v.category}
                    </span>
                    <span
                      aria-hidden="true"
                      className="h-3 w-px bg-ink-faint/40"
                    />
                    <span className="label text-ink-faint">{v.country}</span>
                  </div>
                  <p className="mt-3 leading-relaxed text-ink-soft">
                    {v.summary}
                  </p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Common questions */}
      <section className="on-paper grain border-t border-hair">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <Reveal>
            <h2
              id="services-faq"
              className="font-display text-[clamp(1.7rem,3.6vw,2.5rem)] leading-tight"
            >
              Common questions
            </h2>
          </Reveal>
          <Reveal delay={70}>
            <dl className="mt-12" aria-labelledby="services-faq">
              {faqs.map((faq) => (
                <div key={faq.q} className="border-t border-hair py-8">
                  <dt className="font-display-text text-xl leading-snug">
                    {faq.q}
                  </dt>
                  <dd className="mt-4 leading-[1.75] text-ink-soft">
                    {faq.a}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* Start a conversation — the page's close, on ink. */}
      <section className="on-ink grain relative overflow-hidden">
        <span
          aria-hidden="true"
          className="ghost absolute -bottom-[0.22em] -left-4 text-[20vw] text-paper/[0.05]"
        >
          Start
        </span>
        <div className="relative mx-auto max-w-3xl px-6 py-24">
          <Reveal>
            <h2 className="font-display text-[clamp(1.9rem,4.4vw,3rem)] leading-tight">
              Start a conversation
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-[1.75] text-paper-soft">
              Describe the situation and what needs to be true in ninety days.
              That is usually enough to tell you whether this is the right
              shape of help — and if it is not, I will say so.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href={profile.linkedin}
                rel="me noopener"
                target="_blank"
                className="btn btn-paper"
              >
                Message me on LinkedIn
              </a>
              <Link href="/about" className="btn btn-paper">
                Read the background
              </Link>
            </div>
            <p className="mt-10 max-w-xl border-t border-hair-inv pt-6 text-sm leading-relaxed text-paper-faint">
              Currently in a founder&rsquo;s-office role at Travel Hands UK.
              Selective about additional work — see{" "}
              <Link href="/sponsor" className="ref">
                sponsorship
              </Link>{" "}
              if you are here about the newsletter instead.
            </p>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

import Link from "next/link";
import Reveal from "@/components/Reveal";
import Stamp from "@/components/Stamp";
import { profile, ventures } from "@/lib/content";
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

const engagements = [
  {
    name: "Founder's office",
    stamp: "Ongoing",
    summary:
      "I become the person you hand a half-formed idea to. You stay on product, fundraising and customers; I turn priorities into execution plans, then own them through to a result.",
    includes: [
      "Translating leadership priorities into OKRs and execution plans",
      "Running the operating cadence — reviews, reporting, follow-through",
      "Standing in for the founder with vendors, partners and internal teams",
      "Closing the loop: staying with a plan until it meets a real customer",
    ],
  },
  {
    name: "Go-to-market execution",
    stamp: "Project",
    summary:
      "Not a GTM deck. The launch itself — sequencing, owners, dates, and the unglamorous follow-through that turns a launch plan into first revenue.",
    includes: [
      "Launch program management across product, sales and ops",
      "First-customer acquisition and early pipeline construction",
      "Pricing and packaging support for a new market or segment",
      "Post-launch instrumentation so you can see what actually worked",
    ],
  },
  {
    name: "Cross-border market entry",
    stamp: "Project",
    summary:
      "Entering a country you have never operated in, without a local team. This is the work most operators have never touched, and where things quietly go wrong.",
    includes: [
      "Entity setup, banking and compliance sequencing",
      "Outbound-investment and remittance filings (e.g. ODI from India)",
      "Vendor, logistics and payment-rail selection in the new market",
      "Multi-currency billing and a monthly close that reconciles",
    ],
  },
  {
    name: "Fundraise support",
    stamp: "Project",
    summary:
      "The operator half of a raise. I do not pitch for you — I build the material and the data room that survives diligence, alongside you.",
    includes: [
      "Data room construction and diligence readiness",
      "Financial memos and operating models",
      "Investor-facing deck support and narrative pressure-testing",
      "Post-raise reporting cadence for new investors",
    ],
  },
];

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
    <div className="mx-auto max-w-3xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(graph)}
      />

      <Reveal>
        <p className="text-sm font-medium uppercase tracking-wide text-accent-deep">
          Work with me
        </p>
        <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">
          A founder&rsquo;s office, without hiring one.
        </h1>
        {/*
          Answer-first opening: the first paragraph is written to stand alone
          as a quotable answer to "what does a founder's office operator do",
          because that is the unit an answer engine or snippet extracts.
        */}
        <p className="mt-6 text-lg leading-relaxed text-ink-soft">
          A founder&rsquo;s office operator is the person a founder hands a
          half-formed idea to and trusts that it comes back as a working
          business. I do that work: go-to-market execution, cross-border
          operations, financial operations, and fundraise support — owned end
          to end, not advised on. Over six years I have done it for{" "}
          <Link
            href="/work"
            className="font-medium text-accent-deep underline underline-offset-2"
          >
            four ventures across four countries
          </Link>
          , from a two-person founding team to a twenty-person VC-backed
          company.
        </p>
      </Reveal>

      <Reveal delay={80}>
        <div className="mt-12 border-t border-line pt-8">
          <h2 className="font-display text-2xl text-ink">
            What I take off your plate
          </h2>
          <p className="mt-3 text-ink-soft">
            Most engagements are one of these, or an ongoing founder&rsquo;s
            office that absorbs several.
          </p>
        </div>
      </Reveal>

      <div className="mt-10 space-y-8">
        {engagements.map((e, i) => (
          <Reveal key={e.name} delay={i * 60}>
            <section className="rounded-xl border border-line bg-paper p-7 transition hover:border-accent/60">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-display text-xl text-ink">{e.name}</h3>
                <Stamp>{e.stamp}</Stamp>
              </div>
              <p className="mt-3 leading-relaxed text-ink-soft">{e.summary}</p>
              <ul className="mt-5 space-y-2.5">
                {e.includes.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-ink-soft">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>
        ))}
      </div>

      <Reveal delay={80}>
        <section className="mt-16 border-t border-line pt-10">
          <h2 className="font-display text-2xl text-ink">
            Why founders bring me in
          </h2>
          <p className="mt-4 leading-relaxed text-ink-soft">
            The pattern across all four ventures was the same: a founder with
            more validated priorities than executing capacity, in a situation
            where the next step crossed a border, a currency, or a function
            nobody on the team had run before. What I bring is judgment under
            ambiguity in that exact situation —{" "}
            <Link
              href="/blog/what-a-founders-office-actually-is"
              className="font-medium text-accent-deep underline underline-offset-2"
            >
              which is the part of the role people underestimate
            </Link>
            .
          </p>
          <ul className="mt-6 space-y-3">
            {ventures.map((v) => (
              <li key={v.slug} className="text-sm text-ink-soft">
                <Link
                  href={`/work#${v.slug}`}
                  className="font-medium text-ink hover:text-accent-deep"
                >
                  {v.company}
                </Link>{" "}
                <span className="text-ink-faint">
                  · {v.category} · {v.country}
                </span>
                <br />
                {v.summary}
              </li>
            ))}
          </ul>
        </section>
      </Reveal>

      <Reveal delay={90}>
        <section
          aria-labelledby="services-faq"
          className="mt-16 border-t border-line pt-10"
        >
          <h2 id="services-faq" className="font-display text-2xl text-ink">
            Common questions
          </h2>
          <dl className="mt-6 space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q}>
                <dt className="font-display text-lg text-ink">{faq.q}</dt>
                <dd className="mt-2 leading-relaxed text-ink-soft">{faq.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </Reveal>

      <Reveal delay={100}>
        <section className="mt-16 rounded-xl border border-line bg-cream p-8">
          <h2 className="font-display text-2xl text-ink">
            Start a conversation
          </h2>
          <p className="mt-3 leading-relaxed text-ink-soft">
            Describe the situation and what needs to be true in ninety days.
            That is usually enough to tell you whether this is the right shape
            of help — and if it is not, I will say so.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <a
              href={profile.linkedin}
              rel="me noopener"
              target="_blank"
              className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-cream transition hover:-translate-y-0.5 hover:bg-accent-deep"
            >
              Message me on LinkedIn
            </a>
            <Link
              href="/about"
              className="rounded-full border border-line bg-paper px-6 py-3 text-sm font-medium text-ink transition hover:-translate-y-0.5 hover:border-accent"
            >
              Read the background
            </Link>
          </div>
          <p className="mt-5 text-xs text-ink-faint">
            Currently in a founder&rsquo;s-office role at Travel Hands UK.
            Selective about additional work — see{" "}
            <Link href="/sponsor" className="underline underline-offset-2">
              sponsorship
            </Link>{" "}
            if you are here about the newsletter instead.
          </p>
        </section>
      </Reveal>
    </div>
  );
}

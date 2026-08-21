import Link from "next/link";
import Reveal from "@/components/Reveal";
import FaqSection from "@/components/FaqSection";
import { absoluteUrl } from "@/lib/site";
import {
  PERSON_ID,
  WEBSITE_ID,
  breadcrumbSchema,
  buildMetadata,
  faqSchema,
  jsonLdGraph,
  jsonLdScript,
} from "@/lib/seo";

export const metadata = buildMetadata({
  path: "/cross-border-operations",
  title: "Cross-Border Startup Operations: A Practical Field Guide",
  description:
    "Running startup operations across countries: compliance sequencing, multi-currency close, entity setup and remote teams — from six years across four countries.",
});

const faqs = [
  {
    q: "What is the first thing to get right when expanding to a new country?",
    a: "Compliance sequencing, before growth. Entity, banking, tax registration and any outbound-investment filings have to be ordered correctly because each one blocks the next — you cannot open a bank account without an entity, and you cannot move money without the filing. Teams that chase first revenue before this is settled usually end up unable to invoice or receive payment.",
  },
  {
    q: "How do you handle multi-currency accounting in an early-stage company?",
    a: "Pick one reporting currency and hold every figure against it, with a single source of truth rather than per-country spreadsheets. Record the rate used on each transaction at the time it happens. The failure mode is not a wrong number but two teams quoting different numbers for the same month, which erodes the founder's trust in all reporting.",
  },
  {
    q: "What is ODI compliance and when does it apply?",
    a: "Overseas Direct Investment (ODI) is the Indian regulatory filing required when an Indian entity or resident invests in a foreign entity — for example, an Indian startup setting up a US subsidiary. It gates the legal movement of capital abroad, so it sits early in any India-to-US expansion sequence rather than being handled after incorporation.",
  },
  {
    q: "How do you manage a team across several time zones?",
    a: "Close the loop in writing, and reduce the number of decisions that need a live conversation. Teams working across time zones do not need their operator to have every answer immediately; they need to know that a question raised will be resolved and returned to them. Predictable written follow-through beats availability.",
  },
  {
    q: "How many countries can one operator realistically cover?",
    a: "Two well, three with strain, in my experience — but the limit is regulatory surface area rather than headcount. Two countries with simple structures is easier than one country with a complex entity and licensing position.",
  },
];

export default function CrossBorderOperationsPage() {
  const url = absoluteUrl("/cross-border-operations");

  const graph = jsonLdGraph(
    {
      "@type": "Article",
      "@id": `${url}#article`,
      headline: "Cross-Border Startup Operations: A Practical Field Guide",
      description:
        "Running startup operations across countries: compliance sequencing, multi-currency close, entity setup and distributed teams.",
      url,
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      author: { "@id": PERSON_ID },
      publisher: { "@id": PERSON_ID },
      isPartOf: { "@id": WEBSITE_ID },
      inLanguage: "en",
      about: {
        "@type": "Thing",
        name: "Cross-border business operations",
      },
    },
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Cross-border operations", path: "/cross-border-operations" },
    ]),
    faqSchema(faqs)
  );

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(graph)}
      />

      <Reveal>
        <nav aria-label="Breadcrumb" className="text-sm text-ink-faint">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-accent-deep">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>Guide</li>
          </ol>
        </nav>

        <h1 className="mt-6 font-display text-4xl leading-tight text-ink sm:text-5xl">
          Cross-border startup operations
        </h1>

        <p className="mt-6 text-lg leading-relaxed text-ink-soft">
          Running operations across countries fails for regulatory and
          reconciliation reasons far more often than strategic ones. Compliance
          has to be sequenced before growth, money needs one source of truth in
          one currency, and distributed teams need written follow-through more
          than they need answers. Everything below comes from doing this across{" "}
          <Link
            href="/work"
            className="font-medium text-accent-deep underline underline-offset-2"
          >
            India, the Maldives, the United States and the United Kingdom
          </Link>
          .
        </p>
      </Reveal>

      <div className="prose-post mt-12">
        <Reveal delay={60}>
          <h2>1. Compliance first, growth second</h2>
          <p>
            Compliance comes first because each step blocks the next. You
            cannot open a bank account without an entity, you cannot legally
            move capital without the outbound-investment filing, and you cannot
            invoice without tax registration. The sequence is not
            interchangeable, and discovering that mid-launch is expensive.
          </p>
          <p>
            Setting up US operations for an AI/robotics company from India
            meant entity formation, ODI compliance, US banking, then the vendor
            and logistics network — in that order — before the first US
            customer could be closed. Teams that chase revenue first typically
            reach a signed customer they cannot legally bill.
          </p>

          <h2>2. One source of truth for money, in one currency you trust</h2>
          <p>
            Pick a reporting currency and hold every figure against it. Record
            the rate used at the moment of each transaction, not at month end.
            Keep it in one system rather than per-country spreadsheets that
            drift.
          </p>
          <p>
            Across a roughly &#8377;1 crore monthly budget, centralised
            cross-border billing and a single metrics dashboard were what made
            a multi-currency monthly close reconcile. The real risk is not an
            incorrect figure — it is two people quoting different numbers for
            the same month, after which the founder stops trusting any
            reporting at all.
          </p>

          <h2>3. Close the loop, don&rsquo;t have every answer</h2>
          <p>
            Distributed teams do not need their operator to know the answer
            immediately. They need to know that a question raised will come
            back resolved. Predictable written follow-through beats being
            constantly available, and it is the only thing that survives an
            eight-hour time difference.
          </p>
          <p>
            Automated reporting that removed ten-plus hours a week of manual
            data retrieval from a founder&rsquo;s calendar mattered less for
            the hours saved than for making the reporting boringly reliable.
          </p>

          <h2>4. Expect the operational surface to be jagged</h2>
          <p>
            Payment rails, hiring norms, invoicing expectations and vendor
            reliability differ per country in ways no research turns up in
            advance. Budget explicitly for a discovery period in a new market
            rather than assuming the second country works like the first.
          </p>
          <p>
            Work-visa navigation in the Maldives, ODI filings from India, and
            fully remote operation from India for a London company were three
            genuinely different problems, sharing only the property that none
            of them came with a manual.
          </p>

          <h2>What I would tell someone starting this tomorrow</h2>
          <p>
            Map the regulatory sequence before writing the growth plan, and
            treat the first ninety days in a new country as instrumentation
            rather than execution. And read{" "}
            <Link href="/founders-office-guide">
              what a founder&rsquo;s office actually is
            </Link>{" "}
            first — cross-border work is much harder if the role boundaries are
            not clear before you start.
          </p>
        </Reveal>
      </div>

      <FaqSection faqs={faqs} id="cross-border-faq" />

      <Reveal delay={90}>
        <section className="mt-16 rounded-xl border border-line bg-cream p-8">
          <h2 className="font-display text-xl text-ink">
            Expanding into a new market?
          </h2>
          <p className="mt-3 leading-relaxed text-ink-soft">
            Cross-border market entry is one of the{" "}
            <Link
              href="/services"
              className="font-medium text-accent-deep underline underline-offset-2"
            >
              engagements I take on
            </Link>
            . The longer narrative version of this is in{" "}
            <Link
              href="/blog/running-ops-across-four-countries"
              className="font-medium text-accent-deep underline underline-offset-2"
            >
              running ops across four countries with no playbook
            </Link>
            .
          </p>
        </section>
      </Reveal>
    </div>
  );
}

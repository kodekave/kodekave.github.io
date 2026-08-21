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
  path: "/founders-office-guide",
  title: "What Is a Founder's Office? A Practical Guide for Founders",
  description:
    "A founder's office turns a founder's priorities into executed work. What the role covers, how it differs from chief of staff, and when to hire one.",
});

const faqs = [
  {
    q: "What is a founder's office?",
    a: "A founder's office is the function that converts a founder's priorities into executed work. It sits directly next to the founder rather than inside the org chart, and it owns outcomes end to end — go-to-market launches, operations, financial operations, fundraising support — rather than advising on them. In a small company it is usually one person; in a larger one it becomes a small team.",
  },
  {
    q: "Is a founder's office the same as a chief of staff?",
    a: "No. A chief of staff is primarily a coordination and communication role: managing the founder's attention, running meeting cadence, and moving information between functions. A founder's office operator is an execution role, judged on whether the launch shipped and the customer closed. The two overlap in proximity to the founder and differ in accountability.",
  },
  {
    q: "When should a startup hire a founder's office?",
    a: "When the founder has more validated priorities than executing capacity, and the next step crosses a border, a currency, or a function nobody on the team has run before. Typically that is between pre-seed and Series A, at roughly two to thirty people. Before that, the founder is the founder's office; well after it, you need functional heads instead.",
  },
  {
    q: "What skills matter most in a founder's office role?",
    a: "Judgment under ambiguity, ahead of domain expertise. Domain knowledge can be taught in weeks; the ability to make a reasonable call with incomplete information and then own the consequence either survived a zero-to-one environment already or has not been tested. The second most important trait is closing the loop — staying with a plan until it meets a real customer.",
  },
  {
    q: "What does a founder's office operator not do?",
    a: "It is not a note-taking or scheduling role, and it is not a shadow-CEO role either. The operator does not set company strategy or replace functional leadership. The boundary is that the founder decides what matters, and the founder's office is accountable for it happening.",
  },
];

export default function FoundersOfficeGuidePage() {
  const url = absoluteUrl("/founders-office-guide");

  const graph = jsonLdGraph(
    {
      "@type": "Article",
      "@id": `${url}#article`,
      headline: "What Is a Founder's Office? A Practical Guide for Founders",
      description:
        "A founder's office is the function that turns a founder's priorities into executed work — what the role covers, how it differs from chief of staff, and when to hire one.",
      url,
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      author: { "@id": PERSON_ID },
      publisher: { "@id": PERSON_ID },
      isPartOf: { "@id": WEBSITE_ID },
      inLanguage: "en",
      about: {
        "@type": "Thing",
        name: "Founder's office",
        description:
          "The startup function responsible for converting a founder's priorities into executed work.",
      },
    },
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "What is a founder's office", path: "/founders-office-guide" },
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
          What is a founder&rsquo;s office?
        </h1>

        {/* Definition first, in one extractable paragraph. */}
        <p className="mt-6 text-lg leading-relaxed text-ink-soft">
          A founder&rsquo;s office is the function that turns a
          founder&rsquo;s priorities into executed work. It sits next to the
          founder rather than inside the org chart, and it owns outcomes end
          to end — go-to-market launches, operations, financial operations,
          fundraising support — instead of advising on them. In an early-stage
          company it is usually one person; later it becomes a small team.
        </p>
        <p className="mt-4 leading-relaxed text-ink-soft">
          This guide is written from six years doing the job across{" "}
          <Link
            href="/work"
            className="font-medium text-accent-deep underline underline-offset-2"
          >
            four ventures in four countries
          </Link>{" "}
          — AI/robotics, space-tech, hospitality and investments, and
          accessibility tech — under three different job titles for what was
          substantially the same function.
        </p>
      </Reveal>

      <div className="prose-post mt-12">
        <Reveal delay={60}>
          <h2>The three things that define the role</h2>
          <p>
            Across every version of this job, three properties held constant.
            They are a more reliable definition than any job title.
          </p>
          <ol>
            <li>
              <strong>Proximity to real priorities.</strong> The founder&rsquo;s
              office works from what the founder actually needs next, not the
              org chart&rsquo;s version of it. That is why the role cannot be
              specified as a fixed job description — the input changes monthly.
            </li>
            <li>
              <strong>Operating with minimal oversight.</strong> In zero-to-one
              environments there is no playbook to follow, so the operator is
              expected to produce one and be accountable for it.
            </li>
            <li>
              <strong>Closing the loop.</strong> Not just planning the launch,
              but staying with it until the first customer. This is the part
              people underestimate, and the clearest dividing line between a
              founder&rsquo;s office and a consultant.
            </li>
          </ol>
          <p>
            Anyone can build a plan, and founders do not need more plans. They
            need someone who will still be there when the plan meets a customs
            form, a visa delay, or a vendor who disappears on delivery day.
          </p>

          <h2>Founder&rsquo;s office vs chief of staff vs fractional COO</h2>
          <p>
            These three are routinely used interchangeably and should not be.
            The short version: a chief of staff coordinates, a fractional COO
            runs an established function part-time, and a founder&rsquo;s
            office executes whatever is next. The{" "}
            <Link href="/fractional-coo-vs-founders-office">
              full comparison is here
            </Link>
            , including which one to hire for a given situation.
          </p>

          <h2>What the work actually looks like</h2>
          <p>
            Concretely, in my case: setting up a US entity from a laptop in
            India, including ODI compliance and US banking. Negotiating a
            guesthouse deal in the Maldives. Building centralised cross-border
            billing across a roughly &#8377;1 crore monthly budget so the
            multi-currency close reconciled. Constructing the data room and
            financial memos that closed an angel round. Running launch program
            management for four product launches.
          </p>
          <p>
            None of those are the same task. All of them are the same function:
            the founder decided it mattered, and someone had to own it to
            completion.
          </p>

          <h2>When to hire one</h2>
          <p>
            The signal is a backlog of validated priorities the founder cannot
            personally reach, combined with a next step that crosses a border,
            a currency, or a function nobody has run before. In practice that
            is roughly pre-seed to Series A, two to thirty people. Below that,
            the founder is the founder&rsquo;s office. Well above it, the
            company needs functional heads and the role either becomes a team
            or dissolves into them.
          </p>
          <p>
            Hire for judgment under ambiguity before domain expertise. The
            domain can be taught. The judgment either survived a zero-to-one
            environment already, or it has not been tested yet.
          </p>

          <h2>Why cross-border versions are harder</h2>
          <p>
            Every one of my roles involved at least two countries, which adds
            compliance work most operators never touch — outbound-investment
            filings, multi-currency billing, work-visa navigation. It also
            makes the role more valuable, because founders lean harder on
            someone solving problems they cannot see from where they sit. The{" "}
            <Link href="/cross-border-operations">
              field guide to cross-border operations
            </Link>{" "}
            covers the mechanics.
          </p>
        </Reveal>
      </div>

      <FaqSection faqs={faqs} id="founders-office-faq" />

      <Reveal delay={90}>
        <section className="mt-16 rounded-xl border border-line bg-cream p-8">
          <h2 className="font-display text-xl text-ink">
            Building this function into your company?
          </h2>
          <p className="mt-3 leading-relaxed text-ink-soft">
            I do this work for early-stage founders —{" "}
            <Link
              href="/services"
              className="font-medium text-accent-deep underline underline-offset-2"
            >
              here is what an engagement covers
            </Link>
            . Or read{" "}
            <Link
              href="/blog/what-a-founders-office-actually-is"
              className="font-medium text-accent-deep underline underline-offset-2"
            >
              the shorter essay version
            </Link>{" "}
            of this argument.
          </p>
        </section>
      </Reveal>
    </div>
  );
}

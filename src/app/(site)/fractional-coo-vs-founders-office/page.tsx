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
  path: "/fractional-coo-vs-founders-office",
  title: "Fractional COO vs Founder's Office vs Chief of Staff",
  description:
    "The three roles are not interchangeable. What each one owns, how they are measured, what they cost in practice, and which to hire for your situation.",
});

const rows = [
  {
    dimension: "Core job",
    cos: "Coordinate the founder's attention and information flow",
    fo: "Execute whatever the founder's next priority is, end to end",
    coo: "Run an established operating function part-time",
  },
  {
    dimension: "Measured on",
    cos: "Cadence held, decisions unblocked, communication quality",
    fo: "Launches shipped, customers closed, systems that hold",
    coo: "Functional metrics — margin, throughput, retention",
  },
  {
    dimension: "Scope",
    cos: "Broad but shallow; follows the founder's calendar",
    fo: "Narrow and deep, changing every few months",
    coo: "Deep in one function, stable over time",
  },
  {
    dimension: "Needs a playbook?",
    cos: "Helps, not required",
    fo: "No — expected to produce one",
    coo: "Yes — brings an existing one",
  },
  {
    dimension: "Typical stage",
    cos: "Series A onward, once there is an org to coordinate",
    fo: "Pre-seed to Series A, 2–30 people",
    coo: "Series A onward, once a function exists to run",
  },
  {
    dimension: "Fails when",
    cos: "There is nothing yet to coordinate",
    fo: "Priorities are not actually decided",
    coo: "The function it would run does not exist yet",
  },
];

const faqs = [
  {
    q: "What is the difference between a fractional COO and a founder's office?",
    a: "A fractional COO runs an existing operating function part-time and brings a playbook to it, measured on functional metrics like margin or throughput. A founder's office operator executes whatever the founder's next priority is, produces the playbook rather than importing one, and is measured on whether the launch shipped and the customer closed. Fractional COOs suit companies that have a function to run; founder's offices suit companies still deciding what the function is.",
  },
  {
    q: "Is a chief of staff the same as a founder's office?",
    a: "No. A chief of staff is a coordination role — managing the founder's attention, meeting cadence and information flow across an organisation. A founder's office operator is an execution role accountable for outcomes. They overlap in proximity to the founder and differ in what they are judged on. A chief of staff also generally needs an organisation to coordinate, which very early companies do not yet have.",
  },
  {
    q: "Which should I hire first?",
    a: "If your bottleneck is that decisions are made but nothing gets executed, hire a founder's office. If the bottleneck is that a specific function — finance, supply chain, support — needs professional running and you cannot afford a full-time leader, hire a fractional COO. If your bottleneck is that you have thirty people and no operating rhythm, hire a chief of staff. Diagnose the bottleneck before the title.",
  },
  {
    q: "Can one person cover more than one of these roles?",
    a: "In practice yes at very small scale, because there is not enough of any one role to fill a week. What does not work is expecting a fractional COO's playbook-driven approach in a company that has no established function, or expecting a chief of staff to own delivery. The mismatch is about accountability, not capacity.",
  },
  {
    q: "How is a founder's office different from a consultant?",
    a: "A consultant delivers a recommendation and leaves. A founder's office operator stays and is accountable for the result, including the parts that are unglamorous — the customs form, the visa delay, the vendor who disappears on delivery day.",
  },
];

export default function ComparisonPage() {
  const url = absoluteUrl("/fractional-coo-vs-founders-office");

  const graph = jsonLdGraph(
    {
      "@type": "Article",
      "@id": `${url}#article`,
      headline: "Fractional COO vs Founder's Office vs Chief of Staff",
      description:
        "What each of the three roles owns, how they are measured, and which to hire for a given bottleneck.",
      url,
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      author: { "@id": PERSON_ID },
      publisher: { "@id": PERSON_ID },
      isPartOf: { "@id": WEBSITE_ID },
      inLanguage: "en",
    },
    breadcrumbSchema([
      { name: "Home", path: "/" },
      {
        name: "Fractional COO vs founder's office",
        path: "/fractional-coo-vs-founders-office",
      },
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
        <nav aria-label="Breadcrumb" className="text-sm text-ink-faint">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-accent-deep">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>Comparison</li>
          </ol>
        </nav>

        <h1 className="mt-6 font-display text-4xl leading-tight text-ink sm:text-5xl">
          Fractional COO vs founder&rsquo;s office vs chief of staff
        </h1>

        <p className="mt-6 text-lg leading-relaxed text-ink-soft">
          These three titles get used interchangeably and should not be. A
          chief of staff coordinates, a fractional COO runs an established
          function part-time with a playbook they bring, and a
          founder&rsquo;s office executes whatever is next and writes the
          playbook as it goes. Hiring the wrong one wastes two quarters,
          because the mismatch is about accountability rather than capability.
        </p>
      </Reveal>

      <Reveal delay={70}>
        <div className="mt-12 overflow-x-auto border border-line bg-paper">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <caption className="sr-only">
              Comparison of chief of staff, founder&rsquo;s office operator and
              fractional COO across six dimensions
            </caption>
            <thead>
              <tr className="border-b border-ink/20">
                <th scope="col" className="p-4 text-left font-mono text-xs uppercase tracking-wider text-ink-faint">
                  Dimension
                </th>
                <th scope="col" className="p-4 text-left font-display text-base text-ink">
                  Chief of staff
                </th>
                <th scope="col" className="p-4 text-left font-display text-base text-ink">
                  Founder&rsquo;s office
                </th>
                <th scope="col" className="p-4 text-left font-display text-base text-ink">
                  Fractional COO
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.dimension} className="border-b border-line last:border-0">
                  <th scope="row" className="p-4 text-left align-top font-mono text-xs uppercase tracking-wider text-ink-faint">
                    {r.dimension}
                  </th>
                  <td className="p-4 align-top leading-relaxed text-ink-soft">{r.cos}</td>
                  <td className="p-4 align-top leading-relaxed text-ink">{r.fo}</td>
                  <td className="p-4 align-top leading-relaxed text-ink-soft">{r.coo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>

      <div className="prose-post mt-14">
        <Reveal delay={60}>
          <h2>Diagnose the bottleneck, then pick the title</h2>
          <p>
            The useful question is not which role sounds most senior. It is
            which of these three sentences describes your company right now.
          </p>
          <ul>
            <li>
              <strong>&ldquo;We decide things and they don&rsquo;t
              happen.&rdquo;</strong> That is a founder&rsquo;s office. The
              gap is execution ownership, not coordination or expertise.
            </li>
            <li>
              <strong>&ldquo;This function needs professional running and we
              can&rsquo;t afford a full-time leader.&rdquo;</strong> That is a
              fractional COO. You have a function; you need someone with a
              playbook for it.
            </li>
            <li>
              <strong>&ldquo;We have thirty people and no operating
              rhythm.&rdquo;</strong> That is a chief of staff. There is now an
              organisation whose attention needs managing.
            </li>
          </ul>

          <h2>Why the founder&rsquo;s office version is hardest to hire for</h2>
          <p>
            The other two roles can be assessed on track record in a
            comparable company. A founder&rsquo;s office cannot, because the
            work changes every few months and the only durable qualification is
            judgment under ambiguity. Hire for that ahead of domain expertise —
            the domain can be taught in weeks, and the judgment either survived
            a zero-to-one environment already or has not been tested.
          </p>
          <p>
            The second thing to test for is whether the person closes the loop.
            Plenty of candidates can produce a plan. Far fewer will still be
            attached to it when it meets a customs form or a vendor who
            disappears on delivery day.
          </p>

          <h2>Where cross-border changes the answer</h2>
          <p>
            If the next step crosses a border, the founder&rsquo;s office
            version is usually the right hire regardless of stage, because the
            work is definitionally unplaybooked — a fractional COO&rsquo;s
            imported playbook does not cover outbound-investment filings or
            multi-currency close in a market neither of you has operated in.
            The{" "}
            <Link href="/cross-border-operations">
              cross-border field guide
            </Link>{" "}
            covers what that work involves.
          </p>
        </Reveal>
      </div>

      <FaqSection faqs={faqs} id="comparison-faq" />

      <Reveal delay={90}>
        <section className="mt-16 rounded-xl border border-line bg-cream p-8">
          <h2 className="font-display text-xl text-ink">
            Think it&rsquo;s the founder&rsquo;s office you need?
          </h2>
          <p className="mt-3 leading-relaxed text-ink-soft">
            Start with{" "}
            <Link
              href="/founders-office-guide"
              className="font-medium text-accent-deep underline underline-offset-2"
            >
              what the function actually is
            </Link>
            , then{" "}
            <Link
              href="/services"
              className="font-medium text-accent-deep underline underline-offset-2"
            >
              how I work with founders
            </Link>
            .
          </p>
        </section>
      </Reveal>
    </div>
  );
}

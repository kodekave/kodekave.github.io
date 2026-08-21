import { sponsorTiers } from "@/lib/content";
import SponsorForm from "@/components/SponsorForm";
import Reveal from "@/components/Reveal";
import {
  breadcrumbSchema,
  buildMetadata,
  jsonLdGraph,
  jsonLdScript,
} from "@/lib/seo";

export const metadata = buildMetadata({
  path: "/sponsor",
  title: "Sponsor the Founder's Office Newsletter & Writing",
  description:
    "Reach founders and startup operators through newsletter mentions, sponsored posts, and ongoing partnerships — pricing, audience, and what each tier includes.",
});

export default function SponsorPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          jsonLdGraph(breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Sponsor", path: "/sponsor" }]))
        )}
      />

      <Reveal>
        <p className="text-sm font-medium uppercase tracking-wide text-accent-deep">
          Sponsor
        </p>
        <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">
          Reach founders and operators.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-ink-soft">
          My newsletter and writing reach founders, operators, and people
          building across borders — the same audience I&rsquo;ve spent 6+
          years working alongside. If your product or service helps that
          audience, I want to hear from you.
        </p>
      </Reveal>

      <Reveal delay={60}>
        <section className="mt-12 border-t border-line pt-8">
          <h2 className="font-display text-2xl text-ink">Who reads this</h2>
          <p className="mt-3 leading-relaxed text-ink-soft">
            Early-stage founders and the operators around them — people running
            go-to-market, operations and cross-border expansion at companies
            between roughly two and thirty people. It is a small,
            specific audience rather than a large general one, which is the
            point: the writing is about founder&rsquo;s-office work, so the
            people reading it are the ones with that problem in front of them.
          </p>
          <p className="mt-4 leading-relaxed text-ink-soft">
            Good fits are tools and services those readers actually use —
            cross-border payments and payroll, entity formation and compliance,
            accounting and multi-currency finance, hiring and contractor
            management, project and program tooling. Poor fits are anything
            requiring a hard-sell placement or claims I cannot verify myself.
          </p>
        </section>
      </Reveal>

      <h2 className="mt-14 font-display text-2xl text-ink">
        Placements and pricing
      </h2>
      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {sponsorTiers.map((tier, i) => (
          <Reveal key={tier.name} delay={i * 80}>
            <div className="h-full rounded-xl border border-line bg-paper p-6 transition hover:-translate-y-1 hover:border-accent hover:shadow-md">
              <h3 className="font-display text-lg text-ink">{tier.name}</h3>
              <p className="mt-1 font-mono text-sm font-medium text-accent-deep">
                {tier.price}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                {tier.description}
              </p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={90}>
        <section className="mt-14 border-t border-line pt-8">
          <h2 className="font-display text-2xl text-ink">How I run sponsorships</h2>
          <ul className="mt-5 space-y-3">
            {[
              "Every placement is labelled as sponsored. No native-advertising ambiguity.",
              "I keep editorial control of the surrounding writing, and I will not claim to use a product I do not use.",
              "One sponsor per issue, so a placement is not competing for attention.",
              "If it is not a fit for the audience I will say so rather than take the placement.",
            ].map((line) => (
              <li key={line} className="flex gap-3 text-sm text-ink-soft">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span className="leading-relaxed">{line}</span>
              </li>
            ))}
          </ul>
        </section>
      </Reveal>

      <Reveal delay={100}>
        <div className="mt-16 rounded-xl border border-line bg-cream p-8">
          <h2 className="font-display text-2xl text-ink">Get in touch</h2>
          <p className="mt-2 text-ink-soft">
            Tell me a bit about what you&rsquo;re building and what
            you&rsquo;re looking for.
          </p>
          <div className="mt-6">
            <SponsorForm />
          </div>
        </div>
      </Reveal>
    </div>
  );
}

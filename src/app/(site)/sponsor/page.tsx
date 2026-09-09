import { sponsorTiers } from "@/lib/content";
import Masthead from "@/components/Masthead";
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

const principles = [
  "Every placement is labelled as sponsored. No native-advertising ambiguity.",
  "I keep editorial control of the surrounding writing, and I will not claim to use a product I do not use.",
  "One sponsor per issue, so a placement is not competing for attention.",
  "If it is not a fit for the audience I will say so rather than take the placement.",
];

export default function SponsorPage() {
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          jsonLdGraph(breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Sponsor", path: "/sponsor" }]))
        )}
      />

      <Masthead
        label="Sponsor"
        ghost="Sponsor"
        title={<>Reach founders and operators.</>}
        lead={
          <>
            My newsletter and writing reach founders, operators, and people
            building across borders — the same audience I&rsquo;ve spent 6+
            years working alongside. If your product or service helps that
            audience, I want to hear from you.
          </>
        }
      />

      <section className="on-paper grain">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <Reveal>
            <h2 className="font-display text-[clamp(1.7rem,3.6vw,2.5rem)] leading-tight">
              Who reads this
            </h2>
            <p className="mt-6 text-lg leading-[1.75] text-ink-soft">
              Early-stage founders and the operators around them — people
              running go-to-market, operations and cross-border expansion at
              companies between roughly two and thirty people. It is a small,
              specific audience rather than a large general one, which is the
              point: the writing is about founder&rsquo;s-office work, so the
              people reading it are the ones with that problem in front of
              them.
            </p>
            <p className="mt-5 text-lg leading-[1.75] text-ink-soft">
              Good fits are tools and services those readers actually use —
              cross-border payments and payroll, entity formation and
              compliance, accounting and multi-currency finance, hiring and
              contractor management, project and program tooling. Poor fits
              are anything requiring a hard-sell placement or claims I cannot
              verify myself.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Placements. Parallel options rather than a sequence, so these stay a
          grid of ruled columns and take no numbering. */}
      <section className="grain border-t border-hair bg-mist">
        <div className="mx-auto max-w-5xl px-6 py-20 md:px-10">
          <Reveal>
            <p className="label text-ink-faint">Placements and pricing</p>
          </Reveal>
          <Reveal delay={60}>
            <dl className="mt-12 grid gap-x-10 gap-y-12 sm:grid-cols-3">
              {sponsorTiers.map((tier) => (
                <div key={tier.name} className="border-t border-hair pt-6">
                  <dt className="font-display-text text-xl leading-snug">
                    {tier.name}
                  </dt>
                  <dd>
                    <span
                      className="font-display tabular mt-4 block text-3xl leading-none"
                      style={{ fontVariationSettings: '"opsz" 34' }}
                    >
                      {tier.price}
                    </span>
                    <span className="mt-5 block leading-relaxed text-ink-soft">
                      {tier.description}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      <section className="on-paper grain border-t border-hair">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <Reveal>
            <h2 className="font-display text-[clamp(1.7rem,3.6vw,2.5rem)] leading-tight">
              How I run sponsorships
            </h2>
            <ul className="mt-10 flex flex-col gap-4">
              {principles.map((line) => (
                <li key={line} className="flex gap-4 text-ink-soft">
                  <span
                    aria-hidden="true"
                    className="mt-2.5 h-1.5 w-1.5 shrink-0 bg-ink-faint"
                  />
                  <span className="leading-relaxed">{line}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="on-ink grain relative overflow-hidden">
        <div className="relative mx-auto max-w-3xl px-6 py-24">
          <Reveal>
            <h2 className="font-display text-[clamp(1.9rem,4.4vw,3rem)] leading-tight">
              Get in touch
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-[1.75] text-paper-soft">
              Tell me a bit about what you&rsquo;re building and what
              you&rsquo;re looking for.
            </p>
            <div className="mt-10">
              <SponsorForm onInk />
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

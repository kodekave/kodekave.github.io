import { sponsorTiers } from "@/lib/content";
import SponsorForm from "@/components/SponsorForm";
import Reveal from "@/components/Reveal";

export const metadata = {
  title: "Sponsor",
  description:
    "Reach founders and startup operators through newsletter mentions, sponsored posts, and ongoing partnerships built around real founder's-office and GTM experience.",
};

export default function SponsorPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
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

      <div className="mt-14 grid gap-6 sm:grid-cols-3">
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

import { profile, sponsorTiers } from "@/lib/content";
import SponsorForm from "@/components/SponsorForm";

export const metadata = {
  title: `Sponsor — ${profile.name}`,
};

export default function SponsorPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-accent-deep">
        Sponsor
      </p>
      <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">
        Reach founders and operators.
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-ink-soft">
        My newsletter and writing reach founders, operators, and people
        building across borders — the same audience I&rsquo;ve spent 6+ years
        working alongside. If your product or service helps that audience, I
        want to hear from you.
      </p>

      <div className="mt-14 grid gap-6 sm:grid-cols-3">
        {sponsorTiers.map((tier) => (
          <div
            key={tier.name}
            className="rounded-2xl border border-line bg-paper p-6"
          >
            <h3 className="font-display text-lg text-ink">{tier.name}</h3>
            <p className="mt-1 text-sm font-medium text-accent-deep">
              {tier.price}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              {tier.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-2xl border border-line bg-cream p-8">
        <h2 className="font-display text-2xl text-ink">Get in touch</h2>
        <p className="mt-2 text-ink-soft">
          Tell me a bit about what you&rsquo;re building and what you&rsquo;re looking
          for.
        </p>
        <div className="mt-6">
          <SponsorForm />
        </div>
      </div>
    </div>
  );
}

import Portrait from "@/components/Portrait";
import { distinctions, earlierRoles, journey, profile } from "@/lib/content";

export const metadata = {
  title: `About — ${profile.name}`,
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-accent-deep">
        About
      </p>
      <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">
        A science whiz who ended up in founders&rsquo; offices.
      </h1>

      <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-start">
        <Portrait
          src="/images/hero.jpg"
          alt={profile.name}
          className="h-40 w-40 shrink-0"
          rounded="rounded-2xl"
          objectPosition="50% 20%"
        />
        <p className="text-lg leading-relaxed text-ink-soft">
          I&rsquo;m {profile.shortName} — a founder&rsquo;s-office operator who has spent
          the last 6+ years turning early-stage ambition into GTM, revenue,
          and working systems, across four countries and four very different
          kinds of businesses. Here&rsquo;s how I got here.
        </p>
      </div>

      <div className="mt-14 space-y-12">
        {journey.map((section) => (
          <div key={section.heading}>
            <h2 className="font-display text-2xl text-ink">
              {section.heading}
            </h2>
            <p className="mt-3 text-lg leading-relaxed text-ink-soft">
              {section.body}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-2xl border border-line bg-paper p-8">
        <h2 className="font-display text-xl text-ink">Earlier roles</h2>
        <div className="mt-5 space-y-5">
          {earlierRoles.map((role) => (
            <div key={role.company}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium text-ink">{role.company}</p>
                <p className="text-xs text-ink-faint">{role.period}</p>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                {role.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 rounded-2xl border border-line bg-paper p-8">
        <h2 className="font-display text-xl text-ink">
          Distinctions & mobility
        </h2>
        <ul className="mt-5 space-y-3">
          {distinctions.map((d) => (
            <li key={d} className="flex gap-3 text-sm text-ink-soft">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              {d}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10 rounded-2xl border border-line bg-paper p-8">
        <h2 className="font-display text-xl text-ink">
          Off the clock
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Sketching & design · music — piano, guitar, and songwriting ·
          competitive basketball & distance running · Formula 1.
        </p>
      </div>
    </div>
  );
}

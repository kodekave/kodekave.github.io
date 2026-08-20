import { profile, ventures } from "@/lib/content";

export const metadata = {
  title: `Work — ${profile.name}`,
};

export default function WorkPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-accent-deep">
        Work
      </p>
      <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">
        4 ventures, 4 countries.
      </h1>
      <p className="mt-5 max-w-xl text-lg text-ink-soft">
        Every one of these is a founder who needed someone in the room from
        early on — for GTM, operations, fundraising, or all three.
      </p>

      <div className="mt-16 space-y-20">
        {ventures.map((v, i) => (
          <div
            key={v.slug}
            id={v.slug}
            className="grid scroll-mt-24 gap-6 border-t border-line pt-10 md:grid-cols-[220px_1fr]"
          >
            <div>
              <p className="text-xs text-ink-faint">
                {String(i + 1).padStart(2, "0")}
              </p>
              <p className="mt-2 text-sm font-medium text-ink-faint">
                {v.period}
              </p>
              <p className="mt-1 text-sm text-ink-faint">{v.location}</p>
              {v.current && (
                <span className="mt-3 inline-block rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent-deep">
                  Current
                </span>
              )}
            </div>

            <div>
              <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent-deep">
                {v.category}
              </span>
              <h2 className="mt-4 font-display text-2xl text-ink sm:text-3xl">
                {v.company}
              </h2>
              <p className="mt-1 text-ink-faint">{v.role}</p>
              <p className="mt-4 text-lg leading-relaxed text-ink-soft">
                {v.summary}
              </p>
              <ul className="mt-5 space-y-3">
                {v.highlights.map((h) => (
                  <li key={h} className="flex gap-3 text-sm text-ink-soft">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <span className="leading-relaxed">{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

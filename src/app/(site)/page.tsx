import Link from "next/link";
import Arrow from "@/components/Arrow";
import JourneyList, { type JourneyStop } from "@/components/JourneyList";
import LocalTime from "@/components/LocalTime";
import Pattern from "@/components/Pattern";
import PortraitCard from "@/components/PortraitCard";
import SectionLabel from "@/components/SectionLabel";
import StopArt, { type Motif } from "@/components/StopArt";
import {
  engagements,
  milestones,
  profile,
  route,
  stats,
  ventures,
} from "@/lib/content";
import { getPublishedPosts } from "@/lib/posts";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  path: "/",
  title: `${profile.role} — ${profile.name}`,
  description:
    "Komal Kedarnath helps founders build from idea to execution: four ventures across India, the Maldives, the US and the UK in more than six years.",
});

/**
 * The homepage, kept as plain as it can be: the opening, four doors, then four
 * quiet sections (the figures, the journey, what I bring and the writing, and
 * the way to reach me). Anything longer than a line lives on its own page.
 *
 * Every word on it is already somewhere on the site; nothing here is new copy.
 */

/** The venture each figure comes from, for its "View source" link. */
const sourceSlug: Record<string, string> = {
  Uduvilla: "uduvilla-investments",
  Neuralzome: "neuralzome-cybernetics",
  "Genex · SpaceCat": "genex-space-spacecat",
};

/** The four doors. Lines and tags are lifted from copy that already exists. */
const doors: {
  n: string;
  title: string;
  href: string;
  line: string;
  tags: string[];
  motif: Motif;
}[] = [
  {
    n: "01",
    title: "Ventures",
    href: "/work",
    line: "4 ventures, 4 countries.",
    tags: ["4 ventures", "4 countries", "6+ years"],
    motif: "stars",
  },
  {
    n: "02",
    title: "Research",
    href: "/research",
    line: "One published study, and the research programmes around it.",
    tags: ["Paper", "OpenFOAM", "Zenodo"],
    motif: "flow",
  },
  {
    n: "03",
    title: "Writing",
    href: "/blog",
    line: "Notes from the founder’s office.",
    tags: ["Founder’s office", "GTM strategy", "Cross-border"],
    motif: "ledger",
  },
  {
    n: "04",
    title: "Contact",
    href: "/#contact",
    line: "Building something? Let’s talk.",
    tags: ["Email", "LinkedIn", profile.location],
    motif: "orbit",
  },
];

const profiles = [
  { href: profile.linkedin, label: "LinkedIn", me: true },
  { href: "https://github.com/kodekave", label: "GitHub", me: true },
  { href: "https://orcid.org/0000-0003-4980-5945", label: "ORCID", me: true },
  { href: "https://zenodo.org/records/24120078", label: "Zenodo", me: false },
];

export default function HomePage() {
  const posts = getPublishedPosts().slice(0, 4);
  // The journey, one stop per stage. A stage that is a venture carries its role
  // from the venture record, so that is written once.
  const placeLabel = Object.fromEntries(route.map((r) => [r.code, r.label]));
  const stops: JourneyStop[] = milestones.map((m) => {
    const v = m.slug ? ventures.find((x) => x.slug === m.slug) : undefined;
    return {
      year: m.year,
      title: v?.company ?? m.title,
      line: v?.role ?? m.note,
      place: placeLabel[m.place] ?? m.place,
      href: v ? `/work#${v.slug}` : m.href,
      hrefLabel: v ? "Open the record" : m.hrefLabel,
    };
  });

  return (
    <div>
      {/* --------------------------------------------------- the opening */}
      <section id="hero" className="relative overflow-hidden">
        <Pattern kind="harmonograph" />

        <div className="settle relative mx-auto grid max-w-6xl gap-14 px-6 pb-20 pt-12 md:px-10 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-center lg:gap-14 lg:pb-28 lg:pt-16">
          <div>
            <p className="label label-dot text-ink-faint">
              <span>
                Local time, <LocalTime />, {profile.location}
              </span>
            </p>

            {/* The statement leads. The name is the first thing a screen
                reader hears, and is set again, quietly, just below. */}
            <h1 className="font-display mt-9 max-w-[11.6em] text-[clamp(3rem,6.2vw,5.5rem)] leading-[1.03]">
              <span className="sr-only">{profile.name}: </span>
              {profile.tagline}
            </h1>

            <p className="mt-11 flex flex-wrap items-baseline gap-x-5 gap-y-1">
              <span className="font-display-text text-[1.2rem]">
                {profile.name}
              </span>
              <span className="font-display-text text-[1.2rem] text-brass-deep">
                Startups-Operator. Maker. Explorer.
              </span>
            </p>

            <div className="mt-10">
              <a href={`mailto:${profile.email}`} className="btn btn-ink">
                Start a conversation
                <Arrow className="btn-arrow" />
              </a>
            </div>
          </div>

          <PortraitCard
            alt={`${profile.name}, black sketch portrait`}
            badge
            priority
            sizes="(max-width: 640px) 78vw, 336px"
            className="w-full max-w-[22rem] justify-self-center lg:w-[27rem] lg:max-w-none lg:justify-self-end"
          />
        </div>
      </section>

      {/* -------------------------------------------------- the four doors */}
      <section aria-labelledby="doors-h" className="relative">
        <div className="mx-auto max-w-6xl px-6 pb-20 md:px-10 md:pb-28">
          <h2 id="doors-h" className="sr-only">
            Where to go next
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {doors.map((d) => (
              <li key={d.title}>
                <Link
                  href={d.href}
                  className="door group flex h-full min-h-[19rem] flex-col p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="label tabular text-ink-faint">{d.n}</span>
                    <div className="w-[4.75rem] opacity-90">
                      <StopArt motif={d.motif} />
                    </div>
                  </div>

                  <h3 className="font-display mt-9 text-[2rem] leading-none">
                    {d.title}
                  </h3>
                  <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                    {d.line}
                  </p>

                  <div className="mt-auto flex items-end justify-between gap-4 pt-8">
                    <ul className="label flex flex-wrap gap-x-3 gap-y-1.5 text-ink-faint">
                      {d.tags.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                    <Arrow className="door-arrow shrink-0" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------ 01 · figures */}
      <section id="record" className="scroll-mt-24">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-24">
          <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[11rem_1fr]">
            <SectionLabel n="01" className="text-ink-faint lg:pt-1">
              Figures
            </SectionLabel>

            <div>
              <h2 className="sr-only">Figures</h2>
              <p className="label text-ink-faint">
                4 ventures · 4 countries · 6+ years
              </p>

              <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3">
                {stats.map((s) => (
                  <div key={s.tag} className="border-t border-hair pt-5">
                    <dt className="sr-only">{s.label}</dt>
                    <dd
                      aria-hidden="true"
                      className="font-display tabular text-[clamp(2.8rem,5.6vw,4.6rem)] leading-none"
                    >
                      {s.value}
                    </dd>
                    <dd className="mt-4 text-[0.95rem] text-ink-soft">
                      {s.tag}
                    </dd>
                    <dd className="mt-2">
                      {sourceSlug[s.source] ? (
                        <Link
                          href={`/work#${sourceSlug[s.source]}`}
                          className="label link-rule text-ink-faint hover:text-ink"
                        >
                          View source ↗
                          <span className="sr-only"> — {s.source}</span>
                        </Link>
                      ) : (
                        <span className="label text-ink-faint">{s.source}</span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ 02 · journey */}
      <section id="trace" className="scroll-mt-24">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-24">
          <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[11rem_1fr]">
            <SectionLabel n="02" className="text-ink-faint lg:pt-1">
              Journey
            </SectionLabel>
            <div>
              <h2 className="sr-only">The journey</h2>
              <JourneyList stops={stops} />
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------- 03 · what I bring, and the writing */}
      <section id="writing" className="scroll-mt-24">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-24">
          <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[11rem_1fr]">
            <SectionLabel n="03" className="text-ink-faint lg:pt-1">
              Register
            </SectionLabel>

            <div className="grid gap-x-16 gap-y-16 xl:grid-cols-2">
              <div id="work-with-me">
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="font-display text-3xl sm:text-4xl">
                    What I bring
                  </h2>
                  <Link
                    href="/services"
                    className="label link-rule text-ink-soft hover:text-ink"
                  >
                    How it works
                  </Link>
                </div>
                <ul className="reg-list mt-8">
                  {engagements.map((e) => (
                    <li
                      key={e.name}
                      className="flex items-baseline justify-between gap-6 border-t border-hair py-4"
                    >
                      <span className="font-display-text text-[1.2rem] leading-snug">
                        {e.name}
                      </span>
                      <span className="label shrink-0 text-ink-faint">
                        {e.stamp}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {posts.length > 0 && (
                <div>
                  <div className="flex items-baseline justify-between gap-4">
                    <h2 className="font-display text-3xl sm:text-4xl">
                      Latest writing
                    </h2>
                    <Link
                      href="/blog"
                      className="label link-rule text-ink-soft hover:text-ink"
                    >
                      All posts
                    </Link>
                  </div>
                  <ul className="reg-list mt-8">
                    {posts.map((post) => (
                      <li key={post.slug} className="border-t border-hair">
                        <Link
                          href={`/blog/${post.slug}`}
                          className="group flex flex-wrap items-baseline gap-x-6 gap-y-1 py-4 sm:flex-nowrap"
                        >
                          <time
                            dateTime={post.published_at}
                            className="label tabular w-full flex-none text-ink-faint sm:w-[6.4rem]"
                          >
                            {post.published_at.slice(0, 10)}
                          </time>
                          <span className="font-display-text text-[1.05rem] leading-snug group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
                            {post.title}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- 04 · contact */}
      <section id="contact" className="scroll-mt-24">
        <div className="mx-auto max-w-6xl px-6 pb-24 pt-8 md:px-10 md:pb-32">
          <div className="callout px-6 py-16 text-center md:py-24">
            <p className="label label-dot justify-center text-ink-faint">
              Contact
            </p>
            <h2 className="font-display mx-auto mt-7 max-w-2xl text-[clamp(2.4rem,5.6vw,4.4rem)] leading-[1.02]">
              Building something? Let&rsquo;s talk.
            </h2>
            <div className="mt-10">
              <a
                href={`mailto:${profile.email}`}
                className="btn btn-solid-paper"
              >
                Start a conversation
                <Arrow className="btn-arrow" />
              </a>
            </div>
          </div>

          <ul className="label mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-ink-faint">
            {profiles.map((p) => (
              <li key={p.label}>
                <a
                  href={p.href}
                  target="_blank"
                  rel={p.me ? "me noopener noreferrer" : "noopener noreferrer"}
                  className="link-rule hover:text-ink"
                >
                  {p.label}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

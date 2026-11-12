import Link from "next/link";
import Arrow from "@/components/Arrow";
import DotMatrix from "@/components/DotMatrix";
import Journey from "@/components/Journey";
import LinkedInMark from "@/components/LinkedInMark";
import Plate from "@/components/Plate";
import SectionLabel from "@/components/SectionLabel";
import UtcClock from "@/components/UtcClock";
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
 * The homepage, kept as plain as it can be: the hero, then four panels. The
 * telemetry (the readings), the register (what is on offer, set as a page from
 * a manual), the trace (the journey as a program listing) and the signal (how
 * to reach me). Anything longer than a line lives on its own page: the
 * ventures on /work, the research on /research.
 */

export default function HomePage() {
  const posts = getPublishedPosts().slice(0, 4);
  // "Komal" / "Kedarnath G" — set as two lines without hardcoding the split.
  const [firstName, ...restOfName] = profile.name.split(" ");

  // The journey, one stop per stage. A stage that is a venture carries its
  // role and dates from the venture record, so those are written once.
  const stops = milestones.map((m) => {
    const v = m.slug ? ventures.find((x) => x.slug === m.slug) : undefined;
    return {
      addr: `0x${m.year}`,
      op: m.op,
      arg: m.arg,
      year: m.year,
      title: v?.company ?? m.title,
      role: v?.role,
      meta: v ? `${v.period} · ${v.category}` : undefined,
      href: v ? `/work#${v.slug}` : m.href,
      hrefLabel: v ? "Open the record" : m.hrefLabel,
      motif: m.motif,
      place: m.place,
    };
  });
  const pins = route.map((r) => ({ code: r.code, label: r.label }));

  return (
    <div>
      {/* ------------------------------------------------------ 00 · the screen */}
      <section id="hero" className="on-ink relative overflow-hidden">
        <Plate
          alt={`${profile.name} — engraved portrait`}
          priority
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 54vw, 44vw"
          className="plate-fade plate-hero absolute right-0 top-0 h-[54%] w-auto max-w-none opacity-90 sm:-right-[3%] sm:h-full sm:w-[54%] sm:object-cover sm:object-[46%_20%] sm:opacity-100 lg:w-[44%]"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-ink from-36% to-transparent to-50% sm:hidden"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 hidden bg-gradient-to-r from-ink from-20% via-ink/10 to-transparent to-45% sm:block"
        />

        <div className="settle relative mx-auto flex min-h-[calc(100svh-4.25rem)] max-w-6xl flex-col px-6 pb-14 pt-12 md:px-10 md:pb-16 md:pt-14">
          {/* The status line: a live clock and where the work is based. */}
          <p className="statusbar label">
            <span className="flex items-center gap-2.5 text-paper-soft">
              <span aria-hidden="true" className="now-mark text-brass" />
              Online
            </span>
            <span>
              UTC <UtcClock className="text-paper-soft" />
            </span>
            <span className="hidden sm:inline">Base · India</span>
          </p>

          <div className="mt-auto pt-24">
            <h1 className="wordmark text-[clamp(2.8rem,7.6vw,6.5rem)]">
              {firstName}
              <br />
              <span className="sm:whitespace-nowrap">{restOfName.join(" ")}</span>
            </h1>

            <p className="tagline mt-7 max-w-xl text-balance text-[clamp(1.5rem,2.8vw,2.1rem)] leading-[1.22] text-paper-soft">
              {profile.tagline}
            </p>

            <div className="mt-11">
              <a
                href={`mailto:${profile.email}`}
                className="btn btn-solid-paper"
              >
                Start a conversation
                <Arrow className="btn-arrow" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- 01 · the telemetry */}
      <section id="record" className="on-ink rule-1 scroll-mt-16">
        <div className="mx-auto max-w-6xl px-6 py-7 md:px-10">
          <div className="sec-head mb-3.5">
            <SectionLabel n="01" onInk className="text-paper-faint">
              Telemetry
            </SectionLabel>
            <p className="label hidden text-paper-faint sm:block">
              4 ventures · 4 countries · 6+ years
            </p>
          </div>

          <dl className="tele-row">
            {stats.map((s) => (
              <div key={s.tag} className="tele-ch">
                <dt className="tele-top label">{s.tag}</dt>
                <dd>
                  <DotMatrix text={s.value} label={s.label} />
                </dd>
                <dd aria-hidden="true" className="tele-src label">
                  {s.source}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ------------------------------------------------- 02 · the register */}
      <section id="writing" className="bg-paper scroll-mt-16">
        <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-24">
          <SectionLabel n="02" className="text-ink-faint">
            Register
          </SectionLabel>

          <div className="mt-12 grid gap-x-20 gap-y-16 lg:grid-cols-2">
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
                  <li key={e.name}>
                    <Link href="/services" className="reg-row group">
                      <span className="font-display-text text-lg leading-snug group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
                        {e.name}
                      </span>
                    </Link>
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
                    <li key={post.slug}>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="reg-row group flex-wrap sm:flex-nowrap"
                      >
                        <time
                          dateTime={post.published_at}
                          className="label tabular w-full flex-none text-ink-faint sm:w-[6.4rem]"
                        >
                          {post.published_at.slice(0, 10)}
                        </time>
                        <span className="font-display-text text-base leading-snug group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
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
      </section>

      {/* ---------------------------------------------------- 03 · the trace */}
      <section id="trace" className="on-ink rule-1 scroll-mt-16">
        <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-24">
          <SectionLabel n="03" onInk className="text-paper-faint">
            Trace
          </SectionLabel>
          <h2 className="font-display mt-5 mb-10 max-w-3xl text-[clamp(2rem,4vw,3rem)] leading-[1.06]">
            The journey, one instruction at a time.
          </h2>
          <Journey stops={stops} pins={pins} />
        </div>
      </section>

      {/* ---------------------------------------------------- 04 · the signal */}
      <section id="contact" className="on-ink rule-1 scroll-mt-16">
        <div className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-28">
          <SectionLabel n="04" onInk className="text-paper-faint">
            Signal
          </SectionLabel>
          <h2 className="font-display mt-8 max-w-3xl text-[clamp(2.6rem,6.2vw,5.2rem)] leading-[1]">
            Building something? Let&rsquo;s talk.
          </h2>

          <div className="mt-12 flex flex-wrap items-center gap-3">
            <a
              href={profile.linkedin}
              target="_blank"
              rel="me noopener noreferrer"
              className="btn btn-solid-paper"
            >
              <LinkedInMark className="h-3.5 w-3.5" />
              Connect on LinkedIn
              <span className="sr-only">(opens in a new tab)</span>
            </a>
            <a href={`mailto:${profile.email}`} className="btn btn-paper">
              Email me
              <Arrow className="btn-arrow" />
            </a>
          </div>

          <p className="label mt-10 text-paper-faint">{profile.location}</p>
        </div>
      </section>
    </div>
  );
}

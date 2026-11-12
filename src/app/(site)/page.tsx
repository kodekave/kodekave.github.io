import Link from "next/link";
import Arrow from "@/components/Arrow";
import BootPost from "@/components/BootPost";
import DotMatrix from "@/components/DotMatrix";
import Journey from "@/components/Journey";
import LinkedInMark from "@/components/LinkedInMark";
import Plate from "@/components/Plate";
import SectionLabel from "@/components/SectionLabel";
import SectionRail from "@/components/SectionRail";
import StickyCta from "@/components/StickyCta";
import Terminal from "@/components/Terminal";
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
  title: "Founder's Office Operator & GTM Strategist — Komal Kedarnath",
  description:
    "Komal Kedarnath helps founders build from idea to execution: four ventures across India, the Maldives, the US and the UK in more than six years.",
});

/**
 * The homepage is one machine, and the page ends on HCF.
 *
 * Four panels after the screen that powers on: the telemetry (the readings),
 * the register (what is on offer, as a printout), the trace (the journey as a
 * program listing, with the map as its detail) and the signal (a terminal
 * awaiting input). Each carries a silkscreen designator, U1 to U4. Anything
 * longer than a line lives on its own page: the ventures on /work, the
 * research on /research.
 */

/**
 * The name, split into words and then glyphs so each letter can rise into
 * place on load (see `.name-glyph`). `startAt` continues the stagger from the
 * previous line, so the second line begins as the first one ends.
 */
function glyphs(words: string[], startAt: number) {
  let n = startAt;
  return words.map((word, w) => (
    <span key={`${word}-${w}`}>
      {w > 0 ? " " : null}
      <span className="name-word">
        {[...word].map((ch, c) => (
          <span
            key={c}
            className="name-glyph"
            style={{ "--i": n++ } as React.CSSProperties}
          >
            {ch}
          </span>
        ))}
      </span>
    </span>
  ));
}

export default function HomePage() {
  const posts = getPublishedPosts().slice(0, 4);
  // "Komal" / "Kedarnath G" — set as two lines without hardcoding the split.
  const [firstName, ...restOfName] = profile.name.split(" ");

  // The journey, one stop per stage. A stage that is a venture carries its
  // role and dates from the venture record, so those are written once. The two
  // counts are running totals: how many countries and ventures there had been
  // by that stage, for the registers.
  const stops = milestones.map((m, i) => {
    const v = m.slug ? ventures.find((x) => x.slug === m.slug) : undefined;
    const soFar = milestones.slice(0, i + 1);
    return {
      addr: `0x${m.year}`,
      op: m.op,
      arg: m.arg,
      year: m.year,
      title: v?.company ?? m.title,
      role: v?.role,
      meta: v ? `${v.period} · ${v.category}` : undefined,
      current: v?.current,
      href: v ? `/work#${v.slug}` : m.href,
      hrefLabel: v ? "Open the record" : m.hrefLabel,
      motif: m.motif,
      place: m.place,
      countries: new Set(soFar.map((x) => x.place)).size,
      ventures: soFar.filter((x) => x.slug).length,
    };
  });
  const pins = route.map((r) => ({
    code: r.code,
    label: r.label,
    years: r.years,
    lat: r.lat,
    lon: r.lon,
  }));

  return (
    <div>
      <BootPost />

      {/* ------------------------------------------------------ 00 · the screen */}
      <section
        id="hero"
        className="on-ink grain scanlines relative overflow-hidden"
      >
        <Plate
          alt={`${profile.name} — engraved portrait`}
          priority
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 54vw, 44vw"
          className="plate-fade settle-plate absolute opacity-40 sm:opacity-100 -top-8 -right-[3%] h-[112%] w-[86%] max-w-none object-cover object-[46%_20%] sm:w-[54%] lg:w-[44%]"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-ink via-ink/85 to-ink/25 sm:hidden"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 hidden bg-gradient-to-r from-ink from-20% via-ink/10 to-transparent to-45% sm:block"
        />

        <div className="hero-exit relative mx-auto flex min-h-[calc(100svh-4.25rem)] max-w-6xl flex-col px-6 pb-14 pt-12 md:px-10 md:pb-16 md:pt-14">
          {/* The status strip: a live clock and where the work is based. */}
          <p className="statusbar label settle settle-1">
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
            <h1
              aria-label={profile.name}
              className="wordmark text-[clamp(2.6rem,8.8vw,7rem)]"
            >
              <span aria-hidden="true">
                {glyphs([firstName], 0)}
                <br />
                <span className="sm:whitespace-nowrap">
                  {glyphs(restOfName, firstName.length)}
                </span>
              </span>
            </h1>

            <p className="settle settle-3 tagline mt-8 max-w-2xl text-balance text-[clamp(1.7rem,3.6vw,2.5rem)] leading-[1.14]">
              {profile.tagline}
            </p>

            <div className="settle settle-4 mt-10 flex flex-wrap items-center gap-3">
              <a
                href={`mailto:${profile.email}`}
                className="btn btn-solid-paper"
              >
                Start a conversation
                <Arrow className="btn-arrow" />
              </a>
              <a
                href={profile.linkedin}
                target="_blank"
                rel="me noopener noreferrer"
                className="btn btn-paper"
              >
                <LinkedInMark className="h-3.5 w-3.5" />
                LinkedIn
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- 01 · the telemetry */}
      <section id="record" className="on-ink grain rule-2 relative scroll-mt-16">
        <div className="mx-auto max-w-7xl px-6 py-8 md:px-10 md:py-9">
          <div className="sec-head mb-4">
            <SectionLabel n="01" onInk className="text-paper-faint">
              Telemetry
            </SectionLabel>
            <p className="label text-paper-faint">
              4 ventures · 4 countries · 6+ years
            </p>
            <span className="label hidden items-center gap-3 text-paper-faint sm:flex">
              <span aria-hidden="true" className="lamp-d" />
              Sig
              <span className="desig">U1</span>
            </span>
          </div>

          <dl className="panel tele-panel">
            {stats.map((s, i) => (
              <div key={s.tag} className="tele-ch">
                <dt className="tele-top label">
                  <span>{s.tag}</span>
                  <span aria-hidden="true" className="tele-no tabular">
                    {i + 1}
                  </span>
                </dt>
                <dd>
                  <DotMatrix text={s.value} label={s.label} />
                </dd>
                <dd aria-hidden="true" className="label text-paper-faint">
                  {s.source}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ------------------------------------------------- 02 · the register */}
      <section id="writing" className="regsec grain scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:px-10 md:py-20">
          <div className="feed">
            <div className="feed-perf" aria-hidden="true" />
            <div className="feed-page">
              <div className="feed-head sec-head">
                <SectionLabel n="02" className="text-ink-faint">
                  Register
                </SectionLabel>
                <span className="desig text-ink-faint">U2</span>
              </div>

              <div className="mt-10 grid gap-x-16 gap-y-14 lg:grid-cols-2">
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
                  <ul className="reg-list mt-6">
                    {engagements.map((e) => (
                      <li key={e.name}>
                        <Link href="/services" className="reg-row group">
                          <span className="reg-box" aria-hidden="true" />
                          <span className="font-display-text text-lg leading-snug group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
                            {e.name}
                          </span>
                          <span className="reg-lead" aria-hidden="true" />
                          <span className="stamp">{e.stamp}</span>
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
                    <ul className="reg-list mt-6">
                      {posts.map((post) => (
                        <li key={post.slug}>
                          <Link
                            href={`/blog/${post.slug}`}
                            className="reg-row group"
                          >
                            <time
                              dateTime={post.published_at}
                              className="label tabular w-[6.4rem] flex-none text-ink-faint"
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
            <div className="feed-perf" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- 03 · the trace */}
      <section
        id="trace"
        className="on-ink grain rule-2 relative scroll-mt-16"
      >
        <div className="mx-auto max-w-7xl px-6 py-12 md:px-10 md:py-16">
          <div className="sec-head">
            <SectionLabel n="03" onInk className="text-paper-faint">
              Trace
            </SectionLabel>
            <span className="desig text-paper-faint">U3</span>
          </div>
          <h2 className="font-display mt-4 mb-7 max-w-3xl text-[clamp(2rem,4.2vw,3rem)] leading-[1.04]">
            The journey, one instruction at a time.
          </h2>
          <Journey stops={stops} pins={pins} />
        </div>
      </section>

      {/* ---------------------------------------------------- 04 · the signal */}
      <section
        id="contact"
        className="on-ink grain scanlines rule-2 relative scroll-mt-16 overflow-hidden"
      >
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-x-16 gap-y-12 px-6 py-20 md:px-10 md:py-28 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <SectionLabel n="04" onInk className="text-paper-faint">
              Signal
            </SectionLabel>
            <h2 className="font-display mt-8 max-w-3xl text-[clamp(2.6rem,6.4vw,5.4rem)] leading-[0.98]">
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

          <Terminal address={profile.linkedin.replace(/^https?:\/\/(www\.)?/, "")} />
        </div>
      </section>

      <StickyCta
        href={`mailto:${profile.email}`}
        label="Start a conversation"
        hideWhileVisible={["hero", "contact", "newsletter"]}
      />

      <SectionRail
        items={[
          { id: "record", label: "Telemetry", tone: "ink" },
          { id: "writing", label: "Register", tone: "paper" },
          { id: "trace", label: "Trace", tone: "ink" },
          { id: "contact", label: "Signal", tone: "ink" },
        ]}
        hideWhileVisible={["hero", "newsletter"]}
      />
    </div>
  );
}

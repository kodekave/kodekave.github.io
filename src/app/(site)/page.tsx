import Link from "next/link";
import Arrow from "@/components/Arrow";
import Atlas from "@/components/Atlas";
import BlueprintFrame from "@/components/BlueprintFrame";
import DotMatrix from "@/components/DotMatrix";
import LinkedInMark from "@/components/LinkedInMark";
import Plate from "@/components/Plate";
import Reveal from "@/components/Reveal";
import SectionLabel from "@/components/SectionLabel";
import SectionRail from "@/components/SectionRail";
import SignalBeacon from "@/components/SignalBeacon";
import StickyCta from "@/components/StickyCta";
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
 * The homepage is an instrument panel, not a brochure.
 *
 * Five short readings, in the order a backer wants them: who (the card),
 * what (the telemetry), where and when (the atlas, with its timeline), what
 * is on offer (the register), and how to reach me (the signal). Anything
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

/**
 * The line of record under the statement. It types itself out with CSS alone
 * (see `.type`), starting once the name has landed.
 */
function bootLines() {
  const lines: { cmd: string; out: string }[] = [
    { cmd: "record", out: "4 ventures · 4 countries · 6+ years" },
  ];
  let t = 1.0;
  return lines.map((l) => {
    const delay = t;
    t += l.out.length * 0.034 + 0.25;
    return { ...l, delay };
  });
}

export default function HomePage() {
  const posts = getPublishedPosts().slice(0, 4);
  // "Komal" / "Kedarnath G" — set as two lines without hardcoding the split.
  const [firstName, ...restOfName] = profile.name.split(" ");
  const boot = bootLines();

  // What happened at each place, for the atlas to show when one is chosen.
  // A stage that is a venture carries its role and dates from the venture
  // record, so those are written once.
  const pins = route.map((r) => ({
    ...r,
    stations: milestones
      .filter((m) => m.place === r.code)
      .map((m) => {
        const v = m.slug ? ventures.find((x) => x.slug === m.slug) : undefined;
        return {
          year: m.year,
          title: v?.company ?? m.title,
          role: v?.role,
          period: v?.period,
          category: v?.category,
          current: v?.current,
          href: v ? `/work#${v.slug}` : m.href,
          hrefLabel: v ? "Open the record" : m.hrefLabel,
        };
      }),
  }));

  return (
    <div>
      {/* ------------------------------------------------------ 00 · the card */}
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
        <BlueprintFrame />

        <div className="hero-exit relative mx-auto flex min-h-[calc(100svh-4.25rem)] max-w-6xl flex-col px-6 pb-14 pt-12 md:px-10 md:pb-16 md:pt-14">
          {/* The status line: a live clock and where the work is based. */}
          <p className="statusbar label settle settle-1">
            <span className="flex items-center gap-2.5 text-paper-soft">
              <span aria-hidden="true" className="now-mark text-brass" />
              Online
            </span>
            <span>
              UTC <UtcClock className="text-paper-soft" />
            </span>
            <span className="hidden sm:inline">
              Base · India
            </span>
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

            <p className="settle settle-3 font-display mt-8 max-w-2xl text-balance text-[clamp(1.7rem,3.6vw,2.75rem)] leading-[1.12]">
              {profile.tagline}
            </p>

            <div className="boot mt-7 max-w-full overflow-hidden" aria-hidden="true">
              {boot.map((l, i) => (
                <p key={l.cmd} className="boot-line">
                  <span className="boot-cmd">&gt; {l.cmd}</span>
                  <span>
                    <span
                      className="type"
                      style={
                        {
                          "--n": l.out.length,
                          "--d": `${l.delay}s`,
                        } as React.CSSProperties
                      }
                    >
                      {l.out}
                    </span>
                    {i === boot.length - 1 && <span className="caret" />}
                  </span>
                </p>
              ))}
            </div>
            {/* The same record, for screen readers and crawlers. */}
            <p className="sr-only">
              Four ventures across four countries and more than six years.
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
      <section id="record" className="on-ink grain relative scroll-mt-16">
        <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionLabel n="01" onInk className="text-paper-faint">
                Telemetry
              </SectionLabel>
              <p className="label text-paper-faint">
                Readings from four ventures
              </p>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <dl className="tele mt-10 grid-cols-2 lg:grid-cols-3">
              {stats.map((s) => (
                <div
                  key={s.tag}
                  className="flex flex-col justify-between gap-8 p-5 sm:p-7"
                >
                  <dt className="label text-paper-faint">{s.tag}</dt>
                  <dd>
                    <DotMatrix
                      text={s.value}
                      label={s.label}
                      className="h-9 max-w-full sm:h-12 lg:h-14"
                    />
                    <span
                      aria-hidden="true"
                      className="label mt-5 block text-paper-faint"
                    >
                      {s.source}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------- 02 · the atlas */}
      <section
        id="atlas"
        className="on-deep grain scanlines relative scroll-mt-16"
      >
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-28">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
              <div>
                <SectionLabel n="02" onInk className="text-paper-faint">
                  Atlas
                </SectionLabel>
                <h2 className="font-display mt-6 max-w-2xl text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.04]">
                  Where the work was done.
                </h2>
              </div>
              <p className="label text-paper-faint">
                {route.map((r) => r.code).join(" → ")}
              </p>
            </div>
          </Reveal>

          <Reveal delay={80} className="mt-12">
            <Atlas
              pins={pins}
              label="A flat dot-matrix world map that drifts sideways, marking the four places worked, in order: India, Malé in the Maldives, the United States, and London in the United Kingdom. Choosing a place lists what happened there."
            />
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------- 03 · the register */}
      <section
        id="writing"
        className="grain scroll-mt-16 border-t border-hair bg-mist"
      >
        <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
          <Reveal>
            <SectionLabel n="03" className="text-ink-faint">
              Register
            </SectionLabel>
          </Reveal>

          <div className="mt-12 grid gap-x-20 gap-y-16 lg:grid-cols-2">
            <Reveal id="work-with-me">
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
              <ul className="mt-8 border-b border-hair">
                {engagements.map((e) => (
                  <li key={e.name}>
                    <Link href="/services" className="reg-row group">
                      <span className="reg-box" aria-hidden="true" />
                      <span className="font-display-text text-xl leading-snug group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
                        {e.name}
                      </span>
                      <span className="reg-lead" aria-hidden="true" />
                      <span className="stamp">{e.stamp}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>

            {posts.length > 0 && (
              <Reveal delay={100}>
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
                <ul className="mt-8 border-b border-hair">
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
                        <span className="font-display-text text-lg leading-snug group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
                          {post.title}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- 04 · the signal */}
      <section
        id="contact"
        className="on-ink grain scanlines relative scroll-mt-16 overflow-hidden"
      >
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-x-16 gap-y-14 px-6 py-24 md:px-10 md:py-32 lg:grid-cols-[1.15fr_0.85fr]">
          <Reveal>
            <SectionLabel n="04" onInk className="text-paper-faint">
              Signal
            </SectionLabel>
            <h2 className="font-display mt-8 max-w-3xl text-[clamp(2.6rem,6.4vw,5.4rem)] leading-[1]">
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

            <p className="label mt-10 break-all text-paper-faint">
              linkedin.com/in/komalkedarnath
            </p>
            <p className="label mt-2 text-paper-faint">{profile.location}</p>
          </Reveal>

          <Reveal delay={120} className="justify-self-center lg:justify-self-end">
            <SignalBeacon
              href={profile.linkedin}
              name={profile.name}
              className="h-[min(78vw,26rem)] w-[min(78vw,26rem)]"
            />
          </Reveal>
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
          { id: "atlas", label: "Atlas", tone: "ink" },
          { id: "writing", label: "Register", tone: "paper" },
          { id: "contact", label: "Signal", tone: "ink" },
        ]}
        hideWhileVisible={["hero", "newsletter"]}
      />
    </div>
  );
}

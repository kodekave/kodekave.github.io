import Link from "next/link";
import Arrow from "@/components/Arrow";
import BlueprintFrame from "@/components/BlueprintFrame";
import CountUp from "@/components/CountUp";
import Globe from "@/components/Globe";
import Guilloche from "@/components/Guilloche";
import HalftoneDivider from "@/components/HalftoneDivider";
import Marquee from "@/components/Marquee";
import Plate from "@/components/Plate";
import PointerLight from "@/components/PointerLight";
import Reveal from "@/components/Reveal";
import RouteMap from "@/components/RouteMap";
import ScrollText from "@/components/ScrollText";
import SectionLabel from "@/components/SectionLabel";
import SectionRail from "@/components/SectionRail";
import StickyCta from "@/components/StickyCta";
import {
  countryCode,
  engagements,
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
    "Komal Kedarnath is a founder's-office operator and GTM strategist who has scaled four ventures across India, the Maldives, the US, and the UK.",
});

/**
 * The homepage runs as three acts.
 *
 * Act one is the card: name, title, one line of positioning, the two things
 * a visitor can do, and three figures of proof. Act two is the proposal — who
 * I am, the operating record, and what an engagement covers — and takes the
 * visual and motion budget. Act three is the close: a direct way to start a
 * conversation, with the newsletter after it in the footer.
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
  const posts = getPublishedPosts().slice(0, 3);
  // "Komal" / "Kedarnath G" — set as two lines without hardcoding the split.
  const [firstName, ...restOfName] = profile.name.split(" ");
  const leadStats = stats.filter((s) => s.lead);
  const restStats = stats.filter((s) => !s.lead);
  const proof = stats.slice(0, 3);
  const now = ventures.find((v) => v.current);

  return (
    <div>
      {/* ------------------------------------------------ Act I — the card */}
      <section id="hero" className="on-ink grain relative overflow-hidden">
        <Plate
          alt={`${profile.name} — engraved portrait`}
          priority
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 54vw, 44vw"
          className="plate-fade settle-plate absolute opacity-40 sm:opacity-100 -top-8 -right-[3%] h-[112%] w-[86%] max-w-none object-cover object-[46%_20%] sm:w-[54%] lg:w-[44%]"
        />

        {/* The brighter copy of the portrait, revealed under the cursor. */}
        <Plate
          alt=""
          sizes="(max-width: 1024px) 54vw, 44vw"
          className="plate-lit absolute -top-8 -right-[3%] h-[112%] w-[86%] max-w-none object-cover object-[46%_20%] sm:w-[54%] lg:w-[44%]"
        />
        <PointerLight />
        <span aria-hidden="true" className="hero-glow absolute inset-0" />

        {/*
          Two scrims, because the type sits in a different place at each
          width. Narrow: the name is bottom-aligned over the middle of the
          plate, so the field darkens upward from the bottom. Wide: the name
          is beside the plate, so it darkens inward from the left and barely
          touches the engraving.
        */}
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-ink via-ink/85 to-ink/25 sm:hidden"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 hidden bg-gradient-to-r from-ink from-20% via-ink/10 to-transparent to-45% sm:block"
        />

        <BlueprintFrame />

        <div className="hero-exit relative mx-auto flex min-h-[calc(100svh-4.25rem)] max-w-6xl flex-col justify-end px-6 pb-14 pt-28 md:px-10 md:pb-16">
          {now && (
            <p className="settle settle-1 label mb-5 flex items-center gap-3 text-paper-soft">
              <span aria-hidden="true" className="now-mark text-brass" />
              <span>
                Now — {now.role}, {now.company}
              </span>
            </p>
          )}
          <p className="settle settle-1 label text-paper-faint">
            {profile.role}
          </p>

          <h1
            aria-label={profile.name}
            className="wordmark mt-7 text-[clamp(2.6rem,8.8vw,7rem)]"
          >
            <span aria-hidden="true">
              {glyphs([firstName], 0)}
              <br />
              <span className="sm:whitespace-nowrap">
                {glyphs(restOfName, firstName.length)}
              </span>
            </span>
          </h1>

          <p className="settle settle-3 mt-8 max-w-sm text-lg leading-relaxed text-paper-soft">
            {profile.tagline}
          </p>

          <div className="settle settle-4 mt-9 flex flex-wrap items-center gap-3">
            <Link href="/services" className="btn btn-solid-paper">
              Work with me
              <Arrow className="btn-arrow" />
            </Link>
            <Link href="#record" className="btn btn-paper">
              See the record
            </Link>
          </div>

          {/* Proof, in the first screen: three figures on a hairline. */}
          <dl className="settle settle-5 mt-14 grid max-w-md grid-cols-3 gap-6 border-t border-hair-inv pt-6">
            {proof.map((s) => (
              <div key={s.short}>
                <dt className="label text-paper-faint">{s.short}</dt>
                <dd className="font-display tabular mt-2 text-3xl leading-none sm:text-4xl">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* The seal: a guilloche rosette around the initials, pressed into
            the corner of the card like a stamp on good stationery. */}
        <span
          aria-hidden="true"
          className="absolute bottom-8 right-6 hidden h-20 w-20 place-items-center text-paper md:grid md:right-10"
        >
          <Guilloche copies={30} className="absolute inset-0 text-brass/75" />
          <span className="relative grid h-10 w-10 place-items-center rounded-full bg-ink">
            <span className="wordmark text-base leading-none text-paper-soft">
              KK
            </span>
          </span>
        </span>
      </section>

      <Marquee items={profile.knowsAbout} />

      {/* ---------------------------------------------- Act II — the proposal */}

      {/* About */}
      <section id="about" className="on-paper grain scroll-mt-16">
        <div className="mx-auto grid max-w-6xl gap-x-16 gap-y-16 px-6 py-24 md:px-10 md:py-32 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <SectionLabel n="01" className="text-ink-faint">
                About
              </SectionLabel>
              <h2 className="font-display mt-6 max-w-2xl text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.04]">
                Four countries, one operating career.
              </h2>
            </Reveal>

            <Reveal delay={90}>
              <ScrollText
                text={profile.subTagline}
                className="mt-9 max-w-2xl text-xl leading-[1.7] text-ink-soft"
              />
            </Reveal>

            <Reveal delay={180}>
              <Link
                href="/about"
                className="label link-rule mt-12 inline-block text-ink-soft hover:text-ink"
              >
                More about me
              </Link>
            </Reveal>
          </div>

          <Reveal delay={140} className="lg:col-span-5 lg:pt-14">
            <div className="border-t border-ink pt-8 text-ink">
              <p className="label mb-6 text-ink-faint">The route</p>
              <Globe
                pins={route}
                label="A turning globe marking the four places worked: India, Malé in the Maldives, the United States, and London in the United Kingdom."
              />
              <div className="mt-10">
                <RouteMap />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <HalftoneDivider field="paper" dot="ink" />

      {/* Operating record — the stats, then the venture timeline as a
          numbered sequence. This is the section with the most budget. */}
      <section
        id="record"
        className="on-ink grain relative scroll-mt-16 overflow-hidden"
      >
        <span
          aria-hidden="true"
          className="ghost absolute -right-6 -top-4 text-[26vw] text-paper/[0.045]"
        >
          Record
        </span>

        <div className="relative mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
          <Reveal>
            <SectionLabel n="02" onInk className="text-paper-faint">
              Operating record
            </SectionLabel>
            <h2 className="font-display mt-6 max-w-2xl text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.04]">
              Idea to operations, wherever the founder is.
            </h2>
          </Reveal>

          {/* Two figures set large, four set small beneath them. */}
          <Reveal delay={90}>
            <div className="mt-16 space-y-12">
              <dl className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
                {leadStats.map((s) => (
                  <div key={s.label} className="border-t border-brass pt-6">
                    <dt className="sr-only">{s.label}</dt>
                    <dd>
                      <CountUp
                        value={s.value}
                        className="font-display tabular block text-[clamp(3.6rem,9vw,7rem)] leading-[0.96]"
                      />
                      <span
                        aria-hidden="true"
                        className="label mt-5 block leading-relaxed text-paper-soft"
                      >
                        {s.label}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>

              <dl className="grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-4">
                {restStats.map((s) => (
                  <div key={s.label} className="border-t border-hair-inv pt-5">
                    <dt className="sr-only">{s.label}</dt>
                    <dd>
                      <CountUp
                        value={s.value}
                        className="font-display tabular block text-4xl leading-[1.06]"
                      />
                      <span
                        aria-hidden="true"
                        className="label mt-4 block leading-relaxed text-paper-faint"
                      >
                        {s.label}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>

          {/* Reverse-chronological, so the numbers count back through the
              record rather than labelling an arbitrary list. */}
          <ol className="mt-24">
            {ventures.map((v, i) => (
              <Reveal as="li" key={v.slug} delay={i * 60}>
                <Link
                  href={`/work#${v.slug}`}
                  className="group grid grid-cols-1 gap-x-10 gap-y-4 border-t border-hair-inv py-9 md:grid-cols-[4rem_1fr_auto]"
                >
                  <span className="label tabular text-paper-faint md:pt-2">
                    #{i + 1}
                  </span>

                  <div className="row-body">
                    <h3 className="font-display text-3xl leading-tight sm:text-4xl">
                      {v.company}
                    </h3>
                    <p className="font-display-text mt-3 text-lg text-paper-soft">
                      {v.role}
                    </p>
                    {/* Hairlines rather than dots between the facts. */}
                    <div className="label mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-paper-faint">
                      <span>{v.period}</span>
                      <span
                        aria-hidden="true"
                        className="h-3 w-px bg-hair-inv"
                      />
                      <span>{v.location}</span>
                    </div>
                    <p className="mt-6 max-w-xl leading-relaxed text-paper-soft">
                      {v.summary}
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-6 md:items-end md:justify-between">
                    <div className="flex flex-wrap items-start gap-2 md:justify-end">
                      {v.current && (
                        <span className="stamp stamp-brass">Current</span>
                      )}
                      <span className="stamp stamp-dark">{v.category}</span>
                      <span className="stamp stamp-dark">
                        {countryCode(v.country)}
                      </span>
                    </div>
                    <Arrow className="row-arrow hidden text-paper md:block" />
                  </div>
                </Link>
              </Reveal>
            ))}
          </ol>

          <div className="border-t border-hair-inv pt-10">
            <Link
              href="/work"
              className="label link-rule inline-block text-paper-soft hover:text-paper"
            >
              All the work
            </Link>
          </div>
        </div>
      </section>

      <HalftoneDivider field="ink" dot="paper" />

      {/* Offering */}
      <section id="work-with-me" className="on-paper grain scroll-mt-16">
        <div className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
          <Reveal>
            <SectionLabel n="03" className="text-ink-faint">
              Work with me
            </SectionLabel>
            <h2 className="font-display mt-6 max-w-2xl text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.04]">
              What an engagement covers.
            </h2>
            <p className="mt-8 max-w-xl text-xl leading-[1.7] text-ink-soft">
              A founder&rsquo;s office, without hiring one. Most engagements
              are one of these, or an ongoing arrangement that absorbs
              several.
            </p>
          </Reveal>

          <ol className="mt-20">
            {engagements.map((e, i) => (
              <Reveal as="li" key={e.name} delay={i * 60}>
                <Link
                  href="/services"
                  className="group grid grid-cols-1 gap-x-10 gap-y-4 border-t border-hair py-9 md:grid-cols-[4rem_1fr_auto]"
                >
                  <span className="label tabular text-ink-faint md:pt-2">
                    #{i + 1}
                  </span>
                  <div className="row-body">
                    <h3 className="font-display text-3xl leading-tight sm:text-4xl">
                      {e.name}
                    </h3>
                    <p className="mt-5 max-w-xl leading-relaxed text-ink-soft">
                      {e.summary}
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-6 md:items-end md:justify-between">
                    <span className="stamp">{e.stamp}</span>
                    <Arrow className="row-arrow hidden text-ink md:block" />
                  </div>
                </Link>
              </Reveal>
            ))}
          </ol>

          <div className="flex flex-wrap items-center gap-3 border-t border-hair pt-10">
            <a
              href={`mailto:${profile.email}`}
              className="btn btn-solid-ink"
            >
              Start a conversation
              <Arrow className="btn-arrow" />
            </a>
            <Link href="/services" className="btn btn-ink">
              How this works
            </Link>
          </div>
        </div>
      </section>

      {/* --------------------------------- Everything else, deliberately quiet */}
      {posts.length > 0 && (
        <section id="writing" className="grain scroll-mt-16 border-t border-hair bg-mist">
          <div className="mx-auto max-w-6xl px-6 py-20 md:px-10">
            <Reveal>
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <SectionLabel n="04" className="text-ink-faint">
                    Writing
                  </SectionLabel>
                  <h2 className="font-display mt-5 text-2xl sm:text-3xl">
                    Notes from the founder&rsquo;s office.
                  </h2>
                </div>
                <Link
                  href="/blog"
                  className="label link-rule text-ink-soft hover:text-ink"
                >
                  All posts
                </Link>
              </div>
            </Reveal>

            {/* A ruled list, not cards — this should read as an index. */}
            <ul className="mt-10">
              {posts.map((post) => (
                <li key={post.slug}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group grid grid-cols-1 gap-x-10 gap-y-2 border-t border-hair py-6 sm:grid-cols-[9rem_1fr]"
                  >
                    <time
                      dateTime={post.published_at ?? post.created_at}
                      className="label text-ink-faint sm:pt-1.5"
                    >
                      {new Date(
                        post.published_at ?? post.created_at
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </time>
                    <div className="row-body">
                      <h3 className="font-display-text text-xl leading-snug group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
                        {post.title}
                      </h3>
                      <p className="mt-2 max-w-2xl leading-relaxed text-ink-soft">
                        {post.excerpt}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <HalftoneDivider field={posts.length > 0 ? "mist" : "paper"} dot="ink" />

      {/* --------------------------------------------- Act III — the close */}
      <section
        id="contact"
        className="on-ink grain relative scroll-mt-16 overflow-hidden"
      >
        {/* The fade is on a wrapper that does not turn, so it stays put
            while the rosette rotates beneath it. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[-26%] right-[-28%] h-[min(120vw,860px)] w-[min(120vw,860px)] md:bottom-auto md:right-[-22%] md:top-1/2 md:-translate-y-1/2 md:[mask-image:linear-gradient(to_right,transparent_0%,#000_46%)]"
        >
          <Guilloche
            copies={44}
            className="guilloche-turn h-full w-full text-brass/[0.34]"
          />
        </div>
        <div className="relative mx-auto max-w-6xl px-6 pb-80 pt-24 md:px-10 md:py-36">
          <Reveal>
            <SectionLabel n="05" onInk className="text-paper-faint">
              Start a conversation
            </SectionLabel>
            <h2 className="font-display mt-8 max-w-4xl text-[clamp(2.6rem,7vw,6rem)] leading-[1]">
              Have an idea that needs an operator?
            </h2>
            <p className="mt-9 max-w-xl text-xl leading-[1.7] text-paper-soft">
              Tell me what you&rsquo;re building and where it&rsquo;s stuck.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <div className="mt-12 flex flex-wrap items-center gap-3">
              <a
                href={`mailto:${profile.email}`}
                className="btn btn-solid-paper"
              >
                Email me
                <Arrow className="btn-arrow" />
              </a>
              <a
                href={profile.linkedin}
                target="_blank"
                rel="me noopener noreferrer"
                className="btn btn-paper"
              >
                LinkedIn
              </a>
            </div>
            <p className="label mt-10 text-paper-faint">{profile.location}</p>
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
          { id: "about", label: "About", tone: "paper" },
          { id: "record", label: "Operating record", tone: "ink" },
          { id: "work-with-me", label: "Work with me", tone: "paper" },
          ...(posts.length > 0
            ? [{ id: "writing", label: "Writing", tone: "paper" as const }]
            : []),
          { id: "contact", label: "Start a conversation", tone: "ink" },
        ]}
        hideWhileVisible={["hero", "newsletter"]}
      />
    </div>
  );
}

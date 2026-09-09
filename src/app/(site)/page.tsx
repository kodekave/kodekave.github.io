import Link from "next/link";
import Plate from "@/components/Plate";
import Reveal from "@/components/Reveal";
import RouteMap from "@/components/RouteMap";
import {
  countryCode,
  engagements,
  profile,
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
 * Act one is a business card: name, title, one line of positioning, and
 * nothing else to look at. Act two is the proposal — who I am, the operating
 * record, and what an engagement covers — and takes the visual and motion
 * budget. Everything after it stays deliberately quiet, and the newsletter
 * closes the page from the footer.
 */
export default function HomePage() {
  const posts = getPublishedPosts().slice(0, 3);
  // "Komal" / "Kedarnath G" — set as two lines without hardcoding the split.
  const [firstName, ...restOfName] = profile.name.split(" ");

  return (
    <div>
      {/* ------------------------------------------------ Act I — the card */}
      <section className="on-ink grain relative overflow-hidden">
        <Plate
          alt={`${profile.name} — engraved portrait`}
          priority
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 54vw, 44vw"
          className="plate-fade settle-plate absolute -top-8 -right-[3%] h-[112%] w-[86%] max-w-none object-cover object-[46%_20%] sm:w-[54%] lg:w-[44%]"
        />

        {/*
          Legibility scrim. The plate is bright where the face is lit, and the
          name has to sit over it on narrow screens — this keeps the left side
          of the field dark without hiding the engraving on the right.
        */}
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-ink from-20% via-ink/60 to-transparent sm:via-ink/10 sm:to-40%"
        />

        <div className="relative mx-auto flex min-h-[calc(100svh-4.25rem)] max-w-6xl flex-col justify-end px-6 pb-20 pt-28 md:px-10">
          <p className="settle settle-1 label text-paper-faint">
            {profile.role}
          </p>

          <h1 className="settle settle-2 wordmark mt-7 text-[clamp(2.5rem,7.4vw,5.75rem)]">
            {firstName}
            <br />
            <span className="sm:whitespace-nowrap">
              {restOfName.join(" ")}
            </span>
          </h1>

          <p className="settle settle-3 mt-9 max-w-sm text-lg leading-relaxed text-paper-soft">
            {profile.tagline}
          </p>
        </div>

        {/* The badge mark, pressed into the corner of the card. */}
        <span
          aria-hidden="true"
          className="absolute bottom-8 right-6 hidden h-16 w-12 place-items-center border border-hair-inv md:grid md:right-10"
        >
          <span
            className="wordmark text-xl leading-none text-paper-soft"
            style={{ fontVariationSettings: '"opsz" 32' }}
          >
            KK
          </span>
        </span>
      </section>

      {/* ---------------------------------------------- Act II — the proposal */}

      {/* About */}
      <section className="on-paper grain border-t border-hair">
        <div className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
          <Reveal>
            <p className="label text-ink-faint">About</p>
            <h2 className="font-display mt-5 max-w-2xl text-[clamp(1.9rem,4.4vw,3.1rem)] leading-[1.08]">
              Four countries, one operating career.
            </h2>
          </Reveal>

          <Reveal delay={90}>
            <p className="mt-9 max-w-2xl text-xl leading-[1.7] text-ink-soft">
              {profile.subTagline}
            </p>
          </Reveal>

          <Reveal delay={140}>
            <div className="mt-16 max-w-2xl text-ink">
              <RouteMap />
            </div>
          </Reveal>

          <Reveal delay={180}>
            <Link
              href="/about"
              className="label link-rule mt-14 inline-block text-ink-soft hover:text-ink"
            >
              More about me
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Operating record — the stats, then the venture timeline as a
          numbered sequence. This is the section with the most budget. */}
      <section className="on-ink grain relative overflow-hidden">
        <span
          aria-hidden="true"
          className="ghost absolute -right-6 -top-4 text-[26vw] text-paper/[0.045]"
        >
          Record
        </span>

        <div className="relative mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
          <Reveal>
            <p className="label text-paper-faint">Operating record</p>
            <h2 className="font-display mt-5 max-w-2xl text-[clamp(1.9rem,4.4vw,3.1rem)] leading-[1.08]">
              Idea to operations, wherever the founder is.
            </h2>
          </Reveal>

          <Reveal delay={90}>
            <dl className="mt-16 grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
              {stats.map((s) => (
                <div key={s.label} className="border-t border-hair-inv pt-5">
                  <dt className="sr-only">{s.label}</dt>
                  <dd>
                    {/*
                      A lower optical size than the headings use. At opsz 96
                      the hairlines in "%" and "+" thin out to almost nothing
                      at this size, and the figures are the one thing here
                      that has to be unambiguous.
                    */}
                    <span
                      className="font-display tabular block text-4xl leading-[1.06]"
                      style={{ fontVariationSettings: '"opsz" 34' }}
                    >
                      {s.value}
                    </span>
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
          </Reveal>

          {/* Reverse-chronological, so the numbers count back through the
              record rather than labelling an arbitrary list. */}
          <ol className="mt-24">
            {ventures.map((v, i) => (
              <Reveal key={v.slug} delay={i * 60}>
                <li>
                  <Link
                    href={`/work#${v.slug}`}
                    className="group grid grid-cols-1 gap-x-10 gap-y-4 border-t border-hair-inv py-9 md:grid-cols-[4rem_1fr_auto]"
                  >
                    <span className="label tabular text-paper-faint md:pt-2">
                      #{i + 1}
                    </span>

                    <div>
                      <h3 className="font-display text-3xl leading-tight group-hover:underline group-hover:decoration-1 group-hover:underline-offset-[6px] sm:text-4xl">
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

                    <div className="flex flex-wrap items-start gap-2 md:justify-end">
                      {v.current && (
                        <span className="stamp stamp-dark">Current</span>
                      )}
                      <span className="stamp stamp-dark">{v.category}</span>
                      <span className="stamp stamp-dark">
                        {countryCode(v.country)}
                      </span>
                    </div>
                  </Link>
                </li>
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

      {/* Offering */}
      <section className="on-paper grain">
        <div className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
          <Reveal>
            <p className="label text-ink-faint">Work with me</p>
            <h2 className="font-display mt-5 max-w-2xl text-[clamp(1.9rem,4.4vw,3.1rem)] leading-[1.08]">
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
              <Reveal key={e.name} delay={i * 60}>
                <li>
                  <Link
                    href="/services"
                    className="group grid grid-cols-1 gap-x-10 gap-y-4 border-t border-hair py-9 md:grid-cols-[4rem_1fr_auto]"
                  >
                    <span className="label tabular text-ink-faint md:pt-2">
                      #{i + 1}
                    </span>
                    <div>
                      <h3 className="font-display text-3xl leading-tight group-hover:underline group-hover:decoration-1 group-hover:underline-offset-[6px] sm:text-4xl">
                        {e.name}
                      </h3>
                      <p className="mt-5 max-w-xl leading-relaxed text-ink-soft">
                        {e.summary}
                      </p>
                    </div>
                    <span className="stamp self-start md:justify-self-end">
                      {e.stamp}
                    </span>
                  </Link>
                </li>
              </Reveal>
            ))}
          </ol>

          <div className="border-t border-hair pt-10">
            <Link href="/services" className="btn btn-ink">
              How this works
            </Link>
          </div>
        </div>
      </section>

      {/* --------------------------------- Everything else, deliberately quiet */}
      {posts.length > 0 && (
        <section className="grain border-t border-hair bg-mist">
          <div className="mx-auto max-w-6xl px-6 py-20 md:px-10">
            <Reveal>
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <p className="label text-ink-faint">Writing</p>
                  <h2 className="font-display mt-4 text-2xl sm:text-3xl">
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
                    <div>
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
    </div>
  );
}

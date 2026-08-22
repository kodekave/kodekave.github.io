import Link from "next/link";
import Portrait from "@/components/Portrait";
import FrameCorners from "@/components/FrameCorners";
import FieldMesh from "@/components/FieldMesh";
import Reveal from "@/components/Reveal";
import RouteMap from "@/components/RouteMap";
import Stamp from "@/components/Stamp";
import { countryCode, engagements, profile, stats, ventures } from "@/lib/content";
import { getPublishedPosts } from "@/lib/posts";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  path: "/",
  title: "Founder's Office Operator & GTM Strategist — Komal Kedarnath",
  description:
    "Komal Kedarnath is a founder's-office operator and GTM strategist who has scaled four ventures across India, the Maldives, the US, and the UK.",
});

export default function HomePage() {
  const posts = getPublishedPosts().slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/*
          Decorative backdrop. Absolutely positioned and pointer-events-none
          so it never intercepts a click, and masked to near-nothing behind
          the headline so type contrast is unaffected.
        */}
        <FieldMesh className="pointer-events-none absolute inset-0 h-full w-full" />
        <div className="relative mx-auto max-w-5xl px-6 pb-16 pt-14 sm:pt-20">
        <div className="grid items-center gap-12 md:grid-cols-[1.3fr_0.9fr]">
          <Reveal>
            <p className="mb-5 inline-block rounded-full border border-line bg-paper px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-accent-deep">
              Founder&rsquo;s Office · GTM Strategy · Cross-Border Ops
            </p>
            <h1 className="font-display text-5xl leading-[1.05] tracking-tight text-ink sm:text-6xl md:text-[4rem]">
              {profile.tagline}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink-soft">
              {profile.subTagline}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/services"
                className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-cream transition hover:-translate-y-0.5 hover:bg-accent-deep hover:shadow-md"
              >
                See what an engagement covers
              </Link>
              <Link
                href="/work"
                className="rounded-full border border-line bg-paper px-6 py-3 text-sm font-medium text-ink transition hover:-translate-y-0.5 hover:border-accent hover:shadow-sm"
              >
                See the ventures
              </Link>
            </div>
          </Reveal>

          <Reveal delay={150} direction="none">
            <div className="relative">
              <Portrait
                src="/images/hero"
                alt={`${profile.name}, ${profile.role}`}
                className="aspect-[4/5] w-full shadow-sm"
                sizes="(max-width: 768px) 90vw, 430px"
                priority
                kenBurns
                windowGrid
              />
              <FrameCorners />
            </div>
          </Reveal>
        </div>
        </div>
      </section>

      {/* Operating record — the one dark, bold moment */}
      <section className="bg-ink bg-grid-lines">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-khaki">
              Operating record
            </p>
            <h2 className="mt-3 max-w-lg font-display text-2xl text-cream sm:text-3xl">
              Four countries, one operating career.
            </h2>
          </Reveal>

          <Reveal delay={100}>
            <div className="mt-14">
              <RouteMap />
            </div>
          </Reveal>

          <div className="mt-14 grid grid-cols-2 gap-8 border-t border-cream/10 pt-10 sm:grid-cols-3 md:grid-cols-6">
            {stats.map((s, i) => (
              <Reveal key={s.label} delay={i * 60}>
                <p className="font-mono text-2xl text-khaki sm:text-3xl">
                  {s.value}
                </p>
                <p className="mt-1 text-xs text-cream/60 sm:text-sm">
                  {s.label}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Ventures preview */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <Reveal>
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-accent-deep">
                4 Ventures · 4 Countries
              </p>
              <h2 className="mt-2 font-display text-3xl text-ink">
                Idea to operations, wherever the founder is.
              </h2>
            </div>
            <Link
              href="/work"
              className="hidden shrink-0 text-sm font-medium text-ink-soft hover:text-accent-deep sm:block"
            >
              All the work →
            </Link>
          </div>
        </Reveal>

        <div className="grid gap-6 sm:grid-cols-2">
          {ventures.map((v, i) => (
            <Reveal key={v.slug} delay={i * 70}>
              <Link
                href={`/work#${v.slug}`}
                className="group block h-full rounded-xl border border-line bg-paper p-6 transition hover:-translate-y-1 hover:border-accent hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <Stamp>{v.category}</Stamp>
                  <Stamp>{countryCode(v.country)}</Stamp>
                </div>
                <h3 className="mt-4 font-display text-xl text-ink group-hover:text-accent-deep">
                  {v.company}
                </h3>
                <p className="mt-1 text-sm text-ink-faint">{v.role}</p>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  {v.summary}
                </p>
              </Link>
            </Reveal>
          ))}
        </div>

        <Link
          href="/work"
          className="mt-8 block text-sm font-medium text-ink-soft hover:text-accent-deep sm:hidden"
        >
          All the work →
        </Link>
      </section>

      {/* Work with me — the commercial page needs a route in from the homepage */}
      <section className="border-t border-line bg-paper">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <Reveal>
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-accent-deep">
                  Work with me
                </p>
                <h2 className="mt-2 max-w-xl font-display text-3xl text-ink">
                  What an engagement covers.
                </h2>
                <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-soft">
                  A founder&rsquo;s office, without hiring one. Most
                  engagements are one of these, or an ongoing arrangement that
                  absorbs several.
                </p>
              </div>
              <Link
                href="/services"
                className="hidden shrink-0 rounded-full bg-ink px-6 py-3 text-sm font-medium text-cream transition hover:-translate-y-0.5 hover:bg-accent-deep hover:shadow-md sm:block"
              >
                How this works &rarr;
              </Link>
            </div>
          </Reveal>

          <div className="grid gap-6 sm:grid-cols-2">
            {engagements.map((e, i) => (
              <Reveal key={e.name} delay={i * 70}>
                <Link
                  href="/services"
                  className="group block h-full rounded-xl border border-line bg-cream p-6 transition hover:-translate-y-1 hover:border-accent hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-xl text-ink group-hover:text-accent-deep">
                      {e.name}
                    </h3>
                    <Stamp>{e.stamp}</Stamp>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                    {e.summary}
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>

          <Link
            href="/services"
            className="mt-8 block rounded-full bg-ink px-6 py-3 text-center text-sm font-medium text-cream sm:hidden"
          >
            How this works &rarr;
          </Link>
        </div>
      </section>

      {/* Latest writing */}
      {posts.length > 0 && (
        <section className="border-t border-line bg-paper">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <Reveal>
              <div className="mb-10 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-wide text-accent-deep">
                    Writing
                  </p>
                  <h2 className="mt-2 font-display text-3xl text-ink">
                    Notes from the founder&rsquo;s office.
                  </h2>
                </div>
                <Link
                  href="/blog"
                  className="hidden shrink-0 text-sm font-medium text-ink-soft hover:text-accent-deep sm:block"
                >
                  All posts →
                </Link>
              </div>
            </Reveal>

            <div className="grid gap-6 sm:grid-cols-3">
              {posts.map((post, i) => (
                <Reveal key={post.slug} delay={i * 70}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group block h-full rounded-xl border border-line bg-cream p-6 transition hover:-translate-y-1 hover:border-accent hover:shadow-md"
                  >
                    <p className="font-mono text-xs text-ink-faint">
                      {new Date(
                        post.published_at ?? post.created_at
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <h3 className="mt-2 font-display text-lg leading-snug text-ink group-hover:text-accent-deep">
                      {post.title}
                    </h3>
                    <p className="mt-2 text-sm text-ink-soft line-clamp-3">
                      {post.excerpt}
                    </p>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

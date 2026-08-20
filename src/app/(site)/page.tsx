import Link from "next/link";
import Portrait from "@/components/Portrait";
import { profile, stats, ventures } from "@/lib/content";
import { getPublishedPosts } from "@/lib/posts";

export default function HomePage() {
  const posts = getPublishedPosts().slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-16 pt-14 sm:pt-20">
        <div className="grid items-center gap-12 md:grid-cols-[1.3fr_0.9fr]">
          <div>
            <p className="mb-5 inline-block rounded-full border border-line bg-paper px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-accent-deep">
              Founder&rsquo;s Office · GTM · Cross-Border Ops
            </p>
            <h1 className="font-display text-4xl leading-[1.1] text-ink sm:text-5xl md:text-[3.4rem]">
              {profile.tagline}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink-soft">
              {profile.subTagline}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/work"
                className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-accent-deep"
              >
                See the ventures
              </Link>
              <Link
                href="/about"
                className="rounded-full border border-line bg-paper px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-accent"
              >
                Read my story
              </Link>
            </div>
          </div>

          <Portrait
            src="/images/hero.jpg"
            alt={profile.name}
            className="aspect-[4/5] w-full shadow-sm"
          />
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-line bg-paper">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 py-12 sm:grid-cols-3 md:grid-cols-6">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="font-display text-2xl text-accent-deep sm:text-3xl">
                {s.value}
              </p>
              <p className="mt-1 text-xs text-ink-faint sm:text-sm">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Ventures preview */}
      <section className="mx-auto max-w-5xl px-6 py-20">
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

        <div className="grid gap-6 sm:grid-cols-2">
          {ventures.map((v) => (
            <Link
              key={v.slug}
              href={`/work#${v.slug}`}
              className="group rounded-2xl border border-line bg-paper p-6 transition-colors hover:border-accent"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent-deep">
                  {v.category}
                </span>
                <span className="text-xs text-ink-faint">{v.country}</span>
              </div>
              <h3 className="mt-4 font-display text-xl text-ink group-hover:text-accent-deep">
                {v.company}
              </h3>
              <p className="mt-1 text-sm text-ink-faint">{v.role}</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                {v.summary}
              </p>
            </Link>
          ))}
        </div>

        <Link
          href="/work"
          className="mt-8 block text-sm font-medium text-ink-soft hover:text-accent-deep sm:hidden"
        >
          All the work →
        </Link>
      </section>

      {/* Latest writing */}
      {posts.length > 0 && (
        <section className="border-t border-line bg-paper">
          <div className="mx-auto max-w-5xl px-6 py-20">
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

            <div className="grid gap-6 sm:grid-cols-3">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group rounded-2xl border border-line bg-cream p-6 transition-colors hover:border-accent"
                >
                  <p className="text-xs text-ink-faint">
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
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

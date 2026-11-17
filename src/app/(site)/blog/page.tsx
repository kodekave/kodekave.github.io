import Link from "next/link";
import { getPublishedPosts } from "@/lib/posts";
import Arrow from "@/components/Arrow";
import Masthead from "@/components/Masthead";
import NewsletterForm from "@/components/NewsletterForm";
import Reveal from "@/components/Reveal";
import {
  breadcrumbSchema,
  buildMetadata,
  jsonLdGraph,
  jsonLdScript,
} from "@/lib/seo";

export const metadata = buildMetadata({
  path: "/blog",
  title: "Writing on Founder's Office Operations & GTM Strategy",
  description:
    "Essays and guides on founder's-office operations, GTM strategy, and scaling startups across borders — written from six years running ops for founders.",
});

const guides = [
  {
    href: "/founders-office-guide",
    title: "What is a founder's office?",
    blurb:
      "The function that turns a founder's priorities into executed work — what it covers, how it differs from chief of staff, and when to hire one.",
  },
  {
    href: "/cross-border-operations",
    title: "Cross-border startup operations",
    blurb:
      "Compliance sequencing, multi-currency close, entity setup and distributed teams, from four countries of doing it.",
  },
  {
    href: "/fractional-coo-vs-founders-office",
    title: "Fractional COO vs founder's office vs chief of staff",
    blurb:
      "Three titles used interchangeably that should not be. What each owns, and which to hire for which bottleneck.",
  },
];

export default function BlogIndexPage() {
  const posts = getPublishedPosts();

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          jsonLdGraph(breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Writing", path: "/blog" }]))
        )}
      />

      <Masthead
        pattern="halftone"
        label="Writing"
        title={<>Notes from the founder&rsquo;s office.</>}
        lead={
          <>
            On GTM strategy, cross-border operations, and what it actually
            takes to turn an idea into a working business. Everything here
            comes out of six years of{" "}
            <Link href="/work" className="ref">
              founder&rsquo;s-office work across four ventures
            </Link>{" "}
            in India, the Maldives, the United States and the United Kingdom —
            so it is written from having done the thing rather than having
            read about it. Expect specifics: the filing that blocked a launch,
            the reporting change that made a monthly close reconcile, the
            hiring criterion that actually predicted who could operate under
            ambiguity.
          </>
        }
      >
        <p className="settle settle-3 mt-8 max-w-xl leading-relaxed text-ink-faint">
          Shorter essays are below. The longer reference guides are{" "}
          <a href="#guides" className="ref">
            further down
          </a>
          , and new pieces go out through{" "}
          <Link href="/#newsletter" className="ref">
            the newsletter
          </Link>{" "}
          or{" "}
          <a href="/feed.xml" className="ref">
            RSS
          </a>
          . Book recommendations live on the{" "}
          <Link href="/bookshelf" className="ref">
            bookshelf
          </Link>
          .
        </p>
      </Masthead>

      {/* The index: a shelf of paper folders, one per post, newest first. The
          tab carries the number and the date; the sheet inside rises when you
          point at one. Each is a plain link to the post. */}
      <section className="on-paper">
        <div className="mx-auto max-w-6xl px-6 py-20 md:px-10">
          {posts.length === 0 ? (
            <div className="border border-dashed border-hair p-10">
              <p className="text-lg text-ink-soft">
                First post is on its way. Subscribe below and it&rsquo;ll land
                in your inbox.
              </p>
              <div className="mt-8">
                <NewsletterForm compact />
              </div>
            </div>
          ) : (
            <ul className="folders grid gap-x-8 gap-y-11 sm:grid-cols-2">
              {posts.map((post, i) => (
                <Reveal as="li" key={post.slug} delay={i * 60}>
                  <Link href={`/blog/${post.slug}`} className="folder group">
                    <span aria-hidden="true" className="folder-sheet" />
                    <span className="folder-tab label tabular">
                      <span className="text-brass-deep">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <time
                        dateTime={post.published_at ?? post.created_at}
                        className="text-ink-faint"
                      >
                        {new Date(
                          post.published_at ?? post.created_at
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </time>
                    </span>
                    <div className="folder-front">
                      <h2 className="font-display text-[clamp(1.4rem,2.5vw,1.8rem)] leading-tight group-hover:underline group-hover:decoration-1 group-hover:underline-offset-[6px]">
                        {post.title}
                      </h2>
                      <p className="mt-3 line-clamp-3 leading-relaxed text-ink-soft">
                        {post.excerpt}
                      </p>
                      <span className="label mt-auto flex items-center justify-between gap-4 pt-6 text-ink-faint">
                        <span>{post.reading_minutes} min read</span>
                        <Arrow className="door-arrow shrink-0" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Reference guides */}
      <section
        id="guides"
        className="scroll-mt-20 border-t border-hair band"
      >
        <div className="mx-auto max-w-4xl px-6 py-20">
          <Reveal>
            <p className="label text-ink-faint">Reference guides</p>
            <h2 className="font-display mt-5 text-[clamp(1.6rem,3.2vw,2.2rem)] leading-tight">
              Longer, maintained explainers rather than dated essays.
            </h2>
          </Reveal>
          <Reveal delay={60}>
            <ul className="mt-12">
              {guides.map((guide) => (
                <li key={guide.href}>
                  <Link
                    href={guide.href}
                    className="group block border-t border-hair py-8"
                  >
                    <h3 className="font-display-text text-xl leading-snug group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
                      {guide.title}
                    </h3>
                    <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
                      {guide.blurb}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

import Link from "next/link";
import { getPublishedPosts } from "@/lib/posts";
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
        label="Writing"
        ghost="Notes"
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
        <p className="settle settle-3 mt-8 max-w-xl leading-relaxed text-paper-faint">
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

      {/* The index. A ruled list, with the date in the left column so the
          run of posts reads chronologically at a glance. */}
      <section className="on-paper grain">
        <div className="mx-auto max-w-4xl px-6 py-20">
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
            <ul>
              {posts.map((post, i) => (
                <Reveal key={post.slug} delay={i * 60}>
                  <li>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="group grid gap-x-10 gap-y-2 border-t border-hair py-9 sm:grid-cols-[9rem_1fr]"
                    >
                      <time
                        dateTime={post.published_at ?? post.created_at}
                        className="label text-ink-faint sm:pt-2"
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
                        <h2 className="font-display text-[clamp(1.5rem,3vw,2.1rem)] leading-tight group-hover:underline group-hover:decoration-1 group-hover:underline-offset-[6px]">
                          {post.title}
                        </h2>
                        <p className="mt-4 max-w-2xl leading-relaxed text-ink-soft">
                          {post.excerpt}
                        </p>
                      </div>
                    </Link>
                  </li>
                </Reveal>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Reference guides */}
      <section
        id="guides"
        className="grain scroll-mt-20 border-t border-hair bg-mist"
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

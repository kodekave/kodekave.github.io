import Link from "next/link";
import { getPublishedPosts } from "@/lib/posts";
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
    <div className="mx-auto max-w-3xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          jsonLdGraph(breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Writing", path: "/blog" }]))
        )}
      />

      <Reveal>
        <p className="text-sm font-medium uppercase tracking-wide text-accent-deep">
          Writing
        </p>
        <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">
          Notes from the founder&rsquo;s office.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-ink-soft">
          On GTM strategy, cross-border operations, and what it actually
          takes to turn an idea into a working business. Everything here comes
          out of six years of{" "}
          <Link
            href="/work"
            className="font-medium text-accent-deep underline underline-offset-2"
          >
            founder&rsquo;s-office work across four ventures
          </Link>{" "}
          in India, the Maldives, the United States and the United Kingdom —
          so it is written from having done the thing rather than having read
          about it. Expect specifics: the filing that blocked a launch, the
          reporting change that made a monthly close reconcile, the hiring
          criterion that actually predicted who could operate under ambiguity.
        </p>
        <p className="mt-4 text-ink-soft">
          Shorter essays are below. The longer reference guides are{" "}
          <a
            href="#guides"
            className="font-medium text-accent-deep underline underline-offset-2"
          >
            further down
          </a>
          , and new pieces go out through{" "}
          <Link
            href="/#newsletter"
            className="font-medium text-accent-deep underline underline-offset-2"
          >
            the newsletter
          </Link>{" "}
          or{" "}
          <a
            href="/feed.xml"
            className="font-medium text-accent-deep underline underline-offset-2"
          >
            RSS
          </a>
          .
        </p>
      </Reveal>

      {posts.length === 0 ? (
        <div className="mt-16 rounded-xl border border-dashed border-line bg-paper p-10 text-center">
          <p className="text-ink-soft">
            First post is on its way. Subscribe below and it&rsquo;ll land in
            your inbox.
          </p>
          <div className="mt-6 flex justify-center">
            <NewsletterForm compact />
          </div>
        </div>
      ) : (
        <div className="mt-14 divide-y divide-line">
          {posts.map((post, i) => (
            <Reveal key={post.slug} delay={i * 70}>
              <Link
                href={`/blog/${post.slug}`}
                className="group block py-8 transition-transform first:pt-0 hover:translate-x-1"
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
                <h2 className="mt-2 font-display text-2xl text-ink group-hover:text-accent-deep">
                  {post.title}
                </h2>
                <p className="mt-2 text-ink-soft">{post.excerpt}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent-deep">
                  Read more
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      )}

      <Reveal delay={60}>
        <section id="guides" className="mt-20 scroll-mt-24 border-t border-line pt-10">
          <h2 className="font-display text-2xl text-ink">Reference guides</h2>
          <p className="mt-3 text-ink-soft">
            Longer, maintained explainers rather than dated essays.
          </p>
          <ul className="mt-8 space-y-4">
            {guides.map((guide) => (
              <li key={guide.href}>
                <Link
                  href={guide.href}
                  className="group block rounded-xl border border-line bg-paper p-6 transition hover:-translate-y-0.5 hover:border-accent"
                >
                  <p className="font-display text-lg text-ink group-hover:text-accent-deep">
                    {guide.title}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    {guide.blurb}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </Reveal>
    </div>
  );
}

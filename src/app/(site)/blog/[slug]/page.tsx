import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug, getPublishedPosts, getRelatedPosts } from "@/lib/posts";
import { renderMarkdown } from "@/lib/markdown";
import NewsletterForm from "@/components/NewsletterForm";
import Reveal from "@/components/Reveal";
import { profile } from "@/lib/content";
import { OG_IMAGE, SITE_URL, absoluteUrl } from "@/lib/site";
import {
  PERSON_ID,
  breadcrumbSchema,
  buildMetadata,
  faqSchema,
  jsonLdGraph,
  jsonLdScript,
} from "@/lib/seo";

export function generateStaticParams() {
  return getPublishedPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post || !post.published) return {};

  return buildMetadata({
    path: `/blog/${slug}`,
    title: post.title,
    description: post.excerpt,
    type: "article",
    publishedTime: post.published_at,
    modifiedTime: post.updated_at,
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post || !post.published) notFound();

  const html = renderMarkdown(post.content);
  const related = getRelatedPosts(slug);
  const url = absoluteUrl(`/blog/${slug}`);

  const articleSchema = {
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: post.title,
    description: post.excerpt,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    datePublished: post.published_at,
    dateModified: post.updated_at,
    // Reference the Person node defined once in the root layout, so the
    // author resolves to the same entity site-wide rather than a duplicate.
    author: { "@id": PERSON_ID },
    publisher: { "@id": PERSON_ID },
    image: {
      "@type": "ImageObject",
      url: `${SITE_URL}${post.cover_image ?? OG_IMAGE.url}`,
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
    },
    inLanguage: "en",
    wordCount: post.word_count,
    timeRequired: `PT${post.reading_minutes}M`,
    ...(post.tags.length ? { keywords: post.tags.join(", ") } : {}),
    isPartOf: { "@id": `${SITE_URL}/#website` },
  };

  const graph = jsonLdGraph(
    articleSchema,
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Writing", path: "/blog" },
      { name: post.title, path: `/blog/${slug}` },
    ]),
    ...(post.faqs.length ? [faqSchema(post.faqs)] : [])
  );

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(graph)}
      />

      {/* The post opens on ink, like every other page on the site. */}
      <header className="on-ink grain relative overflow-hidden">
        <div className="relative mx-auto max-w-3xl px-6 pb-16 pt-20">
          {/* Visible breadcrumb, matching the BreadcrumbList above. */}
          <nav
            aria-label="Breadcrumb"
            className="settle settle-1 label text-paper-faint"
          >
            <ol className="flex flex-wrap items-center gap-2.5">
              <li>
                <Link href="/" className="link-rule">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/blog" className="link-rule">
                  Writing
                </Link>
              </li>
            </ol>
          </nav>

          <h1 className="settle settle-2 font-display mt-8 text-[clamp(1.9rem,4.8vw,3.3rem)] leading-[1.07]">
            {post.title}
          </h1>

          <div className="settle settle-3 label mt-9 flex flex-wrap items-center gap-x-4 gap-y-2 text-paper-faint">
            <time dateTime={post.published_at}>
              {new Date(post.published_at ?? post.created_at).toLocaleDateString(
                "en-US",
                { month: "long", day: "numeric", year: "numeric" }
              )}
            </time>
            <span aria-hidden="true" className="h-3 w-px bg-hair-inv" />
            <span>{post.reading_minutes} min read</span>
            <span aria-hidden="true" className="h-3 w-px bg-hair-inv" />
            {/* Named author on the page, not just in schema — a basic E-E-A-T signal. */}
            <Link href="/about" className="link-rule">
              {profile.name}
            </Link>
          </div>
        </div>
      </header>

      <div className="on-paper grain">
        <div className="mx-auto max-w-2xl px-6 py-16 md:py-20">
          {post.cover_image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.cover_image}
              alt={post.title}
              width={1200}
              height={630}
              loading="lazy"
              decoding="async"
              className="mb-14 w-full object-cover"
            />
          )}

          <div
            className="prose-post"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>

      {post.faqs.length > 0 && (
        <section
          aria-labelledby="faq-heading"
          className="grain border-t border-hair bg-mist"
        >
          <div className="mx-auto max-w-2xl px-6 py-16">
            <Reveal>
              <h2 id="faq-heading" className="label text-ink-faint">
                Common questions
              </h2>
              <dl className="mt-10">
                {post.faqs.map((faq) => (
                  <div key={faq.q} className="border-t border-hair py-7">
                    <dt className="font-display-text text-xl leading-snug">
                      {faq.q}
                    </dt>
                    <dd className="mt-3 leading-[1.75] text-ink-soft">
                      {faq.a}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="on-paper grain border-t border-hair">
          <div className="mx-auto max-w-2xl px-6 py-16">
            <Reveal>
              <h2 className="label text-ink-faint">Keep reading</h2>
              <ul className="mt-10">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link
                      href={`/blog/${r.slug}`}
                      className="group block border-t border-hair py-7"
                    >
                      <h3 className="font-display-text text-xl leading-snug group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
                        {r.title}
                      </h3>
                      <p className="mt-3 leading-relaxed text-ink-soft">
                        {r.excerpt}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-10 border-t border-hair pt-7 text-ink-soft">
                For the full picture of how this played out in practice, see{" "}
                <Link href="/work" className="ref">
                  the four ventures I have run a founder&rsquo;s office for
                </Link>
                , or{" "}
                <Link href="/services" className="ref">
                  how I work with founders
                </Link>
                .
              </p>
            </Reveal>
          </div>
        </section>
      )}

      {/* The post's own subscribe prompt. The footer's newsletter still
          closes the page below it. */}
      <section className="grain border-t border-hair bg-mist">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <Reveal>
            <h2 className="font-display text-2xl sm:text-3xl">
              Enjoyed this? Get the next one.
            </h2>
            <p className="mt-4 leading-relaxed text-ink-soft">
              Occasional notes on founder&rsquo;s-office work and cross-border
              ops.
            </p>
            <div className="mt-8">
              <NewsletterForm compact />
            </div>
          </Reveal>
        </div>
      </section>
    </article>
  );
}

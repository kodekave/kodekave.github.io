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
    <article className="mx-auto max-w-2xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(graph)}
      />

      <Reveal direction="none">
        {/* Visible breadcrumb, matching the BreadcrumbList above. */}
        <nav aria-label="Breadcrumb" className="text-sm text-ink-faint">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-accent-deep">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/blog" className="hover:text-accent-deep">
                Writing
              </Link>
            </li>
          </ol>
        </nav>

        <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-sm text-ink-faint">
          <time dateTime={post.published_at}>
            {new Date(post.published_at ?? post.created_at).toLocaleDateString(
              "en-US",
              { month: "long", day: "numeric", year: "numeric" }
            )}
          </time>
          <span aria-hidden="true">·</span>
          <span>{post.reading_minutes} min read</span>
          <span aria-hidden="true">·</span>
          {/* Named author on the page, not just in schema — a basic E-E-A-T signal. */}
          <Link href="/about" className="hover:text-accent-deep">
            {profile.name}
          </Link>
        </div>

        <h1 className="mt-3 font-display text-3xl leading-tight text-ink sm:text-4xl">
          {post.title}
        </h1>

        {post.cover_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover_image}
            alt={post.title}
            width={1200}
            height={630}
            className="mt-8 w-full rounded-2xl object-cover"
          />
        )}

        <div
          className="prose-post mt-10"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </Reveal>

      {post.faqs.length > 0 && (
        <Reveal delay={80}>
          <section
            aria-labelledby="faq-heading"
            className="mt-16 border-t border-line pt-10"
          >
            <h2
              id="faq-heading"
              className="font-display text-2xl text-ink"
            >
              Common questions
            </h2>
            <dl className="mt-6 space-y-6">
              {post.faqs.map((faq) => (
                <div key={faq.q}>
                  <dt className="font-display text-lg text-ink">{faq.q}</dt>
                  <dd className="mt-2 leading-relaxed text-ink-soft">
                    {faq.a}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </Reveal>
      )}

      {related.length > 0 && (
        <Reveal delay={90}>
          <section className="mt-16 border-t border-line pt-10">
            <h2 className="font-display text-xl text-ink">Keep reading</h2>
            <ul className="mt-5 space-y-4">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/blog/${r.slug}`}
                    className="group block rounded-lg border border-line bg-paper p-5 transition hover:border-accent"
                  >
                    <p className="font-display text-lg text-ink group-hover:text-accent-deep">
                      {r.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                      {r.excerpt}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-ink-soft">
              For the full picture of how this played out in practice, see{" "}
              <Link
                href="/work"
                className="font-medium text-accent-deep underline underline-offset-2"
              >
                the four ventures I have run a founder&rsquo;s office for
              </Link>
              , or{" "}
              <Link
                href="/services"
                className="font-medium text-accent-deep underline underline-offset-2"
              >
                how I work with founders
              </Link>
              .
            </p>
          </section>
        </Reveal>
      )}

      <Reveal delay={100}>
        <div className="mt-16 rounded-xl border border-line bg-paper p-8 transition hover:border-accent/60">
          <h2 className="font-display text-xl text-ink">
            Enjoyed this? Get the next one.
          </h2>
          <p className="mt-2 text-sm text-ink-soft">
            Occasional notes on founder&rsquo;s-office work and cross-border
            ops.
          </p>
          <div className="mt-5">
            <NewsletterForm compact />
          </div>
        </div>
      </Reveal>
    </article>
  );
}

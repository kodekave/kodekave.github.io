import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug, getPublishedPosts } from "@/lib/posts";
import { renderMarkdown } from "@/lib/markdown";
import NewsletterForm from "@/components/NewsletterForm";
import Reveal from "@/components/Reveal";
import { profile } from "@/lib/content";

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
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.published_at,
      authors: [profile.name],
    },
  };
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

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.published_at,
    author: { "@type": "Person", name: profile.name },
  };

  return (
    <article className="mx-auto max-w-2xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <Reveal direction="none">
        <Link
          href="/blog"
          className="text-sm font-medium text-ink-faint hover:text-accent-deep"
        >
          ← All writing
        </Link>

        <p className="mt-6 text-sm text-ink-faint">
          {new Date(post.published_at ?? post.created_at).toLocaleDateString(
            "en-US",
            { month: "long", day: "numeric", year: "numeric" }
          )}
        </p>
        <h1 className="mt-3 font-display text-3xl leading-tight text-ink sm:text-4xl">
          {post.title}
        </h1>

        {post.cover_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover_image}
            alt=""
            className="mt-8 w-full rounded-2xl object-cover"
          />
        )}

        <div
          className="prose-post mt-10"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </Reveal>

      <Reveal delay={100}>
        <div className="mt-16 rounded-2xl border border-line bg-paper p-8 transition hover:border-accent/60">
          <h3 className="font-display text-xl text-ink">
            Enjoyed this? Get the next one.
          </h3>
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

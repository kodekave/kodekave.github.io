import Link from "next/link";
import { profile } from "@/lib/content";
import { getPublishedPosts } from "@/lib/posts";
import NewsletterForm from "@/components/NewsletterForm";

export const metadata = {
  title: `Writing — ${profile.name}`,
};

export default function BlogIndexPage() {
  const posts = getPublishedPosts();

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-accent-deep">
        Writing
      </p>
      <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">
        Notes from the founder&rsquo;s office.
      </h1>
      <p className="mt-5 text-lg text-ink-soft">
        On GTM, cross-border operations, and what it actually takes to turn
        an idea into a working business.
      </p>

      {posts.length === 0 ? (
        <div className="mt-16 rounded-2xl border border-dashed border-line bg-paper p-10 text-center">
          <p className="text-ink-soft">
            First post is on its way. Subscribe below and it&rsquo;ll land in your
            inbox.
          </p>
          <div className="mt-6 flex justify-center">
            <NewsletterForm compact />
          </div>
        </div>
      ) : (
        <div className="mt-14 divide-y divide-line">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block py-8 first:pt-0"
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
              <h2 className="mt-2 font-display text-2xl text-ink group-hover:text-accent-deep">
                {post.title}
              </h2>
              <p className="mt-2 text-ink-soft">{post.excerpt}</p>
              <span className="mt-3 inline-block text-sm font-medium text-accent-deep">
                Read more →
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

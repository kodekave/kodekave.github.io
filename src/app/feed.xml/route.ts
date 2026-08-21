import { getPublishedPosts } from "@/lib/posts";
import { profile } from "@/lib/content";
import { SITE_URL, absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * RSS 2.0 feed.
 *
 * A blog and newsletter with no feed forfeits the cheapest distribution it
 * has: readers, aggregators, Substack cross-posting and several AI crawlers
 * all consume feeds directly.
 */
export function GET() {
  const posts = getPublishedPosts();
  const updated = posts[0]?.updated_at ?? new Date().toISOString();

  const items = posts
    .map((post) => {
      const url = absoluteUrl(`/blog/${post.slug}`);
      return `    <item>
      <title>${esc(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(post.published_at).toUTCString()}</pubDate>
      <description>${esc(post.excerpt)}</description>
      <dc:creator>${esc(profile.name)}</dc:creator>
${post.tags.map((t) => `      <category>${esc(t)}</category>`).join("\n")}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${esc(profile.name)} — Notes from the founder's office</title>
    <link>${SITE_URL}/</link>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <description>${esc(
      "Essays and guides on founder's-office operations, GTM strategy, and scaling startups across borders."
    )}</description>
    <language>en</language>
    <lastBuildDate>${new Date(updated).toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

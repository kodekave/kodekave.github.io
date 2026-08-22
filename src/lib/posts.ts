import fs from "fs";
import path from "path";
import matter from "gray-matter";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

export type Faq = { q: string; a: string };

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image: string | null;
  published: boolean;
  created_at: string;
  published_at: string;
  /** Last meaningful edit. Falls back to the publish date. */
  updated_at: string;
  /**
   * Question-and-answer pairs rendered at the foot of the post and emitted
   * as FAQPage structured data. This is the main lever for getting a post
   * quoted by answer engines and featured snippets, which pull short,
   * self-contained answers rather than whole articles.
   */
  faqs: Faq[];
  /** Topic tags, used for `keywords` in structured data and related posts. */
  tags: string[];
  /** Word count of the body, for `wordCount` and reading time. */
  word_count: number;
  reading_minutes: number;
};

function readPost(filename: string): Post {
  const slug = filename.replace(/\.md$/, "");
  const raw = fs.readFileSync(path.join(POSTS_DIR, filename), "utf8");
  const { data, content } = matter(raw);

  const words = content.trim().split(/\s+/).filter(Boolean).length;

  return {
    slug,
    title: data.title ?? slug,
    excerpt: data.excerpt ?? "",
    content,
    cover_image: data.cover_image ?? null,
    published: data.published !== false,
    created_at: data.date ?? new Date(0).toISOString(),
    published_at: data.date ?? new Date(0).toISOString(),
    updated_at: data.updated ?? data.date ?? new Date(0).toISOString(),
    faqs: Array.isArray(data.faqs)
      ? (data.faqs as Faq[]).filter((f) => f && f.q && f.a)
      : [],
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
    word_count: words,
    reading_minutes: Math.max(1, Math.round(words / 220)),
  };
}

function getAllPosts(): Post[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    // `_`-prefixed files are templates and scratch drafts, never posts.
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .map(readPost)
    .sort((a, b) => (a.published_at < b.published_at ? 1 : -1));
}

export function getPublishedPosts(): Post[] {
  return getAllPosts().filter((p) => p.published);
}

export function getPostBySlug(slug: string): Post | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

/**
 * Other published posts, most-recent first, for the "keep reading" block.
 *
 * Posts sharing a tag come first — the two existing posts previously linked
 * only back to the index and never to each other, so nothing signalled that
 * they were topically related.
 */
export function getRelatedPosts(slug: string, limit = 2): Post[] {
  const current = getPostBySlug(slug);
  const others = getPublishedPosts().filter((p) => p.slug !== slug);
  if (!current) return others.slice(0, limit);

  return others
    .map((p) => ({
      post: p,
      shared: p.tags.filter((t) => current.tags.includes(t)).length,
    }))
    .sort((a, b) => b.shared - a.shared)
    .slice(0, limit)
    .map((x) => x.post);
}

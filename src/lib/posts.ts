import fs from "fs";
import path from "path";
import matter from "gray-matter";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image: string | null;
  published: boolean;
  created_at: string;
  published_at: string;
};

function readPost(filename: string): Post {
  const slug = filename.replace(/\.md$/, "");
  const raw = fs.readFileSync(path.join(POSTS_DIR, filename), "utf8");
  const { data, content } = matter(raw);

  return {
    slug,
    title: data.title ?? slug,
    excerpt: data.excerpt ?? "",
    content,
    cover_image: data.cover_image ?? null,
    published: data.published !== false,
    created_at: data.date ?? new Date(0).toISOString(),
    published_at: data.date ?? new Date(0).toISOString(),
  };
}

function getAllPosts(): Post[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map(readPost)
    .sort((a, b) => (a.published_at < b.published_at ? 1 : -1));
}

export function getPublishedPosts(): Post[] {
  return getAllPosts().filter((p) => p.published);
}

export function getPostBySlug(slug: string): Post | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

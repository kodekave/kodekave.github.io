#!/usr/bin/env node
/**
 * Validates content/ before the site builds.
 *
 * Posts and the bookshelf are edited by hand in GitHub's web editor, where
 * there is no schema and no autocomplete. Without this, a mistyped frontmatter
 * key produces a page that builds fine and is quietly wrong — a post with no
 * excerpt ships an empty meta description, a bad date sorts to the top of the
 * blog, a duplicate slug silently shadows another post.
 *
 * So this fails the build loudly instead, naming the file and the fix.
 *
 * Errors block the build. Warnings do not, but they cover the SEO rules the
 * site is otherwise careful about — excerpt length becomes the meta
 * description, so drifting outside 150–160 characters undoes that work.
 *
 * Run directly with `npm run validate`; also runs as part of `npm run build`.
 */

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");
const BOOKS_FILE = path.join(process.cwd(), "content", "books.md");

const errors = [];
const warnings = [];

const err = (file, msg) => errors.push(`${file}: ${msg}`);
const warn = (file, msg) => warnings.push(`${file}: ${msg}`);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function validatePosts() {
  if (!fs.existsSync(POSTS_DIR)) return;

  const files = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"));

  if (files.length === 0) warn("content/posts", "no published posts found");

  const seen = new Map();

  for (const file of files) {
    const rel = `content/posts/${file}`;
    const slug = file.replace(/\.md$/, "");

    if (!/^[a-z0-9-]+$/.test(slug)) {
      err(rel, `filename must be lowercase letters, numbers and hyphens only — this becomes the URL /blog/${slug}/`);
    }
    if (seen.has(slug)) err(rel, `duplicate slug, already used by ${seen.get(slug)}`);
    seen.set(slug, rel);

    let parsed;
    try {
      parsed = matter(fs.readFileSync(path.join(POSTS_DIR, file), "utf8"));
    } catch (e) {
      err(rel, `frontmatter is not valid YAML — ${e.message.split("\n")[0]}`);
      continue;
    }

    const { data, content } = parsed;

    if (!data.title) err(rel, "missing `title`");
    if (!data.excerpt) {
      err(rel, "missing `excerpt` — it is used as the meta description and on the blog index");
    } else {
      const n = String(data.excerpt).length;
      if (n < 140 || n > 165) {
        warn(rel, `excerpt is ${n} characters; aim for 150–160 (it becomes the meta description)`);
      }
    }

    if (!data.date) err(rel, "missing `date`");
    else if (!ISO_DATE.test(String(data.date))) {
      err(rel, `date must be quoted YYYY-MM-DD, got \`${data.date}\``);
    }

    if (data.updated && !ISO_DATE.test(String(data.updated))) {
      err(rel, `updated must be quoted YYYY-MM-DD, got \`${data.updated}\``);
    }

    if (data.published !== undefined && typeof data.published !== "boolean") {
      err(rel, "`published` must be true or false, unquoted");
    }

    if (data.tags !== undefined && !Array.isArray(data.tags)) {
      err(rel, "`tags` must be a list");
    }

    if (data.faqs !== undefined) {
      if (!Array.isArray(data.faqs)) {
        err(rel, "`faqs` must be a list of `q`/`a` pairs");
      } else {
        data.faqs.forEach((f, i) => {
          if (!f || !f.q || !f.a) err(rel, `faqs[${i}] needs both \`q\` and \`a\``);
        });
      }
    }

    const words = content.trim().split(/\s+/).filter(Boolean).length;
    if (words < 300 && data.published !== false) {
      warn(rel, `only ${words} words — under 300 tends to be treated as thin`);
    }
  }
}

function validateBooks() {
  if (!fs.existsSync(BOOKS_FILE)) return;
  const rel = "content/books.md";

  let data;
  try {
    ({ data } = matter(fs.readFileSync(BOOKS_FILE, "utf8")));
  } catch (e) {
    err(rel, `frontmatter is not valid YAML — ${e.message.split("\n")[0]}`);
    return;
  }

  if (!Array.isArray(data.books)) {
    err(rel, "`books` must be a list");
    return;
  }

  data.books.forEach((b, i) => {
    const at = `books[${i}]${b?.title ? ` (${b.title})` : ""}`;
    if (!b || !b.title) err(rel, `${at} is missing \`title\``);
    if (!b || !b.author) err(rel, `${at} is missing \`author\` — it is dropped from the page without one`);
    if (b?.year !== undefined && !Number.isInteger(b.year)) {
      err(rel, `${at} \`year\` must be a plain number, unquoted`);
    }
    if (b?.url && !/^https?:\/\//.test(b.url)) {
      err(rel, `${at} \`url\` must start with http:// or https://`);
    }
  });
}

validatePosts();
validateBooks();

for (const w of warnings) console.warn(`  warning  ${w}`);

if (errors.length > 0) {
  console.error(`\nContent validation failed with ${errors.length} error(s):\n`);
  for (const e of errors) console.error(`  error    ${e}`);
  console.error(
    "\nNothing was deployed. Fix the file above and commit again —" +
      " the site is still serving the last good version.\n"
  );
  process.exit(1);
}

console.log(
  `  content ok (${warnings.length} warning${warnings.length === 1 ? "" : "s"})`
);

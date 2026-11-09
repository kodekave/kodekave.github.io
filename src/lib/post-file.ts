import yaml from "js-yaml";

/**
 * Everything the publishing console needs to know about a post file, with no
 * React and no network: read a markdown file into a draft, write a draft back
 * out in the repository's own style, and check it against the same rules the
 * build enforces (scripts/validate-content.mjs).
 *
 * The checks are repeated here, rather than shared, because that script runs
 * in Node at build time and this runs in the browser before anything is
 * committed. A post that fails the build is not deployed, so catching it here
 * is the difference between "published" and "nothing happened".
 */

export type Faq = { q: string; a: string };

export type PostDraft = {
  /** The filename without `.md`; it becomes the URL, /blog/<slug>/. */
  slug: string;
  title: string;
  /** Shown on the blog index and used as the meta description. */
  excerpt: string;
  /** Quoted YYYY-MM-DD. */
  date: string;
  published: boolean;
  tags: string[];
  faqs: Faq[];
  /** The markdown after the frontmatter. */
  body: string;
  /**
   * Frontmatter keys the editor has no field for (`cover_image`, `updated`,
   * anything added by hand), kept so that editing a post never drops them.
   */
  extra: Record<string, unknown>;
};

export type Issue = {
  level: "error" | "warning";
  field: "slug" | "title" | "excerpt" | "date" | "tags" | "faqs" | "body";
  message: string;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG = /^[a-z0-9-]+$/;
const KNOWN = new Set(["title", "excerpt", "date", "published", "tags", "faqs"]);

/** Today in the reader's own calendar, as YYYY-MM-DD. */
export function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function emptyDraft(): PostDraft {
  return {
    slug: "",
    title: "",
    excerpt: "",
    date: todayISO(),
    published: false,
    tags: [],
    faqs: [],
    body: "",
    extra: {},
  };
}

/** "Before you hand ops to an AI agent" -> "before-you-hand-ops-to-an-ai-agent". */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

export function wordCount(body: string): number {
  return body.trim().split(/\s+/).filter(Boolean).length;
}

/** A frontmatter value as a trimmed string, whatever YAML made of it. */
function str(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

/**
 * Read a markdown file into a draft. Nothing here throws: a file that cannot
 * be understood comes back with what could be recovered and a list of
 * `problems` to show the author, because the next step is to let them fix it.
 */
export function parsePostFile(
  raw: string,
  filename = ""
): { draft: PostDraft; problems: string[] } {
  const problems: string[] = [];
  const draft = emptyDraft();
  draft.published = true;
  draft.slug = slugify(filename.replace(/\.(md|markdown)$/i, ""));

  const text = raw.replace(/^﻿/, "").replace(/\r\n/g, "\n");
  const match = /^---\n([\s\S]*?)\n---[ \t]*(?:\n([\s\S]*))?$/.exec(text);

  if (!match) {
    // No frontmatter: take a leading "# Title" as the title and the rest as
    // the body, so a plain markdown file still imports.
    const heading = /^#\s+(.+)\n+/.exec(text);
    if (heading) {
      draft.title = heading[1].trim();
      draft.body = text.slice(heading[0].length).trim();
    } else {
      draft.body = text.trim();
    }
    if (!draft.slug) draft.slug = slugify(draft.title);
    problems.push(
      "This file has no frontmatter block, so the title, summary and date need filling in."
    );
    return { draft, problems };
  }

  let data: Record<string, unknown> = {};
  try {
    // The core schema keeps `2026-01-31` as a string, where the default one
    // turns it into a Date that would not match the site's own parser.
    const parsed = yaml.load(match[1], { schema: yaml.CORE_SCHEMA });
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      data = parsed as Record<string, unknown>;
    }
  } catch (e) {
    const first = e instanceof Error ? e.message.split("\n")[0] : "unreadable";
    problems.push(
      `The frontmatter is not valid YAML (${first}). Quote any title or summary that contains a colon.`
    );
  }

  draft.title = str(data.title);
  draft.excerpt = str(data.excerpt);
  draft.date = str(data.date) || todayISO();
  draft.published = data.published !== false;
  draft.body = (match[2] ?? "").trim();

  if (Array.isArray(data.tags)) {
    draft.tags = data.tags.map(str).filter(Boolean);
  } else if (typeof data.tags === "string") {
    draft.tags = data.tags.split(",").map((t) => t.trim()).filter(Boolean);
  }

  if (Array.isArray(data.faqs)) {
    draft.faqs = data.faqs
      .map((f) => {
        const o = (f ?? {}) as Record<string, unknown>;
        return { q: str(o.q), a: str(o.a) };
      })
      .filter((f) => f.q || f.a);
  }

  for (const [k, v] of Object.entries(data)) {
    if (!KNOWN.has(k)) draft.extra[k] = v instanceof Date ? str(v) : v;
  }

  if (!draft.slug) draft.slug = slugify(draft.title);
  return { draft, problems };
}

const q = (s: string) => JSON.stringify(s);

/**
 * Write a draft out as a post file, in the style the existing posts use:
 * every string double-quoted (so colons and quotes can never break the YAML),
 * the date quoted, tags and FAQs as block lists.
 *
 * `touchUpdated` stamps `updated:` with today, for an edit to a post that
 * already exists.
 */
export function serializePost(d: PostDraft, touchUpdated = false): string {
  const lines: string[] = ["---"];
  lines.push(`title: ${q(d.title.trim())}`);
  lines.push(`excerpt: ${q(d.excerpt.trim())}`);
  lines.push(`date: ${q(d.date)}`);

  const updated = touchUpdated ? todayISO() : str(d.extra.updated);
  if (updated && updated !== d.date) lines.push(`updated: ${q(updated)}`);
  if (d.extra.cover_image) lines.push(`cover_image: ${q(str(d.extra.cover_image))}`);

  lines.push(`published: ${d.published ? "true" : "false"}`);

  if (d.tags.length > 0) {
    lines.push("tags:");
    for (const t of d.tags) lines.push(`  - ${q(t)}`);
  }

  const faqs = d.faqs.filter((f) => f.q.trim() && f.a.trim());
  if (faqs.length > 0) {
    lines.push("faqs:");
    for (const f of faqs) {
      lines.push(`  - q: ${q(f.q.trim())}`);
      lines.push(`    a: ${q(f.a.trim())}`);
    }
  }

  // Anything else that was in the file, passed through untouched.
  const rest = Object.fromEntries(
    Object.entries(d.extra).filter(([k]) => k !== "updated" && k !== "cover_image")
  );
  if (Object.keys(rest).length > 0) {
    lines.push(yaml.dump(rest, { lineWidth: -1 }).trimEnd());
  }

  lines.push("---", "", d.body.trim(), "");
  return lines.join("\n");
}

/**
 * The public blog renders markdown as it is written, raw HTML included, which
 * is right for an author's own files and wrong for a file that came from
 * somewhere else. So anything that can run code in a reader's browser blocks
 * publishing. Returns what was found, or null.
 */
export function findUnsafeHtml(body: string): string | null {
  const checks: [RegExp, string][] = [
    [/<\s*script\b/i, "a <script> tag"],
    [/<\s*(iframe|object|embed|frame|frameset)\b/i, "an embedded frame or object"],
    [/<\s*(form|input|button|textarea|select)\b/i, "a form control"],
    [/<\s*(style|link|meta|base)\b/i, "a style, link or meta tag"],
    [/\son[a-z]+\s*=/i, "an inline event handler (such as onclick)"],
    [/(href|src|action|formaction)\s*=\s*["']?\s*(javascript|vbscript|data):/i, "a script or data link"],
    [/\]\(\s*(javascript|vbscript|data):/i, "a script or data link"],
  ];
  for (const [re, what] of checks) if (re.test(body)) return what;
  return null;
}

/**
 * The same rules as the build. Errors would stop the deploy, so publishing is
 * blocked on them; warnings are the SEO guidance and never block.
 */
export function validateDraft(
  d: PostDraft,
  opts: { isNew: boolean; existingSlugs: string[] }
): Issue[] {
  const out: Issue[] = [];
  const err = (field: Issue["field"], message: string) =>
    out.push({ level: "error", field, message });
  const warn = (field: Issue["field"], message: string) =>
    out.push({ level: "warning", field, message });

  if (!d.slug) err("slug", "Add a web address (slug) for the post.");
  else if (!SLUG.test(d.slug))
    err("slug", "Use lowercase letters, numbers and hyphens only.");
  else if (opts.isNew && opts.existingSlugs.includes(d.slug))
    err("slug", "A post with this web address already exists.");

  if (!d.title.trim()) err("title", "Add a title.");

  const n = d.excerpt.trim().length;
  if (n === 0) {
    err("excerpt", "Add a summary: it is the meta description and the blog index text.");
  } else if (n < 140 || n > 165) {
    warn("excerpt", `The summary is ${n} characters; aim for 150 to 160.`);
  }

  if (!ISO_DATE.test(d.date)) err("date", "The date must be YYYY-MM-DD.");

  d.faqs.forEach((f, i) => {
    if (Boolean(f.q.trim()) !== Boolean(f.a.trim())) {
      err("faqs", `Question ${i + 1} needs both a question and an answer.`);
    }
  });

  const unsafe = findUnsafeHtml(d.body);
  if (unsafe) {
    err(
      "body",
      `The article contains ${unsafe}, which is not allowed on the site. Remove it, or ask for it to be added deliberately.`
    );
  }

  const words = wordCount(d.body);
  if (words === 0) err("body", "The post has no text yet.");
  else if (words < 300 && d.published) {
    warn("body", `Only ${words} words; under 300 tends to be treated as thin.`);
  }

  return out;
}

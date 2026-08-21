import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BOOKS_FILE = path.join(process.cwd(), "content", "books.md");

export type Book = {
  title: string;
  author: string;
  year?: number;
  category?: string;
  /** Komal's own take. Shown in preference to `blurb` when present. */
  note?: string;
  /** Factual description of the book, used until a personal note is written. */
  blurb?: string;
  /** Optional link — publisher, author site, or a review worth reading. */
  url?: string;
};

export type Bookshelf = {
  intro: string;
  /** Markdown body rendered under the list. */
  body: string;
  books: Book[];
};

/**
 * The shelf lives in one markdown file with a YAML list rather than a file per
 * book: a book entry is two or three fields, so a directory of stubs would be
 * more ceremony than content. Same gray-matter dependency the posts use, so
 * adding a book means appending a few lines to `content/books.md`.
 */
export function getBookshelf(): Bookshelf {
  if (!fs.existsSync(BOOKS_FILE)) {
    return { intro: "", body: "", books: [] };
  }

  const { data, content } = matter(fs.readFileSync(BOOKS_FILE, "utf8"));
  const raw = Array.isArray(data.books) ? (data.books as Book[]) : [];

  return {
    intro: typeof data.intro === "string" ? data.intro : "",
    body: content.trim(),
    books: raw.filter((b) => b && b.title && b.author),
  };
}

/** Groups the shelf by category, preserving first-appearance order. */
export function groupByCategory(books: Book[]): [string, Book[]][] {
  const groups = new Map<string, Book[]>();
  for (const book of books) {
    const key = book.category?.trim() || "Other";
    const existing = groups.get(key);
    if (existing) existing.push(book);
    else groups.set(key, [book]);
  }
  return [...groups.entries()];
}

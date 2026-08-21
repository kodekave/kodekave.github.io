import Link from "next/link";
import Reveal from "@/components/Reveal";
import Stamp from "@/components/Stamp";
import { getBookshelf, groupByCategory } from "@/lib/books";
import { renderMarkdown } from "@/lib/markdown";
import { absoluteUrl } from "@/lib/site";
import {
  PERSON_ID,
  WEBSITE_ID,
  breadcrumbSchema,
  buildMetadata,
  jsonLdGraph,
  jsonLdScript,
} from "@/lib/seo";

export const metadata = buildMetadata({
  path: "/bookshelf",
  title: "Bookshelf: Books Worth Handing to Someone Else",
  description:
    "Book recommendations from a founder's-office operator — what changed how I read a situation, with a short note on why each one earns the shelf.",
});

export default function BookshelfPage() {
  const shelf = getBookshelf();
  const grouped = groupByCategory(shelf.books);
  const url = absoluteUrl("/bookshelf");

  const graph = jsonLdGraph(
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Bookshelf", path: "/bookshelf" },
    ]),
    {
      "@type": "ItemList",
      "@id": `${url}#books`,
      name: "Recommended reading",
      numberOfItems: shelf.books.length,
      isPartOf: { "@id": WEBSITE_ID },
      itemListElement: shelf.books.map((b, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Book",
          name: b.title,
          author: { "@type": "Person", name: b.author },
          ...(b.year ? { datePublished: String(b.year) } : {}),
          ...(b.url ? { url: b.url } : {}),
          // The recommendation itself is the review; keep it attributable.
          ...(b.note
            ? {
                review: {
                  "@type": "Review",
                  reviewBody: b.note,
                  author: { "@id": PERSON_ID },
                },
              }
            : {}),
        },
      })),
    }
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(graph)}
      />

      <Reveal>
        <nav aria-label="Breadcrumb" className="text-sm text-ink-faint">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-accent-deep">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>Bookshelf</li>
          </ol>
        </nav>

        <p className="mt-6 text-sm font-medium uppercase tracking-wide text-accent-deep">
          Bookshelf
        </p>
        <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">
          What&rsquo;s on the shelf.
        </h1>
        {shelf.intro && (
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
            {shelf.intro}
          </p>
        )}
      </Reveal>

      {shelf.books.length === 0 ? (
        <p className="mt-14 rounded-xl border border-dashed border-line bg-paper p-10 text-center text-ink-soft">
          Nothing on the shelf yet.
        </p>
      ) : (
        <div className="mt-14 space-y-14">
          {grouped.map(([category, books], gi) => (
            <Reveal key={category} delay={gi * 60}>
              <section>
                <h2 className="font-display text-2xl text-ink">{category}</h2>
                <ul className="mt-6 divide-y divide-line">
                  {books.map((book) => (
                    <li key={`${book.title}-${book.author}`} className="py-6 first:pt-0">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <h3 className="font-display text-xl text-ink">
                          {book.url ? (
                            <a
                              href={book.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-accent-deep"
                            >
                              {book.title}
                            </a>
                          ) : (
                            book.title
                          )}
                        </h3>
                        {book.year && (
                          <span className="font-mono text-xs text-ink-faint">
                            {book.year}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-ink-faint">
                        {book.author}
                      </p>
                      {(book.note || book.blurb) && (
                        <p className="mt-3 leading-relaxed text-ink-soft">
                          {book.note || book.blurb}
                        </p>
                      )}
                      {!book.note && book.blurb && (
                        <Stamp className="mt-3">Note pending</Stamp>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            </Reveal>
          ))}
        </div>
      )}

      {shelf.body && (
        <Reveal delay={80}>
          <div
            className="prose-post mt-16 border-t border-line pt-10"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(shelf.body) }}
          />
        </Reveal>
      )}

      <Reveal delay={90}>
        <section className="mt-16 rounded-xl border border-line bg-cream p-8">
          <h2 className="font-display text-xl text-ink">
            More of the written stuff
          </h2>
          <p className="mt-3 leading-relaxed text-ink-soft">
            Essays and guides on founder&rsquo;s-office work are in{" "}
            <Link
              href="/blog"
              className="font-medium text-accent-deep underline underline-offset-2"
            >
              the writing section
            </Link>
            , and{" "}
            <Link
              href="/founders-office-guide"
              className="font-medium text-accent-deep underline underline-offset-2"
            >
              what a founder&rsquo;s office actually is
            </Link>{" "}
            is the best place to start.
          </p>
        </section>
      </Reveal>
    </div>
  );
}

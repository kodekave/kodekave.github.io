import Link from "next/link";
import Masthead from "@/components/Masthead";
import Reveal from "@/components/Reveal";
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
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(graph)}
      />

      <Masthead
        label="Bookshelf"
        ghost="Shelf"
        breadcrumb={[{ name: "Home", href: "/" }, { name: "Bookshelf" }]}
        title={<>What&rsquo;s on the shelf.</>}
        lead={shelf.intro || undefined}
      />

      <section className="on-paper grain">
        <div className="mx-auto max-w-3xl px-6 py-20">
      {shelf.books.length === 0 ? (
        <p className="border border-dashed border-hair p-10 text-lg text-ink-soft">
          Nothing on the shelf yet.
        </p>
      ) : (
        grouped.map(([category, books], gi) => (
          <Reveal key={category} delay={gi * 60}>
            <section className="mt-16 first:mt-0">
              <h2 className="label text-ink-faint">{category}</h2>
              <ul className="mt-8">
                {books.map((book) => (
                  <li
                    key={`${book.title}-${book.author}`}
                    className="border-t border-hair py-7"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                      <h3 className="font-display-text text-xl leading-snug">
                        {book.url ? (
                          <a
                            href={book.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ref"
                          >
                            {book.title}
                          </a>
                        ) : (
                          book.title
                        )}
                      </h3>
                      {book.year && (
                        <span className="label tabular text-ink-faint">
                          {book.year}
                        </span>
                      )}
                    </div>
                    <p className="label mt-2.5 text-ink-faint">
                      {book.author}
                    </p>
                    {(book.note || book.blurb) && (
                      <p className="mt-4 leading-relaxed text-ink-soft">
                        {book.note || book.blurb}
                      </p>
                    )}
                    {!book.note && book.blurb && (
                      <span className="stamp mt-4">Note pending</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>
        ))
      )}

      {shelf.body && (
        <Reveal delay={80}>
          <div
            className="prose-post mt-20 border-t border-hair pt-12"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(shelf.body) }}
          />
        </Reveal>
      )}
        </div>
      </section>

      <section className="grain border-t border-hair bg-mist">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <Reveal>
            <h2 className="font-display text-2xl sm:text-3xl">
              More of the written stuff
            </h2>
            <p className="mt-4 leading-relaxed text-ink-soft">
              Essays and guides on founder&rsquo;s-office work are in{" "}
              <Link href="/blog" className="ref">
                the writing section
              </Link>
              , and{" "}
              <Link href="/founders-office-guide" className="ref">
                what a founder&rsquo;s office actually is
              </Link>{" "}
              is the best place to start.
            </p>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

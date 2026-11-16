import Link from "next/link";

export type JourneyStop = {
  year: string;
  title: string;
  /** One line: the role at a venture, or the note for a stage that is not one. */
  line: string;
  /** Where it happened, written out. */
  place: string;
  href?: string;
  hrefLabel?: string;
};

/**
 * The journey as one list: year, title, one line, place. Hairlines between the
 * rows and a soft tint under the pointer. It is a plain ordered list, so it is
 * read in order by anything that reads a page, and it needs no script.
 *
 * Small screens stack each row; from the medium breakpoint it is four columns.
 */
export default function JourneyList({ stops }: { stops: JourneyStop[] }) {
  return (
    <ol className="jlist" aria-label="The journey, oldest first">
      {stops.map((s) => (
        <li key={`${s.year}-${s.title}`} className="jrow">
          <div className="grid grid-cols-[3.75rem_minmax(0,1fr)] gap-x-4 gap-y-1 px-2 py-6 md:grid-cols-[5rem_minmax(0,1.05fr)_minmax(0,1.3fr)_7.5rem] md:items-baseline md:gap-x-8 md:px-4 md:py-7">
            <p className="label tabular col-start-1 row-start-1 pt-1.5 text-ink-faint md:pt-0">
              {s.year}
            </p>

            <h3 className="font-display-text col-start-2 row-start-1 text-[1.35rem] leading-snug md:col-start-2 md:text-[1.5rem]">
              {s.title}
            </h3>

            <div className="col-start-2 row-start-2 md:col-start-3 md:row-start-1">
              <p className="text-[0.95rem] leading-relaxed text-ink-soft">
                {s.line}
              </p>
              {s.href && (
                <Link
                  href={s.href}
                  className="label link-rule mt-2.5 inline-block text-ink hover:text-ink"
                >
                  {s.hrefLabel ?? "Open the record"}
                </Link>
              )}
            </div>

            <p className="label col-start-2 row-start-3 mt-1 text-ink-faint md:col-start-4 md:row-start-1 md:mt-0 md:text-right">
              {s.place}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

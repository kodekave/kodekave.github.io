import Link from "next/link";
import Pattern from "./Pattern";
import PortraitCard from "./PortraitCard";
import type { PatternKind } from "@/lib/patterns";

/**
 * The opening every sub-page shares: a small label with its dot, the title in
 * the display serif, and a lead in the quiet sans. Light, on the page's own
 * paper, under the floating nav.
 *
 * `plate` adds the portrait card (only for pages actually about the person).
 * `pattern` names one of the generated background patterns (src/lib/patterns.ts),
 * drawn behind the opening and faded before it reaches the text.
 */
export default function Masthead({
  label,
  title,
  lead,
  plate = false,
  pattern,
  breadcrumb,
  children,
}: {
  label: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  plate?: boolean;
  pattern?: PatternKind;
  /**
   * Visible trail, for pages that also publish a BreadcrumbList. The last
   * entry is the current page and renders as plain text, so pass it without
   * an href.
   */
  breadcrumb?: { name: string; href?: string }[];
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden">
      {pattern && (
        <Pattern kind={pattern} tight focus={plate ? "portrait" : undefined} />
      )}

      <div
        className={`settle relative mx-auto max-w-6xl px-6 pb-16 pt-14 md:px-10 md:pb-24 md:pt-20 ${
          plate
            ? "grid gap-12 lg:grid-cols-[1.35fr_0.65fr] lg:items-end lg:gap-8"
            : ""
        }`}
      >
        <div>
          {breadcrumb && (
            <nav
              aria-label="Breadcrumb"
              className="label mb-8 text-ink-faint"
            >
              <ol className="flex flex-wrap items-center gap-2.5">
                {breadcrumb.map((crumb, i) => (
                  <li key={crumb.name} className="flex items-center gap-2.5">
                    {i > 0 && <span aria-hidden="true">/</span>}
                    {crumb.href ? (
                      <Link href={crumb.href} className="link-rule">
                        {crumb.name}
                      </Link>
                    ) : (
                      <span aria-current="page">{crumb.name}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}
          {/* On a page whose trail already ends in its own name, the label
              would just say it twice. */}
          {breadcrumb?.at(-1)?.name.toLowerCase() !== label.toLowerCase() && (
            <p className="label label-dot text-ink-faint">{label}</p>
          )}
          <h1 className="font-display mt-7 max-w-3xl text-[clamp(2.1rem,5.4vw,4rem)] leading-[1.05]">
            {title}
          </h1>
          {lead && (
            <p className="mt-8 max-w-xl text-[1.15rem] leading-[1.7] text-ink-soft">
              {lead}
            </p>
          )}
          {children}
        </div>

        {plate && (
          <PortraitCard
            alt="Engraved portrait"
            priority
            sizes="(max-width: 640px) 80vw, 26vw"
            className="w-full max-w-[19rem] justify-self-start lg:max-w-[21rem] lg:justify-self-end"
          />
        )}
      </div>
    </section>
  );
}

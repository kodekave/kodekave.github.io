import Link from "next/link";
import Plate from "./Plate";

/**
 * The ink opening every sub-page shares.
 *
 * Two things depend on it. Visually it's what makes the site read as one
 * piece rather than a homepage with older pages attached — each page starts
 * on the same field, in the same three-part sequence of label, title and
 * lead. Structurally it's why `Nav` can be a fixed ink surface instead of
 * having to sense what sits beneath it.
 */
export default function Masthead({
  label,
  title,
  lead,
  ghost,
  plate = false,
  breadcrumb,
  children,
}: {
  label: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  /** Oversized watermark, cropped by the section. Omit on busier pages. */
  ghost?: string;
  /** Show the engraved portrait. Only for pages actually about the person. */
  plate?: boolean;
  /**
   * Visible trail, for pages that also publish a BreadcrumbList. The last
   * entry is the current page and renders as plain text, so pass it without
   * an href.
   */
  breadcrumb?: { name: string; href?: string }[];
  children?: React.ReactNode;
}) {
  return (
    <section className="on-ink grain relative overflow-hidden">
      {ghost && (
        <span
          aria-hidden="true"
          className="ghost absolute -right-6 -top-6 text-[24vw] text-paper/[0.045]"
        >
          {ghost}
        </span>
      )}

      {plate && (
        <>
          <Plate
            alt="Engraved portrait"
            priority
            sizes="(max-width: 640px) 80vw, 38vw"
            className="plate-fade settle-plate absolute opacity-40 sm:opacity-100 -top-10 -right-[4%] h-[118%] w-[78%] max-w-none object-cover object-[46%_18%] sm:w-[46%] lg:w-[36%]"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-ink via-ink/85 to-ink/30 sm:hidden"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 hidden bg-gradient-to-r from-ink from-25% via-ink/10 to-transparent to-50% sm:block"
          />
        </>
      )}

      <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-24 md:px-10 md:pb-28">
        {breadcrumb && (
          <nav
            aria-label="Breadcrumb"
            className="settle settle-1 label mb-8 text-paper-faint"
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
          <p className="settle settle-1 label text-paper-faint">{label}</p>
        )}
        <h1 className="settle settle-2 font-display mt-6 max-w-3xl text-[clamp(2rem,5.4vw,3.9rem)] leading-[1.05]">
          {title}
        </h1>
        {lead && (
          <p className="settle settle-3 mt-8 max-w-xl text-xl leading-[1.7] text-paper-soft">
            {lead}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}

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
  children,
}: {
  label: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  /** Oversized watermark, cropped by the section. Omit on busier pages. */
  ghost?: string;
  /** Show the engraved portrait. Only for pages actually about the person. */
  plate?: boolean;
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
            className="plate-fade settle-plate absolute -top-10 -right-[4%] h-[118%] w-[78%] max-w-none object-cover object-[46%_18%] sm:w-[46%] lg:w-[36%]"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-ink from-25% via-ink/60 to-transparent sm:via-ink/10 sm:to-45%"
          />
        </>
      )}

      <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-24 md:px-10 md:pb-28">
        <p className="settle settle-1 label text-paper-faint">{label}</p>
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

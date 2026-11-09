/**
 * The section eyebrow: a figure, a hairline and a name, so the page reads as
 * a numbered set of plates rather than a run of headings.
 */
export default function SectionLabel({
  n,
  children,
  className = "",
  onInk = false,
}: {
  n: string;
  children: React.ReactNode;
  className?: string;
  /** True on the dark field, where the numeral is brass; on paper it is the
      deeper brass that holds contrast. */
  onInk?: boolean;
}) {
  return (
    <p className={`label flex items-center gap-4 ${className}`}>
      <span className={`tabular ${onInk ? "text-brass" : "text-brass-deep"}`}>
        [{n}]
      </span>
      <span aria-hidden="true" className="h-px w-10 bg-current opacity-40" />
      <span>{children}</span>
    </p>
  );
}

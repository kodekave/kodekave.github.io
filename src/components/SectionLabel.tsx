/**
 * The section label: a numeral and a name, in the one quiet mono style, set in
 * the left margin of an editorial split ("01 / Figures"). The numeral is the
 * deep olive, which holds contrast on paper.
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
  /** True on a dark panel, where the numeral is the yellow. */
  onInk?: boolean;
}) {
  return (
    <p className={`label flex items-baseline gap-2.5 ${className}`}>
      <span className={`tabular ${onInk ? "text-brass" : "text-brass-deep"}`}>
        {n}
      </span>
      <span aria-hidden="true">/</span>
      <span>{children}</span>
    </p>
  );
}

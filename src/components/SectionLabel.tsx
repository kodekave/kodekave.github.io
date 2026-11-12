/**
 * The section label: a figure and a name, in the one quiet label style.
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
    <p className={`label flex items-baseline gap-3 ${className}`}>
      <span className={`tabular ${onInk ? "text-brass" : "text-brass-deep"}`}>
        [{n}]
      </span>
      <span>{children}</span>
    </p>
  );
}

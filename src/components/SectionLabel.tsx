/**
 * The section eyebrow: a figure, a hairline and a name, so the page reads as
 * a numbered set of plates rather than a run of headings.
 */
export default function SectionLabel({
  n,
  children,
  className = "",
}: {
  n: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={`label flex items-center gap-4 ${className}`}>
      <span className="tabular">{n}</span>
      <span aria-hidden="true" className="h-px w-10 bg-current opacity-40" />
      <span>{children}</span>
    </p>
  );
}

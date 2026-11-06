/**
 * A slow, ruled ticker of disciplines. It carries the breadth of the work
 * (the same list the structured data publishes as `knowsAbout`) as a single
 * quiet line of motion between the opening card and the proposal.
 *
 * The list is rendered once for assistive tech and crawlers, then repeated
 * for the loop and hidden from both. Under reduced motion the loop collapses
 * to a wrapped, static list.
 */
export default function Marquee({ items }: { items: string[] }) {
  const row = (hidden: boolean) => (
    <ul
      className="marquee-row"
      {...(hidden ? { "aria-hidden": true } : {})}
    >
      {items.map((item) => (
        <li
          key={item}
          className="label flex items-center gap-10 whitespace-nowrap"
        >
          <span>{item}</span>
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 border border-current opacity-50"
          />
        </li>
      ))}
    </ul>
  );

  return (
    <div
      className="marquee on-paper border-y border-hair"
      role="region"
      aria-label="Areas of work"
    >
      <div className="marquee-track py-5 text-ink-soft">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}

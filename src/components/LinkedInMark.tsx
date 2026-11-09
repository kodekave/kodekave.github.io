/**
 * The "in" of LinkedIn, drawn as a rule-and-glyph mark so it sits with the
 * site's hairline vocabulary: a thin square, the dot of the i, its stem, and
 * the n. It takes its colour from the surrounding text.
 */
export default function LinkedInMark({
  className = "h-4 w-4",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <rect
        x="1.5"
        y="1.5"
        width="21"
        height="21"
        rx="2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <circle cx="7.4" cy="7.4" r="1.45" fill="currentColor" />
      <rect x="6.1" y="10" width="2.6" height="8" fill="currentColor" />
      <path
        d="M11 10h2.5v1.2c.5-.9 1.5-1.4 2.7-1.4 2.2 0 3 1.4 3 3.6V18h-2.6v-4.2c0-1.1-.4-1.8-1.4-1.8s-1.6.7-1.6 1.8V18H11z"
        fill="currentColor"
      />
    </svg>
  );
}

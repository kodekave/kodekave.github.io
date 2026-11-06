/** A hairline arrow, drawn at the same 1px stroke as the nav's menu icon. */
export default function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg
      width="18"
      height="10"
      viewBox="0 0 18 10"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path d="M0 5H16.5M12.5 1L16.5 5L12.5 9" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export default function Stamp({
  children,
  dark = false,
  className = "",
}: {
  children: React.ReactNode;
  dark?: boolean;
  className?: string;
}) {
  return (
    <span className={`stamp ${dark ? "stamp-dark" : ""} ${className}`}>
      {children}
    </span>
  );
}

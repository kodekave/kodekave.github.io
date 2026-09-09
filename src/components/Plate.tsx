/**
 * The engraved portrait plate.
 *
 * `output: "export"` turns the Next image optimiser off, so the variants are
 * the files scripts/engrave.py writes and this picks between them directly.
 * WebP carries the plate at about a third of the PNG's bytes; the PNG stays
 * as the fallback source rather than being dropped.
 *
 * Compositing lives in `.plate` (globals.css): screened on ink so the
 * plate's black ground drops out, inverted and multiplied on paper.
 */
export default function Plate({
  className = "",
  sizes = "50vw",
  alt,
  priority = false,
}: {
  className?: string;
  sizes?: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <picture>
      <source
        type="image/webp"
        srcSet="/images/plate-1x.webp 900w, /images/plate-2x.webp 1600w"
        sizes={sizes}
      />
      <img
        src="/images/plate-1x.png"
        srcSet="/images/plate-1x.png 900w, /images/plate-2x.png 1600w"
        sizes={sizes}
        alt={alt}
        width={900}
        height={1157}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        className={`plate ${className}`}
      />
    </picture>
  );
}

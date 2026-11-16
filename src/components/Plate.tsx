/**
 * The portrait: a black ruling on white, drawn from the hero photograph by
 * scripts/engrave.py (`portrait-*`). Shadow and hair are dense line, the lit
 * face is left as paper, so it reads as a sketch and not a photographic
 * negative. It is printed on the white `.portrait` card.
 *
 * `output: "export"` turns the Next image optimiser off, so the variants are
 * the files the script writes and this picks between them directly. WebP
 * carries the sketch at about a third of the PNG's bytes; the 1-bit PNG stays
 * as the fallback source.
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
        srcSet="/images/portrait-1x.webp 900w, /images/portrait-2x.webp 1600w"
        sizes={sizes}
      />
      <img
        src="/images/portrait-1x.png"
        srcSet="/images/portrait-1x.png 900w, /images/portrait-2x.png 1600w"
        sizes={sizes}
        alt={alt}
        width={900}
        height={1161}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        className={`plate ${className}`}
      />
    </picture>
  );
}

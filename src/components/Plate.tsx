/**
 * The portrait: a black ruling on a transparent ground, drawn from the hero
 * photograph by scripts/engrave.py (`portrait-*`). Shadow and hair are dense
 * line, the lit face is left as paper, so it reads as a sketch and not a
 * photographic negative. It sits directly on the page, over `.portrait-halo`.
 *
 * `output: "export"` turns the Next image optimiser off, so the variants are
 * the files the script writes and this picks between them directly. WebP
 * carries the sketch at about a third of the PNG's bytes; the grey-plus-alpha
 * PNG stays as the fallback source.
 *
 * The dark page has its own drawing (`portrait-dark-*`, from `engrave.py
 * --dark-only`): light line that follows light, like chalk, not the black one
 * turned over, which would be a photographic negative. Both are in the markup
 * and the stylesheet shows the one that fits the theme (`.plate-light` and
 * `.plate-dark`), so the right one is there on the first paint. They are a
 * few kilobytes each.
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
    <>
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
          className={`plate plate-light ${className}`}
        />
      </picture>
      <picture>
        <source
          type="image/webp"
          srcSet="/images/portrait-dark-1x.webp 900w, /images/portrait-dark-2x.webp 1600w"
          sizes={sizes}
        />
        <img
          src="/images/portrait-dark-1x.png"
          srcSet="/images/portrait-dark-1x.png 900w, /images/portrait-dark-2x.png 1600w"
          sizes={sizes}
          alt={alt}
          width={900}
          height={1161}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          className={`plate plate-dark ${className}`}
        />
      </picture>
    </>
  );
}

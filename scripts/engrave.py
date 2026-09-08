#!/usr/bin/env python3
"""Turn a photograph into a halftone line engraving for duotone compositing.

The site's imagery device is a vintage engraving screened over a flat field.
Rather than source period clip art, this screens the real portrait, so the
one photograph the site owns carries the treatment.

Output is a BILEVEL, WHITE-LINE-ON-BLACK plate. Two properties matter:

  * Composited with `mix-blend-mode: screen`, pure black is a no-op — it
    drops out completely and only the white ruling survives. So a single
    asset works on any field colour, and because the portrait's subject
    wears near-black, the shoulders dissolve into the page instead of
    stopping at the image's rectangle. On light sections the same file is
    inverted and multiplied. This only works against a true #000 field;
    a tinted near-black leaves a visible plate edge.

  * Bilevel is what a physical halftone screen actually is, and it is also
    by far the cheapest to ship: the high-frequency ruling defeats lossy
    codecs (JPEG/WebP-lossy land around 400 KB at 2x), while lossless WebP
    of the same bilevel image is ~70 KB. Hence lossless WebP plus a 1-bit
    PNG fallback, and no AVIF — `output: "export"` means whatever ships is
    whatever this script writes.

Usage:
    python3 scripts/engrave.py                 # regenerate the site's plates
    python3 scripts/engrave.py SRC --name foo  # one-off, into public/images/

Requires Pillow and NumPy:
    python3 -m pip install --upgrade pillow numpy
"""
import argparse
import numpy as np
from PIL import Image, ImageOps, ImageFilter

OUT_DIR = "public/images"

# The hero plate. The crop drops the busy distressed wall at the right and
# the lower third of the hoodie; the vignette centre is the face rather than
# the geometric middle of that crop.
HERO = dict(
    src="public/images/hero-2x.jpg",
    name="plate",
    crop=(0.04, 0.0, 0.95, 0.78),
    freq=165,
    gain=1.18,
    vignette=1.5,
    vig_start=0.40,
    cx=0.435,
    cy=0.45,
    # 900 CSS px covers the hero's ~52vw column on a laptop; 1600 covers it
    # on a 2x display. Sizes are widths, and `freq` counts rulings across the
    # width, so the line pitch stays visually identical between the two.
    widths=(900, 1600),
)


def tone(path, width, crop, ss):
    """Prepared luminance for the screen, supersampled by `ss`."""
    im = Image.open(path).convert("L")
    if crop:
        left, top, right, bottom = crop
        im = im.crop((int(left * im.width), int(top * im.height),
                      int(right * im.width), int(bottom * im.height)))
    height = round(im.height * (width / im.width))
    im = im.resize((width * ss, height * ss), Image.LANCZOS)
    # Unsharp before screening: once tone is quantised to a ruling, facial
    # structure only survives if the edges were already crisp.
    im = im.filter(ImageFilter.UnsharpMask(radius=3, percent=110, threshold=2))
    im = ImageOps.autocontrast(im, cutoff=1)
    a = np.asarray(im).astype(np.float32) / 255.0
    # Spend the screen's resolution on the midtones of the face, and keep the
    # extremes off 0 and 1 so nothing goes solid before the vignette applies.
    return np.clip(a, 0.02, 0.99) ** 0.85


def rulings(shape, freq, ss, angle_deg=45.0):
    """A ruling and its perpendicular, both at `angle_deg`."""
    h, w = shape
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    a = np.deg2rad(angle_deg)
    f = freq * ss / max(w, 1) * np.pi * 2
    return (np.sin((x * np.cos(a) + y * np.sin(a)) * f),
            np.sin((-x * np.sin(a) + y * np.cos(a)) * f))


def plate(src, width, crop=None, freq=165, gain=1.0, mode="both",
          vignette=0.0, vig_start=0.45, cx=0.5, cy=0.5, ss=2, cut=150):
    """Render one bilevel engraving plate as a PIL image."""
    lum = tone(src, width, crop, ss)
    ruling, cross = rulings(lum.shape, freq, ss)

    t = np.clip(lum * gain, 0, 1)
    if vignette:
        # Elliptical falloff, so the plate fades into the surrounding field
        # rather than ending at an edge. Without this the engraving reads as
        # a photograph behind a pattern, which is the thing to avoid.
        h, w = t.shape
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        r = np.hypot((xx / w - cx) / 0.52, (yy / h - cy) / 0.58)
        t *= np.clip(1 - (r - vig_start) / max(1e-6, 1 - vig_start), 0, 1) ** vignette

    # A ruling survives where its phase falls below the local tone, so light
    # passages carry a thick line and dark ones a hairline or nothing.
    ink = np.zeros_like(t)
    if mode in ("line", "both"):
        ink = np.maximum(ink, (ruling + 1) * 0.5 < t)
    if mode in ("dot", "both"):
        # The engraver's second pass: cross-hatch only the brightest areas,
        # so highlights read as burnished rather than blown out.
        hi = np.clip((t - 0.58) / 0.42, 0, 1)
        ink = np.maximum(ink, ((cross + 1) * 0.5 < hi) & (hi > 0))

    img = Image.fromarray((ink * 255).astype(np.uint8), mode="L")
    # Downsample the supersampled render, then re-threshold: this places the
    # ruling more accurately than screening at final size would, while still
    # ending bilevel.
    img = img.resize((img.width // ss, img.height // ss), Image.LANCZOS)
    # `cut` above the 128 midpoint thins the ruling as it re-thresholds, which
    # keeps modelling in the lit side of the face; at 128 the highlights merge
    # into one solid white mass and the engraving reads as a blown-out photo.
    return img.point(lambda v: 255 if v > cut else 0, mode="L").convert("1")


def write(img, stem):
    """Write one plate as lossless WebP plus a palette PNG fallback."""
    webp, png = f"{OUT_DIR}/{stem}.webp", f"{OUT_DIR}/{stem}.png"
    # WebP has no 1-bit mode, so it takes the greyscale form — lossless, so
    # the two tones survive exactly. PNG keeps mode "1" and stores 1 bit
    # per pixel, which is the smaller of the two.
    img.convert("L").save(webp, "WEBP", lossless=True, method=6)
    img.save(png, optimize=True, bits=1)
    print(f"  {stem}  {img.width}x{img.height}")


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("src", nargs="?", help="source photo (default: the hero plate)")
    ap.add_argument("--name", default="plate")
    ap.add_argument("--freq", type=float, default=165)
    ap.add_argument("--widths", type=int, nargs="+", default=[900, 1600])
    args = ap.parse_args()

    spec = dict(HERO)
    if args.src:
        spec.update(src=args.src, name=args.name, freq=args.freq,
                    widths=tuple(args.widths), crop=None, vignette=1.5)

    widths = spec.pop("widths")
    name, src = spec.pop("name"), spec.pop("src")
    print(f"{src} -> {OUT_DIR}/{name}-*.{{webp,png}}")
    for i, width in enumerate(widths, start=1):
        write(plate(src, width, **spec), f"{name}-{i}x")


if __name__ == "__main__":
    main()

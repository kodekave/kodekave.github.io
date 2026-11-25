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

The site now uses the POSITIVE of this, `sketch()` below: black ruling,
drawn from darkness rather than brightness, so shadow and hair are dense and
the lit face is left as paper. It is a transparent layer (no white card) with
a small soft halo of paper behind it (`portrait-halo.png`). Simply inverting the plate above
gives a photographic negative (white hair, dark face), which is why the
portrait is redrawn instead. `portrait-*` is what the pages use; `plate-*`
is kept for the brand-asset templates until they are redone.

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

# The sketch is drawn in a near-black (a black sketch, with only a trace of the
# site's green), and the paper under it is the page colour.
INK_RGB = (13, 17, 15)
PAPER_RGB = (255, 255, 255)
# The dark page's version of the same drawing: light line on the dark page, the
# page's own ink colour (see --color-ink in the dark theme).
CHALK_RGB = (235, 234, 226)

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


# The portrait the pages use: a black sketch on white. The crop keeps the whole
# width and the first three lines of the equation on the hoodie; the head and
# body are softly masked so the rusty wall behind drops out, and the hoodie is
# hatched more calmly so the chalk equation can be cut out of it.
PORTRAIT = dict(
    src="public/images/hero-2x.jpg",
    name="portrait",
    crop=(0.0, 0.0, 1.0, 0.86),
    freq=150,
    maxink=0.84,
    hoodie=0.80,
    wall=0.06,
    vignette=1.3,
    vig_start=0.42,
    cx=0.45,
    cy=0.43,
    widths=(900, 1600),
)


# Where the chalk begins and how fast it comes in, in the screen's tone.
DARK_LO = 0.30
DARK_SPAN = 0.62


def _smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def sketch(src, width, crop=None, freq=150, gain=1.0, maxink=0.84,
           vignette=1.3, vig_start=0.42, cx=0.45, cy=0.43, hoodie=0.80,
           wall=0.06, ss=2, cut=150, dark=False):
    """Render the sketch as two RGBA layers: the ink, on a transparent ground,
    and a small soft halo of paper that follows the outline.

    `dark` draws it for the dark page: the line is light and follows LIGHT, as
    chalk on a blackboard does, so the lit face is dense line and shadow and
    hair are left as the dark page. (Inverting the black sketch instead gives a
    photographic negative: white hair, dark face.) The chalk equation on the
    hoodie is then drawn, not cut out.

    There is no white rectangle: the ink is the only thing with an edge, and it
    fades out on its own. The halo sits behind it so the page's pattern does
    not run through the lit face (which is left as paper, not as ink).
    """
    lum = tone(src, width, crop, ss)
    h, w = lum.shape
    ruling, _ = rulings(lum.shape, freq, ss)

    if dark:
        # Chalk follows light: the lit face is dense, shadow and hair are page.
        t = np.clip(lum * gain, 0, 1)
        t = _smooth((t - DARK_LO) / DARK_SPAN) * maxink
    else:
        # Ink follows darkness: shadow and hair are dense, the lit face is paper.
        t = np.clip((1 - lum) * gain, 0, 1)
        t = _smooth((t - 0.10) / 0.80) * maxink

    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    X, Y = xx / w, yy / h
    # The subject: a soft head and a soft body, so the wall drops out.
    head = _smooth((1 - np.hypot((X - 0.46) / 0.24, (Y - 0.33) / 0.19)) / 0.22)
    edge = 0.46 + 0.55 * (X - 0.42) ** 2
    subject = np.maximum(head, _smooth((Y - edge) / 0.05))
    t *= wall + (1 - wall) * subject
    # Elliptical fade, so the sketch dissolves into the page.
    r = np.hypot((X - cx) / 0.50, (Y - cy) / 0.60)
    fade = np.clip(1 - (r - vig_start) / max(1e-6, 1 - vig_start), 0, 1) ** vignette
    t *= fade
    # Where the sketch has a presence at all: the halo is cut from this.
    envelope = (wall + (1 - wall) * subject) * fade
    # Calmer hatching on the hoodie so its equation can read.
    region = _smooth((Y - 0.66) / 0.08) * _smooth((0.70 - np.abs(X - 0.36)) / 0.12)
    t *= 1 - (1 - hoodie) * region

    ink = ((ruling + 1) * 0.5 < t).astype(np.float32)
    # No second, crossing ruling: where it met the first it made a checker
    # that beat against the browser's scaling and showed as bands in the hair.
    # Density alone carries the deepest shadows.
    # The chalk equation: bright strokes on the dark hoodie, cut out of the ink.
    blur = np.asarray(
        Image.fromarray((lum * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(10 * ss))
    ).astype(np.float32) / 255
    chalk = ((lum - blur) > 0.07) & (lum > 0.30) & (region > 0.5)
    if dark:
        # Drawn, not cut out, so keep to where the equation is: a bright thing
        # at the edge of the photograph is not part of it.
        chalk &= np.abs(X - 0.36) < 0.34
    grown = Image.fromarray((chalk * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3 * ss + 1))
    ink[np.asarray(grown) > 0] = 1 if dark else 0

    alpha = Image.fromarray((ink * 255).astype(np.uint8), mode="L")
    alpha = alpha.resize((alpha.width // ss, alpha.height // ss), Image.LANCZOS)
    alpha = alpha.point(lambda v: 255 if v > cut else 0, mode="L")
    ink_layer = Image.new("RGBA", alpha.size, (CHALK_RGB if dark else INK_RGB) + (0,))
    ink_layer.putalpha(alpha)

    # The halo: a feathered patch of paper, 1/10 the size (it is a soft blob,
    # so CSS scales it up smoothly), only a little larger than the ink.
    soft = Image.fromarray((np.clip(envelope * 2.4, 0, 1) * 255).astype(np.uint8), mode="L")
    soft = soft.filter(ImageFilter.GaussianBlur(7 * ss))
    small = (max(1, alpha.width // 10), max(1, alpha.height // 10))
    soft = soft.resize(small, Image.LANCZOS)
    halo = Image.new("RGBA", small, PAPER_RGB + (0,))
    halo.putalpha(soft)
    return ink_layer, halo


def write(img, stem):
    """Write one plate as lossless WebP plus a palette PNG fallback."""
    webp, png = f"{OUT_DIR}/{stem}.webp", f"{OUT_DIR}/{stem}.png"
    # WebP has no 1-bit mode, so it takes the greyscale form — lossless, so
    # the two tones survive exactly. PNG keeps mode "1" and stores 1 bit
    # per pixel, which is the smaller of the two.
    img.convert("L").save(webp, "WEBP", lossless=True, method=6)
    img.save(png, optimize=True, bits=1)
    print(f"  {stem}  {img.width}x{img.height}")


def write_rgba(img, stem):
    """Write a transparent layer as lossless WebP plus a small PNG fallback."""
    img.save(f"{OUT_DIR}/{stem}.webp", "WEBP", lossless=True, method=6)
    # The fallback is grey plus alpha, which is far smaller than RGBA; the ink
    # is one flat colour, so only its brightness is kept.
    la = Image.merge("LA", (img.getchannel("R"), img.getchannel("A")))
    la.save(f"{OUT_DIR}/{stem}.png", optimize=True)
    print(f"  {stem}  {img.width}x{img.height}")


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("src", nargs="?", help="source photo (default: the hero plate)")
    ap.add_argument("--name", default="plate")
    ap.add_argument("--freq", type=float, default=165)
    ap.add_argument("--widths", type=int, nargs="+", default=[900, 1600])
    ap.add_argument("--dark-only", action="store_true",
                    help="write only the dark page's portrait (portrait-dark-*)")
    args = ap.parse_args()

    if args.dark_only:
        p = dict(PORTRAIT)
        pw, pname, psrc = p.pop("widths"), p.pop("name"), p.pop("src")
        pname = f"{pname}-dark"
        print(f"{psrc} -> {OUT_DIR}/{pname}-*.{{webp,png}}")
        for i, width in enumerate(pw, start=1):
            ink_layer, _ = sketch(psrc, width, dark=True, **p)
            write_rgba(ink_layer, f"{pname}-{i}x")
        return

    spec = dict(HERO)
    if args.src:
        spec.update(src=args.src, name=args.name, freq=args.freq,
                    widths=tuple(args.widths), crop=None, vignette=1.5)

    widths = spec.pop("widths")
    name, src = spec.pop("name"), spec.pop("src")
    print(f"{src} -> {OUT_DIR}/{name}-*.{{webp,png}}")
    for i, width in enumerate(widths, start=1):
        write(plate(src, width, **spec), f"{name}-{i}x")

    # The positive sketch the pages use, made from the hero photograph only.
    if not args.src:
        p = dict(PORTRAIT)
        pw, pname, psrc = p.pop("widths"), p.pop("name"), p.pop("src")
        print(f"{psrc} -> {OUT_DIR}/{pname}-*.{{webp,png}}")
        for i, width in enumerate(pw, start=1):
            ink_layer, halo = sketch(psrc, width, **p)
            write_rgba(ink_layer, f"{pname}-{i}x")
            if i == 1:
                halo.save(f"{OUT_DIR}/{pname}-halo.png", optimize=True)
                print(f"  {pname}-halo  {halo.width}x{halo.height}")


if __name__ == "__main__":
    main()

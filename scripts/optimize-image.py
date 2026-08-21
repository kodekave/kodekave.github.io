#!/usr/bin/env python3
"""Generate responsive AVIF/WebP/JPEG variants for a source photo.

`output: "export"` in next.config.ts disables the Next.js image optimiser,
so variants have to exist as files rather than being produced on request.
This script is the reproducible way to make them.

Usage:
    python3 scripts/optimize-image.py path/to/source.jpg [--name hero]

Writes into public/images/:
    <name>-1x.{avif,webp,jpg}   416px wide
    <name>-2x.{avif,webp,jpg}   832px wide

Requires Pillow with AVIF support:
    python3 -m pip install --upgrade pillow

Note the original source photo was a 1.37 MB PNG saved with a .jpg
extension; the 2x AVIF it produces is ~47 KB at ~39 dB PSNR. Keep the
full-resolution original outside public/ so it is never shipped.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image, features
except ImportError:
    sys.exit("Pillow is required: python3 -m pip install --upgrade pillow")

WIDTHS = {"1x": 416, "2x": 832}
OUT_DIR = Path("public/images")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("--name", default="hero")
    parser.add_argument("--jpeg-quality", type=int, default=80)
    parser.add_argument("--webp-quality", type=int, default=78)
    parser.add_argument("--avif-quality", type=int, default=62)
    args = parser.parse_args()

    if not args.source.is_file():
        sys.exit(f"no such file: {args.source}")
    if not features.check("avif"):
        print("warning: Pillow has no AVIF support — skipping .avif output")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    src = Image.open(args.source).convert("RGB")

    for suffix, width in WIDTHS.items():
        height = round(src.height * width / src.width)
        resized = src.resize((width, height), Image.LANCZOS)
        stem = OUT_DIR / f"{args.name}-{suffix}"

        resized.save(
            f"{stem}.jpg", "JPEG",
            quality=args.jpeg_quality, optimize=True, progressive=True,
        )
        resized.save(f"{stem}.webp", "WEBP", quality=args.webp_quality, method=6)
        if features.check("avif"):
            resized.save(f"{stem}.avif", "AVIF", quality=args.avif_quality)

        made = [p for p in (f"{stem}.avif", f"{stem}.webp", f"{stem}.jpg") if Path(p).exists()]
        sizes = ", ".join(f"{Path(p).name} {Path(p).stat().st_size // 1024} KB" for p in made)
        print(f"{width}x{height}: {sizes}")

    print(
        "\nRemember: Portrait.tsx expects the extensionless base path "
        f'(src="/images/{args.name}").'
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

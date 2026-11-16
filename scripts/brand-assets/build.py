#!/usr/bin/env python3
"""Regenerate the social card and the favicon.

The two images are drawn as small HTML pages (the *.html.tmpl files beside
this script) and rendered by headless Chrome, so they use the same fonts and
the same sketch portrait as the site rather than a re-creation in an image
library. To restyle them, edit the templates and run this again.

    npm run build                                  # the fonts come from out/
    python3 scripts/brand-assets/build.py

Writes:
    public/images/og-card.jpg    1200 x 630, the link-preview card
    src/app/favicon.ico          16, 32, 48 and 256 px

The card is rendered at twice its size and scaled down, so the hairline
harmonograph and the sketch keep their detail. It uses the transparent sketch
(`public/images/portrait-2x.webp`) over its paper halo, drawn by
scripts/engrave.py, and the harmonograph formula from src/lib/patterns.ts.

Needs Pillow (python3 -m pip install pillow) and Google Chrome. Set CHROME to
use a different binary. Chrome is run with a throwaway profile so it never
touches a running browser.
"""
import glob
import os
import re
import subprocess
import tempfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
CHROME = os.environ.get(
    "CHROME", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
)


def font_file(family: str, weight: str | None = None) -> Path:
    """The latin subset of an upright face, as next/font shipped it into out/."""
    css = "".join(
        Path(p).read_text() for p in glob.glob(str(ROOT / "out/_next/static/chunks/*.css"))
    )
    wanted = "font-family:" + family.replace(" ", "") + ";"
    for block in re.findall(r"@font-face\{([^}]*)\}", css):
        flat = block.replace(" ", "").replace('"', "").replace("'", "")
        if wanted not in flat or "font-style:italic" in flat:
            continue
        if weight and f"font-weight:{weight}" not in flat:
            continue
        if "U+??,U+131" not in flat:
            continue  # not the latin subset
        name = re.search(r"url\(([^)]+)\)", block).group(1).split("/")[-1]
        return ROOT / "out/_next/static/media" / name
    raise SystemExit(f"No latin {family} face found in out/ — run `npm run build` first.")


def render(
    template: str,
    size: tuple[int, int],
    values: dict[str, Path],
    scale: int = 1,
) -> Image.Image:
    """Render a template at `size` CSS pixels, `scale` times over, then scale
    the result back down to `size` so thin lines are properly anti-aliased."""
    html = (HERE / template).read_text()
    for key, path in values.items():
        html = html.replace("{{" + key + "}}", path.resolve().as_uri())
    with tempfile.TemporaryDirectory() as tmp:
        page = Path(tmp) / "page.html"
        shot = Path(tmp) / "shot.png"
        page.write_text(html)
        subprocess.run(
            [
                CHROME,
                "--headless=new",
                "--disable-gpu",
                "--hide-scrollbars",
                f"--force-device-scale-factor={scale}",
                f"--user-data-dir={tmp}/profile",
                f"--window-size={size[0]},{size[1]}",
                "--default-background-color=00000000",
                "--virtual-time-budget=6000",
                f"--screenshot={shot}",
                page.as_uri(),
            ],
            check=True,
            capture_output=True,
        )
        img = Image.open(shot).convert("RGBA").crop((0, 0, size[0] * scale, size[1] * scale))
        if scale > 1:
            img = img.resize(size, Image.LANCZOS)
        return img


def main() -> None:
    newsreader = font_file("Newsreader")
    card = render(
        "card.html.tmpl",
        (1200, 630),
        {
            "NEWSREADER": newsreader,
            "PLEX": font_file("IBM Plex Mono", "400"),
            "PORTRAIT": ROOT / "public/images/portrait-2x.webp",
            "HALO": ROOT / "public/images/portrait-halo.png",
        },
        scale=2,
    )
    card.convert("RGB").save(
        ROOT / "public/images/og-card.jpg", quality=90, optimize=True, progressive=True
    )

    icon = render("favicon.html.tmpl", (512, 512), {"NEWSREADER": newsreader})
    icon.save(
        ROOT / "src/app/favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (256, 256)],
    )
    print("Wrote public/images/og-card.jpg and src/app/favicon.ico")


if __name__ == "__main__":
    main()

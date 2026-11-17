#!/usr/bin/env python3
"""Draw a link-preview card for every page and every published post.

Every page used to share the one card (public/images/og-card.jpg). A link to a
post should say which post it is, so this writes one card each:

    public/images/og/<key>.jpg      1200 x 630

where <key> is the page's path with the slashes made dashes: /about is
`about`, /blog/some-post is `blog-some-post`. `buildMetadata` in src/lib/seo.ts
looks for that file when the site is built, and falls back to the shared card
when there is none, so a post published later still has a preview.

Each card is the page's own title on paper, with the Lorenz butterfly behind it
(a different one for each page, from a seed made from its key). The journey
page's card is the dot map instead. They are drawn by headless Chrome from
page-card.html.tmpl with the same fonts as the site, through the helpers in
build.py, so run the same way:

    npm run build                                  # the fonts come from out/
    python3 scripts/brand-assets/og-pages.py

Needs Pillow and Google Chrome (see build.py). When you add a post, run it again
and commit the new card; bump OG_VERSION below to make LinkedIn and others fetch
changed cards again.
"""
import html
import json
import re
import sys
import zlib
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build import HERE, ROOT, font_file, render  # noqa: E402

OUT = ROOT / "public/images/og"

# The pages and their cards: path -> (label, the page's own heading).
PAGES = {
    "/about": ("About", "A founder’s-office operator across four countries."),
    "/work": ("Ventures", "4 ventures, 4 countries."),
    "/research": ("Research", "Research and projects."),
    "/blog": ("Writing", "Notes from the founder’s office."),
    "/services": ("Work with me", "A founder’s office, without hiring one."),
    "/journey": ("Journey", "The journey."),
    "/bookshelf": ("Bookshelf", "What’s on the shelf."),
    "/founders-office-guide": ("Reference guide", "What is a founder’s office?"),
    "/cross-border-operations": ("Reference guide", "Cross-border startup operations"),
    "/fractional-coo-vs-founders-office": (
        "Reference guide",
        "Fractional COO vs founder’s office vs chief of staff",
    ),
}

# The places worked, longitude then latitude, in order (the `route` in
# src/lib/content.ts): India, the Maldives, the United States, the UK.
PLACES = [[78.9, 20.6], [73.51, 4.18], [-98.6, 39.8], [-0.13, 51.51]]


def key_of(path: str) -> str:
    return path.strip("/").replace("/", "-")


def map_grid() -> dict:
    ts = (ROOT / "src/lib/map-grid.ts").read_text()
    num = lambda name: float(re.search(rf"{name}:\s*(-?[\d.]+)", ts).group(1))
    return {
        "cols": int(num("cols")),
        "rows": int(num("rows")),
        "step": num("step"),
        "latTop": num("latTop"),
        "lonLeft": num("lonLeft"),
        "bits": re.search(r'bits:\s*"([^"]+)"', ts).group(1),
    }


def grid_uri() -> str:
    """The plus grid under the paper, as the share card has it."""
    tmpl = (HERE / "card.html.tmpl").read_text()
    return re.search(r'url\("(data:image/svg\+xml[^"]+)"\)', tmpl).group(1)


def posts() -> list[tuple[str, str, str]]:
    """(slug, title, date) of each published post."""
    found = []
    for md in sorted((ROOT / "content/posts").glob("*.md")):
        if md.name.startswith("_"):
            continue
        head = md.read_text().split("---")[1]
        field = lambda name: re.search(rf'^{name}:\s*"?(.*?)"?\s*$', head, re.M)
        if not re.search(r"^published:\s*true", head, re.M):
            continue
        found.append((md.stem, field("title").group(1).replace('\\"', '"'), field("date").group(1)))
    return found


def title_size(title: str) -> int:
    n = len(title)
    return 86 if n <= 30 else 76 if n <= 46 else 66 if n <= 64 else 58 if n <= 84 else 50


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    fonts = {
        "NEWSREADER": font_file("Newsreader"),
        "PLEX": font_file("IBM Plex Mono", "400"),
    }
    grid = grid_uri()
    mapdata = json.dumps(map_grid())

    cards = [(path, label, title) for path, (label, title) in PAGES.items()]
    for slug, title, when in posts():
        y, m, d = (int(x) for x in when.split("-"))
        label = "Writing · " + date(y, m, d).strftime("%b %-d, %Y")
        cards.append((f"/blog/{slug}", label, title))

    for path, label, title in cards:
        key = key_of(path)
        mapart = path == "/journey"
        img = render(
            "page-card.html.tmpl",
            (1200, 630),
            {
                **fonts,
                "GRID": grid,
                "LABEL": html.escape(label),
                "TITLE": html.escape(title),
                "TITLE_PX": str(title_size(title)),
                "TITLE_W": "520" if mapart else "700",
                "ART": "map" if mapart else "butterfly",
                "ART_CLASS": "" if mapart else "fade",
                "SEED": str(zlib.crc32(key.encode()) % 997),
                "MAP_JSON": mapdata if mapart else "null",
                "PLACES_JSON": json.dumps(PLACES),
            },
            scale=2,
        )
        img.convert("RGB").save(OUT / f"{key}.jpg", quality=88, optimize=True, progressive=True)
        print("wrote", f"public/images/og/{key}.jpg")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Generate the hero backdrop artwork.

A structured grid displaced by a radial source field (`push = a^2/r`, the
falloff that opens streamlines around an obstacle in potential flow). The void
is not drawn; it is what is left once the grid has been pushed aside.

Outputs three things:

  public/images/field-mesh.svg           landscape, >= 768px
  public/images/field-mesh-portrait.svg  portrait, < 768px
  src/lib/mesh-streamlines.ts            streamline paths, for inlining

Two decisions worth knowing about.

*Two files, not one.* Under `object-fit: cover` a single landscape SVG in a
tall phone hero shows only ~20% of its width, and on this composition that
slice missed the void entirely — the whole point of the artwork was cropped
off. The portrait variant re-centres the geometry for a tall frame.

*Streamlines are inlined, the static mesh is a file.* When the whole artwork
was one `<img>`-referenced SVG the drifting dashes were reported static on
mobile. Animation inside an `<img>` SVG is a known-inconsistent area across
engines, so rather than depend on it the three animated paths are inlined and
driven by page CSS, where behaviour is unambiguous and `prefers-reduced-motion`
applies. Only those three paths are inlined — a couple of KB — because
inlining the whole grid cost ~11 KB gzipped per page load, Next serialising
server-rendered SVG twice (HTML plus the RSC payload).

Usage:
    python3 scripts/generate-mesh.py
"""

from __future__ import annotations

import math
from pathlib import Path

# Palette, mirroring globals.css. An <img>-referenced SVG cannot read the
# page's custom properties, so these are inlined; keep them in sync.
KHAKI = "#c0b283"
INK = "#192231"


class Variant:
    def __init__(self, name, w, h, cx, cy, a, cols, rows, streams, fade, ink=".78"):
        self.name = name
        self.w, self.h = w, h
        self.cx, self.cy = w * cx, h * cy
        self.a = w * a
        self.cols, self.rows = cols, rows
        self.streams = streams
        self.fade = fade  # gradient stops for the readability mask
        self.ink = ink    # grid stroke opacity

    def displace(self, x, y):
        dx, dy = x - self.cx, y - self.cy
        r = math.hypot(dx, dy) or 1e-4
        s = min((self.a * self.a) / max(r, self.a * 0.55), self.a * 1.18)
        return x + (dx / r) * s, y + (dy / r) * s


LANDSCAPE = Variant(
    "field-mesh", 1200, 760, 0.79, 0.47, 0.215, 27, 18,
    streams=(0.20, 0.44, 0.68),
    # Headline sits left, so keep the mesh near-invisible there.
    fade=((0, ".04"), (0.32, ".22"), (0.58, ".8"), (1, ".95")),
)

PORTRAIT = Variant(
    "field-mesh-portrait", 640, 1100, 0.52, 0.30, 0.30, 15, 24,
    streams=(0.13, 0.30, 0.50),
    # Stacked layout: text runs the full width, so fade vertically instead —
    # quiet behind the headline at the top, stronger further down.
    fade=((0, ".08"), (0.34, ".20"), (0.72, ".55"), (1, ".85")),
    ink=".46",
)

STREAM_SAMPLES = 34  # smooth enough; these paths are inlined, so keep them cheap
NODES = ((0.24, 0.28), (0.52, 0.72), (0.88, 0.20), (0.78, 0.82), (0.40, 0.16))


def polyline(points) -> str:
    return " ".join(
        f"{'M' if i == 0 else 'L'}{round(x)} {round(y)}"
        for i, (x, y) in enumerate(points)
    )


def streamlines(v: Variant) -> list[str]:
    return [
        polyline(
            v.displace(v.w * k / STREAM_SAMPLES, v.h * fy)
            for k in range(STREAM_SAMPLES + 1)
        )
        for fy in v.streams
    ]


def static_svg(v: Variant) -> str:
    rows = [
        polyline(
            v.displace(v.w * i / (v.cols - 1), v.h * j / (v.rows - 1))
            for i in range(v.cols)
        )
        for j in range(v.rows)
    ]
    cols = [
        polyline(
            v.displace(v.w * i / (v.cols - 1), v.h * j / (v.rows - 1))
            for j in range(v.rows)
        )
        for i in range(v.cols)
    ]
    mesh = "".join(f'<path d="{d}"/>' for d in rows + cols)
    dots = "".join(
        f'<rect x="{round(x) - 2}" y="{round(y) - 2}" width="4" height="4"/>'
        for x, y in (v.displace(v.w * fx, v.h * fy) for fx, fy in NODES)
    )
    stops = "".join(
        f'<stop offset="{o}" stop-color="#fff" stop-opacity="{op}"/>'
        for o, op in v.fade
    )
    # Portrait fades down the page; landscape fades across it.
    x2, y2 = ("0", "1") if v.name.endswith("portrait") else ("1", "0")

    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {v.w} {v.h}" '
        f'preserveAspectRatio="xMidYMid slice" role="presentation">'
        f'<defs><linearGradient id="f" x1="0" y1="0" x2="{x2}" y2="{y2}">{stops}</linearGradient>'
        f'<radialGradient id="v" cx="{v.cx / v.w:.2f}" cy="{v.cy / v.h:.2f}" r=".8">'
        '<stop offset="0" stop-color="#fff" stop-opacity="1"/>'
        '<stop offset=".68" stop-color="#fff" stop-opacity=".85"/>'
        '<stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>'
        f'<mask id="m"><rect width="{v.w}" height="{v.h}" fill="url(#f)"/>'
        f'<rect width="{v.w}" height="{v.h}" fill="url(#v)" style="mix-blend-mode:multiply"/>'
        "</mask></defs>"
        f'<g mask="url(#m)">'
        f'<g fill="none" stroke="{KHAKI}" stroke-width="1" stroke-opacity="{v.ink}">{mesh}</g>'
        f'<circle cx="{round(v.cx)}" cy="{round(v.cy)}" r="{round(v.a * 1.02)}" fill="none" '
        f'stroke="{INK}" stroke-width="1" stroke-opacity=".2" stroke-dasharray="2 9"/>'
        f'<g fill="{INK}" fill-opacity=".42">{dots}</g>'
        "</g></svg>"
    )


def streamlines_module() -> str:
    def block(v: Variant) -> str:
        paths = ",\n    ".join(f'"{d}"' for d in streamlines(v))
        return (
            f"  viewBox: \"0 0 {v.w} {v.h}\",\n"
            f"  paths: [\n    {paths},\n  ],"
        )

    return (
        "// Generated by scripts/generate-mesh.py — do not edit by hand.\n"
        "//\n"
        "// Only the animated streamlines live here, inlined so page CSS drives\n"
        "// them: animation inside an <img>-referenced SVG is inconsistent across\n"
        "// engines and was reported static on mobile. The static grid stays a\n"
        "// cached file; see the generator for the full reasoning.\n\n"
        "export const STREAMLINES = {\n"
        "  landscape: {\n" + block(LANDSCAPE) + "\n  },\n"
        "  portrait: {\n" + block(PORTRAIT) + "\n  },\n"
        "} as const;\n"
    )


def main() -> int:
    img_dir = Path("public/images")
    img_dir.mkdir(parents=True, exist_ok=True)

    for v in (LANDSCAPE, PORTRAIT):
        out = img_dir / f"{v.name}.svg"
        svg = static_svg(v)
        out.write_text(svg, encoding="utf-8")
        print(f"  {out}: {len(svg.encode()) / 1024:.1f} KB")

    mod = Path("src/lib/mesh-streamlines.ts")
    src = streamlines_module()
    mod.write_text(src, encoding="utf-8")
    print(f"  {mod}: {len(src.encode()) / 1024:.1f} KB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

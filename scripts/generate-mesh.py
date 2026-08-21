#!/usr/bin/env python3
"""Generate public/images/field-mesh.svg — the hero backdrop.

A structured grid displaced by a radial source field (`push = a^2/r`, the
falloff that makes streamlines open around an obstacle in potential flow).
The void in the middle is not drawn; it is what is left once the grid has been
pushed aside.

Emitted as a standalone file rather than inline JSX on purpose: Next
serialises a server-rendered SVG twice — once as HTML and again inside the RSC
flight payload — which cost ~11 KB gzipped on every homepage load. As a file
it is ~2 KB gzipped, fetched once, and cached across pages.

Because it is referenced with <img>, it cannot read the page's CSS custom
properties, so the palette is inlined here. Keep these in sync with
src/app/globals.css if the brand colours change.

Usage:
    python3 scripts/generate-mesh.py
"""

from __future__ import annotations

import math
from pathlib import Path

# Palette, mirroring globals.css.
KHAKI = "#c0b283"
INK = "#192231"
INK_SOFT = "#404a42"

W, H = 1200, 760
CX, CY = W * 0.79, H * 0.47
A = W * 0.215
COLS, ROWS = 27, 18
STREAM_ROWS = (0.20, 0.44, 0.68)
STREAM_SAMPLES = 56
NODES = ((0.24, 0.28), (0.52, 0.72), (0.88, 0.20), (0.78, 0.82), (0.40, 0.16))


def displace(x: float, y: float) -> tuple[float, float]:
    dx, dy = x - CX, y - CY
    r = math.hypot(dx, dy) or 1e-4
    push = (A * A) / max(r, A * 0.55)
    s = min(push, A * 1.18)
    return x + (dx / r) * s, y + (dy / r) * s


def polyline(points) -> str:
    return " ".join(
        f"{'M' if i == 0 else 'L'}{round(x)} {round(y)}"
        for i, (x, y) in enumerate(points)
    )


def build() -> str:
    rows = [
        polyline(
            displace(W * i / (COLS - 1), H * j / (ROWS - 1)) for i in range(COLS)
        )
        for j in range(ROWS)
    ]
    cols = [
        polyline(
            displace(W * i / (COLS - 1), H * j / (ROWS - 1)) for j in range(ROWS)
        )
        for i in range(COLS)
    ]
    streams = [
        polyline(
            displace(W * k / STREAM_SAMPLES, H * fy)
            for k in range(STREAM_SAMPLES + 1)
        )
        for fy in STREAM_ROWS
    ]
    nodes = [displace(W * fx, H * fy) for fx, fy in NODES]

    mesh = "".join(f'<path d="{d}"/>' for d in rows + cols)
    stream = "".join(
        f'<path d="{d}" class="s" style="animation-delay:{-5 * i}s"/>'
        for i, d in enumerate(streams)
    )
    dots = "".join(
        f'<rect x="{round(x) - 2}" y="{round(y) - 2}" width="4" height="4"/>'
        for x, y in nodes
    )

    # The headline sits on the left, so the mask keeps the mesh near-invisible
    # there and lets it strengthen to the right. Type contrast is untouched
    # without needing a scrim over the artwork.
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
        f'preserveAspectRatio="xMidYMid slice" role="presentation">'
        "<defs>"
        '<linearGradient id="f" x1="0" y1="0" x2="1" y2="0">'
        '<stop offset="0" stop-color="#fff" stop-opacity=".04"/>'
        '<stop offset=".32" stop-color="#fff" stop-opacity=".22"/>'
        '<stop offset=".58" stop-color="#fff" stop-opacity=".8"/>'
        '<stop offset="1" stop-color="#fff" stop-opacity=".95"/>'
        "</linearGradient>"
        '<radialGradient id="v" cx=".79" cy=".47" r=".8">'
        '<stop offset="0" stop-color="#fff" stop-opacity="1"/>'
        '<stop offset=".68" stop-color="#fff" stop-opacity=".85"/>'
        '<stop offset="1" stop-color="#fff" stop-opacity="0"/>'
        "</radialGradient>"
        f'<mask id="m"><rect width="{W}" height="{H}" fill="url(#f)"/>'
        f'<rect width="{W}" height="{H}" fill="url(#v)" style="mix-blend-mode:multiply"/>'
        "</mask>"
        "</defs>"
        "<style>"
        "@keyframes d{to{stroke-dashoffset:-240}}"
        ".s{stroke-dasharray:3 13;animation:d 18s linear infinite}"
        "@media(prefers-reduced-motion:reduce){.s{animation:none}}"
        "</style>"
        '<g mask="url(#m)">'
        f'<g fill="none" stroke="{KHAKI}" stroke-width="1" stroke-opacity=".78">{mesh}</g>'
        f'<g fill="none" stroke="{INK_SOFT}" stroke-width="1.4" stroke-opacity=".5">{stream}</g>'
        f'<circle cx="{round(CX)}" cy="{round(CY)}" r="{round(A * 1.02)}" fill="none" '
        f'stroke="{INK}" stroke-width="1" stroke-opacity=".2" stroke-dasharray="2 9"/>'
        f'<g fill="{INK}" fill-opacity=".42">{dots}</g>'
        "</g></svg>"
    )


def main() -> int:
    out = Path("public/images/field-mesh.svg")
    out.parent.mkdir(parents=True, exist_ok=True)
    svg = build()
    out.write_text(svg, encoding="utf-8")
    print(f"{out}: {len(svg.encode()) / 1024:.1f} KB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

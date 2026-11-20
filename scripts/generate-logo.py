"""Draws the AI Studio logo at high resolution with Pillow and exports every icon size.

Run from the mobile-app folder after editing colours or shapes (needs `pip install pillow`):
    python scripts/generate-logo.py .
It overwrites the Android mipmaps, the iOS app icon, src/assets/logo.png and assets/brand.
"""
import math
import os
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFilter

S = 2048  # working resolution; everything is downsampled from here
OUT = sys.argv[1] if len(sys.argv) > 1 else "out"


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(len(a)))


def gradient(size, stops, angle_deg):
    """Linear gradient over a square, stops = [(pos, '#hex'), ...]."""
    w = h = size
    a = math.radians(angle_deg)
    dx, dy = math.cos(a), math.sin(a)
    # project corners to find range
    proj = [x * dx + y * dy for x in (0, w) for y in (0, h)]
    lo, hi = min(proj), max(proj)
    small = 256
    img = Image.new("RGB", (small, small))
    px = img.load()
    cols = [(p, hex_rgb(c)) for p, c in stops]
    for y in range(small):
        for x in range(small):
            t = ((x / small * w) * dx + (y / small * h) * dy - lo) / (hi - lo)
            for i in range(len(cols) - 1):
                p0, c0 = cols[i]
                p1, c1 = cols[i + 1]
                if t <= p1 or i == len(cols) - 2:
                    tt = min(1, max(0, (t - p0) / (p1 - p0)))
                    px[x, y] = lerp(c0, c1, tt)
                    break
    return img.resize((w, h), Image.BICUBIC)


def radial_glow(size, center, radius, color, alpha):
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    cx, cy = center
    d.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=hex_rgb(color) + (alpha,))
    return layer.filter(ImageFilter.GaussianBlur(radius * 0.55))


def sparkle_points(cx, cy, r, power=3.4, steps=720, squash=1.0):
    """Four-point star with concave sides (a softened astroid)."""
    pts = []
    for i in range(steps):
        t = 2 * math.pi * i / steps
        c, s = math.cos(t), math.sin(t)
        x = math.copysign(abs(c) ** power, c) * r
        y = math.copysign(abs(s) ** power, s) * r * squash
        pts.append((cx + x, cy + y))
    return pts


def sparkle_layer(size, cx, cy, r, fill_top, fill_bottom, power=3.4):
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).polygon(sparkle_points(cx, cy, r, power), fill=255)
    fill = gradient(size, [(0, fill_top), (1, fill_bottom)], 90).convert("RGBA")
    fill.putalpha(mask)
    return fill


def ring_layers(size, cx, cy, rx, ry, width, tilt_deg, colors):
    """Returns (back_half, front_half) of a tilted gradient orbit ring."""
    mask = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(mask)
    d.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), outline=255, width=width)
    color = gradient(size, colors, 0).convert("RGBA")
    front_mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(front_mask).rectangle((0, cy, size, size), fill=255)
    front = ImageChops.multiply(mask, front_mask)
    back = ImageChops.subtract(mask, front)

    def colored(m):
        layer = color.copy()
        layer.putalpha(m)
        return layer.rotate(tilt_deg, resample=Image.BICUBIC, center=(cx, cy))

    return colored(back), colored(front)


def symbol(size, scale=1.0, mono=False):
    """The spark + orbit + small sparkles on a transparent canvas."""
    c = size / 2
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    k = size * scale
    if not mono:
        # a tight luminous halo around the spark only, so the background stays vivid
        layer.alpha_composite(radial_glow(size, (c, c), k * 0.16, "#E0E7FF", 150))
    ring_colors = [(0, "#5EEAD4"), (0.5, "#A5F3FC"), (1, "#F0ABFC")]
    back, front = ring_layers(
        size, c, c, int(k * 0.42), int(k * 0.15), max(2, int(k * 0.04)), 28, ring_colors
    )
    star_top, star_bottom = ("#FFFFFF", "#FFFFFF") if mono else ("#FFFFFF", "#E4E9FF")
    star = sparkle_layer(size, c, c, k * 0.34, star_top, star_bottom)
    small1 = sparkle_layer(size, c + k * 0.30, c - k * 0.31, k * 0.085, "#FFFFFF", "#FDF4FF")
    small2 = sparkle_layer(size, c - k * 0.31, c + k * 0.29, k * 0.055, "#FFFFFF", "#CCFBF1")
    if mono:
        for part in (back, front):
            white = Image.new("RGBA", (size, size), (255, 255, 255, 0))
            white.putalpha(part.getchannel("A"))
            part.paste(white)
    for part in (back, star, front, small1, small2):
        layer.alpha_composite(part)
    return layer


def background(size):
    bg = gradient(size, [(0, "#3B82F6"), (0.45, "#6D4AFF"), (1, "#D02BC9")], 50).convert("RGBA")
    # soft light from the top-left and a teal bloom bottom-left for richness
    bg.alpha_composite(radial_glow(size, (size * 0.12, size * 0.08), size * 0.35, "#FFFFFF", 55))
    bg.alpha_composite(radial_glow(size, (size * 0.05, size * 0.98), size * 0.35, "#2DD4BF", 110))
    return bg


def rounded_mask(size, radius_ratio):
    m = Image.new("L", (size, size), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, size - 1, size - 1), radius=int(size * radius_ratio), fill=255)
    return m


def circle_mask(size):
    m = Image.new("L", (size, size), 0)
    ImageDraw.Draw(m).ellipse((0, 0, size - 1, size - 1), fill=255)
    return m


def save(img, path, px):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.resize((px, px), Image.LANCZOS).save(path, optimize=True)


def main():
    bg = background(S)
    full = bg.copy()
    full.alpha_composite(symbol(S, 1.0))  # full-bleed square (iOS, store)

    rounded = full.copy()
    rounded.putalpha(rounded_mask(S, 0.225))
    round_ = full.copy()
    round_.putalpha(circle_mask(S))

    res = os.path.join(OUT, "android", "app", "src", "main", "res")
    legacy = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
    adaptive = {k: round(v * 108 / 48) for k, v in legacy.items()}
    # Adaptive foreground: the symbol must sit inside the 66/108 safe zone.
    fg = symbol(S, 0.62)
    mono = symbol(S, 0.62, mono=True)
    for dens, px in legacy.items():
        save(rounded, f"{res}/mipmap-{dens}/ic_launcher.png", px)
        save(round_, f"{res}/mipmap-{dens}/ic_launcher_round.png", px)
    for dens, px in adaptive.items():
        save(fg, f"{res}/mipmap-{dens}/ic_launcher_foreground.png", px)
        save(bg, f"{res}/mipmap-{dens}/ic_launcher_background.png", px)
        save(mono, f"{res}/mipmap-{dens}/ic_launcher_monochrome.png", px)

    save(full.convert("RGB"), f"{OUT}/ios/AIStudio/Images.xcassets/AppIcon.appiconset/AppIcon-1024.png", 1024)
    save(rounded, f"{OUT}/src/assets/logo.png", 512)
    save(full.convert("RGB"), f"{OUT}/assets/brand/playstore-icon-512.png", 512)
    save(rounded, f"{OUT}/assets/brand/logo-1024.png", 1024)

    # Preview sheet: rounded, round, and adaptive-like on light and dark home screens.
    sheet = Image.new("RGB", (1500, 560), (245, 246, 250))
    dark = Image.new("RGB", (750, 560), (18, 20, 28))
    sheet.paste(dark, (750, 0))
    for i, img in enumerate([rounded, round_]):
        for j, x0 in enumerate((0, 750)):
            small = img.resize((300, 300), Image.LANCZOS)
            sheet.paste(small, (x0 + 60 + i * 340, 130), small)
    sheet.save(f"{OUT}/assets/brand/preview.png")


if __name__ == "__main__":
    main()

"""Уникальная обложка статьи Prime Auto: python cover2.py <spec.json> <выход.webp>

spec = {
  "scene": "что изображено (англ.), без текста",           # фон из Leonardo; место под текст добавляется само
  "layout": "left" | "right" | "center",                   # где заголовок; сцена смещается в другую сторону
  "title": "Главная часть заголовка",                      # белым, крупно
  "accent": "акцентная часть",                             # вторая строка
  "accent_style": "text" | "bar_yellow" | "bar_red",       # жёлтый текст / тёмный текст на жёлтой плашке / белый на красной
  "badge": "плашка в рамке (необязательно)",
  "chips": ["до 3 коротких пунктов"],                       # строка пунктов с жёлтыми маркерами (необязательно)
  "compare": ["НОРМА", "ПОЛОМКА"],                         # две метки ✓ / ✕ (необязательно)
  "warning": true,                                         # жёлтый треугольник «!» над заголовком (необязательно)
  "bg": "готовый фон (необязательно, иначе генерируется)"
}
"""
import json, math, os, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import leo

W, H = 1344, 768
YELLOW, WHITE, DARK = (247, 184, 0), (255, 255, 255), (20, 20, 20)
RED, GREEN = (214, 32, 39), (46, 178, 74)
# Montserrat Bold/ExtraBold/Black (.ttf): Windows — C:/Windows/Fonts, Mac — ~/Library/Fonts
FONTS = ["C:/Windows/Fonts", os.path.expanduser("~/Library/Fonts"), "/Library/Fonts"]
LOGO = os.path.join(os.path.dirname(os.path.abspath(__file__)), "brand-logo.png")  # public/dark-logo.svg, ширина 300
PLACE = {
    "left": "main subject placed on the right third of the frame, large empty very dark negative space on the left half",
    "right": "main subject placed on the left third of the frame, large empty very dark negative space on the right half",
    "center": "main subject large and clearly visible in the lower third of the frame, dark empty upper half",
}
STYLE = "cinematic dark automotive photography, dramatic low-key lighting, deep black background, photorealistic, high detail, no text"


def font(kind, size):
    name = f"Montserrat-{kind}.ttf"
    return ImageFont.truetype(next((os.path.join(d, name) for d in FONTS if os.path.exists(os.path.join(d, name))), name), size)


def wrap(d, text, fnt, width):
    lines, line = [], ""
    for word in text.split():
        probe = (line + " " + word).strip()
        if d.textlength(probe, font=fnt) <= width or not line:
            line = probe
        else:
            lines.append(line)
            line = word
    return lines + ([line] if line else [])


def balanced(d, text, fnt, width):
    """Те же строки, но как можно ровнее: сужаем ширину, пока число строк не меняется"""
    lines = wrap(d, text, fnt, width)
    best = lines
    w = width
    while w > 200:
        w -= 10
        probe = wrap(d, text, fnt, w)
        if len(probe) != len(lines) or any(d.textlength(l, font=fnt) > w for l in probe):
            break
        best = probe
    return best


def fit(d, text, kind, width, sizes, max_lines):
    for size in sizes:
        fnt = font(kind, size)
        lines = wrap(d, text, fnt, width)
        if len(lines) <= max_lines and all(d.textlength(l, font=fnt) <= width for l in lines):
            return fnt, balanced(d, text, fnt, width)
    fnt = font(kind, sizes[-1])
    return fnt, wrap(d, text, fnt, width)


def shade(img, layout):
    """Затемнение под текст: с нужной стороны или по центру"""
    mask = Image.new("L", (W, 1))
    for x in range(W):
        t = x / W
        if layout == "left":
            v = max(0.0, 1 - t / 0.62) ** 1.3
        elif layout == "right":
            v = max(0.0, 1 - (1 - t) / 0.62) ** 1.3
        else:
            v = max(0.0, 1 - abs(t - 0.5) / 0.38) ** 1.1
        mask.putpixel((x, 0), int(235 * v))
    dark = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    dark.putalpha(mask.resize((W, H)))
    img.alpha_composite(dark)


def text_shadow(img, xy, text, fnt, fill):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).text((xy[0] + 3, xy[1] + 4), text, font=fnt, fill=(0, 0, 0, 210))
    img.alpha_composite(layer.filter(ImageFilter.GaussianBlur(6)))
    ImageDraw.Draw(img).text(xy, text, font=fnt, fill=fill)


def warning_icon(d, x, y, s=54):
    d.polygon([(x + s / 2, y), (x + s, y + s * 0.88), (x, y + s * 0.88)], outline=YELLOW, width=5)
    f = font("Black", int(s * 0.55))
    d.text((x + s / 2, y + s * 0.52), "!", font=f, fill=YELLOW, anchor="mm")


def mark(d, cx, cy, ok, r=30):
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=GREEN if ok else RED)
    if ok:
        d.line([(cx - r * .45, cy), (cx - r * .1, cy + r * .38), (cx + r * .5, cy - r * .35)], fill=WHITE, width=7, joint="curve")
    else:
        k = r * .38
        d.line([(cx - k, cy - k), (cx + k, cy + k)], fill=WHITE, width=7)
        d.line([(cx - k, cy + k), (cx + k, cy - k)], fill=WHITE, width=7)


def render(spec, out):
    layout = spec.get("layout", "left")
    bg = spec.get("bg")
    if not bg:
        bg = out.rsplit(".", 1)[0] + "-bg.png"
        if not os.path.exists(bg):
            leo.generate(bg, f"{spec['scene']}, {PLACE[layout]}, {STYLE}")
    img = Image.open(bg).convert("RGBA").resize((W, H), Image.LANCZOS)
    shade(img, layout)
    d = ImageDraw.Draw(img)

    tw = 640 if layout != "center" else 860
    x0 = 64 if layout == "left" else (W - 64 - tw if layout == "right" else (W - tw) / 2)
    align = "center" if layout == "center" else "left"

    def xpos(width):
        return x0 + (tw - width) / 2 if align == "center" else (x0 + tw - width if layout == "right" else x0)

    title, accent = spec["title"].upper(), spec.get("accent", "").upper()
    style = spec.get("accent_style", "text")
    f1, l1 = fit(d, title, "Black", tw, [104, 96, 88, 80, 72, 64, 58, 52], 3)
    f2, l2 = fit(d, accent, "ExtraBold", tw - (40 if style != "text" else 0), [56, 50, 46, 42, 38, 34], 3) if accent else (None, [])
    chips = [c.upper() for c in spec.get("chips", [])][:3]
    fb = font("Bold", 30)
    lb = wrap(d, spec.get("badge", "").upper(), fb, tw - 60) if spec.get("badge") else []

    h = (70 if spec.get("warning") else 0) + len(l1) * f1.size * 1.04
    h += (len(l2) * f2.size * 1.2 + 22) if l2 else 0
    h += (len(lb) * 40 + 48) if lb else 0
    h += 70 if chips else 0
    y = max(48, (H - 150 - h) / 2) if layout != "center" else max(130, (H * 0.62 - h) / 2 + 40)

    if spec.get("warning"):
        warning_icon(d, xpos(54), y)
        y += 70
    for line in l1:
        text_shadow(img, (xpos(d.textlength(line, font=f1)), y), line, f1, WHITE)
        y += f1.size * 1.04
    if l2:
        y += 22
        d = ImageDraw.Draw(img)
        for line in l2:
            w = d.textlength(line, font=f2)
            if style == "text":
                text_shadow(img, (xpos(w), y), line, f2, YELLOW)
            else:
                pad = 18
                x = xpos(w + 2 * pad)
                d.rectangle([x, y - 6, x + w + 2 * pad, y + f2.size * 1.12], fill=YELLOW if style == "bar_yellow" else RED)
                d.text((x + pad, y), line, font=f2, fill=DARK if style == "bar_yellow" else WHITE)
            y += f2.size * 1.2 + (6 if style != "text" else 0)
    d = ImageDraw.Draw(img)
    if lb:
        y += 26
        bw = max(d.textlength(l, font=fb) for l in lb) + 48
        x = xpos(bw)
        d.rounded_rectangle([x, y, x + bw, y + len(lb) * 40 + 24], radius=10, fill=(0, 0, 0, 170), outline=YELLOW, width=3)
        for i, line in enumerate(lb):
            d.text((x + 24, y + 12 + i * 40), line, font=fb, fill=WHITE)
        y += len(lb) * 40 + 24
    if chips:
        y += 30
        fc = font("Bold", 22)
        widths = [d.textlength(c, font=fc) + 44 for c in chips]
        total = sum(widths) + 16 * (len(chips) - 1)
        x = xpos(total)
        for c, w in zip(chips, widths):
            d.rounded_rectangle([x, y, x + w, y + 44], radius=22, fill=(0, 0, 0, 160), outline=(255, 255, 255, 90), width=2)
            d.ellipse([x + 14, y + 17, x + 24, y + 27], fill=YELLOW)
            d.text((x + 32, y + 22), c, font=fc, fill=WHITE, anchor="lm")
            x += w + 16

    if spec.get("compare"):
        a, b = [s.upper() for s in spec["compare"]]
        fc = font("ExtraBold", 26)
        # метки — на стороне сцены, внизу
        base_x = W - 470 if layout == "left" else (90 if layout == "right" else W / 2 - 230)
        for i, (label, ok) in enumerate(((a, True), (b, False))):
            cx = base_x + i * 230 + 100
            mark(d, cx, H - 150, ok)
            w = d.textlength(label, font=fc) + 30
            d.rounded_rectangle([cx - w / 2, H - 108, cx + w / 2, H - 66], radius=8, fill=GREEN if ok else RED)
            d.text((cx, H - 87), label, font=fc, fill=WHITE, anchor="mm")

    logo = Image.open(LOGO).convert("RGBA")
    lx = 64 if layout != "right" else W - 64 - logo.width
    ly = H - 150
    if layout == "center":
        lx, ly = 48, 36  # внизу по центру сцена и пункты — логотип в угол
    img.alpha_composite(logo, (int(lx), int(ly)))
    img.convert("RGB").save(out, "WEBP", quality=86)
    return out


if __name__ == "__main__":
    print(render(json.load(open(sys.argv[1], encoding="utf8")), sys.argv[2]))

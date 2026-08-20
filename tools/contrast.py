"""WCAG AA contrast audit.

Earlier versions read the background out of the DOM and approximated a
gradient by averaging its colour stops. That was wrong in both directions: a
wash containing `transparent` stops averaged to mid-grey and failed dozens of
labels that are perfectly readable on screen, while text over a photograph was
skipped entirely.

This version measures what is actually painted. Each page is rendered twice:
once normally, and once with every glyph made transparent. The second render
is the true background, photographs, gradients, blend modes and all, so the
colour behind a run of text is sampled rather than reconstructed.

    python3 contrast.py light
    python3 contrast.py dark
"""

import sys
from io import BytesIO
from playwright.sync_api import sync_playwright
from PIL import Image

PAGES = [
    ("home", "/index.html"),
    ("cinema", "/modules/cinema/index.html"),
    ("cinema-watched", "/modules/cinema/watched.html"),
    ("cinema-watchlist", "/modules/cinema/watchlist.html"),
    ("books", "/modules/books/index.html"),
    ("books-library", "/modules/books/library.html"),
    ("books-readlist", "/modules/books/readlist.html"),
    ("books-editions", "/modules/books/editions.html"),
    ("travel", "/modules/travel/index.html"),
    ("travel-gallery", "/modules/travel/gallery.html"),
    ("food", "/modules/food/index.html"),
    ("food-add", "/modules/food/add.html"),
    ("fav", "/modules/favourites/index.html"),
    ("fav-category", "/modules/favourites/category.html?category=actors"),
    ("journal", "/modules/journal/index.html"),
    ("journal-story", "/modules/journal/story.html"),
]

BASE = "http://localhost:8899"

# Collect every run of text with its box and its resolved colour.
COLLECT = r"""() => {
  const parse = s => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null;
    const p = m[1].split(',').map(x => parseFloat(x));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const out = [];
  document.querySelectorAll('*').forEach(el => {
    if (el.children.length) return;
    const t = (el.textContent || '').trim();
    if (!t || t.length < 2) return;
    if (!/[\p{L}\p{N}]/u.test(t)) return;
    const r = el.getBoundingClientRect();
    if (r.width < 3 || r.height < 3) return;
    if (r.bottom < 0 || r.top > window.innerHeight) return;
    if (r.right < 0 || r.left > window.innerWidth) return;
    // Content scrolled out of a horizontal scroller is not on screen, but its
    // box still sits over whatever is painted there. Measuring it reported the
    // photograph behind a carousel as the background of chips nobody can see.
    let a = el.parentElement, clipped = false;
    while (a && a !== document.body) {
      const ac = getComputedStyle(a);
      if (/auto|scroll|hidden|clip/.test(ac.overflowX + ac.overflowY)) {
        const ar = a.getBoundingClientRect();
        if (r.right <= ar.left + 1 || r.left >= ar.right - 1 ||
            r.bottom <= ar.top + 1 || r.top >= ar.bottom - 1) { clipped = true; break; }
      }
      a = a.parentElement;
    }
    if (clipped) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') return;
    let p = el, hidden = false;
    while (p) { const pc = getComputedStyle(p);
      if (pc.opacity !== '' && parseFloat(pc.opacity) < 0.15) { hidden = true; break; }
      p = p.parentElement; }
    if (hidden) return;
    // Gradient text paints from its background, not from `color`.
    const fill = cs.webkitTextFillColor || cs.textFillColor;
    if (fill && /rgba\(0, 0, 0, 0\)/.test(fill)) return;
    const fg = parse(cs.color);
    if (!fg || fg.a === 0) return;
    const fs = parseFloat(cs.fontSize), fw = parseInt(cs.fontWeight) || 400;
    out.push({ txt: t.slice(0, 42), fg: [fg.r, fg.g, fg.b, fg.a], fs: fs, fw: fw,
      tag: el.tagName.toLowerCase(),
      cls: ((el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className) || '').toString().slice(0, 38),
      box: [r.left, r.top, r.width, r.height] });
  });
  return out;
}"""

# The background-only pass. Glyphs go transparent; everything else is untouched,
# so shadows, borders and images stay exactly where they were.
HIDE_TEXT = """() => {
  const s = document.createElement('style');
  s.textContent = '*, *::before, *::after { color: transparent !important;' +
    ' -webkit-text-fill-color: transparent !important; text-shadow: none !important; }';
  document.head.appendChild(s);
}"""


def lum(c):
    a = []
    for v in c[:3]:
        v /= 255.0
        a.append(v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4)
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]


def ratio(fg, bg):
    l1, l2 = lum(fg), lum(bg)
    if l1 < l2:
        l1, l2 = l2, l1
    return (l1 + 0.05) / (l2 + 0.05)


def over(fg, bg):
    a = fg[3]
    return [fg[i] * a + bg[i] * (1 - a) for i in range(3)]


def sample_bg(img, box, w, h):
    """The most common colour in the text's box, which is the background it
    sits on — the glyphs themselves are transparent in this render."""
    x, y, bw, bh = box
    x0, y0 = max(0, int(x)), max(0, int(y))
    x1, y1 = min(w, int(x + bw)), min(h, int(y + bh))
    if x1 <= x0 or y1 <= y0:
        return None
    crop = img.crop((x0, y0, x1, y1))
    colours = crop.getcolors(maxcolors=1 << 20)
    if not colours:
        return None
    count, px = max(colours, key=lambda c: c[0])
    return list(px[:3])


def run(theme):
    total = 0
    with sync_playwright() as p:
        b = p.chromium.launch(args=["--force-color-profile=srgb"])
        ctx = b.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
        ctx.add_init_script(
            f"try{{localStorage.setItem('sidverse:theme','{theme}')}}catch(e){{}}")
        for name, path in PAGES:
            pg = ctx.new_page()
            try:
                pg.goto(BASE + path, wait_until="domcontentloaded", timeout=20000)
                pg.wait_for_timeout(2500)
                pg.evaluate("document.querySelectorAll('[data-reveal]').forEach(e=>e.classList.add('is-in'))")
                pg.wait_for_timeout(300)
                runs = pg.evaluate(COLLECT)
                pg.evaluate(HIDE_TEXT)
                pg.wait_for_timeout(200)
                shot = pg.screenshot()
                img = Image.open(BytesIO(shot)).convert("RGB")
                w, h = img.size

                issues = []
                for r in runs:
                    bg = sample_bg(img, r["box"], w, h)
                    if bg is None:
                        continue
                    fg = r["fg"]
                    fgc = over(fg, bg) if fg[3] < 1 else fg[:3]
                    cr = ratio(fgc, bg)
                    large = r["fs"] >= 24 or (r["fs"] >= 18.66 and r["fw"] >= 700)
                    need = 3.0 if large else 4.5
                    if cr < need:
                        issues.append((cr, need, r, bg))

                if issues:
                    total += len(issues)
                    print(f"\n=== {name} [{theme}] — {len(issues)} issues")
                    seen = set()
                    for cr, need, r, bg in sorted(issues, key=lambda x: x[0])[:12]:
                        key = (r["cls"], round(cr, 1))
                        if key in seen:
                            continue
                        seen.add(key)
                        fgs = "rgb(%d,%d,%d)" % tuple(int(v) for v in r["fg"][:3])
                        bgs = "rgb(%d,%d,%d)" % tuple(bg)
                        print(f"   {cr:5.2f} (need {need}) {r['fs']:5.1f}px  "
                              f"{r['tag']}.{r['cls'][:28]:30s} {fgs:18s} on {bgs:18s} \u201c{r['txt']}\u201d")
            except Exception as e:
                print(f"\n=== {name} FAIL {str(e)[:100]}")
            pg.close()
        print(f"\nTOTAL [{theme}]: {total}")
        b.close()


if __name__ == "__main__":
    run(sys.argv[1] if len(sys.argv) > 1 else "light")

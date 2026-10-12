import sys, os, json
from playwright.sync_api import sync_playwright

PAGES = [
    ("home",            "/index.html"),
    ("cinema",          "/modules/cinema/index.html"),
    ("cinema-watched",  "/modules/cinema/watched.html"),
    ("cinema-watchlist","/modules/cinema/watchlist.html"),
    ("books",           "/modules/books/index.html"),
    ("books-library",   "/modules/books/library.html"),
    ("books-readlist",  "/modules/books/readlist.html"),
    ("books-editions",  "/modules/books/editions.html"),
    ("travel",          "/modules/travel/index.html"),
    ("travel-gallery",  "/modules/travel/gallery.html"),
    ("food",           "/modules/food/index.html"),
    ("fav",             "/modules/favourites/index.html"),
    ("fav-category",    "/modules/favourites/category.html?category=actors"),
    ("journal",         "/modules/journal/index.html"),
    ("journal-story",   "/modules/journal/story.html"),
]
BASE="http://localhost:8899"
outdir = sys.argv[1] if len(sys.argv)>1 else "/home/claude/shots"
themes = sys.argv[2].split(",") if len(sys.argv)>2 else ["light","dark"]
width  = int(sys.argv[3]) if len(sys.argv)>3 else 1440
only   = sys.argv[4].split(",") if len(sys.argv)>4 else None
os.makedirs(outdir, exist_ok=True)

errors={}
with sync_playwright() as p:
    b = p.chromium.launch(args=["--force-color-profile=srgb"])
    for theme in themes:
        ctx = b.new_context(viewport={"width":width,"height":1000}, device_scale_factor=1)
        ctx.add_init_script(f"try{{localStorage.setItem('sidverse:theme','{theme}')}}catch(e){{}}")
        for name, path in PAGES:
            if only and name not in only: continue
            pg = ctx.new_page()
            msgs=[]
            pg.on("console", lambda m: msgs.append(m.type+": "+m.text[:200]) if m.type=="error" else None)
            pg.on("pageerror", lambda e: msgs.append("pageerror: "+str(e)[:200]))
            try:
                pg.goto(BASE+path, wait_until="domcontentloaded", timeout=25000)
                pg.wait_for_timeout(3000)
                pg.screenshot(path=f"{outdir}/{name}-{theme}-{width}.png", full_page=True)
            except Exception as e:
                msgs.append("NAV FAIL: "+str(e)[:200])
            if msgs: errors[f"{name}-{theme}"]=msgs[:6]
            pg.close()
        ctx.close()
    b.close()
print(json.dumps(errors, indent=1)[:4000])

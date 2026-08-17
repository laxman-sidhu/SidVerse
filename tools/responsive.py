from playwright.sync_api import sync_playwright
import sys
PAGES=[("home","/index.html"),("cinema","/modules/cinema/index.html"),
("cinema-watched","/modules/cinema/watched.html"),("books","/modules/books/index.html"),
("books-library","/modules/books/library.html"),("books-editions","/modules/books/editions.html"),
("travel","/modules/travel/index.html"),("travel-gallery","/modules/travel/gallery.html"),
("food","/modules/food/index.html"),("food-add","/modules/food/add.html"),
("fav","/modules/favourites/index.html"),("fav-category","/modules/favourites/category.html?c=movies"),
("journal","/modules/journal/index.html"),("journal-story","/modules/journal/story.html")]
JS="""() => {
  const vw=document.documentElement.clientWidth, out=[];
  document.querySelectorAll('*').forEach(el=>{
    const r=el.getBoundingClientRect(); if(r.width===0&&r.height===0) return;
    const cs=getComputedStyle(el); if(cs.position==='fixed') return;
    const right=r.right+window.scrollX;
    if(right>vw+2){
      out.push({tag:el.tagName.toLowerCase(),
        cls:((el.className&&el.className.baseVal!==undefined?el.className.baseVal:el.className)||'').toString().slice(0,34),
        right:Math.round(right), w:Math.round(r.width), ov:Math.round(right-vw)});
    }});
  // outermost only
  const res=[]; const seen=new Set();
  out.sort((a,b)=>b.ov-a.ov).forEach(o=>{const k=o.tag+o.cls; if(!seen.has(k)){seen.add(k);res.push(o);}});
  return {vw, scrollW:document.documentElement.scrollWidth, items:res.slice(0,6)};
}"""
widths=[int(x) for x in sys.argv[1].split(",")]
with sync_playwright() as p:
  b=p.chromium.launch()
  for W in widths:
    print(f"\n{'='*18} {W}px {'='*18}")
    ctx=b.new_context(viewport={"width":W,"height":900},
        is_mobile=(W<600), has_touch=(W<600), device_scale_factor=2 if W<600 else 1)
    for n,path in PAGES:
      pg=ctx.new_page()
      try:
        pg.goto("http://localhost:8899"+path,wait_until="domcontentloaded",timeout=20000); pg.wait_for_timeout(2200)
        d=pg.evaluate(JS)
        over=d["scrollW"]-d["vw"]
        if over>2:
          print(f"  {n:16s} OVERFLOW +{over}px  (scrollW {d['scrollW']})")
          for it in d["items"]: print(f"        {it['tag']}.{it['cls'][:30]:32s} +{it['ov']}px w={it['w']}")
        else:
          print(f"  {n:16s} ok")
      except Exception as e: print(f"  {n:16s} FAIL {str(e)[:60]}")
      pg.close()
    ctx.close()
  b.close()

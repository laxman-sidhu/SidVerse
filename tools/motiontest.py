from playwright.sync_api import sync_playwright
PAGES=[("home","/index.html"),("cinema","/modules/cinema/index.html"),
("books","/modules/books/index.html"),("travel","/modules/travel/index.html"),
("food","/modules/food/index.html"),("fav","/modules/favourites/index.html"),
("journal","/modules/journal/index.html"),("gallery","/modules/travel/gallery.html")]
COUNT="""() => {
  let hidden=0, total=0;
  document.querySelectorAll('*').forEach(el=>{
    const t=(el.textContent||'').trim(); if(!t||el.children.length) return;
    const r=el.getBoundingClientRect(); if(r.width<3||r.height<3) return;
    total++;
    let e=el, op=1;
    while(e){ const o=parseFloat(getComputedStyle(e).opacity); if(!isNaN(o)) op*=o; e=e.parentElement; }
    if(op<0.05) hidden++;
  });
  return {hidden,total, motionAttr: document.documentElement.hasAttribute('data-motion')};
}"""
with sync_playwright() as p:
  b=p.chromium.launch()
  for label, block in [("JS ENABLED", False), ("motion.js BLOCKED", True)]:
    print(f"\n===== {label}")
    ctx=b.new_context(viewport={"width":1440,"height":900})
    if block: ctx.route("**/motion.js", lambda r: r.abort())
    for n,path in PAGES:
      pg=ctx.new_page()
      try:
        pg.goto("http://localhost:8899"+path,wait_until="domcontentloaded",timeout=20000)
        pg.wait_for_timeout(2500)
        d=pg.evaluate(COUNT)
        flag = "  <-- CONTENT HIDDEN" if d["hidden"]>0 else ""
        print(f"  {n:9s} hidden {d['hidden']:3d} / {d['total']:4d} visible-text nodes   data-motion={d['motionAttr']}{flag}")
      except Exception as e: print(f"  {n:9s} FAIL {str(e)[:60]}")
      pg.close()
    ctx.close()
  b.close()

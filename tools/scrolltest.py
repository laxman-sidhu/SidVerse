from playwright.sync_api import sync_playwright
PAGES=[("home","/index.html"),("cinema","/modules/cinema/index.html"),
("books","/modules/books/index.html"),("travel","/modules/travel/index.html"),
("swaad","/modules/swaad/index.html"),("fav","/modules/favourites/index.html"),
("journal","/modules/journal/index.html"),("gallery","/modules/travel/gallery.html")]
COUNT="""() => { let hidden=0,total=0;
  document.querySelectorAll('*').forEach(el=>{
    const t=(el.textContent||'').trim(); if(!t||el.children.length) return;
    const r=el.getBoundingClientRect(); if(r.width<3||r.height<3) return;
    total++; let e=el,op=1;
    while(e){const o=parseFloat(getComputedStyle(e).opacity); if(!isNaN(o)) op*=o; e=e.parentElement;}
    if(op<0.05) hidden++;});
  const stuck=document.querySelectorAll('[data-reveal]:not(.is-in)').length;
  return {hidden,total,stuck}; }"""
with sync_playwright() as p:
  b=p.chromium.launch(); ctx=b.new_context(viewport={"width":1440,"height":900})
  for n,path in PAGES:
    pg=ctx.new_page()
    try:
      pg.goto("http://localhost:8899"+path,wait_until="domcontentloaded",timeout=20000)
      pg.wait_for_timeout(1500)
      # walk the page the way a reader would
      for _ in range(14):
        pg.mouse.wheel(0, 700); pg.wait_for_timeout(160)
      pg.wait_for_timeout(1200)
      d=pg.evaluate(COUNT)
      print(f"  {n:9s} after scroll: hidden {d['hidden']:3d}/{d['total']:4d}   un-revealed [data-reveal]: {d['stuck']}")
    except Exception as e: print(f"  {n:9s} FAIL {str(e)[:60]}")
    pg.close()
  b.close()

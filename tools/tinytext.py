from playwright.sync_api import sync_playwright
PAGES=[("home","/index.html"),("cinema","/modules/cinema/index.html"),
("cinema-watched","/modules/cinema/watched.html"),("books","/modules/books/index.html"),
("books-library","/modules/books/library.html"),("travel","/modules/travel/index.html"),
("travel-gallery","/modules/travel/gallery.html"),("food","/modules/food/index.html"),
("fav","/modules/favourites/index.html"),
("journal","/modules/journal/index.html")]
JS="""() => { const out=[];
 document.querySelectorAll('*').forEach(el=>{ if(el.children.length) return;
  const t=(el.textContent||'').trim(); if(t.length<3) return;
  const r=el.getBoundingClientRect(); if(r.width<3||r.height<3) return;
  const cs=getComputedStyle(el); const fs=parseFloat(cs.fontSize);
  if(fs<11.5) out.push({fs:+fs.toFixed(1), cls:((el.className&&el.className.baseVal!==undefined?el.className.baseVal:el.className)||'').toString().slice(0,34), tag:el.tagName.toLowerCase(), txt:t.slice(0,28)});});
 const seen={},res=[]; out.forEach(o=>{const k=o.tag+o.cls+o.fs; if(!seen[k]){seen[k]=1;res.push(o);} });
 return res.sort((a,b)=>a.fs-b.fs).slice(0,8); }"""
with sync_playwright() as p:
  b=p.chromium.launch(); ctx=b.new_context(viewport={"width":1440,"height":900}); tot=0
  for n,path in PAGES:
    pg=ctx.new_page()
    try:
      pg.goto("http://localhost:8899"+path,wait_until="domcontentloaded",timeout=20000); pg.wait_for_timeout(2200)
      r=pg.evaluate(JS)
      if r: tot+=len(r); print(f"\n{n}:"); [print(f"   {x['fs']:5.1f}px {x['tag']}.{x['cls'][:28]:30s} “{x['txt']}”") for x in r]
    except Exception as e: print(f"\n{n} FAIL {str(e)[:70]}")
    pg.close()
  print(f"\ndistinct sub-11.5px text styles: {tot}")
  b.close()

from playwright.sync_api import sync_playwright
import json
PAGES=[("home","/index.html"),("cinema","/modules/cinema/index.html"),
("books","/modules/books/index.html"),("travel","/modules/travel/index.html"),
("food","/modules/food/index.html"),("fav","/modules/favourites/index.html"),
("journal","/modules/journal/index.html")]
JS="""() => {
  const g = s => { const e=document.querySelector(s); if(!e) return null;
    const c=getComputedStyle(e); const r=e.getBoundingClientRect();
    return {fs:c.fontSize, ff:c.fontFamily.split(',')[0].replace(/"/g,''), h:Math.round(r.height), fw:c.fontWeight}; };
  const body=getComputedStyle(document.body);
  // biggest heading on page
  let big=null,bs=0;
  document.querySelectorAll('h1,h2,.hero__title,[class*=title]').forEach(e=>{
    const f=parseFloat(getComputedStyle(e).fontSize); const r=e.getBoundingClientRect();
    if(f>bs && r.height>0){bs=f;big={sel:e.tagName+'.'+((e.className||'')+'').slice(0,28),fs:f};}});
  // nav/topbar height
  let navh=null;
  for(const s of ['.topbar','.navbar','.nav','.site-topbar','header nav','.nav-wrap']){
    const e=document.querySelector(s); if(e){const r=e.getBoundingClientRect(); if(r.height>10){navh={sel:s,h:Math.round(r.height)};break;}}}
  // buttons
  const btns=[...document.querySelectorAll('button,.btn,a.btn')].filter(e=>e.getBoundingClientRect().height>0).slice(0,6)
    .map(e=>({cls:((e.className||'')+'').slice(0,26),h:Math.round(e.getBoundingClientRect().height),fs:getComputedStyle(e).fontSize,r:getComputedStyle(e).borderRadius.split(' ')[0]}));
  // paragraph font size (most common)
  const counts={};
  document.querySelectorAll('p,li,span,td,div').forEach(e=>{
    if(e.children.length) return; const t=(e.textContent||'').trim(); if(t.length<12) return;
    const f=getComputedStyle(e).fontSize; counts[f]=(counts[f]||0)+1;});
  const common=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,4);
  return {rootFs:getComputedStyle(document.documentElement).fontSize, bodyFs:body.fontSize,
    bodyFf:body.fontFamily.split(',')[0].replace(/"/g,''), big, navh, btns, common};
}"""
with sync_playwright() as p:
  b=p.chromium.launch(); ctx=b.new_context(viewport={"width":1440,"height":900})
  for n,path in PAGES:
    pg=ctx.new_page()
    try:
      pg.goto("http://localhost:8899"+path,wait_until="domcontentloaded",timeout=20000); pg.wait_for_timeout(2200)
      d=pg.evaluate(JS)
      print(f"\n=== {n}")
      print(f"  body font: {d['bodyFs']} / {d['bodyFf']}   (root {d['rootFs']})")
      print(f"  biggest heading: {d['big']}")
      print(f"  nav: {d['navh']}")
      print(f"  common body sizes: {d['common']}")
      print(f"  buttons: {[(x['cls'],x['h'],x['fs'],x['r']) for x in d['btns']]}")
    except Exception as e: print(f"\n=== {n} FAIL {str(e)[:120]}")
    pg.close()
  b.close()

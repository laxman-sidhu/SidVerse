/* ===== Journal Writing — SHARED CORE (one brain for every client) =====
   This file is identical for every client. It contains NO client-specific identity.
   Each client's pages declare who they are by setting window.JOURNAL_CLIENT BEFORE
   loading this script, e.g.:

     <script>
       window.JOURNAL_CLIENT = {
         USERNAME : "laxman-sidhu",        // GitHub account that owns the repo
         REPO     : "Journal-Writing",     // the single repository both clients live in
         DATA_DIR : "Dhanashri-Journal/data", // this client's OWN data folder (no trailing slash)
         TITLE    : "Dhanashri's Journal"
       };
     </script>
     <script src="../assets/js/core.js"></script>

   DATA_DIR is the only thing that decides where this client's stories are read from and
   written to. Because each client's pages hard-code their own DATA_DIR, one client's editor
   can never accidentally write into the other client's folder. */
window.JOURNAL = (function(){
  const CLIENT = (window.JOURNAL_CLIENT || {});
  const CONFIG = {
    USERNAME : CLIENT.USERNAME || "laxman-sidhu",
    REPO     : CLIENT.REPO     || "Journal-Writing",
    DATA_DIR : (CLIENT.DATA_DIR || "data").replace(/\/+$/,''), // strip any trailing slash
    TITLE    : CLIENT.TITLE    || "Journal"
  };
  const PAGE_W = 760;

  /* ---- fonts ----
     A curated set where every font renders VISUALLY UNIQUE for visitors. Most entries are
     free Google web fonts (loaded on every page, identical on every device); the rest are
     classic system / Office / Adobe families that are widely installed (Times New Roman,
     Cambria, Courier New, Daun Penh, Bodoni MT, ...) with sensible fallbacks.

     Decorative named fonts from the inspiration sheets (Naive, Icing, Fontleroy, Belluccia,
     and dozens more) were removed on purpose: they are not installed on most devices, so
     they all rendered as their shared fallback web font and appeared as identical
     duplicates in the dropdown. FONT_ALIASES below maps every removed key to the kept font
     it used to fall back to, so any already-published story keeps rendering pixel-for-pixel. */
  const FONTS = {
    /* handwritten & casual */
    gaegu:    { css:"'Gaegu', cursive",          label:"Gaegu" },
    caveat:   { css:"'Caveat', cursive",         label:"Caveat" },
    patrick:  { css:"'Patrick Hand', cursive",   label:"Patrick Hand" },
    indie:    { css:"'Indie Flower', cursive",   label:"Indie Flower" },
    kalam:    { css:"'Kalam', cursive",          label:"Kalam" },
    shadows:  { css:"'Shadows Into Light', cursive",    label:"Shadows Into Light" },
    amatic:   { css:"'Amatic SC', cursive",             label:"Amatic SC" },
    walterturncoat:{css:"'Walter Turncoat', cursive",   label:"Walter Turncoat" },
    cedarville: { css:"'Cedarville Cursive', cursive",  label:"Cedarville Cursive" },
    mvboli:   { css:"'MV Boli', 'Kalam', cursive",      label:"MV Boli" },

    /* elegant script & calligraphy */
    greatvibes:{ css:"'Great Vibes', cursive",          label:"Great Vibes" },
    sacramento:{ css:"'Sacramento', cursive",           label:"Sacramento" },
    dancing:  { css:"'Dancing Script', cursive",        label:"Dancing Script" },
    satisfy:  { css:"'Satisfy', cursive",               label:"Satisfy" },
    parisienne: { css:"'Parisienne', cursive",          label:"Parisienne" },
    herrvon:  { css:"'Herr Von Muellerhoff', cursive",  label:"Herr Von Muellerhoff" },
    corsiva:  { css:"'Monotype Corsiva', 'Dancing Script', cursive", label:"Monotype Corsiva" },

    /* brush & retro script */
    grandhotel: { css:"'Grand Hotel', cursive",         label:"Grand Hotel" },
    lobstertwo: { css:"'Lobster Two', cursive",         label:"Lobster Two" },
    sail:       { css:"'Sail', cursive",                label:"Sail" },
    gluten:     { css:"'Gluten', cursive",              label:"Gluten" },

    /* serif & classic */
    playfair: { css:"'Playfair Display', serif",        label:"Playfair Display" },
    cormorant:{ css:"'Cormorant Garamond', serif",      label:"Cormorant Garamond" },
    bodonimt: { css:"'Bodoni MT', 'Didot', 'Playfair Display', serif", label:"Bodoni MT" },
    daunpenh: { css:"'DaunPenh', 'Daun Penh', 'Cormorant Garamond', serif", label:"Daun Penh" },
    timesnr:  { css:"'Times New Roman', Times, serif",            label:"Times New Roman" },
    cambria:  { css:"'Cambria', Georgia, serif",                  label:"Cambria" },
    bookantiqua:{ css:"'Book Antiqua', Palatino, 'Palatino Linotype', serif", label:"Book Antiqua" },
    bookman:  { css:"'Bookman Old Style', 'Bookman', serif",      label:"Bookman Old Style" },
    chaparral:{ css:"'Chaparral Pro Light', 'Chaparral Pro', Georgia, serif", label:"Chaparral Pro Light" },
    adobearabic:{ css:"'Adobe Arabic', 'Times New Roman', serif", label:"Adobe Arabic" },

    /* clean & modern */
    quicksand:{ css:"'Quicksand', sans-serif",   label:"Quicksand" },
    nunito:   { css:"'Nunito', sans-serif",      label:"Nunito" },
    calibri:  { css:"'Calibri', 'Segoe UI', sans-serif",          label:"Calibri" },
    franklin: { css:"'Franklin Gothic Book', 'Franklin Gothic', Arial, sans-serif", label:"Franklin Gothic Book" },
    mssans:   { css:"'Microsoft Sans Serif', Arial, sans-serif",  label:"Microsoft Sans Serif" },
    segoefluent:{ css:"'Segoe Fluent Icons', 'Segoe UI', sans-serif", label:"Segoe Fluent Icons" },
    bebas:    { css:"'Bebas Neue', sans-serif",  label:"Bebas Neue" },

    /* monospace */
    couriernew: { css:"'Courier New', Courier, monospace", label:"Courier New" }
  };

  /* removed duplicate-looking keys → the kept font they fell back to.
     resolveFontKey() keeps every already-published story rendering exactly as before. */
  const FONT_ALIASES = {
    naive:"amatic", icing:"amatic", northwest:"amatic", hammock:"amatic", barocca:"amatic",
    everafter:"amatic", matilde:"amatic", windsorpark:"amatic",
    clipper:"greatvibes", jellyka:"greatvibes", belluccia:"greatvibes", domlovesmary:"greatvibes",
    bombshell:"greatvibes", katierose:"greatvibes", madelinette:"greatvibes", copperlove:"greatvibes",
    dasha:"greatvibes", ciaobella:"greatvibes", cantoni:"greatvibes", asterism:"greatvibes",
    annaclara:"greatvibes", aleka:"greatvibes", adorn:"greatvibes", burgues:"greatvibes",
    rachella:"greatvibes", foundry:"greatvibes",
    modesty:"sacramento", hollyhock:"sacramento", cerise:"sacramento", castro:"sacramento",
    settascript:"sacramento", janda:"sacramento", learningcurve:"sacramento", goodtime:"sacramento",
    sachiko:"dancing", nellyscript:"dancing", ondise:"dancing", peonipro:"dancing",
    eliensee:"dancing", gemmadonati:"dancing", ahra:"dancing", ameglia:"dancing",
    antrokas:"dancing", carolyna:"dancing", bookeyedsuzanne:"dancing", bromello:"dancing",
    aline:"dancing", youngcoconut:"dancing", nautilus:"dancing", brannboll:"dancing",
    debby:"caveat", quentin:"caveat", matchmaker:"caveat", jacquesgilles:"caveat",
    littledays:"caveat", pinsetter:"caveat",
    luna:"patrick", dragonfly:"patrick", trashhand:"patrick", argylesocks:"patrick",
    frosted:"kalam", pacificnw:"kalam",
    playlist:"grandhotel", selima:"grandhotel", sunbreath:"grandhotel", brusher:"grandhotel",
    succulent:"grandhotel", kingbasil:"grandhotel",
    hamurz:"bebas", sanek:"bebas", reckless:"bebas", grodna:"bebas",
    fontleroy:"lobstertwo",
    sequel:"franklin", swis721:"franklin",
    champagne:"quicksand", nautik:"quicksand", frykas:"quicksand",
    equable:"cormorant", auntmildred:"cormorant", jacobriley:"cormorant", complexf:"cormorant",
    helsing:"playfair", bookeyedmartin:"playfair",
    lumberjack:"bookman",
    romand:"timesnr", euroroman:"timesnr",
    bodoniathome:"bodonimt",
    italicc:"corsiva"
  };
  function resolveFontKey(k){ if(FONTS[k]) return k; if(FONT_ALIASES[k] && FONTS[FONT_ALIASES[k]]) return FONT_ALIASES[k]; return 'gaegu'; }
  function getFont(k){ return FONTS[resolveFontKey(k)]; }

  /* ---- font groups ----
     Order for the editor's font dropdowns: similar styles sit together, one after the
     other, under a labelled heading (rendered as <optgroup>). Every FONTS key appears in
     exactly one group; any key added later but forgotten here is appended automatically
     to a trailing "More" group by the dropdown builder, so nothing can go missing. */
  const FONT_GROUPS = [
    { label:"Handwritten & Casual", keys:[
      "gaegu","caveat","patrick","indie","kalam","shadows","amatic","walterturncoat","cedarville","mvboli" ]},
    { label:"Elegant Script & Calligraphy", keys:[
      "greatvibes","sacramento","dancing","satisfy","parisienne","herrvon","corsiva" ]},
    { label:"Brush & Retro Script", keys:[
      "grandhotel","lobstertwo","sail","gluten" ]},
    { label:"Serif & Classic", keys:[
      "playfair","cormorant","bodonimt","daunpenh","timesnr","cambria","bookantiqua","bookman","chaparral","adobearabic" ]},
    { label:"Clean & Modern", keys:[
      "quicksand","nunito","calibri","franklin","mssans","segoefluent","bebas" ]},
    { label:"Monospace", keys:[ "couriernew" ]}
  ];

  /* ---- page backgrounds: listed in js/bg-list.js, which update-backgrounds.bat rebuilds ---- */
  const BG_ROOT = '../assets/backgrounds/';
  const BG_THUMBS = window.JOURNAL_BG_THUMBS || {};
  const BACKGROUNDS = [], BG_GROUPS = [], BG_MAP = {};
  (window.JOURNAL_BACKGROUNDS || []).forEach(b=>{
    const bg = {key:b.name, label:b.name, file:BG_ROOT + b.file.split('/').map(encodeURIComponent).join('/'), thumb:BG_THUMBS[b.name]};
    BACKGROUNDS.push(bg); BG_MAP[bg.key] = bg;
    if(!b.group) return;
    let g = BG_GROUPS.find(x=>x.label===b.group);
    if(!g) BG_GROUPS.push(g = {label:b.group, keys:[]});
    g.keys.push(bg.key);
  });
  const BUILTIN_PAPERS = ['grid','dot','plain'];

  /* ---- doodles ----
     Decorative line-art (stars, sparkles, arrows, lines, flourishes) drawn as inline SVG.
     Each shape paints with `currentColor`, so the element's CSS colour recolours it.
     `ratio` is width/height, used to reserve the right height as the width is scaled.
     Stored on an element as { type:'doodle', key, w, rot, color }. */
  const S='stroke="currentColor" fill="none" stroke-width="@W" stroke-linecap="round" stroke-linejoin="round"';
  const DOODLES = [
    {key:"star",   label:"Star",        ratio:1,    w:64,  svg:'<svg viewBox="0 0 100 100"><path fill="currentColor" d="M50 5l12 30 32 2-25 21 8 31-27-17-27 17 8-31-25-21 32-2z"/></svg>'},
    {key:"star_o", label:"Star outline",ratio:1,    w:64,  svg:'<svg viewBox="0 0 100 100"><path '+S+' d="M50 7l12 29 31 2-24 20 8 30-27-16-27 16 8-30-24-20 31-2z"/></svg>'},
    {key:"sparkle",label:"Sparkle",     ratio:1,    w:60,  svg:'<svg viewBox="0 0 100 100"><path fill="currentColor" d="M50 4C54 34 66 46 96 50 66 54 54 66 50 96 46 66 34 54 4 50 34 46 46 34 50 4z"/></svg>'},
    {key:"stars3", label:"Star trio",   ratio:1.35, w:84,  svg:'<svg viewBox="0 0 135 100"><path fill="currentColor" d="M38 8l8 19 21 1-16 13 5 20-18-11-18 11 5-20-16-13 21-1z"/><path fill="currentColor" d="M100 40l6 14 15 1-12 10 4 15-13-8-13 8 4-15-12-10 15-1z"/><path fill="currentColor" d="M24 64l4 10 11 1-9 7 3 11-9-6-9 6 3-11-9-7 11-1z"/></svg>'},
    {key:"heart",  label:"Heart",       ratio:1.12, w:66,  svg:'<svg viewBox="0 0 100 90"><path '+S+' d="M50 80C18 58 8 40 8 26 8 14 18 8 28 8c8 0 16 5 22 14C56 13 64 8 72 8c10 0 20 6 20 18 0 14-10 32-42 54z"/></svg>'},
    {key:"arrow_curl", label:"Curly arrow", ratio:1.7, w:150, svg:'<svg viewBox="0 0 170 100"><path '+S+' d="M14 70C30 28 74 18 100 42 118 56 110 82 90 76 78 72 84 58 96 62 116 67 134 60 150 48L162 39"/><path '+S+' d="M162 39L146.2 41.7M162 39L155 53.4"/></svg>'},
    {key:"arrow_curl_dot", label:"Dotted curly arrow", ratio:1.7, w:150, svg:'<svg viewBox="0 0 170 100"><path '+S+' stroke-dasharray="1 12" d="M14 70C30 28 74 18 100 42 118 56 110 82 90 76 78 72 84 58 96 62 116 67 134 60 150 48L162 39"/><path '+S+' d="M162 39L146.2 41.7M162 39L155 53.4"/></svg>'},
    {key:"arrow", label:"Arrow", ratio:3.33, w:170, svg:'<svg viewBox="0 0 200 60"><path '+S+' d="M10 30H176"/><path '+S+' d="M176 30L161.7 22.7M176 30L161.7 37.3"/></svg>'},
    {key:"arrow_dot", label:"Dotted arrow", ratio:3.33, w:170, svg:'<svg viewBox="0 0 200 60"><path '+S+' stroke-dasharray="1 13" d="M10 30H174"/><path '+S+' d="M174 30L159.7 22.7M174 30L159.7 37.3"/></svg>'},
    {key:"line",      label:"Line",         ratio:8,   w:180, svg:'<svg viewBox="0 0 200 24"><path '+S+' d="M8 12H192"/></svg>'},
    {key:"line_dot",  label:"Dotted line",  ratio:8,   w:180, svg:'<svg viewBox="0 0 200 24"><path '+S+' stroke-dasharray="1 13" d="M8 12H192"/></svg>'},
    {key:"swash",     label:"Swash",        ratio:4,   w:180, svg:'<svg viewBox="0 0 200 50"><path '+S+' d="M8 30C50 10 90 50 130 28 162 11 188 16 196 26"/></svg>'},
    {key:"flourish",  label:"Corner curl",  ratio:1.5, w:110, svg:'<svg viewBox="0 0 120 80"><path '+S+' d="M12 70C12 30 32 12 78 14"/><path '+S+' d="M78 14l-14-6M78 14l-7 14"/></svg>'},
    {key:"arrow_both", label:"Double arrow", ratio:3.33, w:170, svg:'<svg viewBox="0 0 200 60"><path '+S+' d="M28 30H172"/><path '+S+' d="M172 30L157.7 22.7M172 30L157.7 37.3M28 30L42.3 37.3M28 30L42.3 22.7"/></svg>'},
    {key:"wave",      label:"Wavy line",     ratio:5,   w:180, svg:'<svg viewBox="0 0 200 40"><path '+S+' d="M6 20C26 4 46 36 66 20 86 4 106 36 126 20 146 4 166 36 186 20"/></svg>'},
    {key:"double_line",label:"Double line",  ratio:6.7, w:180, svg:'<svg viewBox="0 0 200 30"><path '+S+' d="M8 10H192"/><path '+S+' d="M8 22H192"/></svg>'},
    {key:"circle_o",  label:"Circle it",     ratio:1.25,w:120, svg:'<svg viewBox="0 0 120 96"><path '+S+' d="M60 9C92 9 112 26 112 48 112 70 92 87 60 87 28 87 8 70 8 48 8 26 28 9 60 9z"/></svg>'},
    {key:"bracket",   label:"Bracket",       ratio:0.42,w:42,  svg:'<svg viewBox="0 0 42 100"><path '+S+' d="M31 6C17 6 19 44 9 50 19 56 17 94 31 94"/></svg>'},
    {key:"x_spark",   label:"Twinkle",       ratio:1,   w:48,  svg:'<svg viewBox="0 0 50 50"><path '+S+' d="M25 6V20M25 30V44M6 25H20M30 25H44"/></svg>'},
    {key:"dot",       label:"Dot",           ratio:1,   w:26,  svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="currentColor"/></svg>'},
    {key:"wave_arrow", label:"Wave arrow", ratio:3.33, w:185, svg:'<svg viewBox="0 0 200 60"><path '+S+' d="M8 30C24 50 42 50 58 30 74 10 92 10 108 30 124 50 142 50 158 30L167.4 18.3"/><path '+S+' d="M167.4 18.3L152.8 24.9M167.4 18.3L164.2 34"/></svg>'},
    {key:"wave_arrow_dot", label:"Dotted wave arrow", ratio:3.33, w:185, svg:'<svg viewBox="0 0 200 60"><path '+S+' stroke-dasharray="1 13" d="M8 30C24 50 42 50 58 30 74 10 92 10 108 30 124 50 142 50 158 30L167.4 18.3"/><path '+S+' d="M167.4 18.3L152.8 24.9M167.4 18.3L164.2 34"/></svg>'},
    {key:"squiggle_arrow", label:"Squiggle arrow", ratio:3.39, w:185, svg:'<svg viewBox="0 0 190 56"><path '+S+' d="M8 28C16 42 28 42 36 28 44 14 56 14 64 28 72 42 84 42 92 28 100 14 112 14 120 28 128 42 140 42 148 28L155.4 15"/><path '+S+' d="M155.4 15L142 23.8M155.4 15L154.6 31"/></svg>'},
    {key:"wave_arrow_long", label:"Long wave arrow", ratio:4.29, w:210, svg:'<svg viewBox="0 0 240 56"><path '+S+' d="M8 28C24 10 42 10 58 28 74 46 92 46 108 28 124 10 142 10 158 28 174 46 192 46 208 28L218 16.8"/><path '+S+' d="M218 16.8L203.1 22.6M218 16.8L214 32.3"/></svg>'},
    {key:"wave_arrow_up", label:"Rising wave arrow", ratio:1.75, w:150, svg:'<svg viewBox="0 0 175 100"><path '+S+' d="M10 90C30 66 52 88 66 64 80 40 96 62 108 40 120 20 138 30 150 18L160.6 7.4"/><path '+S+' d="M160.6 7.4L145.4 12.3M160.6 7.4L155.7 22.6"/></svg>'},
    {key:"zigzag",      label:"Zigzag line",   ratio:5,   w:185, svg:'<svg viewBox="0 0 200 40"><path '+S+' d="M8 20L36 8 64 32 92 8 120 32 148 8 176 32 192 22"/></svg>'},
    {key:"zigzag_arrow", label:"Zigzag arrow", ratio:3.08, w:185, svg:'<svg viewBox="0 0 160 52"><path '+S+' d="M8 24L30 12 52 36 74 12 96 36 118 16L129.1 5.9"/><path '+S+' d="M129.1 5.9L113.7 10.1M129.1 5.9L123.4 20.9"/></svg>'},
    {key:"asterisk",    label:"Asterisk",      ratio:1,   w:50,  svg:'<svg viewBox="0 0 50 50"><path '+S+' d="M7 25H43M13 11 37 39M37 11 13 39"/></svg>'},
    {key:"dots3",       label:"Three dots",    ratio:3.3, w:80,  svg:'<svg viewBox="0 0 80 24"><circle cx="12" cy="12" r="6" fill="currentColor"/><circle cx="40" cy="12" r="6" fill="currentColor"/><circle cx="68" cy="12" r="6" fill="currentColor"/></svg>'},
    {key:"check",       label:"Check",         ratio:1.2, w:54,  svg:'<svg viewBox="0 0 60 50"><path '+S+' d="M10 28L26 42 50 10"/></svg>'},
    {key:"heart_fill",  label:"Filled heart",  ratio:1.11,w:60,  svg:'<svg viewBox="0 0 100 90"><path fill="currentColor" d="M50 82C16 58 8 40 8 26 8 13 19 7 30 7 39 7 46 12 50 20 54 12 61 7 70 7 81 7 92 13 92 26 92 40 84 58 50 82z"/></svg>'},
    {key:"sun",         label:"Sun",           ratio:1,   w:54,  svg:'<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="10" fill="currentColor"/><path '+S+' d="M30 6V14M30 46V54M6 30H14M46 30H54M13 13 19 19M41 41 47 47M47 13 41 19M19 41 13 47"/></svg>'},
    {key:"sprig",       label:"Leaf sprig",    ratio:0.75,w:50,  svg:'<svg viewBox="0 0 60 80"><path '+S+' d="M30 74C30 50 30 30 30 8"/><path '+S+' d="M30 50C20 47 14 39 16 29M30 50C40 47 46 39 44 29M30 34C22 31 17 24 18 15M30 34C38 31 43 24 42 15"/></svg>'},
    {key:"plus",        label:"Plus",          ratio:1,   w:34,  svg:'<svg viewBox="0 0 40 40"><path '+S+' d="M20 8V32M8 20H32"/></svg>'},
    {key:"ring",        label:"Ring",          ratio:1,   w:50,  svg:'<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="17" '+S+'/></svg>'},
    {key:"scribble",    label:"Scribble",      ratio:2.4, w:150, svg:'<svg viewBox="0 0 120 50"><path '+S+' d="M8 38C20 12 30 44 44 22 58 4 66 40 80 22 94 8 104 38 114 20"/></svg>'},
    {key:"banner",      label:"Banner",        ratio:2.5, w:150, svg:'<svg viewBox="0 0 140 56"><path '+S+' d="M18 14H122L108 28 122 42H18L32 28z"/></svg>'},
    {key:"flower",      label:"Flower",        ratio:1,   w:58,  svg:'<svg viewBox="0 0 60 60"><circle cx="30" cy="14" r="9" '+S+'/><circle cx="46" cy="26" r="9" '+S+'/><circle cx="40" cy="44" r="9" '+S+'/><circle cx="20" cy="44" r="9" '+S+'/><circle cx="14" cy="26" r="9" '+S+'/><circle cx="30" cy="30" r="5" fill="currentColor"/></svg>'},
    {key:"cloud",       label:"Cloud",         ratio:1.68,w:90,  svg:'<svg viewBox="0 0 84 50"><path '+S+' d="M20 42C8 42 6 28 18 26 18 13 36 11 40 22 47 13 65 16 64 27 76 27 78 42 64 42z"/></svg>'},
    {key:"pin",         label:"Location pin",  ratio:0.71,w:40,  svg:'<svg viewBox="0 0 40 56"><path '+S+' d="M20 52C20 52 33 33 33 20 33 12 27 6 20 6 13 6 7 12 7 20 7 33 20 52 20 52z"/><circle cx="20" cy="20" r="6" '+S+'/></svg>'},
    /* second batch: everyday keepsakes, weather, nature and travel motifs */
    {key:"butterfly",   label:"Butterfly",     ratio:1.15,w:66,  svg:'<svg viewBox="0 0 92 80"><path '+S+' d="M46 22V62"/><path '+S+' d="M46 26C38 8 20 6 12 16 4 26 12 40 28 42 14 48 10 62 20 70 30 78 42 70 46 56"/><path '+S+' d="M46 26C54 8 72 6 80 16 88 26 80 40 64 42 78 48 82 62 72 70 62 78 50 70 46 56"/><path '+S+' d="M46 22 40 10M46 22 52 10"/></svg>'},
    {key:"music",       label:"Music notes",   ratio:1,   w:52,  svg:'<svg viewBox="0 0 64 64"><path '+S+' d="M26 46V14L54 8V40"/><path '+S+' d="M26 22 54 16"/><ellipse cx="18" cy="47" rx="9" ry="7" '+S+'/><ellipse cx="46" cy="41" rx="9" ry="7" '+S+'/></svg>'},
    {key:"coffee",      label:"Coffee cup",    ratio:1.14,w:58,  svg:'<svg viewBox="0 0 80 70"><path '+S+' d="M12 26H60V46C60 56 52 62 42 62H30C20 62 12 56 12 46z"/><path '+S+' d="M60 32H68C74 32 76 38 74 43 72 48 66 50 60 48"/><path '+S+' d="M26 16C26 12 30 11 30 7M40 16C40 12 44 11 44 7"/></svg>'},
    {key:"camera",      label:"Camera",        ratio:1.29,w:70,  svg:'<svg viewBox="0 0 90 70"><path '+S+' d="M8 22H26L32 12H58L64 22H82V60H8z"/><circle cx="45" cy="40" r="13" '+S+'/><circle cx="72" cy="30" r="2.6" fill="currentColor"/></svg>'},
    {key:"book",        label:"Open book",     ratio:1.4, w:80,  svg:'<svg viewBox="0 0 98 70"><path '+S+' d="M49 18C40 10 24 8 10 12V56C24 52 40 54 49 62 58 54 74 52 88 56V12C74 8 58 10 49 18z"/><path '+S+' d="M49 18V62"/></svg>'},
    {key:"balloon",     label:"Balloon",       ratio:0.66,w:44,  svg:'<svg viewBox="0 0 52 78"><path '+S+' d="M26 54C38 54 45 43 45 31 45 17 37 6 26 6 15 6 7 17 7 31 7 43 14 54 26 54z"/><path '+S+' d="M21 55 26 62 31 55"/><path '+S+' d="M26 62C26 67 20 68 20 72 20 76 27 76 27 71"/></svg>'},
    {key:"moon",        label:"Crescent moon", ratio:0.88,w:50,  svg:'<svg viewBox="0 0 62 70"><path '+S+' d="M46 50C30 58 12 50 10 33 8 18 18 8 30 6 20 18 22 36 34 44 39 47 43 49 46 50z"/></svg>'},
    {key:"crown",       label:"Crown",         ratio:1.35,w:70,  svg:'<svg viewBox="0 0 88 65"><path '+S+' d="M10 52 6 14 26 30 44 8 62 30 82 14 78 52z"/><path '+S+' d="M10 52H78"/></svg>'},
    {key:"gift",        label:"Gift box",      ratio:1.06,w:58,  svg:'<svg viewBox="0 0 74 70"><path '+S+' d="M8 26H66V62H8z"/><path '+S+' d="M4 16H70V26H4z"/><path '+S+' d="M37 16V62"/><path '+S+' d="M37 16C30 16 22 14 22 9 22 5 27 4 30 6 34 9 36 12 37 16 38 12 40 9 44 6 47 4 52 5 52 9 52 14 44 16 37 16z"/></svg>'},
    {key:"envelope",    label:"Envelope",      ratio:1.44,w:74,  svg:'<svg viewBox="0 0 92 64"><path '+S+' d="M8 12H84V56H8z"/><path '+S+' d="M8 12 46 38 84 12"/></svg>'},
    {key:"clock",       label:"Clock",         ratio:1,   w:56,  svg:'<svg viewBox="0 0 64 64"><circle cx="32" cy="34" r="24" '+S+'/><path '+S+' d="M32 20V34L42 40"/><path '+S+' d="M20 8 14 14M44 8 50 14"/></svg>'},
    {key:"umbrella",    label:"Umbrella",      ratio:0.94,w:56,  svg:'<svg viewBox="0 0 68 72"><path '+S+' d="M6 34C6 18 18 8 34 8 50 8 62 18 62 34 55 29 48 29 41 34 38 29 30 29 27 34 20 29 13 29 6 34z"/><path '+S+' d="M34 34V58C34 64 28 66 25 62"/></svg>'},
    {key:"cake",        label:"Cake",          ratio:1.1, w:62,  svg:'<svg viewBox="0 0 78 70"><path '+S+' d="M10 40C18 34 24 44 32 40 40 36 46 44 54 40 62 36 66 42 70 40V62H10z"/><path '+S+' d="M10 40V34C10 30 14 28 20 28H60C66 28 70 30 70 34V40"/><path '+S+' d="M27 28V18M40 28V16M53 28V18"/><path '+S+' d="M27 18C25 15 27 12 29 13M40 16C38 13 40 10 42 11M53 18C51 15 53 12 55 13"/></svg>'},
    {key:"key",         label:"Key",           ratio:2.1, w:80,  svg:'<svg viewBox="0 0 96 46"><circle cx="20" cy="23" r="13" '+S+'/><path '+S+' d="M33 23H88"/><path '+S+' d="M74 23V34M84 23V32"/></svg>'},
    {key:"feather",     label:"Feather",       ratio:0.78,w:48,  svg:'<svg viewBox="0 0 56 72"><path '+S+' d="M18 64C10 46 12 24 30 10 44 0 52 8 48 24 44 42 32 54 18 58"/><path '+S+' d="M30 12 20 62"/><path '+S+' d="M26 30 40 26M23 42 38 38"/></svg>'},
    {key:"paw",         label:"Paw print",     ratio:1.05,w:52,  svg:'<svg viewBox="0 0 62 60"><ellipse cx="31" cy="42" rx="15" ry="12" '+S+'/><ellipse cx="12" cy="27" rx="6.5" ry="8" '+S+'/><ellipse cx="24" cy="15" rx="6.5" ry="8.5" '+S+'/><ellipse cx="39" cy="15" rx="6.5" ry="8.5" '+S+'/><ellipse cx="51" cy="27" rx="6.5" ry="8" '+S+'/></svg>'},
    {key:"snowflake",   label:"Snowflake",     ratio:1,   w:54,  svg:'<svg viewBox="0 0 64 64"><g '+S+'><path d="M32 7V57"/><path d="M32 18 25 11M32 18 39 11M32 46 25 53M32 46 39 53"/></g><g '+S+' transform="rotate(60 32 32)"><path d="M32 7V57"/><path d="M32 18 25 11M32 18 39 11M32 46 25 53M32 46 39 53"/></g><g '+S+' transform="rotate(120 32 32)"><path d="M32 7V57"/><path d="M32 18 25 11M32 18 39 11M32 46 25 53M32 46 39 53"/></g></svg>'},
    {key:"bolt",        label:"Lightning",     ratio:0.6, w:38,  svg:'<svg viewBox="0 0 42 70"><path '+S+' d="M26 6 10 40H22L16 64 34 28H22z"/></svg>'},
    {key:"smiley",      label:"Smiley",        ratio:1,   w:54,  svg:'<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="25" '+S+'/><path '+S+' d="M22 26V30M42 26V30"/><path '+S+' d="M20 40C24 48 40 48 44 40"/></svg>'},
    {key:"bubble",      label:"Speech bubble", ratio:1.28,w:76,  svg:'<svg viewBox="0 0 88 68"><path '+S+' d="M44 8C66 8 82 18 82 32 82 46 66 56 44 56 38 56 33 55 28 54L10 62 17 48C10 44 6 38 6 32 6 18 22 8 44 8z"/></svg>'},
    {key:"think",       label:"Thought bubble",ratio:1.14,w:76,  svg:'<svg viewBox="0 0 84 74"><path '+S+' d="M42 6C60 6 74 15 74 27 74 39 60 47 42 47 24 47 10 39 10 27 10 15 24 6 42 6z"/><circle cx="26" cy="56" r="7" '+S+'/><circle cx="13" cy="67" r="4.5" '+S+'/></svg>'},
    {key:"bow",         label:"Ribbon bow",    ratio:1.5, w:70,  svg:'<svg viewBox="0 0 90 60"><path '+S+' d="M45 30C36 20 20 12 12 18 4 24 8 40 20 42 30 44 40 38 45 30z"/><path '+S+' d="M45 30C54 20 70 12 78 18 86 24 82 40 70 42 60 44 50 38 45 30z"/><circle cx="45" cy="30" r="6" '+S+'/><path '+S+' d="M40 35 32 54M50 35 58 54"/></svg>'},
    {key:"tulip",       label:"Tulip",         ratio:0.62,w:42,  svg:'<svg viewBox="0 0 46 74"><path '+S+' d="M10 16C10 30 15 38 23 40 31 38 36 30 36 16 31 22 28 22 23 16 18 22 15 22 10 16z"/><path '+S+' d="M23 40V68"/><path '+S+' d="M23 52C17 52 12 48 11 42 18 41 22 45 23 52z"/></svg>'},
    {key:"palm",        label:"Palm frond",    ratio:0.78,w:50,  svg:'<svg viewBox="0 0 62 78"><path '+S+' d="M30 74C30 56 29 34 34 12"/><path '+S+' d="M30 64Q19 60 14 50M30 52Q19 48 15 38M31 40Q21 36 18 27M33 28Q26 25 24 18"/><path '+S+' d="M30 64Q41 60 46 50M30 52Q41 48 45 38M31 40Q41 36 44 27M33 28Q40 25 42 18"/></svg>'},
    {key:"plane",       label:"Aeroplane",     ratio:1.2, w:66,  svg:'<svg viewBox="0 0 78 65"><path '+S+' d="M39 6C43 6 46 12 46 22V30L72 44V52L46 44V54L54 60V64L39 59 24 64V60L32 54V44L6 52V44L32 30V22C32 12 35 6 39 6z"/></svg>'},
    {key:"anchor",      label:"Anchor",        ratio:0.85,w:52,  svg:'<svg viewBox="0 0 60 70"><circle cx="30" cy="12" r="6" '+S+'/><path '+S+' d="M30 18V62"/><path '+S+' d="M16 28H44"/><path '+S+' d="M8 42C8 54 18 62 30 62 42 62 52 54 52 42"/></svg>'},
    {key:"diamond",     label:"Diamond",       ratio:1.08,w:52,  svg:'<svg viewBox="0 0 66 61"><path '+S+' d="M16 8H50L62 24 33 56 4 24z"/><path '+S+' d="M4 24H62M16 8 24 24 33 56M50 8 42 24 33 56"/></svg>'},
    {key:"spiral",      label:"Spiral",        ratio:1,   w:52,  svg:'<svg viewBox="0 0 64 64"><path '+S+' d="M32 32C32 28 36 26 39 28 44 31 43 39 37 43 29 48 18 44 14 34 9 22 17 8 31 5 48 1 63 12 64 29"/></svg>'},
    {key:"eye",         label:"Eye",           ratio:1.8, w:70,  svg:'<svg viewBox="0 0 90 50"><path '+S+' d="M6 25C18 10 32 4 45 4 58 4 72 10 84 25 72 40 58 46 45 46 32 46 18 40 6 25z"/><circle cx="45" cy="25" r="10" '+S+'/></svg>'},
    {key:"bulb",        label:"Light bulb",    ratio:0.72,w:46,  svg:'<svg viewBox="0 0 52 72"><path '+S+' d="M26 6C36 6 44 14 44 24 44 32 38 36 36 44H16C14 36 8 32 8 24 8 14 16 6 26 6z"/><path '+S+' d="M17 52H35M19 60H33"/></svg>'}
  ];
  const DOODLES_MAP = {}; DOODLES.forEach(d=> DOODLES_MAP[d.key]=d);
  /* build a doodle's final SVG with a chosen colour + stroke weight baked in
     (baking, rather than CSS, so the PDF export renders colour and weight too) */
  function doodleSVG(key, color, weight){ const dd=DOODLES_MAP[key]; if(!dd) return '';
    const w=(weight==null?6:weight); return dd.svg.split('@W').join(w).split('currentColor').join(color||'#4b4361'); }

  /* photo looks: card (default), plain, shadow, frame (custom bg), border. Applied as classes
     so existing photos (no style) stay exactly as the card look.

     Two behaviours changed vs the original:
       1. SHADOW is now INDEPENDENT of the look. Previously "shadow" was its own mutually
          exclusive look, so you could not have, say, a framed photo that also casts a shadow.
          Now any look can have a drop shadow via the separate `d.shadow` flag (class .has-shadow),
          and turning it off removes the shadow entirely. The old style value "shadow" is still
          understood (a bare image) for backwards compatibility with already-published stories.
       2. PLAIN now keeps PNG transparency. A cut-out sticker-style image (e.g. an aeroplane with
          no background) shows ONLY the subject — no filled box behind it. This is handled in CSS
          (.style-plain has no background/padding); here we just make sure no inline background is
          left over from a previous "frame" look. */
  const PHOTO_FRAME_DEFAULT='#e3e8f8';
  const PHOTO_LINE_DEFAULT='#544b6b';
  function applyPhotoStyle(el,d){
    ['card','plain','shadow','frame','border'].forEach(s=>el.classList.remove('style-'+s));
    const st=d.style||'card'; el.classList.add('style-'+st);
    if(d.noCap) el.classList.add('nocap'); else el.classList.remove('nocap');
    // independent shadow toggle (works on top of ANY look)
    if(d.shadow) el.classList.add('has-shadow'); else el.classList.remove('has-shadow');
    // reset any inline overrides each call so switching looks stays clean (CSS governs unless set below)
    el.style.background=''; el.style.padding=''; el.style.borderColor=''; el.style.borderWidth='';
    el.style.borderStyle='';
    el.style.borderRadius='';
    const im=el.querySelector('img'); if(im) im.style.borderRadius='';
    /* CORNER ROUNDING: d.radius (px) controls how rounded the photo's corners are —
       0 = completely square, higher = rounder. Applies to every look. Unset keeps the
       original CSS defaults, so existing photos are untouched. On padded looks (frame /
       card / border) the inner image gets a slightly smaller radius so the band of
       frame/border stays visually even around the corner. */
    if(d.radius!=null){
      el.style.borderRadius=d.radius+'px';
      const padded=(st==='frame'||st==='card'||st==='border');
      if(im) im.style.borderRadius=Math.max(0, d.radius-(padded?6:0))+'px';
    }
    // only the custom "frame" look paints a background colour; everything else (incl. plain) stays clear
    if(st==='frame') el.style.background=(d.frameColor||PHOTO_FRAME_DEFAULT);
    // BORDER look: optional colour + width. Defaults (white band, 6px, subtle 1px edge) come from
    // CSS, so leaving these unset keeps the original look pixel-for-pixel; setting them overrides.
    if(st==='border'){
      if(d.borderColor){ el.style.background=d.borderColor; el.style.borderColor=d.borderColor; }
      if(d.borderWidth!=null){ el.style.padding=d.borderWidth+'px'; }
    }
    /* OUTLINE: an optional drawn edge — solid, dashed, dotted or double. It is deliberately
       independent of the look, so a plain cut-out and a framed photo can both carry one.
       Left unset nothing here runs, and every existing photo keeps the edge its CSS gave it.
       Only border properties are touched: box-shadow is left alone so the separate shadow
       toggle still works, and html2canvas draws borders reliably, so an outline survives the
       PDF export. Elements are border-box, so the outline never changes the photo's size. */
    const line=d.line||'none';
    if(line!=='none'){
      el.style.borderStyle=line;
      el.style.borderWidth=(line==='double'? Math.max(3,(d.lineWidth!=null?d.lineWidth:2)*1.5)
                                           : (d.lineWidth!=null?d.lineWidth:2))+'px';
      el.style.borderColor=d.lineColor||PHOTO_LINE_DEFAULT;
    }
  }

  /* caption styling — font, colour and size are now fully controllable per photo.
     Sensible defaults keep already-published captions looking exactly as before:
     the handwritten caption font, the soft-ink colour, 18px. */
  const CAPTION_DEFAULTS={ font:'', color:'', size:0 };
  function applyCaptionStyle(cap, d){
    // font: a key into FONTS, or empty to inherit the theme's handwritten caption font (from CSS)
    cap.style.fontFamily = d.capFont ? getFont(d.capFont).css : '';
    // colour: empty inherits the theme's --ink-soft (set in CSS)
    cap.style.color = d.capColor || '';
    // size: 0/undefined inherits the CSS default (18px)
    cap.style.fontSize = d.capSize ? (d.capSize+'px') : '';
    /* POSITION: capDY nudges the caption down (or up) and capDX sideways from the default
       centred spot. The offsets go out as CSS variables so the card's bottom padding grows
       with the caption instead of clipping it. Both unset = the original placement. */
    const host=cap.parentNode || (cap.closest && cap.closest('.el'));
    if(host && host.style){
      host.style.setProperty('--cap-dy', (d.capDY||0)+'px');
      host.style.setProperty('--cap-dx', (d.capDX||0)+'px');
    }
  }

  /* ---- video ----
     A video is a LINK plus its own poster image. Only the poster is embedded (a data URL,
     exactly like a photo), so a story file stays small no matter how long the clip is and
     the clip streams from wherever it is hosted.

     The link must be a DIRECT file (an .mp4 or .webm served over https, e.g. a Cloudinary
     upload). YouTube and Vimeo are refused on purpose: their embeds are iframes that drag
     their own branding, channel name, like and share buttons onto the page, none of which
     can be turned off, and an iframe cannot be rasterised into the PDF either. A direct
     file plays in the browser's own <video>, which is clean and has native controls.

     Every surface draws the same FACADE — the poster with a play badge on top — and only
     the reader swaps in a real player, on click. That keeps the page light, lets several
     clips share a page without all of them loading at once, and means the PDF export
     rasterises an ordinary <img> instead of a player, which html2canvas cannot draw.

     The badge is a border-radius circle plus a CSS-border triangle on purpose, NOT an
     inline SVG: html2canvas renders borders and border-radius reliably but drops SVG, so
     an SVG badge would vanish from the PDF without any error. */
  function parseVideoUrl(url){
    url=(url||'').trim(); if(!url) return null;
    // streaming pages cannot be played in a bare <video>, and their embed players bring
    // their own branding, channel name and share buttons onto the page
    if(/(?:youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com)/i.test(url)) return {kind:'unsupported', src:url};
    if(/^http:\/\//i.test(url)) return {kind:'insecure', src:url};
    if(/^https:\/\//i.test(url)) return {kind:'file', src:url};
    return null;
  }
  const VIDEO_FRAME_DEFAULT='#fffdfb';
  function applyVideoStyle(el,d){
    ['plain','card'].forEach(x=> el.classList.remove('style-'+x));
    const st=(d.style==='card')?'card':'plain';
    el.classList.add('style-'+st);
    if(d.shadow===false) el.classList.remove('has-shadow'); else el.classList.add('has-shadow');
    if(d.noCap) el.classList.add('nocap'); else el.classList.remove('nocap');
    el.style.background = (st==='card') ? (d.frameColor||VIDEO_FRAME_DEFAULT) : '';
    const wrap=el.querySelector('.vwrap');
    if(wrap) wrap.style.borderRadius=(d.radius!=null? d.radius : 8)+'px';
    /* The card look is the frame around the clip, so round it to match rather than leaving a
       square frame around rounded video. Outer = inner + the card's 8px padding keeps the
       white band even the whole way round. Only applied once a radius has actually been
       chosen, so videos placed before this stay on the original 4px card. */
    el.style.borderRadius = (st==='card' && d.radius!=null) ? (d.radius+8)+'px' : '';
  }
  function fillVideoFace(wrap, d){
    wrap.innerHTML='';
    const img=document.createElement('img'); img.className='vposter'; img.alt=''; img.draggable=false;
    if(d.poster) img.src=d.poster;
    const play=document.createElement('div'); play.className='vplay'; play.appendChild(document.createElement('i'));
    wrap.appendChild(img); wrap.appendChild(play);
    return wrap;
  }
  function buildVideoFace(d){ const w=document.createElement('div'); w.className='vwrap'; return fillVideoFace(w,d); }
  // reader only: replace the facade with a real player
  function playVideo(el, d){
    const wrap=el.querySelector('.vwrap'); if(!wrap || wrap.dataset.playing || !d) return;
    wrap.style.height=wrap.offsetHeight+'px'; // hold the box so the page does not jump
    wrap.dataset.playing='1'; wrap.innerHTML='';
    const node=document.createElement('video');
    node.src=d.src; node.controls=true; node.autoplay=true; node.setAttribute('playsinline','');
    if(d.poster) node.poster=d.poster;
    node.className='vplayer'; wrap.appendChild(node);
  }
  // put a player back to its poster — used when another clip starts, and before the PDF export
  function stopVideo(el, d){
    const wrap=el && el.querySelector('.vwrap'); if(!wrap || !wrap.dataset.playing) return;
    delete wrap.dataset.playing; wrap.style.height=''; fillVideoFace(wrap, d||{});
  }

  /* `color` tints the plain / grid / dot papers. Unset keeps the theme paper colour, so
     every already-published page is unchanged. Decorative image papers ignore it. */
  function applyPaper(pageEl, paper, color){
    paper = paper || 'grid';
    pageEl.classList.remove('grid','dot','plain','bg');
    pageEl.style.backgroundImage = '';
    pageEl.style.backgroundColor = '';
    const bg = BG_MAP[paper];
    if(bg){ pageEl.classList.add('bg'); pageEl.style.backgroundImage = 'url("'+bg.file+'")'; }
    else {
      pageEl.classList.add(BUILTIN_PAPERS.indexOf(paper)!==-1 ? paper : 'grid');
      if(color) pageEl.style.backgroundColor = color;
    }
  }
  function normalizePaper(p){ return (BUILTIN_PAPERS.indexOf(p)!==-1 || BG_MAP[p]) ? p : 'grid'; }

  function uid(){ return Math.random().toString(36).slice(2,9); }
  function today(){ return new Date().toISOString().slice(0,10); }
  function escapeHtml(s){ return (s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  function slugify(s){ let v=(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); return v || ('story-'+uid()); }
  function formatDate(iso){ if(!iso) return ''; try{ const [y,m,d]=iso.split('-'); const mn=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return parseInt(d)+' '+mn[parseInt(m)-1]+' '+y; }catch(e){ return iso; } }

  /* Encode a canvas to a data URL, automatically choosing PNG when the image has any
     transparency and JPEG otherwise. This is what lets a cut-out image (e.g. an aeroplane
     PNG with no background) keep its transparency instead of getting a black box baked in:
     JPEG has no alpha channel, so transparent pixels become black. We detect alpha and switch
     to PNG only when needed (PNG is lossless but bigger), keeping ordinary photos small as JPEG. */
  function canvasHasAlpha(ctx, w, h){
    try{ const data=ctx.getImageData(0,0,w,h).data;
      for(let i=3;i<data.length;i+=4){ if(data[i]<250) return true; } }catch(e){}
    return false;
  }
  function encodeCanvas(canvas, q, type){
    const ctx=canvas.getContext('2d');
    if(!type || type==='auto'){ type = canvasHasAlpha(ctx, canvas.width, canvas.height) ? 'image/png' : 'image/jpeg'; }
    return canvas.toDataURL(type, q);
  }

  function compress(file, maxW, q, type){
    maxW=maxW||1100; q=(q==null?0.82:q); type=type||'auto'; // 'auto' = PNG if transparent, else JPEG
    return new Promise((res,rej)=>{
      const reader=new FileReader();
      reader.onload=()=>{ const img=new Image();
        img.onload=()=>{ let w=img.width,h=img.height; if(w>maxW){ h=Math.round(h*maxW/w); w=maxW; }
          const c=document.createElement('canvas'); c.width=w; c.height=h; c.getContext('2d').drawImage(img,0,0,w,h);
          res(encodeCanvas(c, q, type)); };
        img.onerror=rej; img.src=reader.result; };
      reader.onerror=rej; reader.readAsDataURL(file);
    });
  }

  function applyTextStyle(body, d){
    body.style.fontFamily = getFont(d.font).css;
    body.style.fontSize   = (d.size||20)+'px';
    body.style.fontWeight = d.bold? '700':'400';
    body.style.fontStyle  = d.italic? 'italic':'normal';
    body.style.textDecoration = d.underline? 'underline':'none';
    body.style.textAlign  = d.align||'left';
    body.style.color = d.color || '';
    /* paragraph / line spacing: a multiplier (1.0 – 3.0). Unset inherits the CSS
       default (1.45), so every already-published story renders exactly as before. */
    body.style.lineHeight = d.spacing ? String(d.spacing) : '';
    /* manual box height: a MINIMUM, so longer text still grows and is never clipped.
       Unset keeps the old auto height, so every already-published story is unchanged. */
    body.style.minHeight = d.h ? (d.h+'px') : '';
    /* internal padding: unset keeps the CSS default (8px 10px) */
    body.style.padding = (d.pad!=null) ? (d.pad+'px') : '';
    /* A shaped box paints its fill and border in the SVG behind the text instead, so the
       rectangular background and border are cleared here and drawn by applyTextShape. */
    const shaped = textShapeKey(d)!=='rect';
    body.style.background = shaped ? 'transparent' : (d.fill || 'transparent');
    /* corner rounding + border: unset keeps the original CSS (6px radius, no border) */
    body.style.borderRadius = (!shaped && d.radius!=null) ? (d.radius+'px') : '';
    if(!shaped && d.bw){ body.style.border = d.bw+'px solid '+(d.bc||'#4b4361'); }
    else body.style.border = '';
  }

  /* ---- text-box shapes ----
     A text box can take a non-rectangular outline (L, C, U, T or a freehand polygon) and
     the text really flows inside it. Each shape is a small function turning a handful of
     named parameters into a polygon in a 0..1 box, so geometry stays meaningful at any size
     and every shape shares one renderer instead of being hard-coded separately.

     Stored on an element as { shape, shapeOpts:{...}, points:[[x,y],...] }. A box with no
     `shape` is a plain rectangle and takes the original code path untouched, so every
     already-published story renders exactly as before. */
  const cl01=(v,lo,hi)=> Math.max(lo==null?0.05:lo, Math.min(hi==null?0.95:hi, (v==null?0.4:v)));
  const TEXT_SHAPES={
    rect:{ label:'Rectangle', params:[], defaults:{},
      points(){ return [[0,0],[1,0],[1,1],[0,1]]; } },
    l:{ label:'L', params:[{k:'arm',label:'Arm width'},{k:'base',label:'Base height'}],
      defaults:{arm:.45, base:.4},
      points(o){ const a=cl01(o.arm), b=cl01(o.base); return [[0,0],[a,0],[a,1-b],[1,1-b],[1,1],[0,1]]; } },
    c:{ label:'C', params:[{k:'arm',label:'Arm width'},{k:'top',label:'Top bar'},{k:'base',label:'Bottom bar'}],
      defaults:{arm:.45, top:.28, base:.28},
      points(o){ const a=cl01(o.arm), t=cl01(o.top), b=cl01(o.base);
        const t2=Math.min(t,.9-b); return [[0,0],[1,0],[1,t2],[a,t2],[a,1-b],[1,1-b],[1,1],[0,1]]; } },
    t:{ label:'T', params:[{k:'top',label:'Top bar'},{k:'stem',label:'Stem width'}],
      defaults:{top:.34, stem:.44},
      points(o){ const t=cl01(o.top), s=cl01(o.stem,.1), l=(1-s)/2, r=(1+s)/2;
        return [[0,0],[1,0],[1,t],[r,t],[r,1],[l,1],[l,t],[0,t]]; } },
    custom:{ label:'Custom', params:[], defaults:{},
      points(){ return [[0,0],[1,0],[1,1],[0,1]]; } }
  };
  /* Reverse L is the same geometry pre-flipped, so there is no duplicated shape code */
  TEXT_SHAPES.lr = Object.assign({}, TEXT_SHAPES.l, { label:'Reverse L',
    defaults:Object.assign({}, TEXT_SHAPES.l.defaults, {flipX:1}) });
  const TEXT_SHAPE_ORDER=['rect','l','lr','c','t','custom'];

  function textShapeKey(d){ return (d && d.shape && TEXT_SHAPES[d.shape]) ? d.shape : 'rect'; }
  function shapeDefaults(key){ return Object.assign({}, (TEXT_SHAPES[key]||TEXT_SHAPES.rect).defaults); }
  function customPoints(d){
    const p=(d && Array.isArray(d.points)) ? d.points : null;
    if(!p || p.length<3) return [[0,0],[1,0],[1,1],[0,1]];
    return p.map(q=>[Math.max(0,Math.min(1,+q[0]||0)), Math.max(0,Math.min(1,+q[1]||0))]);
  }
  /* the element's outline as a polygon in a 0..1 box, with orientation flips applied */
  function shapePoints(d){
    const key=textShapeKey(d), def=TEXT_SHAPES[key];
    const o=Object.assign({}, def.defaults, d.shapeOpts||{});
    let pts = (key==='custom') ? customPoints(d) : def.points(o);
    if(o.flipX) pts=pts.map(p=>[1-p[0], p[1]]);
    if(o.flipY) pts=pts.map(p=>[p[0], 1-p[1]]);
    return pts;
  }

  /* an SVG path for a polygon, with every corner rounded by up to r px */
  function polyPath(pts, r){
    const n=pts.length; if(n<3) return '';
    let out='';
    for(let i=0;i<n;i++){
      const p0=pts[(i-1+n)%n], p1=pts[i], p2=pts[(i+1)%n];
      const d1=Math.hypot(p0[0]-p1[0], p0[1]-p1[1]), d2=Math.hypot(p2[0]-p1[0], p2[1]-p1[1]);
      const rr=Math.min(r||0, d1/2, d2/2);
      const a=[p1[0]+(p0[0]-p1[0])/(d1||1)*rr, p1[1]+(p0[1]-p1[1])/(d1||1)*rr];
      const b=[p1[0]+(p2[0]-p1[0])/(d2||1)*rr, p1[1]+(p2[1]-p1[1])/(d2||1)*rr];
      out += (i===0?'M':'L')+a[0].toFixed(2)+' '+a[1].toFixed(2);
      out += (rr>0.4 ? 'Q'+p1[0].toFixed(2)+' '+p1[1].toFixed(2)+' ' : 'L')+b[0].toFixed(2)+' '+b[1].toFixed(2);
    }
    return out+'Z';
  }

  /* Every horizontal slice of the polygon where the interior actually is. A line of text is
     one unbroken rectangle, so for each band we keep the WIDEST continuous run — that is what
     the text can really use. This one routine drives every shape, including custom polygons. */
  function spansAt(pts, y){
    const xs=[];
    for(let i=0;i<pts.length;i++){
      const a=pts[i], b=pts[(i+1)%pts.length];
      if((a[1]<=y && b[1]>y) || (b[1]<=y && a[1]>y)) xs.push(a[0]+(y-a[1])/(b[1]-a[1])*(b[0]-a[0]));
    }
    xs.sort((p,q)=>p-q);
    const out=[]; for(let i=0;i+1<xs.length;i+=2) out.push([xs[i], xs[i+1]]);
    return out;
  }
  function shapeBands(pts, steps){
    const ys=[0,1]; pts.forEach(p=>ys.push(p[1]));
    ys.sort((a,b)=>a-b);
    const edge=[]; ys.forEach(y=>{ if(!edge.length || y-edge[edge.length-1]>0.004) edge.push(y); });
    const bands=[];
    for(let i=0;i+1<edge.length;i++){
      const a=edge[i], b=edge[i+1], n=Math.max(1, Math.round((b-a)*(steps||1)));
      for(let k=0;k<n;k++) bands.push([a+(b-a)*k/n, a+(b-a)*(k+1)/n]);
    }
    return bands.length?bands:[[0,1]];
  }
  /* per band: the widest usable run, as a fraction of the box width */
  function shapeRuns(d){
    const pts=shapePoints(d);
    const bands=shapeBands(pts, textShapeKey(d)==='custom'?26:1);
    return bands.map(bd=>{
      const sp=spansAt(pts, (bd[0]+bd[1])/2);
      if(!sp.length) return {y0:bd[0], y1:bd[1], lo:0, hi:0};
      // ties favour the left-hand run, so a symmetric U reads top-left downwards
      let best=sp[0]; sp.forEach(s=>{ if(s[1]-s[0] > best[1]-best[0]+1e-6) best=s; });
      return {y0:bd[0], y1:bd[1], lo:best[0], hi:best[1]};
    });
  }

  const SVGNS='http://www.w3.org/2000/svg';
  /* The two exclusion floats must sit before any text for the wrap to apply. They are
     re-created on every pass, so deleting one while typing cannot break the shape. */
  function exSpacer(body, side){
    let n=body.querySelector('.shape-ex.'+side);
    if(!n){ n=document.createElement('div'); n.className='shape-ex '+side; n.setAttribute('contenteditable','false'); }
    if(n.parentNode!==body) body.insertBefore(n, body.firstChild);
    return n;
  }
  function orderSpacers(body){
    const r=body.querySelector('.shape-ex.right'), l=body.querySelector('.shape-ex.left');
    if(r && body.firstChild!==r) body.insertBefore(r, body.firstChild);
    if(l && body.firstChild!==l) body.insertBefore(l, body.firstChild);
  }
  function polyCss(pts){ return 'polygon('+pts.map(p=>p[0].toFixed(1)+'px '+p[1].toFixed(1)+'px').join(',')+')'; }

  /* Draw the outline behind the text and carve the text region to match it. The exclusions
     are two full-height floats (one per side) whose `shape-outside` polygon steps in and out
     with the shape, which is what makes the text genuinely follow the outline rather than
     sitting in a rectangle with a decorative border drawn around it. */
  function applyTextShape(el, d, pass){
    const body=el.querySelector('.text-body'); if(!body) return;
    const key=textShapeKey(d);
    let art=el.querySelector('.shape-art');
    if(key==='rect'){
      if(art) art.remove();
      body.querySelectorAll('.shape-ex').forEach(n=>n.remove());
      body.style.clipPath='';
      el.classList.remove('shaped');
      return;
    }
    el.classList.add('shaped');
    /* clip-path governs hit-testing as well as painting, so a click in the hollow part of an
       L or C falls through to whatever sits underneath instead of being swallowed by the
       bounding box. The fill and outline are drawn by the SVG behind, which is not clipped,
       so this changes what is clickable without changing what is visible. */
    body.style.clipPath='polygon('+shapePoints(d)
      .map(p=>(p[0]*100).toFixed(2)+'% '+(p[1]*100).toFixed(2)+'%').join(',')+')';
    const cs=getComputedStyle(body);
    const padL=parseFloat(cs.paddingLeft)||0, padR=parseFloat(cs.paddingRight)||0;
    const padT=parseFloat(cs.paddingTop)||0, padB=parseFloat(cs.paddingBottom)||0;
    const BW=body.offsetWidth, BH=body.offsetHeight;
    if(BW<4 || BH<4) return;
    const cw=Math.max(1, BW-padL-padR), ch=Math.max(1, BH-padT-padB);

    const runs=shapeRuns(d);
    const left=[], right=[];
    let lMax=0, rMax=0;
    runs.forEach(r=>{
      const y0=Math.max(0, r.y0*BH-padT), y1=Math.min(ch, r.y1*BH-padT);
      if(y1<=y0) return;
      /* content-local x=0 already sits padL inside the box, so a run starting at r.lo keeps
         a full padding gap from an interior edge without subtracting padL again */
      const lo=Math.max(0, Math.min(cw, r.lo*BW));        // text may start here
      const hi=Math.min(cw, r.hi*BW-padL-padR);           // and must stop here
      left.push({y0, y1, v:lo}); right.push({y0, y1, v:hi});
      if(lo>lMax) lMax=lo;
      if(cw-hi>rMax) rMax=cw-hi;
    });

    const lNode=body.querySelector('.shape-ex.left'), rNode=body.querySelector('.shape-ex.right');
    if(lMax>1){
      const n=lNode||exSpacer(body,'left');
      const p=[[0,0]]; left.forEach(b=>{ p.push([b.v,b.y0]); p.push([b.v,b.y1]); }); p.push([0,ch]);
      n.style.cssText='float:left;width:'+lMax.toFixed(1)+'px;height:'+ch.toFixed(1)+'px;';
      n.style.shapeOutside=polyCss(p);
    } else if(lNode) lNode.remove();
    if(rMax>1){
      const n=rNode||exSpacer(body,'right');
      const p=[[rMax,0]]; right.forEach(b=>{ p.push([b.v-(cw-rMax), b.y0]); p.push([b.v-(cw-rMax), b.y1]); }); p.push([rMax,ch]);
      n.style.cssText='float:right;width:'+rMax.toFixed(1)+'px;height:'+ch.toFixed(1)+'px;';
      n.style.shapeOutside=polyCss(p);
    } else if(rNode) rNode.remove();
    orderSpacers(body);

    if(!art){ art=document.createElementNS(SVGNS,'svg'); art.setAttribute('class','shape-art');
      art.appendChild(document.createElementNS(SVGNS,'path')); el.insertBefore(art, el.firstChild); }
    const W=el.offsetWidth||BW, H=el.offsetHeight||BH;
    const bw=d.bw||0, inset=bw/2;
    const box=shapePoints(d).map(p=>[inset+p[0]*(W-bw), inset+p[1]*(H-bw)]);
    art.setAttribute('viewBox','0 0 '+W+' '+H);
    art.setAttribute('width', W); art.setAttribute('height', H);
    const path=art.firstChild;
    path.setAttribute('d', polyPath(box, d.radius!=null?d.radius:6));
    path.setAttribute('fill', d.fill||'none');
    path.setAttribute('stroke', bw? (d.bc||'#4b4361') : 'none');
    path.setAttribute('stroke-width', bw||0);
    path.setAttribute('stroke-linejoin','round');

    /* the shape must wrap however tall the text actually grew, so measure once more */
    if(!pass && Math.abs((body.offsetHeight||0)-BH)>1) applyTextShape(el, d, 1);
  }

  /* INLINE FORMATTING
     A text box can now carry per-word bold / italic / underline. When the user formats a
     selection inside a box, the editor stores the box's `html` (rich markup) alongside the
     plain `content` (used for previews/search and as a fallback). The block-level bold/italic/
     underline buttons still work for whole-box styling via applyTextStyle; inline runs live
     inside the html.

     For safety we never inject arbitrary markup: setRichText whitelists only the formatting
     tags <b> <strong> <i> <em> <u> <s> <br> <ul> <ol> <li>, plus a <span> carrying only a
     whitelisted font-family, font-size or colour, and escapes everything else. This keeps rendering
     identical between the editor and the public reader, and keeps the PDF export correct. */
  /* A <span> may carry ONLY these three properties, and the style attribute is rebuilt
     from scratch rather than passed through, so nothing else can ride along inside it. */
  const SAFE_CSS={
    'color':       /^#[0-9a-f]{3,8}$|^rgba?\([\d\s,.%]{1,40}\)$|^[a-z]{3,20}$/i,
    'font-size':   /^\d{1,3}(\.\d+)?px$/,
    'font-family': /^[-a-z0-9 ,'"]{1,120}$/i
  };
  function safeStyle(el){
    const out=[];
    for(const prop in SAFE_CSS){
      const v=(el.style.getPropertyValue(prop)||'').trim();
      if(v && SAFE_CSS[prop].test(v)) out.push(prop+':'+v);
    }
    return out.join(';');
  }
  function sanitizeRich(html){
    if(html==null) return '';
    const allowed={B:'b',STRONG:'b',I:'i',EM:'i',U:'u',S:'s',STRIKE:'s',DEL:'s',BR:'br',UL:'ul',OL:'ol',LI:'li'};
    const drop={SCRIPT:1,STYLE:1,IFRAME:1,OBJECT:1,EMBED:1}; // discard these AND their contents
    const tmp=document.createElement('div'); tmp.innerHTML=String(html);
    const out=document.createElement('div');
    (function walk(src, dst){
      src.childNodes.forEach(n=>{
        if(n.nodeType===3){ dst.appendChild(document.createTextNode(n.nodeValue)); return; }
        if(n.nodeType!==1) return;
        if(drop[n.nodeName]) return; // skip element and everything inside it
        if(n.nodeName==='SPAN' || n.nodeName==='FONT'){
          // per-word font / size / colour: kept only if the style survives the whitelist
          const st=safeStyle(n);
          if(st){ const e=document.createElement('span'); e.setAttribute('style', st); walk(n,e); dst.appendChild(e); }
          else walk(n, dst);
          return;
        }
        const tag=allowed[n.nodeName];
        if(tag){ const e=document.createElement(tag); if(tag!=='br') walk(n,e); dst.appendChild(e); }
        else { walk(n, dst); } // unknown but harmless wrapper: drop wrapper, keep its text
      });
    })(tmp, out);
    return out.innerHTML;
  }
  // true when the html carries real formatting beyond plain text (so we know to use it)
  function hasRich(d){ return !!(d && d.html && /<(b|strong|i|em|u|s|strike|del|br|ul|ol|li|span)\b/i.test(d.html)); }
  function setTextContent(body, d){
    if(hasRich(d)){ body.innerHTML = sanitizeRich(d.html); }
    else { body.textContent = d.content||''; }
  }

  /* rotation lives on the element wrapper for every type (now text too) */
  function applyRot(el, d){ el.style.transform = d.rot ? ('rotate('+d.rot+'deg)') : ''; }

  function buildElementRO(d){
    const el=document.createElement('div'); el.className='el el-'+d.type; el.__data=d;
    el.style.left=(d.x||40)+'px'; el.style.top=(d.y||120)+'px'; if(d.w) el.style.width=d.w+'px';
    if(d.type==='text'){
      const b=document.createElement('div'); b.className='text-body'; setTextContent(b,d); applyTextStyle(b,d); el.appendChild(b);
      applyRot(el,d);
      // the shape needs real measurements, so it is drawn once the box is laid out
      if(textShapeKey(d)!=='rect') requestAnimationFrame(()=>applyTextShape(el,d));
    } else if(d.type==='photo'){
      const img=document.createElement('img'); img.src=d.src; img.draggable=false; el.appendChild(img);
      const cap=document.createElement('div'); cap.className='cap'; cap.textContent=d.caption||''; el.appendChild(cap); applyCaptionStyle(cap,d);
      applyPhotoStyle(el,d); applyRot(el,d);
    } else if(d.type==='video'){
      el.appendChild(buildVideoFace(d));
      const cap=document.createElement('div'); cap.className='cap'; cap.textContent=d.caption||''; el.appendChild(cap); applyCaptionStyle(cap,d);
      applyVideoStyle(el,d); applyRot(el,d);
    } else if(d.type==='sticker'){
      const s=document.createElement('span'); s.className='s-emoji'; s.textContent=d.emoji; if(d.size) s.style.fontSize=d.size+'px'; el.appendChild(s);
      applyRot(el,d);
    } else if(d.type==='imgsticker'){
      const img=document.createElement('img'); img.src=d.src; img.draggable=false; el.appendChild(img); applyRot(el,d);
    } else if(d.type==='doodle'){
      const dd=DOODLES_MAP[d.key];
      if(dd){ el.innerHTML=doodleSVG(d.key, d.color, d.weight); if(dd.ratio) el.style.aspectRatio=String(dd.ratio); }
      applyRot(el,d);
    } else if(d.type==='washi'){
      const t=document.createElement('div'); t.className='tape'; t.style.background=d.color||'#bfcae6'; if(d.plain) t.classList.add('plain'); if(d.w) t.style.width=d.w+'px';
      el.style.transform='rotate('+(d.rot||-3)+'deg)'; el.appendChild(t);
    }
    return el;
  }

  // overflow-safe: holder reserves the SCALED footprint; scaler is absolutely placed inside it
  function renderPageRO(mount, page){
    const holder=document.createElement('div'); holder.className='page-holder';
    const scaler=document.createElement('div'); scaler.className='page-scaler';
    const pg=document.createElement('div'); pg.className='page'; applyPaper(pg, page.paper, page.bgColor);
    (page.elements||[]).forEach(d=> pg.appendChild(buildElementRO(d)));
    scaler.appendChild(pg); holder.appendChild(scaler); mount.appendChild(holder);
    const fit=()=>{ const cs=getComputedStyle(mount); const pad=(parseFloat(cs.paddingLeft)||0)+(parseFloat(cs.paddingRight)||0);
      const avail=Math.min(mount.clientWidth-pad, 800); const sc=Math.min(1, avail/PAGE_W);
      scaler.style.transform='scale('+sc+')'; holder.style.width=(PAGE_W*sc)+'px'; holder.style.height=(pg.offsetHeight*sc)+'px';
      pg.querySelectorAll('.el-text').forEach(n=>{ if(n.__data && textShapeKey(n.__data)!=='rect') applyTextShape(n, n.__data); }); };
    requestAnimationFrame(fit); window.addEventListener('resize', fit);
    return pg;
  }

  function b64encode(str){ const bytes=new TextEncoder().encode(str); let bin=''; const ch=0x8000;
    for(let i=0;i<bytes.length;i+=ch){ bin+=String.fromCharCode.apply(null, bytes.subarray(i,i+ch)); } return btoa(bin); }
  function b64decode(b64){ const bin=atob((b64||'').replace(/\n/g,'')); const bytes=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i); return new TextDecoder().decode(bytes); }

  return { CONFIG, PAGE_W, FONTS, FONT_GROUPS, FONT_ALIASES, resolveFontKey, getFont, BACKGROUNDS, BG_GROUPS, BG_MAP, BUILTIN_PAPERS, DOODLES, DOODLES_MAP, doodleSVG, applyPhotoStyle, applyCaptionStyle, applyPaper, normalizePaper,
           parseVideoUrl, applyVideoStyle, buildVideoFace, fillVideoFace, playVideo, stopVideo,
           uid, today, escapeHtml, slugify, formatDate, compress, encodeCanvas, applyTextStyle, sanitizeRich, hasRich, setTextContent, applyRot,
           TEXT_SHAPES, TEXT_SHAPE_ORDER, textShapeKey, shapeDefaults, shapePoints, customPoints, applyTextShape,
           buildElementRO, renderPageRO, b64encode, b64decode };
})();

/* Journal — the reader's half of the engine.

   The editor lives in its own project and publishes JSON into data/. Nothing
   here writes: these pages only ever read data/index.json and
   data/posts/<id>.json and draw them. */
window.JOURNAL = (function(){
  const CONFIG = { TITLE: (window.JOURNAL_TITLE || "Journal") };
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

  /* ---- page backgrounds ----
     Built-in styles (grid / dot / plain) plus image backgrounds stored as small files
     under assets/backgrounds/. A page only stores its background KEY (e.g. "bg04"), so
     story files stay tiny; the image itself is fetched once and cached by the browser,
     and only when a page actually uses it. `thumb` is a tiny inline preview for the picker. */
  const BACKGROUNDS = [
    {key:"bg01", label:"Cinnamoroll Paris", file:"assets/backgrounds/bg01.jpg", thumb:"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAwICQsJCAwLCgsODQwOEh4UEhEREiUbHBYeLCcuLisnKyoxN0Y7MTRCNCorPVM+QkhKTk9OLztWXFVMW0ZNTkv/2wBDAQ0ODhIQEiQUFCRLMisyS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0v/wAARCABwAFQDASIAAhEBAxEB/8QAGgABAQADAQEAAAAAAAAAAAAAAAMBBAUCB//EAC8QAAIBAwEGBAUFAQAAAAAAAAABAgMEESESFDE0gbFBUVKhEyIyYZEFI0Jx8DP/xAAYAQEBAQEBAAAAAAAAAAAAAAAABAEDAv/EABwRAQACAgMBAAAAAAAAAAAAAAABAhIxESFRMv/aAAwDAQACEQMRAD8A+jUKVOdFP4blLzzhHqNC321CWZSec4zhYJzpSnYRcNptSzsrXOp6t7ZwinUi9V/F+fmba9s5hkVjHl6dCgquzFSemca6r7MpG2oSWVF/lmaVNycpSUo5xst8V9v6LRjsri234sZW9MYS3Sj6fdjdKPp92XBuVvTGEN0o+n3Y3Sj6PdlwMremMNeVtQjFylHCXjlknRpLOIpv+EdrDlobVXOzp5664PMY52XhPC0k+KMyt6Yx451ZKNRqMXFaaPw0Bm5io15JcECuuocJ23rLl49e5chZcvHr3LktvqXeugAHloAAAAAw0nxRkADmXfMT6dgLvmJ/7wBXXUJ523LLl49e5chZcvHr3Lk1vqXeugAHloAAAAAAADmXfMT6dgLvmJ9OwK66hPO25ZcvHr3LkLLl49e5cmt9S710AA8tAAAAAAAAcy75ifTsBd8xP/eAK66hPO25ZcvHr3LkLLl49e5cmt9S710AA8tAAAAAAAAcy75ifTsBd8xPp2BXXUJ523LLl49e5mvcQoTpQlxqSwiVKbjZPY+tRbSx+DRryq07iy+K/n23JrjhaImnuZd46iHXnNQXm3wRmL2oprxWTxKO3LVfKvcoeO+WgANAAAAeHUivH8amYzjP6Wm14Ac675ifTsDF5zE+nYFddQnnbatUt3U5v7vyWDi3tbeLqrVjPKp/88p68OHudCrcunYfDpJuq8rRcPua1lZ2m7veI/uPho8xRxx4menSbcurY1lWtoSzmWEpf2bBxf0qpK1nOnUTVNvR49zp73R9XszxNJ509RaOFwQ3uj6vZje6Pq9mMbeNyhc1risqa/ck0m8bMVqz1vdH1ezI3VSjcUtj4mzrnOy2ZNbcdQRavPbNK6Ta2Y7NNJ6bL18uB7c3Kq22lGOilj6X5MlTlQpLFOo1ph5T1PdKtRp5bqOTeMvZxkRW3HcNm1WrcvNeTbT+8eAFxJTrSlF5TBXXUJ52/9k="},
    {key:"bg02", label:"Floral Border", file:"assets/backgrounds/bg02.jpg", thumb:"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAwICQsJCAwLCgsODQwOEh4UEhEREiUbHBYeLCcuLisnKyoxN0Y7MTRCNCorPVM+QkhKTk9OLztWXFVMW0ZNTkv/2wBDAQ0ODhIQEiQUFCRLMisyS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0v/wAARCAB2AFQDASIAAhEBAxEB/8QAGQABAQEBAQEAAAAAAAAAAAAAAAMCAQQH/8QALBAAAwACAQIFAgUFAAAAAAAAAAECAxEhEjEyQVFhcSJSBBNCgZEjM1Ohsf/EABUBAQEAAAAAAAAAAAAAAAAAAAAB/8QAGBEBAAMBAAAAAAAAAAAAAAAAAAERIUH/2gAMAwEAAhEDEQA/APpeWW6yKsi1rWn5fwdxYblN/mtuq8SfcR+XlzWlFcr6tr/TPRK6ZSXZLRUSrFVLTva90a1kX6kUBFY6bfe9fCHRX+SjYAnrIv1J/scrHVNN0trtwVAEui/PI/20RWJxle8q1ttS+dcdz1k8kJ7vTdJcaLaUzgmnjW8jflxoGMGaJxpY4trz1O9MAbjHM5rpTpliWOurI3prc+ZUigAAAAAAAByluWvVep05T1La76AlhxQsa+hIHFmcTMrFdaXkgXUUXOWvZI2YjxX8myKAAAAAAAAHGtpr1OgDGN7hAYvC/kAJ4yUvXTNmF/dfwbAAAAAAAAAHHwtnTNeF/AHMS/pr35B2PAgByObt/sbMR4rXubAAAAAAAAAAADGLwJenAGLw79WAORSrI3L2mihOZSyvS0kktIoAAAAAAAAAOU9S2dOUtpr1AnGSJlJ2lr1YEY8dxLqJb1rlAqJ4cqyfiLlSuPPf/D0nmqujLTWLwLSfr7F4bqU2tMSQ0ACKAAAAABm+Ifnx5vRollt9XR07ml3Alg/Ey8fktPzpIFMKV406xqX200C4jGVXFW1b5nhLj2GKc26mrlua7tAF4O5XeKOp2++uEUUP72AQd6bXa9/KGsn3L+ACKdFfeyeR1FRPW/reuwBUa6Mn3p/KIS8vXt39NOkkn2AEC2Kck41u0/PlAAiv/9k="},
    {key:"bg03", label:"Rainy Day Clouds", file:"assets/backgrounds/bg03.jpg", thumb:"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAwICQsJCAwLCgsODQwOEh4UEhEREiUbHBYeLCcuLisnKyoxN0Y7MTRCNCorPVM+QkhKTk9OLztWXFVMW0ZNTkv/2wBDAQ0ODhIQEiQUFCRLMisyS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0v/wAARCABuAFQDASIAAhEBAxEB/8QAGQABAQEBAQEAAAAAAAAAAAAAAAMEAQIH/8QAJhAAAgIBBAICAgMBAAAAAAAAAAECETEDBBIhUXETkUFhIjJSgf/EABgBAQEBAQEAAAAAAAAAAAAAAAADAQIE/8QAHREBAAIDAAMBAAAAAAAAAAAAAAECERIxAyFBE//aAAwDAQACEQMRAD8A+jpJxdumsfs96ejKavCPe3Vwl0VbVJJ17O5s4iuXhbeCXdt+SepoOCbj2l9l7bebX6O02qwjMy2Yhis7KXKTbrs2cf5f1VUd4x8L6N2ZqxKr7wdaj5NnFeF9DivC+hsasfFf6WRxi31JLs2cV4X0clHrpK/Q2NWIHXkHbhfa4l7LkNriXsuSt1WvAAGNAAAAAAAAYXlgPLBZFfa4l7LkNriXsuTt1WvAAHLQAAAAAAAGF5YDywWRX2uJey5Da4l7Lk7dVrwABy0AAAAAAABheWA8sFkV9riXsuQ2uJey5O3Va8AActAAAAAAAAYXlgPLBZFfa4l7LkNriXssmnj8E7dUrx0AHLoAAAHG0suiOpuNJwaWrBNrq5UMj29fSV3OPWexo60NaHODuN1gxau3gtGUvli6V0vyaNLU05P4dOK+NKrTOItOfbmM/UnlgPIPSmtt5RipW0jzuNd6bvRUJN/27JxdNNq/0caT/BxaszxufTRHcxpc7Trvrop8kP8AS+zFxXg9GVpP1u0tUdWDXbSOvVglfJGQX1Vf9N1Npd3G45w4Rh3LpPwYY8KXO1NPv2bMiv2yNvFaZ6ybTPph5U5cU+N9UjbtdSKWm3fV31g7XnsUhXwzE5y6/ScYdeWAD0uH/9k="},
    {key:"bg04", label:"Sky & Sunflowers", file:"assets/backgrounds/bg04.jpg", thumb:"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAwICQsJCAwLCgsODQwOEh4UEhEREiUbHBYeLCcuLisnKyoxN0Y7MTRCNCorPVM+QkhKTk9OLztWXFVMW0ZNTkv/2wBDAQ0ODhIQEiQUFCRLMisyS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0v/wAARCAB3AFQDASIAAhEBAxEB/8QAGQABAQEBAQEAAAAAAAAAAAAAAAQCAwEH/8QAKhAAAgECAwYHAQEAAAAAAAAAAAECAxEEEpEhM0FRUnETFDEyYoGhYSL/xAAYAQEAAwEAAAAAAAAAAAAAAAAAAQIDBP/EAB8RAQADAAIDAQEBAAAAAAAAAAABAhESIQMxUUETMv/aAAwDAQACEQMRAD8A+imqcHOaS9OPYU4OpLKnY7QoTg7xmtDW/cZrnpE7uOrpQcbZV9HDEU4wScVY65avXHQxKhOXuncrE5+tLRsdQxToeJHNmt9GvK/P8OkIThGylHQ1apzjoJtP1EUjO4cvK/P8Hlfn+HW1TnHQWqdUdCOU/U8a/HLyvz/DlVp+HK177Cq1TqjocqtKUrylJbFyLRbvtFqxnUJwAaMVFOHh4iy9LbCgy2syVvs0YTOumsYAAhYAAAAADNTdy7GjM9sJdhCJ9IQAbuVYp5qzjwSOhJht79FZlaMl00nY0ABVYAAAAAADyTsm+QGJUISld3u+TBPUqylK6bS5XBpFZ+sZtXfT3Db36KyTDb1disi/tbx/5AAUaAAAAAAZqbuXZmjNT2S7MQifSEAG7ldcNvforJsNTkpKTVlYpMr+3R44yAAFVwAAAAAM1PZLszRmavCSXFAlCDtHDSaTbs+Vgbcoc3CzvSbdKN+Rsmw9STkoN7LFJlaMlvWdgABCwAAAAAAHknaLa4ID0EnmJ/zQFuEs/wClTD71diskw+9XYrJv7PH6AAUaAAAAAAZn7JdjhisZDDygmnJyll/yr7ThHGSlVqZ3BUbWi821v0tqZT5axbj+p4zmgAOxxulOnJzajK2XiUKk8tnOWbncAytM63pWMacFltd97k9SFSnG/iN/YAie02jphVHxlLUeI+qeoBrkMNl5nl1S1GefVLUAYbKarRm6kpUqsoOo7yb2rZ/D2nh4QmpWTdr3fVxf8AK8Y3TZdrAAsh//2Q=="},
    {key:"bg05", label:"Spiral Notepad", file:"assets/backgrounds/bg05.jpg", thumb:"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAwICQsJCAwLCgsODQwOEh4UEhEREiUbHBYeLCcuLisnKyoxN0Y7MTRCNCorPVM+QkhKTk9OLztWXFVMW0ZNTkv/2wBDAQ0ODhIQEiQUFCRLMisyS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0v/wAARCAB+AFQDASIAAhEBAxEB/8QAGgABAAIDAQAAAAAAAAAAAAAAAAQFAQIDBv/EADUQAAIBAgQDBQYEBwAAAAAAAAABAwIRBBIhMQU0chMUYZGxJEFRUnGBMkNT0SIzQmKhwfH/xAAZAQEAAwEBAAAAAAAAAAAAAAAAAQIDBAX/xAAdEQEAAgIDAQEAAAAAAAAAAAAAAQIRMQMSIRMy/9oADAMBAAIRAxEAPwD1gSb10S8XY74KGieZ0yNqlK+m7JywEF0nmya3vXsd1+WKzhnFcqvLa+ZqmztqMrvZtLW2rLZcPhc7pcdTjtdPMzZcPi7w1VFeO108z3MvvK/WFRkt+N5dbbXMZbXzO1nbRXLnuETxFSqhvHa6bb/cdwi7xlcC7O193uR9zrCmy2vdpJO1xleZptK273Lmrh8TnSUKcW71e/n9DE/D4lVR2cLaqdqv4n+5P3OsKd06qzvdXvsHS0k3s9nfct8RgIY6U446nfRrM9jTF8Noow9VcTqToTqyt3XiWrz5nEomvirAB0s0nhzti6U9qtGXfY0+PmUeC0xcfUvU9AcPN+mldNaKFRtfzNgDFYAAAAADlinbDSt+6h+h1I+P5KfoZMbHnwAemxScJpi4+pepflFhl7XF1L1L04OX2WldAAMlgAAAAAI/EOSn6GSCPxDkpuhkxsefBmwPTYpkC9rh+pdlNCva4fqXJ599tK6AAZrAAAAAAR+IclN0MkEfiHJTdDJjYobA3sD0MsUyJe2Q/Utyqi5yH7lqcNmldAAKLAAAAAAR8fyc3QyQcMbyk3QyY2KawN7A6uzFIh52D7+halVDzsP39C1OazSugAFVgAAAAAOOM5WbofobySxxK8ldNC/udjhNiYJcPKqJaKnlasncZMK+wNqWmkDbLJ0w/PReFLLQq8Ppj4+lloZ2XroABVYAAEPFTS94ogidNDrV87VzV4aVK6xk2ZeFNvIcTToUU63jr1+jJa1WmzKzCyHDDRRR2sq7aZvWqr3v4L4IhYrE0KVumldrUsuit9vBFhVDRNRXHKnlVV97eJD4pFS4nLGvwPWr3u//AAVmKz7BPrMdLVOru3q2DdbA2jxzz77LFbcOIils2lo7EtcQw/vra+tLNDDoT9yKdona0Ww69/w36q8mZ79hn+bSR3HT8q8jDio+VeROIO6T33D/AKtIeOwy/NpIjho+VeRjs6V/SvIYhPZ3xOKw0sFcfaq9S00e5Dix1bippqrUWVW0odVT/wBL/J1yr4CyHWJO6HPPVJV/Mkqo+DSpu/GxypjpkrpWW93rcsLL4CxeMRGIgm8gMgKP/9k="},
    {key:"bg06", label:"Pink Hearts Lined", file:"assets/backgrounds/bg06.jpg", thumb:"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAwICQsJCAwLCgsODQwOEh4UEhEREiUbHBYeLCcuLisnKyoxN0Y7MTRCNCorPVM+QkhKTk9OLztWXFVMW0ZNTkv/2wBDAQ0ODhIQEiQUFCRLMisyS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0v/wAARCAB3AFQDASIAAhEBAxEB/8QAGgABAQADAQEAAAAAAAAAAAAAAAQBAwUCBv/EADAQAAIBAgQEBQMDBQAAAAAAAAABAgMRBDGBkRIhIkETFDRRYQUyU3GhoiNCUmKx/8QAGQEBAAMBAQAAAAAAAAAAAAAAAAEDBAUC/8QAJxEAAgIBAgUEAwEAAAAAAAAAAAECAxESMSEyM1HwBBNBcSIjgaH/2gAMAwEAAhEDEQA/APuKlanStxySbyRroYqFaTik4tc+fsecXhXWkpwaTSs0yn6d9KnGPi1JKMnklz5F8pNPjsRXT6d0as5l2MtJWs7gup4KMG3K1RPta1jy8Ddtqdl7WyJjNLg2Z7K3J5isEYLPIP8AJ/EeQf5P4k+5Eq9mfYjBZ5B/k/iZeBvb+ouX+pDtXwWw9PnmeCWlBSqRUumN+bZ7eGk5S8JxlFd7lHk3/n+xprU3QhKcKt78pJHhWNsulRWo/jxJwYWSBoOeeZu1uyOjhFK0HCrxwceqLd+F/Bzqnbv8F+F8NzpdEqdRR9rKRns3OlQv1+ef0sHMbjcqJHMczG43AM8zEU03d3u+/YbjcAKL6rybv+xy8ThHh4OcpxccvY6u5H9VpRrYOUZX5NNMF1UmpJdyKP2g80aapU1CN2l7g2LY5NjTm2hPNdvk6WG8VeEpxjKLj0yS5x5HNqdr5F+DULwdKr/b1wbKLNzfR0kWPUxuZ3G5USY3G5ncbgGNxuNxuANyfH+lloU7k2P9LLQHuHMiBZIBZIG05J4nmrZnQw8k50VUpuM1HoknyfI59Tt2+TpYVVUqfWp03HWJns3OlR01559FL1G43G5USNzG5nRjRgGNxuNGNHuANyfH+lloU6Mmx/pZA9w5kQLJALIG05J4qdv+F+EVJzg4Nwmo9UbW4iCeatmdHDuV6KqU0+nomu3LuZ7NzpUdNef4VbjcbjR7lRI0Y0Y0e40e4A0Y0Y0e40e4A3Jsf6WWhTo9ybH+lloD3DmRAskAskDack8VO18jo4RO0HTq8cOHqi3fhfwc6p27/BfhXTc6V4Sp1FHlyspIz2bnSo6S88+yzcaPcDR7lRI0e40e40e40e4A0e40e40e40e4A0ZPj/Sy0KNHuacTBVKfBKXCm+bYPUHiSZzVkgZkkpNRd0nyfuDajltcTXU7c7fJfg6kp8CThVglbijnB2yZLDDPFKVO3TbmzzHxsAnQw0ILvKcnxNv9DPZudP0q114+TrtpZhWaujTTqwrRvxLlFOXwe51I07ybtG9nfIqJ0vY2aMaPc0+bofkQ83Q/IgNMuxu0e40e5p83Q/IjPm6H5EBpl2NujI8cpZSbVNr37mrHfV4YecY04eI2rt3skRQ+p1sS50qsY8MldWVrA0V0Wc+OBu/TIBZA2I4cnltmyjWlRk3HusmeasnVnxTs3+gA0rOT1rkljIpTlSlxQsm8+WZmrUlW+93SyVuQA0rca5Yxk18C9kOBeyABGqXccC9kbaFV0OLhjF8XuAGkyVOS+Sath4VvuVn7oxh8NCinbqb7sAjSs5Pfv26NGrgbwASUn//Z"},
    {key:"bg07", label:"Blue Ribbon Frame", file:"assets/backgrounds/bg07.jpg", thumb:"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAwICQsJCAwLCgsODQwOEh4UEhEREiUbHBYeLCcuLisnKyoxN0Y7MTRCNCorPVM+QkhKTk9OLztWXFVMW0ZNTkv/2wBDAQ0ODhIQEiQUFCRLMisyS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0v/wAARCAB3AFQDASIAAhEBAxEB/8QAGgABAQADAQEAAAAAAAAAAAAAAAQCAwUBB//EADMQAAICAQICBggHAQEAAAAAAAECAAMRBBIhMRMzQVFhciIyQ3FzgaHBBRQjU5Hh8ELx/8QAFwEAAwEAAAAAAAAAAAAAAAAAAAECA//EABkRAQEBAQEBAAAAAAAAAAAAAAABMRECEv/aAAwDAQACEQMRAD8A+iB1rFDucKKjPaBcooZ6WVawQeOTx8J4iBn0meSrunRl28JzaTYy0CqpiayxJb0Rxma06isV7lRlRyx2E5+sviL6HHGtvsXatagEWF/1ARxzw/wnrW6lQoenYGs37uf04TqJQiWPYBl3PFjxPumZAYEEAg9hj+oXHMQ22VuDTZvawNxTaMfOZXC8LcWobDsD6JDYx4S+qsVJtUnbngD2eEzi+j45zsbvzHQozh9uDjA4e+eO5Y6ncjVt0Y4NOlI9eduSR6LIVB7jz+0co4k1/Wr5BEa/rV8giXMTWw526dV4F69oPdntnSUBVAHIDEgq9bT/AAiRLaX6WpHxjcoMz9KjOIiSZERAEREASXWkNW6dqru+0qkevXC7xzIKHxGM/aOaVSa/rV8giNf1q+QRNZia28cacLwLV7c92TznRVQqhVGABgCQ1cTp/hGb9Fa1unDPxOSM98z9KiiIiSZERAEREASPVOH6ZP20+plkj1aBTaw9pUc/I/3H50qk1/XL5BEa/rV8giazE1uViq0sOYpYy2msVVIi8lGJJVxbT/CM3aF2alVY5IUYPh/hM6qKYiJJkREAREQBIdRZvbUjsrTA+fE/aXSLVIENzD2lf1H/AL9JXnSqXX9avkERr+tXyCJpMTW+shTQTyFLGVaSroqFU+tjJkiLuFK8s0sJZprhfSrjnyI7jM6qNsREkyIiAIiIAkWsYObFHs6yT7zylsk1qhFscDjYu0+8co5pVHr+tXyCI1/Wr5BE1mJqin1tP8IzdoEK0AkY3YOPlJslUqI5ihp0VwQCOXZiZ1UexESTIiIAiIgCRa1g+5B7NCze88B95bIdRUa/zL5yLFyPlH50qm1/Wr5BEa/rl8giazE1RT62n+EZt/DlZdKoY5H/ADnsEnDbEqbupYzorgAAcuyZ1UexPM5nskyJNZrEpuNdvorjIYHP8902tfUqBzYu08jnnHyhsiR1/iFb7mIYIGwCFJ/mVI62LuRgR4QssHWUk1oYhjj0FrPHvJ/31m4amk2dGLULcsZmn8Ss26faD6TnAHh2/SE0qj1/Wr5BEa/rV8giazE1RVxNAP7RmGnqGNOpZ2RlOVLHHCIkGxqoTbpima2Ytlk4H+5mrXWCrpLiVdypCjbkDxiIw1NpketAAF/XI4CY/k1A3Gxywu2cTwx7oiHaONq19FVaoxwuHIYHZ2T3UVIx1LFfSDqM5x3REAytRUXVqqgKAuABwmNlSI2p2rj9MeMRFA1a/rV8giIlzCr/2Q=="},
    {key:"bg08", label:"Stars & Clouds", file:"assets/backgrounds/bg08.jpg", thumb:"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAwICQsJCAwLCgsODQwOEh4UEhEREiUbHBYeLCcuLisnKyoxN0Y7MTRCNCorPVM+QkhKTk9OLztWXFVMW0ZNTkv/2wBDAQ0ODhIQEiQUFCRLMisyS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0v/wAARCACVAFQDASIAAhEBAxEB/8QAGQABAAMBAQAAAAAAAAAAAAAAAAECAwQH/8QAKhAAAgIBAwMEAQQDAAAAAAAAAAECEQMSITEEE0EiMlFhcQUUUqFCsdH/xAAYAQEBAQEBAAAAAAAAAAAAAAAAAQIDBP/EAB4RAQEBAAMAAwEBAAAAAAAAAAABEQIhMQMSQSJR/9oADAMBAAIRAxEAPwD07L1HbyqGlv8ArfwblXCMnbim6rcsY4zlLftVufgADaAAArNScXoaUvszy54YVFZHcn4SsdTklCMVBpSk6v4KRqKc29cqq3yWce9S38ijy96U6dVtFP8A2XxYnGOpe5cfZlCDk3Jpbs6cfso1evGZ36o88o7S03+QaNRXNAnS9tAVyKTj6Gk/slGN7xpIAKAAA48/S5J53lhkXik0FizSaWmMV5d2dgNfas/WOHLleFVoetrZeB3M8GtSUk/47Mt+2zvLKbyRe+1rwaOOZqnGCfzZrpntWOaGVKWlvxvEEft8yvTNK93Ta3BOl7dRJydPilFWnTXx5+jWGSeqskUk+KfBmxqVsCE0+Gn+CSKAAAAABXJDXFxtq/gTnHGrlxdFjNy7xXztEVpild15BINIyw7Jrclxi03JcfJzLrYt3oko/wAnwad3Hmx+5NG7LGJZVlKHpcKTbrbybnG+nxv1RW/hnVF2lvb8kqzVgAZaAABDV8kghtRVt0kBIITTVp2gBzKMtKi8TT+nsZ4cOWObU8UdMn6rrY6c+XtRT0tt8F4SU4qUeH9CfJLbx/U+n6duN3RKSXCokBQAAAAAIlFSi01aZIFmiIxUUkuECQMwVnjjkVTin+SUqSS8EgmTdAAFAAAACuSaxwlJ70gJbSVvY5p5nkc1B7Q228sSis1SypaUvbdoxx405ylFNJ8bm5IxbWmOElHdu/pg1g6VME1cbgh8NJ7kQUlFKbt/Jje8aWABQAAAw6vFkyxisc1Gnun5NwWXEs2Y41DN7dCvy72JclgVz9Nf2dZx5+nz5M7kpxcP8U72NS76zZniq6rI0msDp77sGyjkiq7af2mBsTL/AK20R16/NUWMOqUnFKO6bppLktg1ODc3K74fg885/wB3jjtnWtQAdWQAAAZyywje9tc0MeaM9lab8MYmtAAFAABEmoptukt2zl70smPuJ0n7Y/8ASrxTnBzy5G7W8b2oxwuWmlLZcKjc4ud5XW+CM/D0t7m3fSdOEtuWlshgfNrdeSM09EHKronta8jWUoxjqbSj8nLn6uLxPstttpXXC+SYxlkhBT0uMXdLyU6mUdoKPPJZJqcrcTUZRUYtJL4ZtjxpxafHgwhjrT6VS+EdOJ3DbcUimrJj9U52lyq2LrPicqU1ZOlPlEeiScWk0Tpe2jdAyxu8cd29tvwDLTnzS1wS4tl8MElSWwB0vjnPWsYqLteTk/Uc0oZIwXtatr5ALw75J8nXHprilqjGXFoiS1Tt8gGb61PGuN7F70gEVL9WNq6s5p9LBpq2k+UnyAJcLJfVVlliWhbpcWADWRnX/9k="},
    {key:"bg09", label:"Lakeside View", file:"assets/backgrounds/bg09.jpg", thumb:"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAwICQsJCAwLCgsODQwOEh4UEhEREiUbHBYeLCcuLisnKyoxN0Y7MTRCNCorPVM+QkhKTk9OLztWXFVMW0ZNTkv/2wBDAQ0ODhIQEiQUFCRLMisyS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0v/wAARCAB+AFQDASIAAhEBAxEB/8QAGgAAAgMBAQAAAAAAAAAAAAAAAAECAwQFBv/EADAQAAIBAwIDBgUEAwAAAAAAAAABAgMEERIhFDFBBRNRUoGRIjNhcaEVMkLwI3Kx/8QAGQEAAwEBAQAAAAAAAAAAAAAAAAIDAQQF/8QAHhEAAgICAwEBAAAAAAAAAAAAAAECEQMSEyFBMVH/2gAMAwEAAhEDEQA/APTYHglgeDuPJorwGCzSGkLCivAsFukNIWFFeCMpRg4qUktTws9S7SY716oypVqFTu3ynHfH1FlKkakaMBgxOc1Vskp6lqcW1/L+o6Cw84aeOf0CM7CiOAJ4AazKJ4NlpQpzpZlFN5Zn0NLLTNtmv8Pqycn0VguyXDUvIhcNS8iLgEsrSKeGo+RBw1HyIuALCkU8NR8iI1bWEqbVPEJ9JNZx6GgAsKRyoWlbvI8RSo1dD1RlB4l7HOsWqMrmVWWO8uXGOer5f37Hdu7ChdtSqRanHlOLw0cmvZYv6Sc5ThTlKpmXNy25/wDRUmmLNKjRpAngC5KjVNKSwi+3p6aXPqzJlmu2+V6si00i6abLMAAaX4AMAgAABkowkyK5k1Mx34akvSLTTwznVop1pNrdN4Ok3nmjDWx3ktuo0WJNFOAJ4AeyVEsM1W3yvUxcRRTSdWGXy3Ntu1ox1yybdlYrstDLABSggGBtmUIMAMLChGWpFd5LL6msyVfmS+4IxkNP1AWqPivcBrEo8PKrPOWnj8nX7KuKrt1LdS1vruYv0vdcvY6/ZvZyhb46amQePoWE+y+N1VT2nLl4kle19vjlsT4GAcHEXjZXYsh2hVb6exPjqv09iEbaEehJ0Y+A+j/TNgle1XywvsiLvKzX7n6Il3EWJ28cbBo/0NimpcVZJKUpM4te6rxuqrU5r4mtnzR3ZWqaOLc9nt3FV7byZnG2LOdGZV6i6SAnwEvAA4SfIdRpG6z+T6swzemEpY5Js19n1I1bSE1ynujplJULBOzVki2MRPZFqYCyPAYM2QasWRphgkombo1QYkzn1vnT/wBjpqDMNSlJ1p4XU2ORIyeJtGfH0A0q2m1yA3mQnBIzXMKyp5oKMpJ7xl/JeBVZfBOg3qhRoU6kpKXOP39zpu372EofEsrGYvDXqc+rbzpUq1Cd7TqylBxUZYU/Fddzllks6FhaOpD44xlHdSWUWKm2ZrXtCjxDtoQk1ClGUZJ809jbG5S5U36yEeVL6zojisSoy8Bq3ZPiX5cCdbPOL9ybzLwqsA1QS549yShBfX7Fffry/kOIXl/IvKMsSRcseX8mSq33ksYjv0RbxC8v5KZy1Sb8WTlkb9KRgl4Q0vzP3AeQJ2ylIj8Uv3Sb9Si4sLa6adehCbXJvZ+5pALZjimqaM9Kyp0KqqUEo5jplFttYznY1JCAPoJJfCWRNkchkw0eRCyJsDR5E2LIgAeQAAA//9k="},
    {key:"bg10", label:"Vintage Scroll", file:"assets/backgrounds/bg10.jpg", thumb:"data:image/jpeg;base64,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"},
    {key:"bg11", label:"Floral Collage", file:"assets/backgrounds/bg11.jpg", thumb:"data:image/jpeg;base64,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"},
    {key:"bg12", label:"Beach Waves", file:"assets/backgrounds/bg12.jpg", thumb:"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAwICQsJCAwLCgsODQwOEh4UEhEREiUbHBYeLCcuLisnKyoxN0Y7MTRCNCorPVM+QkhKTk9OLztWXFVMW0ZNTkv/2wBDAQ0ODhIQEiQUFCRLMisyS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0v/wAARCACVAFQDASIAAhEBAxEB/8QAGQAAAwEBAQAAAAAAAAAAAAAAAAECAwQH/8QAKhAAAgIBAwQBAwQDAAAAAAAAAAECESEDEjEEQVFhEyJxgTKRobEjQsH/xAAYAQADAQEAAAAAAAAAAAAAAAAAAQIDBP/EAB8RAAMBAQACAwEBAAAAAAAAAAABEQISIUEDMVEiYf/aAAwDAQACEQMRAD8A9BbbbbdtgAHJDppxdT1OpDV+OCSxzVtl9PrTnJKbTtWV1PT/ACSUkrfDV1+StLR2W5O5vuKGvWeP9NRDEUY0JSSTbGvYmrWSN0VK28/cXgtMz1dyn9WU7p+CtOLUk2r/AOF3v4W6slI2XytY5hk/juujSM5xVRk0gJAxrNIgQwAozCgGADJFRVCoAJaI6RYnF/TPKvl2a0RLTe9Tg6kv5Ja9lJnD1GnOEn8jbaO3pZOfTwbWUqLlJTVaunzjjhfcuMIxVRVR7LwNT0ab3cxoVAWBUMaQNCQwAYUCKoBk0FF0FABFDSHQwAVCKJYCYWAgL5I6EhggCCo0MQWKD6KGTYEwqlCEAhgJgwjFze1GmURp+jXT004JtO2BsrrAG0M6caGArMxjAW5BYDGAWAQKFhYFw0ZTjd1fGAWQrIScnUVbN4acoxxmT5yPTUdJbZfqecIzT/y7k6t49DsFC/n24UG/NYQEqey4pKkwFf8ARwUdB4c+PCLjBRTctNV9hubacYu15Msx8r7Mb1+CSKlqJ8acS6Ukvk+hPsZttq5NPwS15VCrBvJT0oydQn+4noaiV4/cV4qlzdlQk44Wb5jXIr+jSv0VDThFXOm+bo0+SGFclnwYOk7i8eAkvdjeghqtS9VOlXGeTFyeUu/ZFLi5d/HLLWml9VOPpsEmwsJjoyavgBS3N3TQF8IxfytMIwlqcOl2s0qGlHL3SJ1dS8R4MhJfhWtrP2btwkuVnzgynGSee5L5NIPfFacvw74LjMXvO/BmuSqp4tUK0pOLXD7g3/IPKZOdvDFebY00svP5JayNRSdt3XbyZ8w3768ot6lZpbv6M5Sc3cnbHFbpPHPgHHaUsk6+SfQqvtQG0YR2q+WBUQv7MgfCdE7lXsW63ZSUMNOusulWHYEr08jxddwEaSvVjarevfJk7jaapoadO7qvBevp/I9+nlrkDRTSvsyTspX3M8p1VNFqV8hyiXp/RpVR+49ODlJN4j77hCL1Fl1EJ6ia2R48iKSS/plScZO1GL9tgY2A4T3TnUnyNS7k7cLKT8C/T3t/0bcmdL3FbjF+gukHAU3UzSGpm+TkTbZanXBLyNM7FKElWpG35Q4LSjbTf5OZaiH8mCOWWvkfs31JTkqkns9cGVpYIjq/6vKZNpzUW8dmNZFp9eTTdHywMt1t7boCuSSdWHxasop3tZCADVeUTrw4CdDm26vwADJG1tjfdk2AAhsvSq5WrW1uiX6sAJ9j9E2aRedwAJjR0dP0vy6e56jWawAAYa06dWcZaXg//9k="},
    {key:"bg13", label:"Mountain Scrapbook", file:"assets/backgrounds/bg13.jpg", thumb:"data:image/jpeg;base64,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"},
    {key:"bg14", label:"Vintage Travel", file:"assets/backgrounds/bg14.jpg", thumb:"data:image/jpeg;base64,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"},
    {key:"bg15", label:"Adventure Map", file:"assets/backgrounds/bg15.jpg", thumb:"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAwICQsJCAwLCgsODQwOEh4UEhEREiUbHBYeLCcuLisnKyoxN0Y7MTRCNCorPVM+QkhKTk9OLztWXFVMW0ZNTkv/2wBDAQ0ODhIQEiQUFCRLMisyS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0v/wAARCABwAFQDASIAAhEBAxEB/8QAGgAAAwEBAQEAAAAAAAAAAAAAAAIDBAEFBv/EACsQAAICAQMCBgICAwEAAAAAAAECABEDEiExQVEEImFxgZETMlLwI0Kh0f/EABkBAAMBAQEAAAAAAAAAAAAAAAABAgMEBf/EABgRAQEBAQEAAAAAAAAAAAAAAAABEQIh/9oADAMBAAIRAxEAPwD68tTBV2PeXwszKQQTXBO0FR1S0Cl73udzF9A/Hd307TznWYAnk/UCAyEJdnpxq+ZPCuUhtYb0mpMXlFijKnpUmBSmEllIremNn5lcLHItkAEGtoBTRFEjhlO/1GwomPGFQihLkTWHIE/MdS35u3obr/k2YhqwKSf9buOwxtyure7AjEI6sCQQRRhINZlxv5tXmBOzSGZPxizNtoihQRQ2qQyYkL6iTR5BuTYcrJouiLo78QlyUXYMKHrCRitGBjptuesUPbUCNzXedGyqOSW4mlEAIA/bv1jk0qzE51oVd9Zqx4jpGtjfXeUCgcxhLnKbQqget9TGIHJAPxOqD1nammJKP7tOFQeQPqUqLXPMMCWQNQCAX7SVZGPmAAF/M16ZNxFYcrDkRtZpyBCUbncUYTLFs+ksCFNtU0eFxshJPUdTxM+DIAGZunabcGVcq2t/Iow5FU57Sij2iE1HQzWIN9Q47Tlwv+1KS6PiFc8Tl/2oXz/5AOFvaZ/E5fxrt+x4mg1M+VQwphcmqiav+RbrfgwiEqNgQBCZKSwqFP63f1NmIVwK9p5alxlU2a1VyeZ6iQ5PpaowG0RfiUHxNYzFToEPqH1KIVCuYfUD8QBTM+XqDNB+Jkz6jkFbLRs31kdKjOcaigLoesJPN4jRkKhbr1hMvGnqnhcTresiug7TYnEh5Vpm6bXKK41AA2T2MqeJq6ygkxwIwM0iDzsUH3jSiFxSeZ0xD1hQ4x9Zl8QToaruukrlZtJ03dbTCHyh6yluOJl1VyI6T/HJCVOo8mvQQmeNNOG10G3A6S2JEWiALmRU813LLl09RfSOUrG8EbcQsX0klewN50NvNNZ4vY9IBvaSDQv1laMULe0Un2iMwHLSLZXDkKDpAuyIrRh8rAHbc9hM7UAP5dx1guRsmNuB2I7xFUjc95nauQrPv+t+0Ij6lagdvaElR3ahtwekgcjBwBYA6SwG11cUoCbobd4gojkkUaHJl1ZiQAdyeZmA0jvKYH84BveVKVjbsqm+kzL4oD9sbLfqDHBIx6Sb2q5mTBkBHmQDk1e5qXamRtxsuj8hI3F2IuVwF2O5G1xMI0YwpA27Qy+cVdb7w3wsQasaZMi/see1yS5SzV0rtLm0SuTfMk/+Q3dCvkzOrhSxB4JhCgNhCBv/2Q=="},
    {key:"bg16", label:"Blue Gingham Bow", file:"assets/backgrounds/bg16.jpg", thumb:"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAwICQsJCAwLCgsODQwOEh4UEhEREiUbHBYeLCcuLisnKyoxN0Y7MTRCNCorPVM+QkhKTk9OLztWXFVMW0ZNTkv/2wBDAQ0ODhIQEiQUFCRLMisyS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0v/wAARCACVAFQDASIAAhEBAxEB/8QAGwABAQEBAQEBAQAAAAAAAAAAAAQCAQUDBgf/xAArEAACAgECBgEEAgMBAAAAAAABAgADEQQSEyEiMUFRBRQjYXGh8DIzsdH/xAAYAQEBAQEBAAAAAAAAAAAAAAAAAgMEAf/EABwRAQEAAgMBAQAAAAAAAAAAAAABAjEREiFhUf/aAAwDAQACEQMRAD8A/oC69fpiMrmfLW/KDQ6AvcRXxHCKcc8n1/M87UitdPYWcqVGNpbbk9v2f1PF0aav5DRW6K4Kv04F9W5dxdQ3Yg+gROrpi5+9e3rL1+OWjX0MNqHhuqnkynvk+T5ntaW9zUxCZB7cj6n5pvjHtK1/Ka016VyCq6ZQig+z/wCz9hRSlFS1152gADn4AxIzskVhLal0t1mH+3/BnNLdZub7f8GWpWEzjPOErWsnGefuZ3Kfi5Ki011nEb7f8GKL7OO/2/fg+5alaoSRnnC1qrFhnJi5Q61FXe/1Lfb9+4W9/qj9v37lorUOWGcmZdNpLrktHaHFQ33vxW+3/wBicvut4rdP8GJrJ4zt9Tn4yjW6ujV3q4and0g4VvyR75YmNPVUfk9NqKypLF8geQRPT0ztbVsZdobIzPjovh6tFbS9TtiusqQ3PceXV/fxJuXHPKuvPHDzfnqX0dJ2qW0x5Agf6z6/U9n43TW6TTLTbqDft/xYrggepV3nZFztnC5jJeSIiQoiIgJixiqEgZM3M2MVUkDP4gebdqH4rdH/AGJ27UNxW6InRJ5phb9UaOyxlAZcDJ8SuSaO12UArgEnxK5jltrjoiIkqIiICIiAmbGKoSoyZqYsYqhIGTA86663it0efRiLdQ/Fbo8/mJ0SeaYW/VOjtdlAKYGTK5Jo3sKgMuBk+JXMcttcdERElRERAREQEy7FVJAyRNTFhKoSoyYHnW6huI3R5iLbreI3R59GJ0SMLVOjtdlAZcAk+JXJNHY7KAyYGT4lcxy21x0RESVEREBERATNjFUJAyZqZsYqpIGTA8y2+ziN0efRidsvfiN9vz+YnRJ8Yc/VOja0qNw5ZOeUrkmje0qAy4GT4lcxy21x0RESVEREBERATNhYISoyZqZsJCEqMmB5lll/Ebp8+oiy27iN0efUTojBVpGtKgMuBk+JXJNHxsDd2yc9pXMcttcdERElRERAREQEy5IUlRkzUxZu2Hb/AJQPOssu3t0efUTjm/e2R59CJ0MVWjN2BvHLJz2lck0fG29YGMnMrmOW2mOiIiSoiIgIiICZs3BDt7zUy+7adveB5jtdvbK+fUTrG7c2QO8Tdko0a2gDc2Rk55yuQ0i9aWIbmM+Zut9S1TMSuRn1M8pzVS8RZEjqfUtWxJXI7dopfUsjEkZHbtPOr3ssnJJS+pZWLEZHbtOUPqXDbiOX6jqdlk7IqH1L7txBx+oofUuW3EHH6jqdlkzZuKHb3ktD6l2YMQcfqKX1LuwYjA7do6nZORdubJ8+4nSLtzbj59xNKiFdr/Tv1HzFNr8B+o+YiVxHnJRa/BfqP9Eae1+G/Uf6IiLJ68ld01r7H6jOaW2za/UYiLJ69lvjultsw3UZzS22ZfqPiIiyevJb4aW2zc/UY011m9+oxEWT0lvjAsYlsnzERJu1S+P/2Q=="},
    {key:"bg17", label:"Pink Boho Card", file:"assets/backgrounds/bg17.jpg", thumb:"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAwICQsJCAwLCgsODQwOEh4UEhEREiUbHBYeLCcuLisnKyoxN0Y7MTRCNCorPVM+QkhKTk9OLztWXFVMW0ZNTkv/2wBDAQ0ODhIQEiQUFCRLMisyS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0v/wAARCACVAFQDASIAAhEBAxEB/8QAGgAAAgMBAQAAAAAAAAAAAAAAAAECBAYFA//EADoQAAEDAQUEBQoGAwEAAAAAAAEAAhEDBAUSITFBUXKxEzVxgcEUFSIjJTJCYZHhMzRSYpLRQ0RUgv/EABkBAAMBAQEAAAAAAAAAAAAAAAABAgQDBf/EACARAQACAQMFAQAAAAAAAAAAAAABAhEDEjITFDFBYVH/2gAMAwEAAhEDEQA/ALxJhCeEuGondOf0VmvZG2NrTaKoY8sL2tjWNk781OXqZiFVw2ZSNUpyV+jZKVRhJtVNlMZNc46nbA3JGx2Wcrexx/awlLI3QoTG5GIrsC4sQBFoERPuFPzCf+gfw+6Mwnq0/XIDpTkA6rreYjMeUD+H3TdcUf7B/h90ZgurT9cc71E5OGi7fmMRHlE/+fuqlvuupZWdKHh7BrlBCcTBxqVmcRKkwSEJAfNCa3pSBc5rRB9IZOOXepeQOvG830m1aYp0hOOnTIZOhgTnulQosD6jGmYcQD6REiV0qLmMvGlVaxzWPd0VCDDcIyOW/LLtUSi9tsZhbs91ssrWto9E6NtSkHE94V2kH9H6xtNrwT+HpGxTnuQFLFa028gGfFEoAzThCShNMZJoCMKpew9n1uwcwrc5qpe3V1cfIcwiFU5QzEoSKF0ek9qLcVVgGpcBktAanQ2qhQY1gpNbBJ1B0bHbn9Fn6Eisw7nDmtBa6VGpbbMXvw1gSWgavA2dymzLr+luJUgFHYpDLVSynEITQgEmNEiEwkEXCVUvTq+vw+IVyc1UvTq+vw+IThVOUMucyhInP7IXR6L2on1jOMc13rXTqi22d9NuJpdhcYzaNSZ2SBB7FnqBPTM4xzWhtdd1K22cdIWtkgsH+QnLXZGqmzLr+YXIzUglqpNUswCcpwiEAkpTKikYlVb0/IV+HxVoFVL16vr/ACb4pwqnKGXdqUJGSULo3vSiYr0+Mc1pLYWG0Wdj6OP0y7FOVOBqeXas1RHrWcQ5rS26z9NVoEVRTc1+h+ITMAdoCmzNr+YWuak1RlTbqpZkkFCEAlEplIICJMKreZm7rRw+KtlVL0Hs60GPh8UQqvKGWPYhIzKF0ei9qf4rIHxDmtBeUttNmqdHj9PC064HHImOGVn6QPTM4hzWktlofRr0Q17WsJJeDq4aAD5yQpsy6/mFmIU29qjOxSapZk0kSgoAIlIJhIhAR2qrevV1o4fFWiM1VvQez7RwIhVOUMqROcoTmELo9F60sqrD+4c1o7a2z1KlCnXMONWaYGRJGcLOUx6xvEOa0N4UqzqlJ9FuI48Lt4B2zsykd6mzLr+lxSGqgMtVIKWZOUSoylOaAmkhEpGRVW8+r7Rl8CtKtef5CvwJwdeUMoYnRClO9C6PRelOTUaP3Dmu5eVToatncXODWvkAGA46QflnPcuLTBFRvEOa79rqAPosNIVGuqS4u0YB8X15hTZl1/S4EgkJCYJ2qWZJIhKU5QAMkJSiUASV4XlBu+vH6F7KveOVhr8BQqvKGYhCNqF0ejl6jJ4K7VqZRtbKDm1msOMEHftIjuXEcRO1KYMImMuV6b2qnagOjUhZXFG0/VIuM7Sp2uXb/WsxDeliG9ZOT8/qkXOhG0dD61uIb0Yx+ofVZMOkoxZo2n2/1rA8T7wVS9bQxtjqMxAueIAlZ6YMpTJRtOujETnJkZ6IQChU0J/2lGZQhMiPYo/0hCAZ91ByhCEAwBiCHAA6IQgyAlMCChCCEIQhAf/Z"},
    {key:"bg18", label:"Travel Lined Paper", file:"assets/backgrounds/bg18.jpg", thumb:"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAwICQsJCAwLCgsODQwOEh4UEhEREiUbHBYeLCcuLisnKyoxN0Y7MTRCNCorPVM+QkhKTk9OLztWXFVMW0ZNTkv/2wBDAQ0ODhIQEiQUFCRLMisyS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0v/wAARCACVAFQDASIAAhEBAxEB/8QAGwABAQEAAwEBAAAAAAAAAAAAAAIBAwQFBgf/xAAvEAABAwIFAwMEAgIDAAAAAAABAAIRUpEDIlOhsRJRYQQFIRMxQWIyQjSBY3HB/8QAFgEBAQEAAAAAAAAAAAAAAAAAAAEC/8QAGxEBAQEAAgMAAAAAAAAAAAAAAAERAhIhMUH/2gAMAwEAAhEDEQA/AP1PN4TN4U5ezt0y9nWKCs3hM3hTl7OsUy9nboKzeEzeFxYzulktBmfzK6WLjer+r04YHR0H5/b8KWyLJa5/We4YfonMGMWsDv7OkC8KML3b0+K4gPZ8fkGQV0nN9biN6MXGwII/ILur/X2Xn+5e04gf9T0WHhgdLfhkhxI+/gz8JOUpeNj6PC9dg42K/CZi4Zfhx1CftPyLrmc7p/kWD4n5K+R9J7D64M/yG4T3mX4ckgx9vkfmF6jvb/Vu9OMF7SWtcD0jElrgP6kkTBWrnxJ78vczfqi4A3FIHU4A9gwn/wBRQc8OqFkh1QsphunsEhunsEFQ6oWSHVCymG6ewWw3T2CCcYH6bpg/H2heY8vxMRv0/qkNBBAH8v8Aa9WBp7BIGnsFLNalx4w9rfiYbGHCysBA63/j/oLvYHosRjWtc9oa0QAB9l24bp7BIGnsFOsO1cbfT9JBLySPC5Yd3FlkDT2CQNPYLTO62HdxZFkDT2CIEjU4SRqcJmpF0zUi6BI1OEkanCfNIunzSLoEjU4SRqcJ80i6ZqRdAkanCSNThM1IunzSLoEjU4SRqcJmpF0zUi6BP/JwifNIuiDJbU65SW1Ouqz+Ez+EEy2p10ltRuqz+Ez+EEy2o3SW1G6rP4TP4QTLajdJbU65VZ/1TP8AqgmW1OuktqddVn/VM/hBMtqN0VZ/CIJy9nWKZezrFVDqhZIdULIJy9nWKZezrFVDqhZIdULIJy9nbpl7OsVUOqFkh1QsgnL2dumXs6xVQ6oWSHVCyCcvZ1imXs6xVQ6oWSHVCyCcvZ1iiqHVCyIJgaewWwNPYJI1OEkanCBA09gkDT2CSNThJGpwgQNPYJA09gkjU4SRqcIEDT2CyBp7BbI1OEkanCBA09gkDT2CSNThJGpwgQNPYIkjU4RAl1IukupF1ktqduktqdug2XUi6S6kXWS2p26S2p26DZdSLpLqRdZLanbpLanboNl1IukupF1ktqduktqdug2XUi6S6kXWS2p26S2p26DZdSLosltTt0QVm8Jn8KYbS7dMtLt0FZ/CZ/CnLS7dMtLt0FZ/CZ/CnLS7dMtLt0FZ/CZvCnLS7dIbS7dBWfwmfwphtLt0y0u3QVn8Ipy0u3RBUOqFlkOqFkgafCQNPhAh1QskOqFkgafCQNPhAh1QskOqFkgafCQNPhAh1QskOqFkgafCQNPhBsOqFlkOqFkgafCQNPhBsOqFkWQNPhEG9JqOydJqOyIgdJqOydJqOyIgdJqOydJqOyIgdJqOydJqOyIgdJqOydJqOyIgdJqOyIiD/9k="},
    {key:"bg19", label:"Simple Bow Frame", file:"assets/backgrounds/bg19.jpg", thumb:"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAwICQsJCAwLCgsODQwOEh4UEhEREiUbHBYeLCcuLisnKyoxN0Y7MTRCNCorPVM+QkhKTk9OLztWXFVMW0ZNTkv/2wBDAQ0ODhIQEiQUFCRLMisyS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0v/wAARCACVAFQDASIAAhEBAxEB/8QAGQABAQEBAQEAAAAAAAAAAAAAAAIDAQQH/8QAKRABAAIBAwMEAgEFAAAAAAAAAAECAxEzcRNRwRJSU5EEIUEFIjEygf/EABYBAQEBAAAAAAAAAAAAAAAAAAABAv/EABcRAQEBAQAAAAAAAAAAAAAAAAABETH/2gAMAwEAAhEDEQA/APqVsnptpFbW4T1Z+O/0qN23EeVqM+rPx3+jqz8d/poA8X5ee9bU0tbHXSZnXRhH9YpOlfT+/wDE2nXR7vycdL4/VfHW80/urEx/LDHSMf4mK2kTp/tHfWf21LM4jT8f8i16zM1teNf1MQ16s/Hf6Vjx0xV9NKxWvaFM2wZ9Wfjv9HVn47/TQFcrPqrEx/InDtV4ECN23EeVojdtxHla0AEEZazfHesTpNomInsRjrFK101iumn/ABYAAAACMO1XgMO1XgKEbtuI8rRG7biPK1oAIAAAAAAIw7VeAw7VeAoRu24jytEbtuI8rWgAgAAAAAAjDtV4DDtV4ChG7biPK0Ru24jytaACAAAAAACMO1XgMO1XgKEbtuI8rRG7biPK1oAIAAAAAAIw7VeAw7VeAoRu24jytEbtuI8rWgAgAAAAAAjDtV4DDtV4ChG7biPK0Ru24jytaACAAAAAACMO1XgMO1XgKEbtuI8rZTetMtvVMRrEO9bH74XEaDPrY/fB1sfvgyrrQZ9bH74Otj98GU1oM+tj98HWx++DKNBn1sfvg62P3wZR3DtV4DDtV4EorQ0jsAGkdjSOwAaR2NI7ABpHY0jsAGkdjSOwA6AD/9k="},
    {key:"bg20", label:"Travel Planner", file:"assets/backgrounds/bg20.jpg", thumb:"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAwICQsJCAwLCgsODQwOEh4UEhEREiUbHBYeLCcuLisnKyoxN0Y7MTRCNCorPVM+QkhKTk9OLztWXFVMW0ZNTkv/2wBDAQ0ODhIQEiQUFCRLMisyS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0v/wAARCAB3AFQDASIAAhEBAxEB/8QAGwAAAwEBAQEBAAAAAAAAAAAAAAIDBAEFBgf/xAAzEAABBAAEAwYEBQUAAAAAAAABAAIDEQQSITEFE1FBQlJhcZEUIjKBBhUzodEWI2Jy4f/EABgBAAMBAQAAAAAAAAAAAAAAAAABAgME/8QAIBEAAgIDAAIDAQAAAAAAAAAAAAECERIhMUFRAxMiof/aAAwDAQACEQMRAD8A/VUJJJWR1nNXsgSNd9JtFjpnm8R4y7A4oxHCSSRgMJkadBmJG3XTTqll42OVh8RDFmw0jZHOJ+oBl3Q27Oq1uxTXsObCzEHcFiphnsLMjIHRNb3XNyhRv2XpLhhdx6Fs5hdBOHNIa6gDlJBNGj0B9lP8/wCZC6SDCvf80bWNLqLs19L6fuvW5kYO4B9FxxiYaIaDodk6fsLivB5P9SQMts0EokaTbWU6qcW9R0Tn8R4XX+1iLBcCMg2aLJ3/AOr0JJY2NzNic8f4Ns9VP4yPUCCYka1yilv2P8vwaYZDLE15Y5mYXldVj2TqEOJEljlyMoX87aT86PxfsrRm0UQhCBGXFRhzgX60bb5JAFpljL6o1SmYHDdwUNbNItJEkKnJPiajknxNRRWSIySMibme4NHUp5/1T6BJi8C6dgALbBvW1CLBTQTguGcVQcCdPKlaWjGU3lVaLoXcjvC72Rkd4XeyYziE2R3hd7LmR57h9kAbkIQkIz4uQsDdSL6KIkLmEH5muFG1bFAW2wD0tQ+wFdE4Kbe6r+ibXjojIYY/piaNb7fPz8yniDYSTGxrS7eu1CFpjH0LKXsbO7xH3WovI7FjK1O3SkgR3OT5KMvxJceVMxra0DmWR+6ohRQ06GzeawycQkjmcXREQsGv8rYuOY1/1NB9QonFtadFRkk9obDy86FklVmF1doVAA0AAAAdgQmrrYOhJYxIBZqlF8UcbS58mVo3JT4nuqWY1V6dKVW1wjV7OB2HIsYhhA8wmY2GQ5WTBxHYEga0CgxgH+oXR8pJAAJ3IA1RlIf5KjDtPfKq5oJ3pZXEnUm002sh+yTbHBKToo98UZp8rWmromtEvPw9Xz2V1zBScA+szWurQW0GkNY1rQ0MbQFAZQlbNPrRVs8DzTZ2E3VBwVQwdVloA3lbe95QukkmydUWw+s2oQhMzIYnuqNK2J7qkEyH0KRSZBQIQp5v1D9khTTfqH7KWa/F0VC4hSbnbSSyxwtDpXhjSQAXaapxuvln/h7iE72OlxEQykktMj3B++pHYdUDSvyfajUIWPg+DkwPDocNM9sj47GZt1Vkga9BohWc76WxPdUgq4nuqQTM30ZcKFwoEI9wbW5vouucXTPBrTp2JJr5ZIuxrYVIoZHl8hoB5seiwk5Z4nR8aSjZxCryX9R7rnJf5e60ovJCIT8l3Vvuu8h99iKDJGlCEKjAhie791kixEUppjrPoQji+KGGDc5AY4HSrJ8l4TfhsNx9kg54cQWljSBFmIAuuv8ACLRNNvR9GF0pdimvRMkUrQ4m91nKu7dRLhpAMx9VGTDRSyF7mnMa2eRt91VCizTh29EZj1K4sc3EY4p+VkcXZgCdgEnKujUW+HpoQhbGROWGOauYxrspsWLpYn8Fwb5Hvcwlz35yb1v13QhKkwNphYevuuchnn7oQmFByGdD7pywHdCEBw5y2o5bUISpDtncjVixPDI8RPzC9zbFEBCEnFPo4zlF2mbWNyMa2yaFWdyhCFRJ/9k="},
    {key:"bg21", label:"Bunny Notes", file:"assets/backgrounds/bg21.jpg", thumb:"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAwICQsJCAwLCgsODQwOEh4UEhEREiUbHBYeLCcuLisnKyoxN0Y7MTRCNCorPVM+QkhKTk9OLztWXFVMW0ZNTkv/2wBDAQ0ODhIQEiQUFCRLMisyS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0v/wAARCAB3AFQDASIAAhEBAxEB/8QAGQABAQEBAQEAAAAAAAAAAAAAAAEEAwIH/8QAKxAAAgECBAYCAQUBAAAAAAAAAAECETEDBFJxEhMhMlGRoeFBBSJCYfCB/8QAGAEBAQEBAQAAAAAAAAAAAAAAAAMBAgT/xAAbEQEBAQEBAQEBAAAAAAAAAAAAARExAmEhQf/aAAwDAQACEQMRAD8A+jJNvoqlSbsqlw4Sk3wOjR7WBiJ1TSfn/I6t9b+OJI8cEtLCw5q8WdOVjavn6LysbV8/Rzvv43I5cEtDHBLQzpysbV8/Q5WNq+fob7+GRzcZLq4Oh44kq9Du8LFao5Km55eWm/Hs6lv9MmuVV4Zarw6HRZWas0v+h5adOrXs3W55+uYAOknbK90tkaTNle6WyNJO9V88AAY0AAAEqUAR2ZSOzAxKyBFZAqi7ZXulsjSZsr3S2RpJ3qvngADGgAAlEygARdQ7MpHZgYVZAKyBVF2yvdLZGkzZXulsjQ2/wqk71XzxQRbFMaAAAAABHZlI7MDCrIBWBRF2yvdLZGkzZXulsjScXqvngADGgAAAAAR2ZSOzAwqyAVkCiLtle6WyNJmyvdLZGk4vVfPAAGNAAAAAAjsykdmBhVkArIFEXbK90tkaTNle6WyNJxeq+eAAMaAAAc5zcZxiouVbtfg6Hh4ceJySSk1SoHDMSni4MkklCX8q/wB+P90OH6fl5YU8SU3GLaaUE/DuduBqHB+9yo1bp4udo4MIKqVZKNKu4dT1ZMZVZAKyBR51jJx6xdKnrm4mt+kAMbtXm4mt+kObian6QAyG05uJqfpDm4mt+kAMhtTm4mt+kObia36QAyG1ebia36RObian6QAyG15oADWP/9k="}
  ];
  const BG_MAP = {}; BACKGROUNDS.forEach(b=> BG_MAP[b.key]=b);
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
    {key:"pin",         label:"Location pin",  ratio:0.71,w:40,  svg:'<svg viewBox="0 0 40 56"><path '+S+' d="M20 52C20 52 33 33 33 20 33 12 27 6 20 6 13 6 7 12 7 20 7 33 20 52 20 52z"/><circle cx="20" cy="20" r="6" '+S+'/></svg>'}
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
  function applyPhotoStyle(el,d){
    ['card','plain','shadow','frame','border'].forEach(s=>el.classList.remove('style-'+s));
    const st=d.style||'card'; el.classList.add('style-'+st);
    if(d.noCap) el.classList.add('nocap'); else el.classList.remove('nocap');
    // independent shadow toggle (works on top of ANY look)
    if(d.shadow) el.classList.add('has-shadow'); else el.classList.remove('has-shadow');
    // reset any inline overrides each call so switching looks stays clean (CSS governs unless set below)
    el.style.background=''; el.style.padding=''; el.style.borderColor=''; el.style.borderWidth='';
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
  }

  function applyPaper(pageEl, paper){
    paper = paper || 'grid';
    pageEl.classList.remove('grid','dot','plain','bg');
    pageEl.style.backgroundImage = '';
    const bg = BG_MAP[paper];
    if(bg){ pageEl.classList.add('bg'); pageEl.style.backgroundImage = 'url("'+bg.file+'")'; }
    else { pageEl.classList.add(BUILTIN_PAPERS.indexOf(paper)!==-1 ? paper : 'grid'); }
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


  function applyTextStyle(body, d){
    body.style.fontFamily = getFont(d.font).css;
    body.style.fontSize   = (d.size||20)+'px';
    body.style.fontWeight = d.bold? '700':'400';
    body.style.fontStyle  = d.italic? 'italic':'normal';
    body.style.textDecoration = d.underline? 'underline':'none';
    body.style.textAlign  = d.align||'left';
    body.style.color = d.color || '';
    body.style.background = d.fill || 'transparent';
    /* paragraph / line spacing: a multiplier (1.0 – 3.0). Unset inherits the CSS
       default (1.45), so every already-published story renders exactly as before. */
    body.style.lineHeight = d.spacing ? String(d.spacing) : '';
  }

  /* INLINE FORMATTING
     A text box can now carry per-word bold / italic / underline. When the user formats a
     selection inside a box, the editor stores the box's `html` (rich markup) alongside the
     plain `content` (used for previews/search and as a fallback). The block-level bold/italic/
     underline buttons still work for whole-box styling via applyTextStyle; inline runs live
     inside the html.

     For safety we never inject arbitrary markup: setRichText whitelists only the formatting
     tags <b> <strong> <i> <em> <u> <br> and escapes everything else. This keeps rendering
     identical between the editor and the public reader, and keeps the PDF export correct. */
  function sanitizeRich(html){
    if(html==null) return '';
    const allowed={B:'b',STRONG:'b',I:'i',EM:'i',U:'u',BR:'br'};
    const drop={SCRIPT:1,STYLE:1,IFRAME:1,OBJECT:1,EMBED:1}; // discard these AND their contents
    const tmp=document.createElement('div'); tmp.innerHTML=String(html);
    const out=document.createElement('div');
    (function walk(src, dst){
      src.childNodes.forEach(n=>{
        if(n.nodeType===3){ dst.appendChild(document.createTextNode(n.nodeValue)); return; }
        if(n.nodeType!==1) return;
        if(drop[n.nodeName]) return; // skip element and everything inside it
        const tag=allowed[n.nodeName];
        if(tag){ const e=document.createElement(tag); if(tag!=='br') walk(n,e); dst.appendChild(e); }
        else { walk(n, dst); } // unknown but harmless wrapper: drop wrapper, keep its text
      });
    })(tmp, out);
    return out.innerHTML;
  }
  // true when the html carries real formatting beyond plain text (so we know to use it)
  function hasRich(d){ return !!(d && d.html && /<(b|strong|i|em|u|br)\b/i.test(d.html)); }
  function setTextContent(body, d){
    if(hasRich(d)){ body.innerHTML = sanitizeRich(d.html); }
    else { body.textContent = d.content||''; }
  }

  /* rotation lives on the element wrapper for every type (now text too) */
  function applyRot(el, d){ el.style.transform = d.rot ? ('rotate('+d.rot+'deg)') : ''; }

  function buildElementRO(d){
    const el=document.createElement('div'); el.className='el el-'+d.type;
    el.style.left=(d.x||40)+'px'; el.style.top=(d.y||120)+'px'; if(d.w) el.style.width=d.w+'px';
    if(d.type==='text'){
      const b=document.createElement('div'); b.className='text-body'; setTextContent(b,d); applyTextStyle(b,d); el.appendChild(b);
      applyRot(el,d);
    } else if(d.type==='photo'){
      const img=document.createElement('img'); img.src=d.src; img.draggable=false; el.appendChild(img);
      const cap=document.createElement('div'); cap.className='cap'; cap.textContent=d.caption||''; applyCaptionStyle(cap,d); el.appendChild(cap);
      applyPhotoStyle(el,d); applyRot(el,d);
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
    const pg=document.createElement('div'); pg.className='page'; applyPaper(pg, page.paper);
    (page.elements||[]).forEach(d=> pg.appendChild(buildElementRO(d)));
    scaler.appendChild(pg); holder.appendChild(scaler); mount.appendChild(holder);
    const fit=()=>{ const cs=getComputedStyle(mount); const pad=(parseFloat(cs.paddingLeft)||0)+(parseFloat(cs.paddingRight)||0);
      const avail=Math.min(mount.clientWidth-pad, 800); const sc=Math.min(1, avail/PAGE_W);
      scaler.style.transform='scale('+sc+')'; holder.style.width=(PAGE_W*sc)+'px'; holder.style.height=(pg.offsetHeight*sc)+'px'; };
    requestAnimationFrame(fit); window.addEventListener('resize', fit);
    return pg;
  }

  return { CONFIG, PAGE_W, FONTS, FONT_GROUPS, FONT_ALIASES, resolveFontKey, getFont, BACKGROUNDS, BG_MAP, BUILTIN_PAPERS, DOODLES, DOODLES_MAP, doodleSVG, applyPhotoStyle, applyCaptionStyle, applyPaper, normalizePaper,
           uid, today, escapeHtml, slugify, formatDate, applyTextStyle, sanitizeRich, hasRich, setTextContent, applyRot,
           buildElementRO, renderPageRO };
})();

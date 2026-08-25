// SidVerse — the app shell: one sidebar for the site, and the theme toggle. A plain script, not a module, because four of the six modules load their own code as modules and two do not. Each page says which module it is and how far up the site root is: <html data-section="cinema"> <script defer src="../../assets/js/site.config.js"></script> <script defer src="../../assets/js/shell.js" data-root="../.."></script> The theme is set on <html> before this runs, by the inline snippet in each page's <head>, so a dark page never flashes light first.

(function () {
  "use strict";

  var SITE = window.SIDVERSE || {};
  var SECTIONS = SITE.sections || [];
  var script = document.currentScript || document.querySelector("script[data-root]");
  var ROOT = (script && script.getAttribute("data-root")) || ".";
  var HERE = document.documentElement.dataset.section || "";

  var ICONS = {
    film: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M8 4v16M16 4v16M3 9h5M3 15h5M16 9h5M16 15h5"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H19v3H6.5A2.5 2.5 0 0 1 4 20.5z"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.6 8.4l-2.1 5.1-5.1 2.1 2.1-5.1z"/>',
    bowl: '<path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M12 3c1.6 1.4 1.6 3.1 0 4.5M8.5 4.6c1.2 1 1.2 2.3 0 3.4M15.5 4.6c1.2 1 1.2 2.3 0 3.4"/>',
    star: '<path d="M12 3.6l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.8l5.9-.9z"/>',
    pen: '<path d="M4 20l4.5-1.2L20 7.3a2 2 0 0 0 0-2.8l-.5-.5a2 2 0 0 0-2.8 0L5.2 15.5z"/><path d="M15 6l3 3"/>',
    home: '<path d="M4 11l8-7 8 7"/><path d="M6.5 9.6V20h11V9.6"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    images: '<rect x="3" y="5" width="18" height="14" rx="2.4"/><circle cx="8.6" cy="10" r="1.6"/><path d="M4 17l4.8-4.3 3.2 2.7 3-2.4L20 17"/>',
    sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6"/>',
    moon: '<path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2z"/>'
  };

  function svg(name, cls) {
    return '<svg class="' + (cls || "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor"'
      + ' stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
      + (ICONS[name] || "") + "</svg>";
  }

  function esc(text) {
    return String(text == null ? "" : text).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function url(path) {
    if (!path) return ROOT + "/";
    return ROOT === "." ? path : ROOT + "/" + path;
  }

  function current() {
    for (var i = 0; i < SECTIONS.length; i++) if (SECTIONS[i].key === HERE) return SECTIONS[i];
    return null;
  }

  // ---- markup ----------------------------------------------------------

  function items() {
    return [{ key: "home", label: "Home", href: "index.html", note: "Everything at once", icon: "home" }]
      .concat(SECTIONS);
  }

  // Collapsed: a floating pill of icons against the left edge. The name shows on hover, so the rail is still legible before the icons are learnt.
  function rail() {
    var dots = items().map(function (s, i) {
      var on = s.key === HERE;
      return (i === 1 ? '<span class="psb__sep"></span>' : "")
        + '<a class="psb__dot' + (on ? " is-current" : "") + '" data-section="' + esc(s.key) + '"'
        + ' href="' + esc(url(s.href)) + '" aria-label="' + esc(s.tip || s.label) + '">'
        + svg(s.icon) + '<span class="psb__tip">' + esc(s.tip || s.label) + "</span></a>";
    }).join("");

    var node = document.createElement("nav");
    node.className = "psb__rail";
    node.setAttribute("aria-label", "Modules");
    node.innerHTML = dots
      + '<span class="psb__sep"></span>'
      + '<button class="psb__dot psb__dot--theme" type="button" data-theme-toggle aria-label="Switch theme">'
      + '<span class="psb__glyph">' + svg("sun", "psb__sun") + svg("moon", "psb__moon") + "</span>"
      + '<span class="psb__tip" data-theme-label>Dark</span></button>';
    return node;
  }

  function burger() {
    var node = document.createElement("button");
    node.className = "psb__burger";
    node.type = "button";
    node.setAttribute("aria-label", "Open the menu");
    node.setAttribute("aria-expanded", "false");
    node.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true">'
      + '<path class="psb__bar psb__bar--top" d="M4 7h16"/>'
      + '<path class="psb__bar psb__bar--mid" d="M4 12h16"/>'
      + '<path class="psb__bar psb__bar--bot" d="M4 17h16"/></svg>';
    return node;
  }

  function panel() {
    var links = items().map(function (s) {
      var on = s.key === HERE;
      return '<a class="psb__link' + (on ? " is-current" : "") + '" data-section="' + esc(s.key) + '"'
        + ' href="' + esc(url(s.href)) + '"' + (on ? ' aria-current="page"' : "") + ">"
        + '<span class="psb__icon">' + svg(s.icon) + "</span>"
        + '<span class="psb__text">' + esc(s.tip || s.label) + "</span></a>";
    });

    var node = document.createElement("aside");
    node.className = "psb";
    node.innerHTML =
      '<a class="psb__brand" href="' + esc(url("index.html")) + '">'
      + '<span class="psb__diamond" aria-hidden="true">P</span>'
      + '<span class="psb__name">' + esc(SITE.name || "SidVerse") + "</span></a>"
      + '<nav class="psb__nav" aria-label="Sections">'
      + links[0] + '<p class="psb__label">Rooms</p>' + links.slice(1).join("") + "</nav>"
      + '<div class="psb__foot"><button class="psb__theme" type="button" data-theme-toggle>'
      + '<span class="psb__glyph">' + svg("sun", "psb__sun") + svg("moon", "psb__moon") + "</span>"
      + "<span data-theme-label>Dark</span></button></div>";
    return node;
  }

  // ---- theme ------------------------------------------------------------
  // One key for the whole site. data-bs-theme rides along because Cinema's stylesheet inherited a handful of Bootstrap rules that read it.

  function readTheme() {
    try { return localStorage.getItem("sidverse:theme") || ""; } catch (e) { return ""; }
  }

  function setTheme(next) {
    var root = document.documentElement;
    root.setAttribute("data-theme", next);
    root.setAttribute("data-bs-theme", next);
    try { localStorage.setItem("sidverse:theme", next); } catch (e) {}

    // There are two switches — one on the rail, one in the panel — and both have to read the same way.
    var word = next === "dark" ? "Light" : "Dark";
    document.querySelectorAll("[data-theme-label]").forEach(function (el) { el.textContent = word; });
    document.querySelectorAll("[data-theme-toggle]").forEach(function (el) {
      el.setAttribute("aria-label", "Switch to " + word.toLowerCase());
    });

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", next === "dark" ? "#171a26" : "#ffffff");
  }

  function wireTheme() {
    setTheme(document.documentElement.getAttribute("data-theme") || readTheme() || "light");
    document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.stopPropagation();
        setTheme((document.documentElement.getAttribute("data-theme") === "dark") ? "light" : "dark");
      });
    });
  }

  // ---- open and close ---------------------------------------------------

  function wireOpen(button, scrim) {
    function set(open) {
      document.body.classList.toggle("psb-open", open);
      button.setAttribute("aria-expanded", String(open));
      button.setAttribute("aria-label", open ? "Close the menu" : "Open the menu");
    }
    button.addEventListener("click", function (event) {
      event.stopPropagation();
      set(!document.body.classList.contains("psb-open"));
    });
    scrim.addEventListener("click", function () { set(false); });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && document.body.classList.contains("psb-open")) set(false);
    });
  }

  // ---- the footer -------------------------------------------------------
  // One shape on every page: the module's own line on the left, its links in the middle, the same signature on the right. A module with `ownFooter` already has one worth keeping and is left alone.

  function footer() {
    var here = current();
    if (!here || here.ownFooter) return null;

    // A link to the page you are already on is not a way out of it.
    var page = (location.pathname.split("/").pop() || "index.html");
    var links = (here.footerLinks || []).filter(function (l) {
      return l.href !== page;
    }).map(function (l) {
      return '<a class="pfoot__link" href="' + esc(url(here.href + l.href)) + '">'
        + svg(l.icon || "arrow", "pfoot__link-icon")
        + '<span>' + esc(l.label) + "</span></a>";
    }).join("");

    // An optional feature card above the line: a module with somewhere worth going puts it here rather than in the row of small links. A link to the page you are already on is not a way out of it.
    var f = here.footerFeature && here.footerFeature.href !== page ? here.footerFeature : null;
    var feature = !f ? "" :
      '<a class="pfeat" href="' + esc(url(here.href + f.href)) + '">'
      + '<div class="pfeat__text">'
      + '<span class="pfeat__eyebrow">' + esc(f.eyebrow || "") + "</span>"
      + '<h3 class="pfeat__title">' + esc(f.title || "")
      + (f.titleEm ? " <em>" + esc(f.titleEm) + "</em>" : "") + ".</h3>"
      + '<p class="pfeat__sub">' + esc(f.sub || "") + "</p>"
      + "</div>"
      + '<div class="pfeat__side">'
      + '<span class="pfeat__frames" aria-hidden="true">'
      + (f.shots || []).map(function (src) {
          return '<span class="pfeat__frame" style="background-image:url(\'' + esc(src) + '\')"></span>';
        }).join("")
      + "</span>"
      + '<span class="pfeat__cta">' + esc(f.cta || "Open")
      + '<span class="pfeat__arrow" aria-hidden="true">&#8599;</span></span>'
      + "</div></a>";

    // A page can host the card itself; only then does it stay in the footer.
    var slot = document.querySelector("[data-feature-slot]");
    if (slot && feature) {
      slot.innerHTML = feature;
      feature = "";
    }

    var node = document.createElement("footer");
    node.className = "pfoot";
    node.innerHTML =
      feature
      + '<div class="pfoot__inner">'
      + '<p class="pfoot__line">' + esc(here.footerLine || SITE.footerLine || "") + "</p>"
      + (links ? '<nav class="pfoot__links">' + links + "</nav>" : "")
      + '<p class="pfoot__made">Made with <span class="pfoot__heart">&#128150;</span> by '
      // A span, not an anchor: the sign-off names who made the site, it is not somewhere to go, and an <a> back to the home page from the footer of the home page was a link to nowhere useful.
      + '<span class="pfoot__me">' + esc(SITE.madeBy || SITE.owner || "me") + "</span></p>"
      + "</div>";
    return node;
  }

  // ---- the bar wordmark --------------------------------------------------
  // Every module wrote its own brand markup. The name and the icon now come from site.config.js, so a rename happens in one place. The existing node is kept and refilled: it carries each module's own link and handlers.

  var BRAND_SEL = ".wordmark, .navbar .logo, .brand, .nav__brand, .topbar__brand";

  function brand() {
    var here = current();
    if (!here) return;
    document.querySelectorAll(BRAND_SEL).forEach(function (node) {
      node.classList.add("pmark");
      node.innerHTML =
        '<span class="pmark__tile" aria-hidden="true">' + svg(here.icon) + "</span>"
        + '<span class="pmark__name">' + esc(here.site || here.label || "") + "</span>";
      node.setAttribute("aria-label", (here.site || "") + " home");
    });
  }

  // ---- the hero language line -------------------------------------------
  // The phrase and its translation both live in the config.

  function langline() {
    var here = current();
    if (!here || !here.phrase) return;
    document.querySelectorAll("[data-phrase]").forEach(function (el) {
      el.classList.add("langline");
      el.setAttribute("tabindex", "0");
      // A centred heading centres its gloss, so the label sits under the phrase rather than off to one side of it.
      var align = window.getComputedStyle(el).textAlign;
      if (align === "center") el.classList.add("langline--center");
      el.innerHTML = esc(here.phrase)
        + '<span class="langline__gloss">' + esc(here.gloss || "") + "</span>";

      // There is no hover on a touch screen, so a tap opens the translation and a second tap — or a tap anywhere else — closes it again.
      el.addEventListener("click", function (e) {
        e.stopPropagation();
        var open = el.classList.toggle("is-glossed");
        // The bubble sits above the phrase, which on a short screen puts it under the sticky bar. If there is not room, it flips below.
        if (open) {
          // Measured against the bubble's own height, not a guess: a tall heading sits low enough for the bubble to clear the bar, a short one does not.
          var g = el.querySelector(".langline__gloss");
          var need = (g ? g.offsetHeight : 32) + 18;
          var bar = document.querySelector(".topbar, .navbar, .nav, .site-topbar");
          var floor = bar ? bar.getBoundingClientRect().bottom : 0;
          el.classList.toggle("langline--below",
            el.getBoundingClientRect().top - need < floor);
        }
      });
    });

    // `pointerdown` rather than `click`: on iOS a click on a plain element does not always reach the document, so a tap on empty page never closed anything. pointerdown fires for mouse and touch alike.
    document.addEventListener("pointerdown", function (e) {
      if (e.target.closest && e.target.closest(".langline")) return;
      document.querySelectorAll(".langline.is-glossed")
        .forEach(function (el) { el.classList.remove("is-glossed"); });
    });
  }

  // ---- the page menu ----------------------------------------------------
  // On a phone every bar ran out of room: Cinema's four destinations, Books' three plus two tools, Favourites' menu. They fold into one button that opens the bar's own links as a sheet. The burger on the left stays the way between rooms; this is the way around the room you are in.

  var PAGE_GROUPS = ".topbar__tools, .nav__links, .navbar .nav-links, .nav__tools";

  // A tool button carries only an icon, or only a count badge. Either way the row needs a name; these are the few whose own title reads as a sentence.
  var PMENU_NAMES = {
    refreshBtn: "Reload from sheet",
    filterToggle: "Browse navigation",
    reloadBtn: "Reload from sheet",
    searchToggle: "Find a book"
  };

  function pmenuLabel(el, text) {
    [].slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType === 1 && n.tagName.toLowerCase() === "svg") return;
      el.removeChild(n);
    });
    var span = document.createElement("span");
    span.className = "pmenu__label";
    span.textContent = text;
    el.appendChild(span);
  }

  // Trimming and naming the rows. Runs on every attempt, not just the first: a module may fill its own bar after the fold has happened.
  function dress(sheet) {
    // Favourites' bar carries Home and Collections beside its Galleries menu. In the sheet only the galleries are wanted: the rail already covers rooms, and Collections is the page you are on. Scoped to that module — every other bar's links ARE its destinations.
    if (document.documentElement.getAttribute("data-section") === "favourites") {
      sheet.querySelectorAll(".nav__link").forEach(function (el) {
        // The Galleries toggle is a .nav__link too, and the module's own script wires it up after this runs — removing it threw. It is hidden by CSS instead.
        if (el.classList.contains("nav__dropdown-toggle")) return;
        if (!el.closest(".nav__dropdown-panel")) el.remove();
      });
    }

    sheet.querySelectorAll("a, button").forEach(function (el) {
      if (el.querySelector(".pmenu__label")) return;
      if (PMENU_NAMES[el.id]) { pmenuLabel(el, PMENU_NAMES[el.id]); return; }

      var own = el.textContent.trim();
      if (own && !/^\d+$/.test(own)) return;

      var text = el.getAttribute("aria-label") || el.getAttribute("title");
      if (!text) return;
      pmenuLabel(el, text.split(/[.,-]/)[0].trim());
    });
  }

  function pageMenu() {
    var existing = document.querySelector(".pmenu__sheet");
    if (existing) { dress(existing); return; }
    var groups = [].slice.call(document.querySelectorAll(PAGE_GROUPS))
      .filter(function (g) { return g.children.length; });
    if (!groups.length) return;

    var bar = document.querySelector(".topbar__inner, .navbar .nav-inner, .nav__inner, .topbar > .wrap");
    if (!bar) return;

    var wrap = document.createElement("div");
    wrap.className = "pmenu";

    var button = document.createElement("button");
    button.type = "button";
    button.className = "pmenu__btn";
    button.setAttribute("aria-label", "This page");
    button.setAttribute("aria-expanded", "false");
    button.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"'
      + ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
      + '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/>'
      + '<circle cx="19" cy="12" r="1.6"/></svg>';

    var sheet = document.createElement("div");
    sheet.className = "pmenu__sheet";
    groups.forEach(function (g) { sheet.appendChild(g); });

    dress(sheet);

    wrap.appendChild(button);
    wrap.appendChild(sheet);
    bar.appendChild(wrap);

    function close() { wrap.classList.remove("is-open"); button.setAttribute("aria-expanded", "false"); }

    button.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = wrap.classList.toggle("is-open");
      button.setAttribute("aria-expanded", open ? "true" : "false");
    });

    document.addEventListener("pointerdown", function (e) { if (!wrap.contains(e.target)) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    // Following a link inside the sheet should close it on the way out.
    sheet.addEventListener("click", function (e) { if (e.target.closest("a")) close(); });
  }

  // The module's own footer is hidden rather than removed: its markup is often wired to that module's scripts, and removing it would break them.
  function retireOldFooter() {
    var here = current();
    if (!here || here.ownFooter) return;
    document.querySelectorAll("footer.footer, footer.site-footer, footer.page-footer, footer.foot, footer.gallery-footer").forEach(function (el) {
      el.setAttribute("data-retired", "");
    });
  }

  function mount() {
    if (document.querySelector(".psb")) return;

    var scrim = document.createElement("div");
    scrim.className = "psb__scrim";
    var button = burger();

    document.body.insertBefore(panel(), document.body.firstChild);
    document.body.insertBefore(rail(), document.body.firstChild);
    document.body.appendChild(scrim);
    document.body.appendChild(button);

    brand();
    langline();

    // Modules build their own bar links from their own scripts, which run after this one, so the fold is attempted again once they have.
    if (window.matchMedia("(max-width: 720px)").matches) {
      pageMenu();
      window.addEventListener("load", pageMenu);
      setTimeout(pageMenu, 600);
    }

    retireOldFooter();
    var foot = footer();
    if (foot) document.body.appendChild(foot);

    wireTheme();
    wireOpen(button, scrim);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();

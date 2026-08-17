/* Pitara — the front page. Everything on it is drawn from site.config.js, so
   adding a section there adds a card here. */

(function () {
  "use strict";

  var SITE = window.PITARA || {};
  var SECTIONS = SITE.sections || [];

  var ICONS = {
    film: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M8 4v16M16 4v16M3 9h5M3 15h5M16 9h5M16 15h5"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H19v3H6.5A2.5 2.5 0 0 1 4 20.5z"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.6 8.4l-2.1 5.1-5.1 2.1 2.1-5.1z"/>',
    bowl: '<path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M12 3c1.6 1.4 1.6 3.1 0 4.5M8.5 4.6c1.2 1 1.2 2.3 0 3.4M15.5 4.6c1.2 1 1.2 2.3 0 3.4"/>',
    star: '<path d="M12 3.6l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.8l5.9-.9z"/>',
    pen: '<path d="M4 20l4.5-1.2L20 7.3a2 2 0 0 0 0-2.8l-.5-.5a2 2 0 0 0-2.8 0L5.2 15.5z"/><path d="M15 6l3 3"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r="1"/>',
    github: '<path d="M9 19c-4 1.4-4-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.3 4.3 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>'
  };

  function svg(name, size) {
    return '<svg viewBox="0 0 24 24" width="' + (size || 24) + '" height="' + (size || 24) + '"'
      + ' fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"'
      + ' stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || "") + "</svg>";
  }

  // Instagram's own gradient, so the mark reads as the real thing.
  function instagramMark() {
    return '<svg class="ig" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">'
      + '<defs><linearGradient id="igg" x1="0" y1="1" x2="1" y2="0">'
      + '<stop offset="0" stop-color="#FFD776"/><stop offset=".28" stop-color="#F5983D"/>'
      + '<stop offset=".56" stop-color="#E9376E"/><stop offset=".78" stop-color="#C42A96"/>'
      + '<stop offset="1" stop-color="#7B3FE4"/></linearGradient></defs>'
      + '<rect x="2.6" y="2.6" width="18.8" height="18.8" rx="5.4" fill="none"'
      + ' stroke="url(#igg)" stroke-width="2"/>'
      + '<circle cx="12" cy="12" r="4.1" fill="none" stroke="url(#igg)" stroke-width="2"/>'
      + '<circle cx="17.6" cy="6.4" r="1.3" fill="url(#igg)"/></svg>';
  }

  function esc(text) {
    return String(text == null ? "" : text).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function set(selector, value) {
    var node = document.querySelector(selector);
    if (node) node.textContent = value;
  }

  function paint() {
    set("[data-hero-eyebrow]", SITE.tagline || "");
    set("[data-hero-lede]", SITE.intro || "");
    set("[data-hero-count]", SECTIONS.length + " rooms, and counting");
    set("[data-foot-line]", SITE.footerLine || "");
    set("[data-foot-meta]", SITE.name + " — kept by " + (SITE.owner || "me"));

    var portrait = document.querySelector("[data-portrait]");
    if (portrait) {
      if (SITE.portrait) portrait.src = SITE.portrait;
      portrait.alt = SITE.portraitAlt || SITE.owner || "";
    }

    var rooms = document.querySelector("[data-rooms]");
    if (rooms) {
      rooms.innerHTML = SECTIONS.map(function (s) {
        // No <img> without a URL: the tinted panel behind it is a better empty
        // state than a broken-image glyph.
        var shot = s.image
          // A remote thumbnail can 403 on hotlink or simply go away. If it does,
          // the <img> removes itself and the tinted panel behind it shows.
          ? '<img src="' + esc(s.image) + '" alt="" loading="lazy" decoding="async"'
            + ' onerror="this.remove()">'
          : "";
        return '<a class="room" data-section="' + esc(s.key) + '" href="' + esc(s.href) + '">'
          + '<span class="room__shot">' + shot
          + '<span class="room__badge">' + svg(s.icon, 20) + "</span></span>"
          + '<span class="room__body">'
          + '<span class="room__label">' + esc(s.label) + "</span>"
          + '<span class="room__blurb">' + esc(s.blurb || "") + "</span>"
          + '<span class="room__foot">'
          + '<span class="room__note">' + esc(s.note || "") + "</span>"
          + '<span class="room__go">' + svg("arrow", 16) + "</span>"
          + "</span></span></a>";
      }).join("");
    }

    var chips = document.querySelector("[data-index-chips]");
    if (chips) {
      chips.innerHTML = SECTIONS.map(function (s) {
        return '<a class="index__chip" data-section="' + esc(s.key) + '" href="' + esc(s.href) + '">'
          + '<span class="index__dot"></span>' + esc(s.label) + "</a>";
      }).join("");
    }

    var links = document.querySelector("[data-foot-links]");
    if (links) {
      var out = "";
      Object.keys(SITE.links || {}).forEach(function (key) {
        var href = SITE.links[key];
        if (!href || !ICONS[key]) return;
        var mark = key === "instagram" ? instagramMark() : svg(key, 18);
        out += '<a class="foot__link foot__link--' + key + '" href="' + esc(href) + '"'
          + ' target="_blank" rel="noopener" title="' + esc(key) + '">' + mark + "</a>";
      });
      links.innerHTML = out;
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", paint);
  else paint();
})();

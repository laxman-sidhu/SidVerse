// SidTrails - the Photos tab. One column feeds the gallery page, the other the hero fan; both read it through window.SidPhotos.
(function () {
  "use strict";

  var PUB_TOKEN = "2PACX-1vRu5WZo8jYshhWVSUIYIHqWZFcwOC2tWeeQcJMowqYw5LG7CMjecBMhGT9iHX8tnLFIp6ob44QbJ6Ge";
  var SHEET_ID = "1CtRBUNbgxf-Z-pEfwoKW9O5NTCUxTsbpTGBrfox9gSk";
  var GID_PHOTOS = "472072756";
  var CACHE_KEY = "sidtrails:photos:v1";
  var CACHE_MS = 5 * 60 * 1000;

  var URLS = [
    "https://docs.google.com/spreadsheets/d/e/" + PUB_TOKEN + "/pub?output=csv&single=true&gid=" + GID_PHOTOS,
    "https://docs.google.com/spreadsheets/d/" + SHEET_ID + "/gviz/tq?tqx=out:csv&gid=" + GID_PHOTOS,
    "https://docs.google.com/spreadsheets/d/" + SHEET_ID + "/export?format=csv&gid=" + GID_PHOTOS
  ];

  var VIDEO = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;

  function parseCSV(text) {
    var rows = [], row = [], field = "", quoted = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (quoted) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
        } else field += c;
      } else if (c === '"') quoted = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c !== "\r") field += c;
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  function kindOf(url) {
    return VIDEO.test(url) || /\/video\/upload\//.test(url) ? "video" : "image";
  }

  function nameOf(url) {
    try { return decodeURIComponent(url.split("?")[0].split("/").pop()) || "photo"; }
    catch (e) { return "photo"; }
  }

  // A cell may hold one link, or several on separate lines.
  function column(table, test) {
    var header = (table[0] || []).map(function (h) { return String(h).trim().toLowerCase(); });
    var at = header.findIndex(test);
    if (at < 0) return [];
    var out = [];
    table.slice(1).forEach(function (row) {
      String(row[at] || "").split(/[\r\n]+/).forEach(function (cell) {
        var url = cell.trim();
        if (/^https?:\/\//i.test(url)) out.push({ url: url, kind: kindOf(url), name: nameOf(url) });
      });
    });
    return out;
  }

  function shape(text) {
    var table = parseCSV(text);
    return {
      gallery: column(table, function (h) { return h.indexOf("gallery") > -1; }),
      hero: column(table, function (h) { return h.indexOf("hero") > -1 || h.indexOf("carousel") > -1; })
    };
  }

  function readCache() {
    try {
      var hit = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
      return hit && Date.now() - hit.time < CACHE_MS ? hit.data : null;
    } catch (e) { return null; }
  }

  function writeCache(data) {
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), data: data })); } catch (e) {}
  }

  function fetchFrom(index) {
    if (index >= URLS.length) return Promise.reject(new Error("The Photos tab could not be read."));
    return fetch(URLS[index], { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (text) {
        var data = shape(text);
        if (!data.gallery.length && !data.hero.length) throw new Error("empty");
        return data;
      })
      .catch(function () { return fetchFrom(index + 1); });
  }

  // Cloudinary resizes on the fly; anything else is used as it is.
  function cdn(url, transform) {
    if (!url || url.indexOf("res.cloudinary.com") < 0 || url.indexOf("/upload/") < 0) return url;
    if (/\/upload\/[a-z]{1,3}_[^/]+\//.test(url)) return url;
    return url.replace("/upload/", "/upload/" + transform + "/");
  }

  // A Cloudinary video gives a still of its first frame for a poster.
  function poster(url) {
    if (url.indexOf("res.cloudinary.com") < 0 || url.indexOf("/video/upload/") < 0) return "";
    return url.replace("/video/upload/", "/video/upload/so_0,w_800,q_auto/").replace(/\.(mp4|webm|mov|m4v)(\?.*)?$/i, ".jpg");
  }

  var pending = null;

  window.SidPhotos = {
    cdn: cdn,
    poster: poster,
    load: function () {
      var cached = readCache();
      if (cached) return Promise.resolve(cached);
      if (!pending) {
        pending = fetchFrom(0)
          .then(function (data) { writeCache(data); return data; })
          .catch(function (error) { pending = null; throw error; });
      }
      return pending;
    }
  };
})();

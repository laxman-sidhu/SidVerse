// SidNotes - draws stories with the editor's own engine and data, read live from Journal-Writing; the copies in js/ and data/ answer when it is out of reach.
window.SIDNOTES = (function () {
  "use strict";

  var EDITOR = "https://laxman-sidhu.github.io/Journal-Writing/";
  var SOURCES = [EDITOR + "Siddhesh-Journal/data/", "data/"];

  function script(src) {
    return new Promise(function (resolve, reject) {
      var tag = document.createElement("script");
      tag.src = src;
      tag.onload = resolve;
      tag.onerror = function () { tag.remove(); reject(new Error("load " + src)); };
      document.head.appendChild(tag);
    });
  }

  var ready = null;

  // The paper list loads first, because core.js reads it the moment it runs.
  function engine() {
    if (!ready) {
      ready = script(EDITOR + "assets/js/bg-list.js")
        .catch(function () { return script("js/bg-list.js"); })
        .catch(function () {})
        .then(function () { return script(EDITOR + "assets/js/core.js"); })
        .catch(function () { return script("js/core.js"); })
        .then(function () { return window.JOURNAL; });
    }
    return ready;
  }

  // The first source that answers wins, so a story published in the editor appears here without copying files.
  async function json(path) {
    for (var i = 0; i < SOURCES.length; i++) {
      try {
        var res = await fetch(SOURCES[i] + path + "?t=" + Date.now(), { cache: "no-store" });
        if (res.ok) return await res.json();
      } catch (e) {}
    }
    throw new Error("not found");
  }

  // The engine names papers relative to the editor's pages, so each one is pointed back at the editor's site.
  function fixPaper(page) {
    var bg = page.style.backgroundImage || "";
    if (bg.indexOf("../assets/backgrounds/") > -1) page.style.backgroundImage = bg.split("../assets/backgrounds/").join(EDITOR + "assets/backgrounds/");
  }

  return { EDITOR: EDITOR, engine: engine, json: json, fixPaper: fixPaper };
})();

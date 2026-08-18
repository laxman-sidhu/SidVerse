/* The hero fan.

   Reads assets/hero-index.json — the list the .bat writes — and lays every
   picture in assets/hero/ into the fan. Four or fewer keep the original
   angled stack. More than that and the fan becomes a horizontal scroller, so
   dropping a fifth photo in the folder never breaks the layout.

   If the JSON is missing the four original files are tried directly, so the
   page still shows something on a checkout that has not run the .bat. */

(function () {
  "use strict";

  var MAX_FANNED = 4;
  var host = document.getElementById("heroFan");
  if (!host) return;

  function card(name, eager) {
    var fig = document.createElement("figure");
    fig.className = "fan-card";
    var img = document.createElement("img");
    img.src = "assets/hero/" + name;
    img.alt = "";
    img.loading = eager ? "eager" : "lazy";
    img.decoding = "async";
    // A file listed but missing should not leave a broken frame behind.
    img.addEventListener("error", function () { fig.remove(); measure(); });
    fig.appendChild(img);
    return fig;
  }

  function measure() {
    host.classList.toggle("is-scroller", host.children.length > MAX_FANNED);
  }

  function paint(files) {
    host.textContent = "";
    files.forEach(function (name, i) { host.appendChild(card(name, i === 0)); });
    measure();
  }

  fetch("assets/hero-index.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      var files = data && Array.isArray(data.files) ? data.files : null;
      paint(files && files.length ? files : ["1.webp", "2.webp", "3.webp", "4.webp"]);
    })
    .catch(function () {
      paint(["1.webp", "2.webp", "3.webp", "4.webp"]);
    });
})();

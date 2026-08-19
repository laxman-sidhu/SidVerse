/* The hero fan.

   Reads assets/hero-index.json — the list the .bat writes — and lays every
   picture in assets/hero/ into the track. The fan itself never changes shape:
   four cards fill the window, and the rest wait outside it. The track moves one
   picture at a time, by drag or by the dots below it. */

(function () {
  "use strict";

  var PER_VIEW = 4;
  var IDLE = 2000;
  var FALLBACK = ["1.webp", "2.webp", "3.webp", "4.webp"];

  var visual = document.getElementById("heroVisual");
  var track = document.getElementById("heroFan");
  var nav = document.getElementById("heroFanNav");
  var dots = document.getElementById("heroFanDots");
  if (!visual || !track) return;

  var desktop = window.matchMedia("(min-width: 901px)");
  var BOX = 210;
  var OVERLAP = 34;
  var BOX_H = 373;
  var index = 0;
  var stops = 1;
  var idleTimer = null;

  function card(name, eager) {
    var fig = document.createElement("figure");
    fig.className = "fan-card";
    var img = document.createElement("img");
    img.src = "assets/hero/" + name;
    img.alt = "";
    img.loading = eager ? "eager" : "lazy";
    img.decoding = "async";
    img.draggable = false;
    // A file listed but missing should not leave a broken frame behind.
    img.addEventListener("error", function () { fig.remove(); measure(); });
    fig.appendChild(img);
    return fig;
  }

  function cards() {
    return track.children;
  }

  // Where a slot sits and how big it reads. Slot 0 is the front of the fan and
  // each step back is 10px narrower at 9:16, 4% smaller and 30px further away -
  // the sizes the design already had, written as a step rather than a table so
  // any slot before or after the four visible ones follows the same run.
  function slotBox(slot) {
    var w = BOX - 10 * slot;
    return { w: w, h: Math.round(w * 16 / 9), k: 1.04 - 0.04 * slot };
  }

  // Each place begins where the one in front ends, less the overlap.
  function slotX(slot) {
    var x = 0;
    var s;
    for (s = 0; s < slot; s++) x += BOX - 10 * s - OVERLAP;
    for (s = -1; s >= slot; s--) x -= BOX - 10 * s - OVERLAP;
    return x;
  }

  // The card takes the look of the slot it is in, so moving up a place is a
  // card growing into that place rather than the place moving.
  function place(cardEl, slot, first, animate) {
    var style = cardEl.style;
    if (!animate) style.transition = "none";
    var box = slotBox(slot);
    style.setProperty("--fw", box.w + "px");
    style.setProperty("--fh", box.h + "px");
    style.setProperty("--fk", box.k.toFixed(4));
    style.setProperty("--fz", -30 * slot + "px");
    style.setProperty("--fi", String(10 - slot));
    // The row starts at the first card, so its margin is where the row starts:
    // sliding the row is a margin rather than a transform, because a transform
    // on the row flattens the cards behind it out of the pointer's reach.
    style.setProperty("--fml", first ? slotX(-index) + "px" : -OVERLAP + "px");
    // Only the fan's own four places are drawn; a card outside them fades, which
    // is what lets the window go unclipped and hover grow past either edge.
    style.opacity = slot < 0 || slot >= PER_VIEW ? "0" : "1";
    style.animation = "none";
    if (!animate) {
      // Read once so the browser takes the jump before the transition returns.
      void cardEl.offsetWidth;
      style.transition = "";
    }
  }

  function layout(animate) {
    var list = cards();
    for (var i = 0; i < list.length; i++) place(list[i], i - index, i === 0, animate);
  }

  function measure() {
    var count = cards().length;
    var on = desktop.matches && count > PER_VIEW;

    visual.classList.toggle("is-carousel", on);

    stops = Math.max(1, count - PER_VIEW + 1);
    index = Math.min(index, stops - 1);

    if (!desktop.matches) {
      if (nav) nav.hidden = true;
      return;
    }

    layout(false);
    paintDots();
    if (nav) nav.hidden = !on;
    if (on) shift();
  }

  function shift() {
    layout(true);

    var prev = nav && nav.querySelector("[data-fan-prev]");
    var next = nav && nav.querySelector("[data-fan-next]");
    if (prev) prev.disabled = index === 0;
    if (next) next.disabled = index >= stops - 1;

    if (!dots) return;
    Array.prototype.forEach.call(dots.children, function (dot, i) {
      dot.classList.toggle("is-on", i === index);
      dot.setAttribute("aria-current", i === index ? "true" : "false");
    });
  }

  function paintDots() {
    if (!dots || dots.children.length === stops) return;
    dots.textContent = "";
    for (var i = 0; i < stops; i++) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "fan-nav__dot";
      dot.dataset.fanStop = i;
      dot.setAttribute("aria-label", "Photo " + (i + 1));
      dots.appendChild(dot);
    }
  }

  function go(to) {
    index = Math.max(0, Math.min(to, stops - 1));
    shift();
  }

  // The arrows are a hint, not furniture: they surface while the gallery is
  // being used and fade back out once it is left alone.
  function wake() {
    if (!visual.classList.contains("is-carousel")) return;
    visual.classList.add("is-awake");
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () { visual.classList.remove("is-awake"); }, IDLE);
  }

  function paint(files) {
    track.textContent = "";
    files.forEach(function (name, i) { track.appendChild(card(name, i === 0)); });
    measure();
    // Card widths are fixed in CSS, but a late web font or a slow image can
    // still land after the first measure.
    window.addEventListener("load", measure, { once: true });
  }

  if (nav) {
    nav.addEventListener("click", function (event) {
      var dot = event.target.closest("[data-fan-stop]");
      if (dot) return go(Number(dot.dataset.fanStop));
      if (event.target.closest("[data-fan-prev]")) go(index - 1);
      if (event.target.closest("[data-fan-next]")) go(index + 1);
    });
  }

  visual.addEventListener("pointermove", wake);
  visual.addEventListener("pointerdown", wake);

  bindDrag();

  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(measure, 180);
  });

  // Dragging moves the fan a picture at a time, in whichever direction the
  // pointer went, and settles the moment the step is taken.
  function bindDrag() {
    var startX = 0;
    var taken = 0;
    var dragging = false;

    track.addEventListener("pointerdown", function (event) {
      if (!visual.classList.contains("is-carousel") || event.button !== 0) return;
      dragging = true;
      taken = 0;
      startX = event.clientX;
      track.setPointerCapture(event.pointerId);
    });

    track.addEventListener("pointermove", function (event) {
      if (!dragging) return;
      wake();
      // One picture per card's width of travel, so a long drag walks the fan.
      var steps = Math.trunc((startX - event.clientX) / 120);
      if (steps === taken) return;
      go(index + (steps - taken));
      taken = steps;
    });

    function release() {
      if (!dragging) return;
      dragging = false;
    }

    track.addEventListener("pointerup", release);
    track.addEventListener("pointercancel", release);
    // A drag should not open the picture it finished on.
    track.addEventListener("dragstart", function (event) { event.preventDefault(); });
  }

  fetch("assets/hero-index.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      var files = data && Array.isArray(data.files) ? data.files : null;
      paint(files && files.length ? files : FALLBACK);
    })
    .catch(function () {
      paint(FALLBACK);
    });
})();

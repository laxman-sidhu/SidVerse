// SidVerse - reveal-on-scroll and the theme cross-fade. Sets data-motion on <html>; every rule in motion.css that hides something is scoped to it, so a blocked script leaves the page visible. Off under reduced-motion.

(function () {
  "use strict";

  var reduced = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var supported = "IntersectionObserver" in window &&
    "classList" in document.documentElement;

  // Only claim the page once we know we can finish the job.
  if (!reduced && supported) {
    document.documentElement.setAttribute("data-motion", "");
  }

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  ready(function () {

    // ---- 1. mark what should reveal --------------------------------------
    // Rather than asking every page to add attributes by hand, the blocks a page is built from are collected here. A page that has none of these simply gets no reveals.

    var TARGETS = [
      ".rooms__head", ".room",
      ".section-head", ".section__head",
      ".card", ".mcard", ".fav-card", ".bookcard", ".moviecard",
      ".dish-card", ".place-card", ".trek-card", ".goal-card",
      ".activity-card", ".monument-card", ".stat-card", ".topcard",
      ".kpi-grid", ".featured-journey",
      ".collhead", ".coll__head",
      ".gallery-item",
      ".empty", ".state"
    ].join(",");

    if (!document.documentElement.hasAttribute("data-motion")) return;

    var nodes = [];
    try {
      nodes = Array.prototype.slice.call(document.querySelectorAll(TARGETS));
    } catch (e) {
      return;
    }

    // Anything already on screen at load is shown immediately — a reveal that fires for content the reader is already looking at reads as a flash.
    var vh = window.innerHeight || document.documentElement.clientHeight;

    nodes.forEach(function (el, i) {
      var box = el.getBoundingClientRect();
      var onscreenNow = box.top < vh * 0.9 && box.bottom > 0;

      el.setAttribute("data-reveal", "");

      if (onscreenNow) {
        el.classList.add("is-in");
        return;
      }

      // Stagger within a row, capped so a long grid never stalls.
      var parent = el.parentElement;
      var index = parent ? Array.prototype.indexOf.call(parent.children, el) : i;
      el.style.setProperty("--i", String(Math.min(index % 12, 7)));
    });

    var pending = nodes.filter(function (el) {
      return !el.classList.contains("is-in");
    });

    if (pending.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });

      pending.forEach(function (el) { io.observe(el); });

      // A hard stop: if anything is still hidden a few seconds in — a stalled image, a mis-measured container — it is shown regardless. Content is never allowed to stay invisible because an effect did not fire.
      window.setTimeout(function () {
        pending.forEach(function (el) { el.classList.add("is-in"); });
      }, 4000);
    }


    // ---- 3. theme cross-fade -------------------------------------------
    // The transition is switched on for the length of the change and off again, so it never slows an ordinary hover. The theme itself is still owned by shell.js — this only softens the moment it flips.

    var root = document.documentElement;
    var observer = new MutationObserver(function (records) {
      for (var i = 0; i < records.length; i++) {
        if (records[i].attributeName !== "data-theme") continue;
        root.classList.add("is-theming");
        window.clearTimeout(root._themeTimer);
        root._themeTimer = window.setTimeout(function () {
          root.classList.remove("is-theming");
        }, 380);
      }
    });

    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });


    // ---- 4. a skip link -------------------------------------------------

    var main = document.querySelector("main") || document.querySelector("[role=main]");
    if (main) {
      if (!main.id) main.id = "p-main";
      var skip = document.createElement("a");
      skip.className = "p-skip";
      skip.href = "#" + main.id;
      skip.textContent = "Skip to content";
      document.body.insertBefore(skip, document.body.firstChild);
    }
  });
})();

import { SITE } from "./config.js";
import { fetchDishes, parseDate, shortDate, cdn, prunePending } from "./api.js";
import { learnFromUrls } from "./folders.js";

const $ = s => document.querySelector(s);
const grid = $("#grid");
const chipsEl = $("#chips");
const countEl = $("#count");
const emptyEl = $("#empty");

export const state = { all: [], view: [], cuisine: "All", q: "", sort: "recent", lbIndex: 0 };

const esc = s => String(s || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const num = n => (Math.round(n * 10) / 10).toString();
const line = (...parts) => parts.filter(Boolean).join(" · ");

/* ---------- load ---------- */

export async function init() {
  document.title = `SidVerse - ${SITE.name}`;
  // The shell owns the bar wordmark and the footer, so those nodes may be gone.
  const put = (sel, text) => { const n = $(sel); if (n) n.textContent = text; };
  put("#heroBy", "Photographed, rated and written down.");
  skeletons(8);
  measureTopbar();
  bindControls();
  bindLightbox();
  await load();
}

function measureTopbar() {
  const set = () => document.documentElement.style
    .setProperty("--topbar-h", `${document.querySelector(".topbar").offsetHeight}px`);
  set();
  window.addEventListener("resize", set);
}

async function load() {
  try {
    const rows = await fetchDishes();
    const waiting = prunePending(new Set(rows.map(r => r.image)));
    state.all = waiting.map(hydrate).concat(rows);
    learnFromUrls(state.all.map(d => d.image));
    buildChips();
    fillDatalists();
    paintHero();
    buildReel();
    apply();
  } catch (err) {
    grid.innerHTML = "";
    emptyEl.hidden = false;
    emptyEl.querySelector(".empty__title").textContent = "The log did not load.";
    // err.message is a browser string — "Failed to fetch" tells a reader
    // nothing and reads as a broken page rather than a considered state. The
    // detail still goes to the console for whoever is debugging.
    console.error("Swaad: could not read the sheet —", err);
    emptyEl.querySelector(".empty__note").textContent =
      "The sheet did not answer. It may be offline, or this network may be blocking it. Try again in a moment.";
  }
}

function hydrate(d) {
  return { ...d, ratingNum: parseFloat(d.rating) || 0, dateObj: parseDate(d.date) };
}

/* ---------- filters ---------- */

function bindControls() {
  let t;
  $("#search").addEventListener("input", e => {
    clearTimeout(t);
    t = setTimeout(() => { state.q = e.target.value.toLowerCase().trim(); apply(); }, 160);
  });
  $("#sort").addEventListener("change", e => { state.sort = e.target.value; apply(); });
}

function buildChips() {
  const counts = {};
  state.all.forEach(d => { const c = d.cuisine || "Other"; counts[c] = (counts[c] || 0) + 1; });
  const names = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);

  chipsEl.innerHTML = [`All<b>${state.all.length}</b>`]
    .concat(names.map(n => `${esc(n)}<b>${counts[n]}</b>`))
    .map((label, i) => {
      const value = i === 0 ? "All" : names[i - 1];
      const on = value === state.cuisine ? " is-on" : "";
      return `<button class="chip${on}" data-cuisine="${esc(value)}">${label}</button>`;
    }).join("");

  chipsEl.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
      state.cuisine = chip.dataset.cuisine;
      chipsEl.querySelectorAll(".chip").forEach(c => c.classList.toggle("is-on", c === chip));
      apply();
    });
  });
}

function clearFilters() {
  state.cuisine = "All";
  state.q = "";
  $("#search").value = "";
  chipsEl.querySelectorAll(".chip").forEach((c, i) => c.classList.toggle("is-on", i === 0));
}

function apply() {
  let list = state.all.slice();

  if (state.cuisine !== "All") list = list.filter(d => (d.cuisine || "Other") === state.cuisine);
  if (state.q) {
    list = list.filter(d => [d.dish, d.place, d.location, d.cuisine].join(" ").toLowerCase().includes(state.q));
  }

  const by = {
    recent: (a, b) => (b.dateObj || 0) - (a.dateObj || 0) || b.ratingNum - a.ratingNum,
    rating: (a, b) => b.ratingNum - a.ratingNum || (b.dateObj || 0) - (a.dateObj || 0),
    name: (a, b) => a.dish.localeCompare(b.dish),
    place: (a, b) => (a.place || "").localeCompare(b.place || "") || a.dish.localeCompare(b.dish)
  };
  list.sort(by[state.sort]);

  state.view = list;
  render(list);
}

/* ---------- render ---------- */

function skeletons(n) {
  grid.innerHTML = Array.from({ length: n }, () => `<article class="card card--skeleton"></article>`).join("");
}

function render(list) {
  const total = state.all.length;
  countEl.textContent = list.length === total
    ? `${total} ${total === 1 ? "dish" : "dishes"} tasted`
    : `${list.length} of ${total} dishes`;

  emptyEl.hidden = list.length > 0;
  grid.innerHTML = list.map(cardHTML).join("");

  grid.querySelectorAll(".card").forEach((card, i) => {
    card.style.setProperty("--d", `${Math.min(i, 11) * 45}ms`);
    card.addEventListener("click", () => openLightbox(+card.dataset.i));
    card.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLightbox(+card.dataset.i); }
    });
    const img = card.querySelector("img");
    const done = () => img.classList.add("is-loaded");
    if (img.complete) done();
    else { img.addEventListener("load", done); img.addEventListener("error", done); }
  });

  reveal();
}

function cardHTML(d, i) {
  const r = num(d.ratingNum);
  return `
    <article class="card" data-i="${i}" tabindex="0" role="button" aria-label="${esc(d.dish)}, rated ${r} out of 10">
      <div class="card__top">
        <div class="card__media">
          <img src="${esc(cdn(d.image, "f_auto,q_auto,w_640"))}" alt="${esc(d.dish)}" loading="lazy" decoding="async">
        </div>
        <div class="card__score${d.ratingNum >= 10 ? " is-top" : ""}">${r}</div>
      </div>
      <div class="card__body">
        <p class="card__cuisine">${esc(d.cuisine || "Other")}</p>
        <h3 class="card__title">${esc(d.dish)}</h3>
        <p class="card__place">${esc(d.place)}</p>
        <p class="card__meta"><span>${esc(d.location)}</span><span>${esc(shortDate(d.dateObj) || d.date)}</span></p>
      </div>
    </article>`;
}

function reveal() {
  if (!("IntersectionObserver" in window)) {
    grid.querySelectorAll(".card").forEach(c => c.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      setTimeout(() => e.target.style.setProperty("--d", "0ms"), 900);
      obs.unobserve(e.target);
    });
  }, { rootMargin: "80px" });
  grid.querySelectorAll(".card").forEach(c => io.observe(c));
}

/* ---------- hero ---------- */

function paintHero() {
  const n = state.all.length;
  const dates = state.all.map(d => d.dateObj).filter(Boolean).sort((a, b) => a - b);
  const since = dates.length ? ` · since ${dates[0].toLocaleDateString("en-GB", { month: "short", year: "numeric" })}` : "";

  if (!n) {
    $("#heroStat").textContent = "Nothing logged yet.";
    return;
  }

  const cuisines = new Set(state.all.map(d => d.cuisine || "Other")).size;
  const avg = state.all.reduce((s, d) => s + d.ratingNum, 0) / n;
  $("#heroStat").innerHTML =
    `<b>${n}</b> ${n === 1 ? "dish" : "dishes"}` +
    `<i>·</i><b>${cuisines}</b> ${cuisines === 1 ? "cuisine" : "cuisines"}` +
    `<i>·</i><b>${num(avg)}</b> average`;

  const best = state.all.slice()
    .sort((a, b) => b.ratingNum - a.ratingNum || (b.dateObj || 0) - (a.dateObj || 0))[0];

  const fig = $("#heroTop");
  $("#topImg").src = cdn(best.image, "f_auto,q_auto,w_140,h_140,c_fill");
  $("#topImg").alt = best.dish;
  $("#topScore").textContent = num(best.ratingNum);
  $("#topName").textContent = best.dish;
  $("#topPlace").textContent = line(best.place, best.location);
  fig.hidden = false;
  fig.setAttribute("role", "button");
  fig.setAttribute("tabindex", "0");
  fig.addEventListener("click", () => openDish(best));
  fig.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDish(best); }
  });
}

function buildReel() {
  const track = $("#reelTrack");
  if (!track) return;
  const shots = state.all.slice(0, 22);
  if (shots.length < 6) { track.parentElement.remove(); return; }
  const strip = shots.map(d =>
    `<img src="${esc(cdn(d.image, "f_auto,q_auto,w_220,h_220,c_fill"))}" alt="" loading="lazy">`).join("");
  track.innerHTML = strip + strip;
}

/* ---------- lightbox ---------- */

const cache = new Map();
let paintToken = 0;

const full = d => cdn(d.image, "f_auto,q_auto,w_1400");

// keeping neighbours warm is what makes the arrows feel instant
function warm(i) {
  const d = state.view[(i + state.view.length) % state.view.length];
  if (!d) return;
  const url = full(d);
  if (cache.has(url)) return;
  const img = new Image();
  img.src = url;
  cache.set(url, img);
  if (cache.size > 14) cache.delete(cache.keys().next().value);
}

function bindLightbox() {
  $("#lbClose").addEventListener("click", closeLightbox);
  $("#lbPrev").addEventListener("click", e => { e.stopPropagation(); step(-1); });
  $("#lbNext").addEventListener("click", e => { e.stopPropagation(); step(1); });
  $("#lightbox").addEventListener("click", e => { if (e.target.id === "lightbox") closeLightbox(); });
  document.addEventListener("keydown", e => {
    if ($("#lightbox").hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });
}

function openDish(dish) {
  let i = state.view.findIndex(d => d.image === dish.image);
  if (i < 0) {
    clearFilters();
    apply();
    i = state.view.findIndex(d => d.image === dish.image);
  }
  if (i > -1) openLightbox(i);
}

function openLightbox(i) {
  state.lbIndex = i;
  $("#lightbox").hidden = false;
  document.body.style.overflow = "hidden";
  paintLightbox();
}

function closeLightbox() {
  $("#lightbox").hidden = true;
  document.body.style.overflow = "";
}

function step(dir) {
  state.lbIndex = (state.lbIndex + dir + state.view.length) % state.view.length;
  paintLightbox();
}

async function paintLightbox() {
  const d = state.view[state.lbIndex];
  if (!d) return;

  $("#lbCuisine").textContent = d.cuisine || "Other";
  $("#lbScore").textContent = `${num(d.ratingNum)}/10`;
  $("#lbTitle").textContent = d.dish;
  $("#lbPlace").textContent = line(d.place, d.location);

  const url = full(d);
  const token = ++paintToken;
  warm(state.lbIndex);
  const img = cache.get(url);

  // hold the old frame until the new one is decoded, so arrows never flash empty
  if (img && !img.complete) {
    $("#lbFigure").classList.add("is-loading");
    await img.decode().catch(() => {});
  }
  if (token !== paintToken) return;

  $("#lbImg").src = url;
  $("#lbImg").alt = d.dish;
  $("#lbFigure").classList.remove("is-loading");

  warm(state.lbIndex + 1);
  warm(state.lbIndex - 1);
  warm(state.lbIndex + 2);
}

/* ---------- shared ---------- */

function fillDatalists() {
  const fill = (id, key) => {
    const el = document.getElementById(id);
    if (!el) return;
    const values = [...new Set(state.all.map(d => d[key]).filter(Boolean))].sort();
    el.innerHTML = values.map(v => `<option value="${esc(v)}">`).join("");
  };
  fill("placeList", "place");
  fill("locList", "location");
  fill("cuisineList", "cuisine");
}

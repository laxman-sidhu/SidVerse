// The title screen, shared by all pages. A card carries only what a list endpoint gave, so the full record is fetched here.

import { esc } from "../core/util.js";
import { details } from "../tmdb/queries.js";
import { ratingsFor } from "../omdb/client.js";
import { watched } from "../data/watched.js";
import { watchlist } from "../data/watchlist.js";

const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';
const OUT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-8.5 8.5M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>';

const TICK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4.5 12.5 5 5 10-11"/></svg>';

const BOOKMARK = '<svg viewBox="0 0 24 24" aria-hidden="true">'
  + '<path d="M6 3.5h12a.5.5 0 0 1 .5.5v16.2a.3.3 0 0 1-.47.25L12 16.4l-6.03 4.05a.3.3 0 0 1-.47-.25V4a.5.5 0 0 1 .5-.5Z"/></svg>';

// The score marks are drawn, not fetched, so the strip paints with the page.
const MARK_TMDB = '<svg viewBox="0 0 44 22" aria-hidden="true">'
  + '<defs><linearGradient id="tmdbMark" x1="0" y1="0" x2="1" y2="0">'
  + '<stop offset="0" stop-color="#90cea1"/><stop offset="1" stop-color="#01b4e4"/></linearGradient></defs>'
  + '<rect width="44" height="22" rx="4" fill="url(#tmdbMark)"/>'
  + '<text x="22" y="15.4" text-anchor="middle" fill="#0d253f" font-family="Helvetica,Arial,sans-serif" '
  + 'font-size="10" font-weight="700">TMDB</text></svg>';

const MARK_IMDB = '<svg viewBox="0 0 44 22" aria-hidden="true">'
  + '<rect width="44" height="22" rx="4" fill="#f5c518"/>'
  + '<text x="22" y="15.8" text-anchor="middle" fill="#000000" font-family="Helvetica,Arial,sans-serif" '
  + 'font-size="11" font-weight="700">IMDb</text></svg>';

function markTomato(fresh) {
  const skin = fresh ? "#fa320a" : "#12b76a";
  return '<svg viewBox="0 0 24 24" aria-hidden="true">'
    + `<circle cx="12" cy="14.4" r="7.5" fill="${skin}"/>`
    + '<path d="M12.1 7c-.5-2 .5-3.5 2.7-4.2.2 1.8-.6 3.2-2 4Z" fill="#3f9142"/>'
    + '<path d="M11.3 7C10.1 5.7 8.5 5.4 6.6 6.3c1.2 1.3 2.8 1.8 4.5 1.4Z" fill="#3f9142"/></svg>';
}

function markMetacritic(score) {
  const band = score >= 61 ? "#00ce7a" : score >= 40 ? "#ffbd3f" : "#ff6874";
  return '<svg viewBox="0 0 24 24" aria-hidden="true">'
    + `<rect width="24" height="24" rx="6" fill="${band}"/>`
    + '<text x="12" y="17.2" text-anchor="middle" fill="#0d1117" font-family="Helvetica,Arial,sans-serif" '
    + 'font-size="14" font-weight="700">M</text></svg>';
}

let modal = null;
let body = null;
let requestId = 0;

function instance() {
  if (!modal) {
    const node = document.getElementById("detailModal");
    if (!node) return null;
    body = document.getElementById("detailBody");
    modal = window.bootstrap && window.bootstrap.Modal
      ? new window.bootstrap.Modal(node)
      : null;
    wireHistory(node);
  }
  return modal;
}

// Back should close the modal, not leave the page. One history entry per modal session, pushed on open and taken back off however it closes - so the entry can never outlive the modal and strand a Back press on a page that looks unchanged. The URL is untouched: this is a state, not a location.
let pushed = false;

function wireHistory(node) {
  // show/hidden rather than open(): a jump to a related title re-renders the same modal and must not push a second entry.
  node.addEventListener("show.bs.modal", () => {
    window.history.pushState({ detailModal: true }, "");
    pushed = true;
  });

  node.addEventListener("hidden.bs.modal", () => {
    // Emptying the slot is what stops the audio: a hidden modal would otherwise keep playing.
    closeTrailer();
    if (!pushed) return;   // a popstate closed it, so the entry is already gone
    pushed = false;
    window.history.back();
  });

  window.addEventListener("popstate", () => {
    if (!pushed) return;
    pushed = false;
    if (modal) modal.hide();
  });
}

// Up to two initials: more is unreadable at 76px and one is ambiguous across a cast list.
function initials(name) {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  const letters = words.length === 1
    ? words[0].slice(0, 1)
    : words[0].slice(0, 1) + words[words.length - 1].slice(0, 1);
  return letters.toUpperCase();
}

// A face, or the initials in its place - not the poster placeholder, which would read as a row of missing films.
function faceFor(person) {
  // The initials sit BEHIND the photo: an <img> with an empty alt draws nothing when it fails, so the letters show through with no error handler.
  const ini = `<span class="detail__face-ini">${esc(initials(person.name))}</span>`;
  const photo = person.profile
    ? `<img src="${esc(person.profile)}" alt="" loading="lazy" decoding="async">`
    : "";
  return `<span class="detail__face" aria-hidden="true">${ini}${photo}</span>`;
}

function prettyDate(date) {
  const parsed = new Date(`${date}T00:00:00`);
  // TMDB dates are occasionally partial or malformed, so show the raw string rather than "Invalid Date".
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function compact(count) {
  if (!count) return "0";
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${Math.round(count / 1000)}k`;
  return String(count);
}

function money(value) {
  if (!value) return null;
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(2)}B`;
  if (value >= 1000000) return `$${Math.round(value / 1000000)}M`;
  return `$${value.toLocaleString()}`;
}

function runtimeLabel(minutes) {
  if (!minutes) return "";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}h ${rest ? `${rest}m` : ""}`.trim() : `${rest}m`;
}

// --- the scores -------------------------------------------------------------

function scoreTile(tile) {
  const inner = `<span class="detail__score-mark">${tile.mark}</span>`
    + '<span class="detail__score-body">'
    + `<span class="detail__score-value">${esc(tile.value)}`
    + (tile.scale ? `<i>${esc(tile.scale)}</i>` : "")
    + "</span>"
    + `<span class="detail__score-meta">${esc(tile.meta)}</span>`
    + "</span>";
  return tile.href
    ? `<a class="detail__score" href="${esc(tile.href)}" target="_blank" rel="noopener">${inner}</a>`
    : `<span class="detail__score">${inner}</span>`;
}

function hasScore(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function scoreStrip(item, extra) {
  const tiles = [];

  if (item.rating > 0) {
    tiles.push(scoreTile({
      mark: MARK_TMDB,
      value: item.rating.toFixed(1),
      scale: "/ 10",
      meta: `${compact(item.vote_count)} votes`,
      href: `https://www.themoviedb.org/${item.media_type}/${item.id}`
    }));
  }

  if (extra && hasScore(extra.imdb)) {
    tiles.push(scoreTile({
      mark: MARK_IMDB,
      value: extra.imdb.toFixed(1),
      scale: "/ 10",
      meta: extra.imdb_votes ? `${compact(extra.imdb_votes)} votes` : "IMDb rating",
      href: item.imdb_id ? `https://www.imdb.com/title/${item.imdb_id}/ratings/` : ""
    }));
  }

  if (extra && hasScore(extra.tomatoes)) {
    const fresh = extra.tomatoes >= 60;
    tiles.push(scoreTile({
      mark: markTomato(fresh),
      value: `${Math.round(extra.tomatoes)}%`,
      meta: fresh ? "Fresh \u00b7 Rotten Tomatoes" : "Rotten \u00b7 Rotten Tomatoes"
    }));
  }

  if (extra && hasScore(extra.metacritic)) {
    tiles.push(scoreTile({
      mark: markMetacritic(extra.metacritic),
      value: String(Math.round(extra.metacritic)),
      scale: "/ 100",
      meta: "Metascore"
    }));
  }

  return tiles.join("");
}

// --- where to watch ---------------------------------------------------------

// Four fits exactly one row at the column's width, and TMDB already orders these by how much they matter.
const PROVIDERS_PER_GROUP = 4;

function watchColumn(item) {
  const offer = item.providers;
  if (!offer) return "";

  const rows = offer.groups.map(group =>
    '<div class="detail__watch-row">'
    + `<span class="detail__watch-kind">${esc(group.label)}</span>`
    + '<div class="detail__watch-logos">'
    + group.items.slice(0, PROVIDERS_PER_GROUP).map(provider =>
      `<span class="detail__provider" title="${esc(provider.name)}">`
      + (provider.logo
        ? `<img src="${esc(provider.logo)}" alt="${esc(provider.name)}" loading="lazy" decoding="async">`
        : `<span class="detail__provider-alt">${esc(provider.name)}</span>`)
      + "</span>").join("")
    + "</div></div>").join("");

  return '<aside class="detail__watchcol">'
    + '<p class="detail__label">Available on</p>'
    + `<div class="detail__watch">${rows}</div>`
    + "</aside>";
}

// --- the page ---------------------------------------------------------------

function numbersGrid(item, isTv) {
  const cells = [
    { key: isTv ? "First aired" : "Release date", value: item.release_date ? prettyDate(item.release_date) : "-" },
    { key: isTv ? "Episode length" : "Runtime", value: item.runtime ? runtimeLabel(item.runtime) : "-" },
    { key: isTv ? "Created by" : "Director", value: (item.directors || []).map(person => person.name).join(", ") || "-" }
  ];

  if (isTv) {
    cells.push({ key: "Seasons", value: item.seasons ? String(item.seasons) : "-" });
    cells.push({ key: "Episodes", value: item.episodes ? String(item.episodes) : "-" });
  } else {
    cells.push({ key: "Budget", value: item.budget ? money(item.budget) : "-" });
    cells.push({ key: "Box office", value: item.revenue ? money(item.revenue) : "-", slot: "revenue" });
  }

  cells.push({ key: "Status", value: item.status || "-" });

  return cells.map(cell =>
    '<div class="detail__cell">'
    + `<span class="detail__cell-key">${esc(cell.key)}</span>`
    + `<span class="detail__cell-val"${cell.slot ? ` data-cell="${cell.slot}"` : ""}>${esc(cell.value)}</span>`
    + "</div>").join("");
}

function render(item) {
  const isTv = item.media_type === "tv";
  const seen = item.watched === true;
  // The queue state belongs here too - this screen is the other place a title is looked at.
  const queued = !seen && item.watchlisted === true;
  const kind = isTv ? "Web series" : "Film";

  const heroStyle = item.backdrop ? `background-image:url('${esc(item.backdrop)}')` : "";

  const flags = [];
  if (seen) flags.push(`<span class="detail__flag detail__flag--seen">${TICK}Already watched</span>`);
  if (queued) flags.push(`<span class="detail__flag detail__flag--listed">${BOOKMARK}On the watchlist</span>`);

  const facts = [];
  if (item.year) facts.push(`<span>${item.year}</span>`);
  if (item.runtime) facts.push(`<span>${runtimeLabel(item.runtime)}${isTv ? " per ep" : ""}</span>`);
  if (item.language) facts.push(`<span>${esc(item.language)}</span>`);
  if (isTv && item.seasons) facts.push(`<span>${item.seasons} season${item.seasons === 1 ? "" : "s"}</span>`);

  // Trailer first and the reference links after. The phone grid rule relies on .btn-solid being the only solid button here.
  const buttons = [];
  if (item.trailer) {
    buttons.push(`<button type="button" class="btn-solid" data-trailer="${esc(item.trailer.key)}">`
      + `${PLAY}Watch trailer</button>`);
  }
  if (item.imdb_id) {
    buttons.push(`<a class="btn-outline" href="https://www.imdb.com/title/${esc(item.imdb_id)}/" `
      + `target="_blank" rel="noopener">${OUT}IMDb</a>`);
  }
  buttons.push(`<a class="btn-outline" href="https://www.themoviedb.org/${item.media_type}/${item.id}" `
    + `target="_blank" rel="noopener">${OUT}TMDB</a>`);
  if (item.homepage) {
    buttons.push(`<a class="btn-outline" href="${esc(item.homepage)}" target="_blank" rel="noopener">`
      + `${OUT}Official site</a>`);
  }

  const genres = (item.genres || [])
    .map(genre => `<span class="detail__chip">${esc(genre)}</span>`).join("");

  const seasons = (item.season_list || []).slice(0, 8)
    .map(season => `<span class="detail__chip">${esc(season.name)}${season.episodes ? ` \u00b7 ${season.episodes} ep` : ""}</span>`)
    .join("");

  const cast = (item.cast || []).map(person =>
    '<div class="detail__person">'
    + faceFor(person)
    + `<span class="detail__person-name">${esc(person.name)}</span>`
    + (person.character ? `<span class="detail__person-role">${esc(person.character)}</span>` : "")
    + "</div>").join("");

  const similar = (item.similar || []).map(other =>
    `<button type="button" class="detail__similar" data-jump="${other.id}" data-jump-media="${esc(other.media_type)}">`
    + '<span class="detail__similar-art">'
    + `<span class="detail__similar-alt">${esc(other.title)}</span>`
    + (other.poster ? `<img src="${esc(other.poster)}" alt="" loading="lazy">` : "")
    + "</span>"
    + `<span>${esc(other.title)}</span>`
    + (other.watched ? `<span class="detail__similar-seen">${TICK}</span>` : "")
    + "</button>").join("");

  // The strip opens on TMDB alone and fills out when OMDb answers.
  const waiting = item.imdb_id ? " is-waiting" : "";

  return ''
    + `<div class="detail__hero${item.backdrop ? "" : " is-blank"}" style="${heroStyle}"></div>`
    + '<div class="detail__head">'
    + `<span class="detail__poster${seen ? " is-watched" : ""}">`
    + `<span class="detail__poster-alt">${esc(item.title)}</span>`
    + (item.poster ? `<img src="${esc(item.poster)}" alt="" loading="lazy">` : "")
    + "</span>"
    + '<div class="detail__headline">'
    + '<div class="detail__meta">'
    + `<span class="detail__kind">${kind}</span>`
    + flags.join("")
    + "</div>"
    + `<h2 class="detail__title" id="modalTitle">${esc(item.title)}</h2>`
    + (item.original_title && item.original_title !== item.title
      ? `<p class="detail__original">${esc(item.original_title)}</p>` : "")
    + (item.tagline ? `<p class="detail__tagline">${esc(item.tagline)}</p>` : "")
    + `<div class="detail__facts">${facts.join('<span class="dot">/</span>')}</div>`
    + `<div class="detail__scores${waiting}" data-scores>${scoreStrip(item, null)}</div>`
    + `<div class="detail__actions">${buttons.join("")}</div>`
    + "</div>"
    + watchColumn(item)
    + "</div>"

    + '<div class="detail__main">'
    + '<div class="detail__section" id="trailerSlot"></div>'
    + '<section class="detail__section">'
    + '<p class="detail__label">Overview</p>'
    + `<p class="detail__overview">${esc(item.overview || "TMDB has no overview for this one yet.")}</p>`
    + "</section>"
    + (genres ? `<section class="detail__section"><p class="detail__label">Genres</p><div class="detail__chips">${genres}</div></section>` : "")
    + `<section class="detail__section"><p class="detail__label">The numbers</p><div class="detail__grid">${numbersGrid(item, isTv)}</div></section>`
    + '<section class="detail__section" data-awards-section hidden>'
    + '<p class="detail__label">Awards</p>'
    + '<p class="detail__awards" data-awards></p></section>'
    + (seasons ? `<section class="detail__section"><p class="detail__label">Seasons</p><div class="detail__chips">${seasons}</div></section>` : "")
    + (cast ? `<section class="detail__section"><p class="detail__label">Cast</p><div class="detail__people">${cast}</div></section>` : "")
    + (similar ? `<section class="detail__section"><p class="detail__label">More like this</p><div class="detail__similars">${similar}</div></section>` : "")
    + "</div>";
}

// Everything OMDb adds, patched into the slots the first render left open.
async function decorate(item) {
  const ticket = requestId;
  const extra = item.imdb_id ? await ratingsFor(item.imdb_id) : null;
  if (ticket !== requestId || !body) return;

  const strip = body.querySelector("[data-scores]");
  if (strip) {
    strip.classList.remove("is-waiting");
    strip.innerHTML = scoreStrip(item, extra);
  }
  if (!extra) return;

  // TMDB's revenue is worldwide and wins. OMDb's is the US gross, and only stands in where there is nothing.
  const gross = body.querySelector('[data-cell="revenue"]');
  if (gross && !item.revenue && extra.box_office) gross.textContent = `${money(extra.box_office)} (US)`;

  const awards = body.querySelector("[data-awards]");
  if (awards && extra.awards) {
    awards.textContent = extra.awards;
    const section = body.querySelector("[data-awards-section]");
    if (section) section.hidden = false;
  }
}

// A pointer can hover and a finger cannot: the only reliable touch signal that is not user-agent sniffing.
function isTouch() {
  return window.matchMedia("(hover: none)").matches;
}

function openTrailer(key) {
  const slot = document.getElementById("trailerSlot");
  if (!slot) return;
  // The close button sits ABOVE the video: inside the frame it fought YouTube's own controls for the same corner.
  slot.innerHTML = '<div class="detail__trailer">'
    + '<div class="detail__trailer-bar">'
    + '<span class="detail__trailer-label">Trailer</span>'
    + '<button type="button" class="detail__trailer-close" data-trailer-close '
    + 'aria-label="Close the trailer" title="Close the trailer">'
    + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>'
    + "</button></div>"
    + '<div class="detail__video">'
    + `<iframe src="https://www.youtube.com/embed/${esc(key)}?autoplay=1" title="Trailer" `
    + 'allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture" '
    + 'allowfullscreen loading="lazy"></iframe></div></div>';
  // Guarded: not every environment implements it, and failing to scroll must not stop the video playing.
  if (typeof slot.scrollIntoView === "function") {
    slot.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function closeTrailer() {
  const slot = document.getElementById("trailerSlot");
  // Emptying the slot is what stops the audio; hiding would leave it playing behind a closed panel.
  if (slot) slot.innerHTML = "";
}

function wire() {
  if (!body || body.dataset.wired) return;
  body.dataset.wired = "1";

  body.addEventListener("click", event => {
    const trailer = event.target.closest("[data-trailer]");
    if (trailer) {
      openTrailer(trailer.dataset.trailer);
      return;
    }

    if (event.target.closest("[data-trailer-close]")) {
      closeTrailer();
      return;
    }

    // A click elsewhere closes the video on a pointer device but NOT on touch, where a stray thumb would kill it mid-scene.
    const slot = document.getElementById("trailerSlot");
    if (!isTouch() && slot && slot.firstChild && !event.target.closest(".detail__trailer")) {
      closeTrailer();
    }

    const jump = event.target.closest("[data-jump]");
    if (jump) open(jump.dataset.jump, jump.dataset.jumpMedia);
  });
}

export async function open(itemId, media) {
  const shell = instance();
  if (!shell || !body) return;

  wire();
  const ticket = ++requestId;

  body.innerHTML = '<div class="detail__loading"><span class="spinner"></span><p>Loading the details\u2026</p></div>';
  shell.show();

  try {
    const item = await details(itemId, media);
    if (ticket !== requestId) return;   // a later click won

    watched.annotate(item);
    watchlist.annotate(item);
    item.similar = watchlist.annotateAll(watched.annotateAll(item.similar || []));

    body.innerHTML = render(item);
    // A jump to a related title must start at the top rather than mid-page.
    body.scrollTop = 0;
    decorate(item);
  } catch (error) {
    if (ticket !== requestId) return;
    body.innerHTML = '<div class="detail__loading"><p><strong>Could not load that title.</strong></p>'
      + `<p>${esc(error.message)}</p></div>`;
  }
}

// In-card controls that must not open the card. stopPropagation is not enough: the card handler is on the same element and registered first.
const IN_CARD = ".cardact, .card__note";

// The "what my sheet calls it" tip: hover on a pointer device, the (i) button on touch, and tapping again closes it.
let noteWired = false;

function wireNotes() {
  if (noteWired) return;
  noteWired = true;

  document.addEventListener("click", event => {
    const button = event.target.closest(".card__note");

    document.querySelectorAll('.card__note[aria-expanded="true"]').forEach(open => {
      if (open !== button) open.setAttribute("aria-expanded", "false");
    });

    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    const showing = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", showing ? "false" : "true");
  });

  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    document.querySelectorAll('.card__note[aria-expanded="true"]')
      .forEach(open => open.setAttribute("aria-expanded", "false"));
  });
}

export function attach(container, { onOpen } = {}) {
  if (!container) return;
  wireNotes();

  container.addEventListener("click", event => {
    if (event.target.closest(IN_CARD)) return;
    const card = event.target.closest(".card");
    if (!card) return;
    if (onOpen) onOpen(card);
    open(card.dataset.id, card.dataset.media);
  });

  container.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (event.target.closest(IN_CARD)) return;
    const card = event.target.closest(".card");
    if (!card) return;
    event.preventDefault();
    open(card.dataset.id, card.dataset.media);
  });
}

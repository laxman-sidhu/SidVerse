// The browse filters. NOT a sieve over the last result set - each pick runs a fresh discover query across the whole catalogue.

import * as tmdb from "../tmdb/client.js";
import { discover } from "../tmdb/queries.js";
import { BROWSE_PAGES } from "../config.js";

const TV = "tv";

// Every key the browse form understands. Anything else is dropped on arrival.
const KEYS = ["genre", "language", "year", "sort", "rating"];

// The three that take more than one value at a time.
const MULTI_KEYS = ["genre", "language", "year"];

// A ceiling on each field, and on the queries a selection can fan out into.
const MAX_PICKS = 4;
const MAX_VARIANTS = 6;

const OLDEST_YEAR = 1950;
const FUTURE_YEARS = 2;

// popularity is what discover does when asked for nothing, so it is the one sort that means "no sort".
export const DEFAULT_SORT = "popularity";

const SORTS = [
  { value: "popularity", label: "Most popular" },
  { value: "rating", label: "Highest rated" },
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "revenue", label: "Biggest box office" }
];

const RATINGS = [
  { value: "5", label: "5+" },
  { value: "6", label: "6+" },
  { value: "7", label: "7+" },
  { value: "8", label: "8+" }
];

// Languages worth offering. The full TMDB list is ~190 entries, and a dropdown that long is not a control.
const LANGUAGE_ORDER = [
  "hi", "en", "ta", "te", "ml", "kn", "mr", "bn", "pa", "gu",
  "ko", "ja", "zh", "es", "fr", "de", "it", "ru", "tr", "th", "ar", "fa"
];

function text(value) {
  return String(value == null ? "" : value).trim();
}

// One value or several: a multi field arrives as an array and everything else as a string, and both are read the same way here.
function values(raw) {
  const list = Array.isArray(raw) ? raw : [raw];
  const out = [];
  for (const entry of list) {
    const value = text(entry).slice(0, 40);
    if (value && !out.includes(value)) out.push(value);
  }
  return out.slice(0, MAX_PICKS);
}

export function valuesFor(selection, key) {
  return values((selection || {})[key]);
}

async function genreOptions(media) {
  try {
    const { list } = await tmdb.genreLookup(media);
    return list.map(genre => ({ value: genre.name, label: genre.name }));
  } catch {
    return [];
  }
}

async function languageOptions() {
  await tmdb.loadLanguageNames();
  return LANGUAGE_ORDER.map(code => ({
    value: code,
    label: tmdb.languageLabel(code)
  }));
}

function yearOptions() {
  const now = new Date().getFullYear();
  const out = [];
  for (let year = now + FUTURE_YEARS; year >= OLDEST_YEAR; year--) {
    out.push({ value: String(year), label: String(year) });
  }
  return out;
}

export async function filterOptions(media) {
  const kind = tmdb.cleanMedia(media);
  const [genres, languages] = await Promise.all([genreOptions(kind), languageOptions()]);

  // A series has no box office, and an option that silently means something else is worse than one that is not there.
  const sorts = kind === TV ? SORTS.filter(entry => entry.value !== "revenue") : SORTS;

  return {
    noun: kind === TV ? "series" : "movies",
    groups: [
      { key: "genre", label: "Genre", all_label: "All Genres", multi: true, options: genres },
      { key: "language", label: "Language", all_label: "All Languages", multi: true, options: languages },
      { key: "year", label: "Year", all_label: "All Years", multi: true, options: yearOptions() },
      { key: "rating", label: "Rating", all_label: "Any Rating", options: RATINGS },
      { key: "sort", label: "Sort", all_label: "Most popular", options: sorts }
    ]
  };
}

export function cleanSelection(raw) {
  if (!raw || typeof raw !== "object") return {};
  const out = {};
  for (const key of KEYS) {
    const list = values(raw[key]);
    if (!list.length) continue;
    out[key] = MULTI_KEYS.includes(key) ? list : list[0];
  }
  return out;
}

// Chips drop one value at a time, so a key only leaves once its last value has gone.
export function without(selection, key, value) {
  const out = { ...(selection || {}) };
  const left = values(out[key]).filter(entry => entry !== value);
  if (!left.length) delete out[key];
  else out[key] = MULTI_KEYS.includes(key) ? left : left[0];
  return out;
}

// A sort on its own is a real query: "Biggest box office" used to fall through to the trending feed. popularity stays the exception.
export function isActive(selection) {
  const chosen = selection || {};
  if (["genre", "language", "year", "rating"].some(key => values(chosen[key]).length)) return true;
  const sort = text(chosen.sort);
  return Boolean(sort) && sort !== DEFAULT_SORT;
}

// What a chip should say - "revenue" is the API's word and means nothing to anyone reading it.
export function labelFor(key, value) {
  const wanted = text(value);
  if (!wanted) return "";
  if (key === "sort") {
    const found = SORTS.find(entry => entry.value === wanted);
    return found ? found.label : wanted;
  }
  if (key === "language") return tmdb.languageLabel(wanted);
  if (key === "rating") return `${wanted}+`;
  return wanted;
}

// Each genre is kept, rewritten to the other catalogue's name for it, or removed and reported by name.
export async function resolve(selection, media) {
  const kind = tmdb.cleanMedia(media);
  const usable = { ...(selection || {}) };
  const dropped = [];

  const wanted = values(usable.genre);
  if (wanted.length) {
    const kept = [];
    for (const name of wanted) {
      const genreId = await tmdb.resolveGenre(name, kind);
      if (genreId === null) {
        dropped.push(name);
        continue;
      }
      const canonical = await tmdb.genreNamesFor([genreId], kind);
      const label = canonical.length ? canonical[0] : name;
      if (!kept.includes(label)) kept.push(label);
    }
    if (kept.length) usable.genre = kept;
    else delete usable.genre;
  }

  return { selection: usable, dropped };
}

// TMDB takes one release year per query, so years next to each other collapse into a single date range and only the gaps cost an extra call.
function yearRuns(years) {
  const sorted = years.map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  const runs = [];
  for (const year of sorted) {
    const last = runs[runs.length - 1];
    if (last && year === last.to + 1) last.to = year;
    else runs.push({ from: year, to: year });
  }
  return runs;
}

// Round robin rather than end to end, so a second language is not buried under the whole of the first.
function merge(sets) {
  const out = [];
  const seen = new Set();
  const longest = Math.max(0, ...sets.map(set => set.length));

  for (let index = 0; index < longest; index++) {
    for (const set of sets) {
      const item = set[index];
      if (!item || seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
    }
  }

  // There is more to ask for as long as any one query still has pages left.
  out.exhausted = sets.every(set => set.exhausted);
  return out;
}

export async function browse(selection, media, { page = 1, pages = BROWSE_PAGES } = {}) {
  const kind = tmdb.cleanMedia(media);
  const genres = values(selection.genre);
  const languages = values(selection.language);
  const runs = yearRuns(values(selection.year));
  const rating = parseFloat(text(selection.rating));

  const base = {
    media: kind,
    // Several genres go into one query as an OR; discover joins them with a pipe.
    genreNames: genres.length ? genres : null,
    minRating: Number.isNaN(rating) ? null : rating,
    sort: text(selection.sort) || DEFAULT_SORT,
    startPage: page,
    pages
  };

  // Language and year take a single value each, so those are the two that fan out and are merged back together.
  const variants = [];
  for (const language of languages.length ? languages : [null]) {
    for (const run of runs.length ? runs : [null]) {
      const spread = run && run.from !== run.to;
      variants.push({
        ...base,
        language,
        year: run && !spread ? run.from : null,
        yearFrom: spread ? run.from : null,
        yearTo: spread ? run.to : null
      });
    }
  }

  const found = await Promise.all(
    variants.slice(0, MAX_VARIANTS).map(variant => discover(variant))
  );
  return found.length === 1 ? found[0] : merge(found);
}

export function describe(selection, media) {
  const kind = tmdb.cleanMedia(media);
  const noun = kind === TV ? "series" : "movies";
  const bits = [];

  const sort = text(selection.sort);
  if (sort === "rating") bits.push("Highest rated");
  else if (sort === "newest") bits.push("Newest");
  else if (sort === "oldest") bits.push("Oldest");
  else if (sort === "revenue") bits.push("Biggest");
  else bits.push("Popular");

  const languages = values(selection.language);
  if (languages.length) bits.push(languages.map(code => tmdb.languageLabel(code)).join(" / "));

  const genres = values(selection.genre);
  if (genres.length) bits.push(genres.join(" / "));

  bits.push(noun);

  const rating = text(selection.rating);
  if (rating) bits.push(`rated ${rating}+`);

  const years = values(selection.year);
  if (years.length) bits.push(`from ${years.join(", ")}`);

  return bits.join(" ");
}

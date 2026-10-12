// SidPicks - the data layer. Reads the one published SidPicks tab as CSV, matches columns by header name and sorts every row into its collection by the Category column. Cached in sessionStorage so moving between pages never refetches the sheet.

import { CONFIG, sameCategory, registerCategories } from "./config.js";
import { parseCsv } from "./utils.js";

const CACHE_KEY = "sidpicks:sheet:v2";
const CACHE_TTL = 5 * 60 * 1000;

// Header text -> field. Add a spelling here if a column is ever renamed.
const COLUMNS = {
  name: ["name", "title", "exhibit"],
  images: ["image url", "image urls", "images", "image", "photo", "photos", "picture"],
  industry: ["industry", "universe", "from", "studio"],
  category: ["category", "collection", "wing", "type"],
};

const norm = (text) => String(text || "").replace(/﻿/g, "").replace(/\s+/g, " ").trim().toLowerCase();

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { time, rows } = JSON.parse(raw);
    return Date.now() - time > CACHE_TTL ? null : rows;
  } catch {
    return null;
  }
}

function writeCache(rows) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), rows }));
  } catch {
    // Caching is best-effort only.
  }
}

// The first column naming a field wins.
function mapColumns(header) {
  const map = {};
  header.forEach((cell, index) => {
    const label = norm(cell);
    for (const [field, names] of Object.entries(COLUMNS)) {
      if (map[field] === undefined && names.includes(label)) { map[field] = index; break; }
    }
  });
  return map;
}

// A cell may hold one image URL or many, one per line.
function normaliseRows(table) {
  if (!table.length) return [];
  const map = mapColumns(table[0]);
  const at = (cells, field) => (map[field] === undefined ? "" : String(cells[map[field]] || "").trim());

  return table.slice(1).map((cells) => {
    const images = at(cells, "images").split(/[\r\n]+/).map((url) => url.trim()).filter((url) => /^https?:\/\//i.test(url));
    return { name: at(cells, "name"), images, image: images[0] || "", industry: at(cells, "industry"), category: at(cells, "category") };
  }).filter((row) => row.name);
}

let inflight = null;

// Every row in the tab, once per page load.
export async function fetchSheet() {
  const cached = readCache();
  if (cached) return cached;
  if (!inflight) {
    inflight = fetch(CONFIG.sheetUrl, { redirect: "follow" })
      .then((response) => {
        if (!response.ok) throw new Error(`Sheet request failed with status ${response.status}`);
        return response.text();
      })
      .then((text) => {
        const rows = normaliseRows(parseCsv(text));
        writeCache(rows);
        return rows;
      })
      .finally(() => { inflight = null; });
  }
  return inflight;
}

// Wings the sheet names but the config does not are added before anything is drawn from them.
export async function loadCategories() {
  const rows = await fetchSheet();
  const grew = registerCategories(rows.map((row) => row.category));
  return { rows, grew };
}

// One collection's exhibits.
export async function fetchCategory(category) {
  const rows = await fetchSheet();
  return rows.filter((row) => sameCategory(category, row.category));
}

// Every collection, keyed by slug. A failed sheet marks each card unavailable rather than rejecting.
export async function fetchAllCategories() {
  const results = new Map();
  let grew = false;
  try {
    const loaded = await loadCategories();
    grew = loaded.grew;
    CONFIG.categories.forEach((category) => {
      results.set(category.slug, { ok: true, exhibits: loaded.rows.filter((row) => sameCategory(category, row.category)) });
    });
  } catch {
    CONFIG.categories.forEach((category) => results.set(category.slug, { ok: false, exhibits: [] }));
  }
  return { results, grew };
}

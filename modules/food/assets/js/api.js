import { CSV_URL } from "./config.js";

const MONTHS = ["january","february","march","april","may","june","july","august","september","october","november","december"];

const KEYS = {
  dish: "dish",
  where: "place",
  location: "location",
  imageurl: "image",
  image: "image",
  photo: "image",
  datetried: "date",
  date: "date",
  rating10: "rating",
  rating: "rating",
  cuisine: "cuisine",
  notes: "notes"
};

const norm = s => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

// handles quoted fields, escaped quotes and newlines inside cells
export function parseCSV(text) {
  const rows = [];
  let row = [], field = "", quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += c;
    } else if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n") {
      row.push(field); rows.push(row); row = []; field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

export function rowsToDishes(rows) {
  if (!rows.length) return [];
  const head = rows[0].map(h => KEYS[norm(h)] || norm(h));

  return rows.slice(1).map(r => {
    const o = {};
    head.forEach((k, i) => { o[k] = (r[i] || "").trim(); });
    o.ratingNum = parseFloat(o.rating) || 0;
    o.dateObj = parseDate(o.date);
    return o;
  }).filter(d => d.dish && d.image);
}

export function parseDate(str) {
  if (!str) return null;
  const s = str.trim();

  const long = s.match(/^(\d{1,2})\s+([A-Za-z]+),?\s+(\d{4})$/);
  if (long) {
    const m = MONTHS.indexOf(long[2].toLowerCase());
    if (m > -1) return new Date(+long[3], m, +long[1]);
  }
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);

  const d = new Date(s);
  return isNaN(d) ? null : d;
}

export function shortDate(d) {
  if (!d) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ask Cloudinary for a lighter, right-sized file
export function cdn(url, transform) {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  if (/\/upload\/[a-z]_/.test(url)) return url;
  return url.replace("/upload/", `/upload/${transform}/`);
}

// The published CSV is the only source; the cache-buster keeps a fresh edit from waiting on the browser.
export async function fetchDishes() {
  const res = await fetch(`${CSV_URL}&t=${Date.now()}`);
  if (!res.ok) throw new Error("Could not reach the sheet");
  return rowsToDishes(parseCSV(await res.text()));
}

import { CSV_URL, APPS_SCRIPT_URL, READ_FROM } from "./config.js";

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

// "2026-08-12" -> "12 August 2026", matching what is already in the sheet
export function formatDate(iso) {
  const d = parseDate(iso);
  if (!d) return iso;
  const month = MONTHS[d.getMonth()];
  return `${d.getDate()} ${month[0].toUpperCase() + month.slice(1)} ${d.getFullYear()}`;
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

export const isScriptReady = () => /^https:\/\/script\.google\.com\//.test(APPS_SCRIPT_URL);

export async function fetchDishes() {
  if (READ_FROM === "script" && isScriptReady()) {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=list&t=${Date.now()}`);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "Could not read the sheet");
    return rowsToDishes(data.rows);
  }
  const res = await fetch(`${CSV_URL}&t=${Date.now()}`);
  if (!res.ok) throw new Error("Could not reach the sheet");
  return rowsToDishes(parseCSV(await res.text()));
}

// a new row takes a few minutes to reach the published CSV, so hold it locally until then
const PENDING = "swaad:pending";

export function readPending() {
  try { return JSON.parse(localStorage.getItem(PENDING) || "[]"); }
  catch (_) { return []; }
}

export function addPending(dish) {
  const list = readPending();
  list.unshift(dish);
  localStorage.setItem(PENDING, JSON.stringify(list));
}

export function prunePending(liveImages) {
  const waiting = readPending().filter(d => !liveImages.has(d.image));
  localStorage.setItem(PENDING, JSON.stringify(waiting));
  return waiting;
}

// text/plain keeps this a simple request, so Apps Script answers without a preflight
export async function post(body) {
  if (!isScriptReady()) throw new Error("Apps Script URL is not set in config.js");
  const res = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body),
    redirect: "follow"
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "The sheet rejected that");
  return data;
}

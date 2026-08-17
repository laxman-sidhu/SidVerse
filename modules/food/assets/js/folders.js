import { CLOUDINARY } from "./config.js";
import { post } from "./api.js";

const STORE = "swaad:folders";
const base = () => CLOUDINARY.baseFolder;

let paths = new Set(load());

function load() {
  try { return JSON.parse(localStorage.getItem(STORE) || "[]"); }
  catch (_) { return []; }
}

function save() {
  localStorage.setItem(STORE, JSON.stringify([...paths]));
}

export function addPath(path) {
  const clean = path.split("/").filter(Boolean).join("/");
  if (clean && clean !== base()) paths.add(clean);
}

export function childrenOf(path) {
  const prefix = `${path}/`;
  const kids = new Set();
  paths.forEach(p => {
    if (!p.startsWith(prefix)) return;
    const rest = p.slice(prefix.length);
    if (rest) kids.add(rest.split("/")[0]);
  });
  return [...kids].sort((a, b) => a.localeCompare(b));
}

// existing photo links already carry their folder, so read the structure off them
export function learnFromUrls(urls) {
  urls.forEach(url => {
    const match = String(url).match(/\/upload\/(.+)$/);
    if (!match) return;
    const parts = match[1].split("/")
      .filter(p => !/^v\d+$/.test(p))
      .filter((p, i) => !(i === 0 && /(^|,)[a-z]{1,3}_[^/]/.test(p)));
    parts.pop();
    const path = parts.join("/");
    if (path.startsWith(`${base()}/`)) addPath(path);
  });
  save();
}

export async function listChildren(path, password) {
  try {
    const res = await post({ action: "folders", password, path });
    (res.folders || []).forEach(name => addPath(`${path}/${name}`));
    save();
    return true;
  } catch (_) {
    return false;
  }
}

// Cloudinary makes the folder on first upload anyway, so a failed create is not fatal
export async function createFolder(path, password) {
  addPath(path);
  save();
  try {
    await post({ action: "createFolder", password, path });
    return true;
  } catch (_) {
    return false;
  }
}

const SHEET_ID = "1feutMD3Idg8OTc8fBBKnquIPxRD-pj0Wg6BSgrQpPK0";
const SHEET_NAME = "";
const ADMIN_PASSWORD = "CHANGE_THIS_PASSWORD";
const CLOUDINARY_CLOUD_NAME = "dadtqawh5";
const CLOUDINARY_API_KEY = "534744288219611";
// leave this empty and set CLOUDINARY_API_SECRET in Project Settings > Script Properties
const CLOUDINARY_API_SECRET = "";

// Script Properties win over the constants above, so secrets can stay out of the file
function setting(name, fallback) {
  const value = PropertiesService.getScriptProperties().getProperty(name);
  return value || fallback;
}

function sheet() {
  const book = SpreadsheetApp.openById(SHEET_ID);
  return (SHEET_NAME && book.getSheetByName(SHEET_NAME)) || book.getSheets()[0];
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || "";
  if (action === "list") return out({ ok: true, rows: readRows() });
  return out({ ok: true, message: "Swaad backend is running" });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    if (body.password !== setting("ADMIN_PASSWORD", ADMIN_PASSWORD)) {
      return out({ ok: false, error: "That password does not match." });
    }

    if (body.action === "auth") return out({ ok: true });
    if (body.action === "add") return out(addDish(body.dish));
    if (body.action === "signature") return out(signUpload(body.params));
    if (body.action === "folders") return out(listFolders(body.path));
    if (body.action === "createFolder") return out(makeFolder(body.path));

    return out({ ok: false, error: "Unknown action: " + body.action });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}

function readRows() {
  const values = sheet().getDataRange().getDisplayValues();
  return values.filter(row => row.join("").trim() !== "");
}

function addDish(dish) {
  if (!dish || !dish.dish || !dish.image) return { ok: false, error: "Dish name and photo are required." };

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    const sh = sheet();
    const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];

    const map = {
      dish: dish.dish,
      where: dish.place,
      location: dish.location,
      imageurl: dish.image,
      image: dish.image,
      datetried: dish.date,
      date: dish.date,
      rating10: Number(dish.rating) || "",
      rating: Number(dish.rating) || "",
      cuisine: dish.cuisine
    };

    const row = headers.map(function (h) {
      const key = String(h).toLowerCase().replace(/[^a-z0-9]/g, "");
      return map[key] !== undefined ? map[key] : "";
    });

    const index = sh.getLastRow() + 1;
    sh.getRange(index, 1, 1, row.length).setValues([row]);

    // keep the date as plain text so it reads "12 August 2026" in the published CSV
    const dateCol = headers.findIndex(h => String(h).toLowerCase().indexOf("date") > -1) + 1;
    if (dateCol) sh.getRange(index, dateCol).setNumberFormat("@").setValue(dish.date);

    return { ok: true, row: index };
  } finally {
    lock.releaseLock();
  }
}

function cloudinaryCall(method, path) {
  const key = setting("CLOUDINARY_API_KEY", CLOUDINARY_API_KEY);
  const secret = setting("CLOUDINARY_API_SECRET", CLOUDINARY_API_SECRET);
  if (!key || !secret) return { ok: false, error: "Cloudinary keys are not set on the server." };

  const cloud = setting("CLOUDINARY_CLOUD_NAME", CLOUDINARY_CLOUD_NAME);
  const url = "https://api.cloudinary.com/v1_1/" + cloud + "/folders" + (path ? "/" + path : "");

  const res = UrlFetchApp.fetch(url, {
    method: method,
    headers: { Authorization: "Basic " + Utilities.base64Encode(key + ":" + secret) },
    muteHttpExceptions: true
  });

  const body = JSON.parse(res.getContentText() || "{}");
  if (res.getResponseCode() >= 400) {
    return { ok: false, error: (body.error && body.error.message) || "Cloudinary said no." };
  }
  return { ok: true, body: body };
}

function listFolders(path) {
  const res = cloudinaryCall("get", path);
  if (!res.ok) return res;
  const names = (res.body.folders || []).map(function (f) { return f.name; });
  return { ok: true, folders: names };
}

function makeFolder(path) {
  if (!path) return { ok: false, error: "No folder path given." };
  const res = cloudinaryCall("post", path);
  if (!res.ok) return res;
  return { ok: true, path: path };
}

function signUpload(params) {
  const secret = setting("CLOUDINARY_API_SECRET", CLOUDINARY_API_SECRET);
  const apiKey = setting("CLOUDINARY_API_KEY", CLOUDINARY_API_KEY);
  if (!secret || !apiKey) return { ok: false, error: "Cloudinary keys are not set on the server." };

  const base = Object.keys(params).sort().map(k => k + "=" + params[k]).join("&");
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_1, base + secret, Utilities.Charset.UTF_8);
  const signature = bytes.map(b => ("0" + (b & 255).toString(16)).slice(-2)).join("");

  return { ok: true, signature: signature, apiKey: apiKey, timestamp: params.timestamp };
}

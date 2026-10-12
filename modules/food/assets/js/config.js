export const SITE = {
  name: "SidBites",
  tagline: "a tasting log",
  city: "Mumbai",
  author: "Siddhesh"
};

// The SidBites tab of the shared Books, Picks and Bites workbook.
export const SHEET_ID = "1L-c3xiSpec_l2Vd8ctJGGsl_46mm3Z_XBuPwzf2FAJk";
export const SHEET_GID = "847926404";

export const CSV_URL = `https://docs.google.com/spreadsheets/d/e/2PACX-1vT-f1hmsMFY9vJRgLnh_hPRxKC3xj2flti_hNWEhwUEkP8hcjDExPXRMZO2PiLywXSKL0WhzrAQh2pk/pub?gid=${SHEET_GID}&single=true&output=csv`;

export const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyIqOzeqIq2XT3SIKFKYB6iM2g90J2L-VYHKB_Fnw4iCZBCNBOq4A-9jQdNTxY174A6vg/exec";

// "csv" reads the published link, "script" reads live through Apps Script
export const READ_FROM = "csv";

// The same word the film and book diaries use, so one password opens all three. Apps Script still checks every write against its own ADMIN_PASSWORD property, so this only decides whether the form opens.
export const ADMIN_PASSWORD = "LaxSid@12345";

// baseFolder and uploadPreset are names that live in the Cloudinary account, not here. They keep the module's original spelling on purpose: renaming either one means renaming it in Cloudinary too, and the existing uploads sit under it.
export const CLOUDINARY = {
  cloudName: "dadtqawh5",
  apiKey: "534744288219611",
  baseFolder: "Swaad",
  // "signed" asks Apps Script to sign each upload, "unsigned" uses the preset below
  mode: "signed",
  uploadPreset: "swaad_uploads"
};

// the API secret is deliberately not here — it lives in Apps Script Script Properties, because anything in this file is readable by anyone who opens the site

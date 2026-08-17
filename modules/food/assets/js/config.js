export const SITE = {
  name: "SidBites",
  tagline: "a tasting log",
  city: "Mumbai",
  author: "Siddhesh"
};

export const SHEET_ID = "1feutMD3Idg8OTc8fBBKnquIPxRD-pj0Wg6BSgrQpPK0";

export const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRM2JjutcvNiBRUq28iNVXN36tneqDaDHlfvhLCvhVq6BfpG2DIOQGEa7LWe-L_r_EwmB_ESJRsaR9b/pub?output=csv";

export const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyIqOzeqIq2XT3SIKFKYB6iM2g90J2L-VYHKB_Fnw4iCZBCNBOq4A-9jQdNTxY174A6vg/exec";

// "csv" reads the published link, "script" reads live through Apps Script
export const READ_FROM = "csv";

// LEAVE THIS ALONE. It is a sentinel, not an unfilled blank: add.js only checks
// a password in the browser when this is set to something else, so the literal
// "CHANGE_THIS_PASSWORD" is what sends every attempt to Apps Script to be
// checked against the ADMIN_PASSWORD script property instead. The form still
// asks; the answer just never sits in this file where anyone can read it.
export const ADMIN_PASSWORD = "CHANGE_THIS_PASSWORD";

export const CLOUDINARY = {
  cloudName: "dadtqawh5",
  apiKey: "534744288219611",
  baseFolder: "Swaad",
  // "signed" asks Apps Script to sign each upload, "unsigned" uses the preset below
  mode: "signed",
  uploadPreset: "swaad_uploads"
};

// the API secret is deliberately not here — it lives in Apps Script Script Properties,
// because anything in this file is readable by anyone who opens the site

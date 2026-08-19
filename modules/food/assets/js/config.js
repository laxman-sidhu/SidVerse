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

// The same word the film and book diaries use, so one password opens all three.
// Apps Script still checks every write against its own ADMIN_PASSWORD property,
// so this only decides whether the form opens.
export const ADMIN_PASSWORD = "LaxSid@12345";

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

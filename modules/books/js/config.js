// Books — every credential and constant. Nothing else in this section
// hardcodes one.

// --- the spreadsheet --------------------------------------------------------
export const SHEET_ID = "1SPNRwytBNr4b5OtTnKe1kkH9nU0w8UEt4LWl4bVKte8";
export const READ_GID = "0";
export const READLIST_GID = "294473504";

// Tab names, as Code.gs sees them. Must match the workbook exactly.
export const READ_TAB = "Books Read";
export const READLIST_TAB = "Want to Read";

// File > Share > Publish to web, CSV. Used only when the bridge is unreachable,
// and cached by Google for a few minutes.
export const PUBLISHED_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQDtgfekQMFcgM54hlEfdxQ64E1LFHxaTrqtKSMEESEagmO8-FY_UpOu4hzZamJlfviv-yOct1Wrbxx/pub?output=csv";

// --- the write bridge -------------------------------------------------------
// The /exec URL from Deploy > Manage deployments. Empty means read-only.
export const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbycr1caYZOYFICMoDufUx1V0f2gp3fypzP9ysdW1rtgkSXiRABe8-v1U13PQl71DYrqBQ/exec";
// Must match SECRET in Code.gs. Change both together.
export const APPS_SCRIPT_TOKEN = "sidverse-books-u81apw9xjBIM2AGt8dlx_0mJvwEvCZpZSBsuzbiq8E_42_Rk";

// Unlocks the write buttons in this browser. The same password guards every
// section. It is checked in the browser, so it gates the buttons, not the
// sheet; APPS_SCRIPT_TOKEN is what actually guards the workbook.
export const OWNER_PASSWORD = "LaxSid@12345";
export const SESSION_HOURS = 72;

// --- whose shelf this is ----------------------------------------------------
// One reader, so the sheet has no reader column and there is nothing to filter
// by. The photograph is the one that used to make the readers card.
export const OWNER = {
  name: "Siddhesh",
  photo: "assets/images/siddhesh.jpeg",
  blurb: "Short stories, and anything with a twist"
};

// --- the book APIs ----------------------------------------------------------
// Both are free and need no key. Google Books is rate limited per IP.
export const GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1";
// NOT optional: Google answers 403 "unknown location" without it. ISO 3166-1.
export const GOOGLE_BOOKS_COUNTRY = "IN";
// Optional but recommended. Without a key every anonymous browser shares ONE
// Google quota. A free key from console.cloud.google.com (enable "Books API",
// then Credentials > API key) gives this site its own 1,000 a day. Each Google
// Cloud PROJECT gets its own allowance, so a second key is a second allowance;
// the site moves to the next one the moment Google answers "quota exceeded".
export const GOOGLE_BOOKS_KEYS = ["AIzaSyDXkC1nYREhUffyPuGjNq9npB6I5Xq6Kvc"];
export const OPEN_LIBRARY_API = "https://openlibrary.org";
export const OPEN_LIBRARY_COVERS = "https://covers.openlibrary.org";

// --- tuning -----------------------------------------------------------------
export const PAGE_SIZE = 24;
export const CACHE_TTL_MS = 10 * 60 * 1000;
// Open Library is often slow before it is unavailable, and 12s was cutting off
// requests that would have arrived.
export const REQUEST_TIMEOUT_MS = 20000;

// Browse chips. Open Library subject slugs, with the label shown on screen.
export const SUBJECTS = [
  { label: "Fiction", slug: "fiction" },
  { label: "Fantasy", slug: "fantasy" },
  { label: "Romance", slug: "romance" },
  { label: "Mystery", slug: "mystery" },
  { label: "Thriller", slug: "thriller" },
  { label: "Short Stories", slug: "short_stories" },
  { label: "Biography", slug: "biography" },
  { label: "Self-Help", slug: "self-help" },
  { label: "History", slug: "history" },
  { label: "Science", slug: "science" },
  { label: "Poetry", slug: "poetry" },
  { label: "Horror", slug: "horror" },
  { label: "Philosophy", slug: "philosophy" },
  { label: "Young Adult", slug: "juvenile_fiction" }
];

export const SITE_NAME = "SidBooks";

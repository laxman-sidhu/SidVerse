// SidPicks - the only file to edit to change the collections. Every exhibit lives in one tab (Name | Image Url | Industry | No. of Images | Category); a collection is the rows whose Category matches its `key`. A Category the list below does not name still gets its own wing, with a default icon. The slug drops the leading "Favourite", so "Favourite Actors" opens at ?category=actors.

export const CONFIG = {
  sheetUrl:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vT-f1hmsMFY9vJRgLnh_hPRxKC3xj2flti_hNWEhwUEkP8hcjDExPXRMZO2PiLywXSKL0WhzrAQh2pk/pub?gid=1397506388&single=true&output=csv",

  defaultIcon: "✦",

  categories: [
    { title: "Favourite Actors",        icon: "🎬", key: "Actors" },
    { title: "Favourite Actress",       icon: "✨", key: "Actress" },
    { title: "Favourite Superheroes",   icon: "🦸", key: "Superheroes" },
    { title: "Favourite Supervillains", icon: "😈", key: "Supervillains" },
  ],
};

// Pastel washes cycled across collection cards. Categories pick theirs by index, so new collections are styled automatically.
export const CARD_THEMES = [
  { wash: "var(--grad-lavender)", glow: "0 14px 40px rgba(160, 138, 240, 0.30)" },
  { wash: "var(--grad-mint)",     glow: "0 14px 40px rgba(102, 194, 160, 0.30)" },
  { wash: "var(--grad-blue)",     glow: "0 14px 40px rgba(111, 168, 220, 0.30)" },
  { wash: "var(--grad-peach)",    glow: "0 14px 40px rgba(242, 163, 124, 0.30)" },
  { wash: "var(--grad-butter)",   glow: "0 14px 40px rgba(230, 195, 100, 0.30)" },
];

// Short display label — drops a leading "Favourite"/"Favorite" so labels read "Actors", "Superheroes", etc. The full title is kept for page headings; the slug is built from this short form.
export function displayTitle(category) {
  const title = typeof category === "string" ? category : category.title;
  return String(title).replace(/^\s*favou?rite\s+/i, "").trim();
}

// Turn a label into a clean URL slug.
function slugify(text) {
  return String(text).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "");
}

// Plural and spelling slips in the sheet still land in the right wing: "Superheros" and "Superheroes" share a stem.
export function stem(text) {
  const slug = slugify(text);
  return slug.endsWith("ss") ? slug : slug.replace(/(es|s)$/, "");
}

export function sameCategory(category, value) {
  const wanted = stem(value);
  return Boolean(wanted) && (wanted === stem(category.key || displayTitle(category)) || wanted === stem(displayTitle(category)));
}

// Give every category a clean slug once, at load.
CONFIG.categories.forEach((category) => {
  if (!category.slug) category.slug = slugify(displayTitle(category));
});

// A Category value no configured wing claims becomes a wing of its own. Returns true when the list grew.
export function registerCategories(values) {
  let grew = false;
  values.forEach((value) => {
    const name = String(value || "").trim();
    if (!name || CONFIG.categories.some((c) => sameCategory(c, name))) return;
    CONFIG.categories.push({ title: name, icon: CONFIG.defaultIcon, key: name, slug: slugify(name) });
    grew = true;
  });
  return grew;
}

// Find a category by its URL slug.
export function findCategoryBySlug(slug) {
  if (!slug) return null;
  const wanted = slugify(slug);
  return CONFIG.categories.find((c) => c.slug === wanted) || CONFIG.categories.find((c) => stem(c.slug) === stem(wanted)) || null;
}

// Build the public URL for a category page.
export function categoryUrl(category) {
  return `category.html?category=${encodeURIComponent(category.slug)}`;
}

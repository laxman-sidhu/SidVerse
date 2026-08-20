# SidVerse

A box of everything I keep. Six small habits, one site: films watched, books
read, roads taken, food eaten, things loved without a good reason, and pages
written down.

There is no build step, no framework and no bundler. It is HTML, CSS and ES
modules, served as files. Every module was once its own project; they now share
a shell, a palette and a set of components, and nothing else.

This is the only document. Everything about structure, theming, data, setup,
deployment and troubleshooting is here.

---

## 1. The six rooms

| Module | Name | Pages | Data behind it |
|---|---|---|---|
| `cinema/` | **SidCinemas** | index, watched, watchlist | TMDB + Google Sheet (3 tabs) |
| `books/` | **SidBooks** | index, library, readlist, editions | Google Books + Open Library + Sheet (2 tabs) |
| `travel/` | **SidTrails** | index, gallery | Sheet (5 tabs) + Leaflet + EmailJS |
| `food/` | **SidBites** | index, add | Sheet + Cloudinary |
| `favourites/` | **SidPicks** | index, category | one published Sheet |
| `journal/` | **SidNotes** | index, story | JSON files on disk |

The folder names are the original ones and do not always match the display
names - `food/` is SidBites, `favourites/` is SidPicks. Display names live in
`assets/js/site.config.js` and are the single source for wordmarks, the module
switcher, the front page and the footer.

### Which name to write

Both registers are in use on purpose, so the rule is:

- **Inside a module's own files**, use its display name: `/* SidBooks - ... */`.
- **When one file refers to another module**, use the folder name, capitalised:
  *Books*, *Cinema*, *Travel*, *Food*, *Favourites*, *Journal*. The shared
  stylesheets do this because those comments sit beside `[data-section="food"]`
  selectors, and the selector is the folder name.

Storage keys follow the display name, lowercased, as `<module>:<thing>` -
`sidbooks:cache:`, `sidcinemas:owner`, `sidbites:key`, `sidpicks:sheet:`. The
one site-wide key is `sidverse:theme`.

Earlier names - Pitara, Swaad, BookVerse, SidCinema, Museum of Favorites,
Wanderlog, Marquee - are gone from the codebase. Two deliberate exceptions
remain, both in `modules/food/assets/js/config.js`: `baseFolder: "Swaad"` and
`uploadPreset: "swaad_uploads"` name resources that live in the Cloudinary
account, and renaming them here without renaming them there breaks uploads.

---

## 2. Structure

```
index.html                      the front page

assets/
    css/tokens.css              THE PALETTE - every colour, font, size, radius
    css/base.css                reset and a few primitives
    css/shell.css               the sidebar: rail, panel, theme switch
    css/universal.css           shared bars, footers, inputs, scrollbars
    css/components.css          shared buttons, cards, sheets, pickers
    css/home.css                the front page only
    css/motion.css              transitions and reduced-motion opt-outs
    js/site.config.js           name, owner, intro, and the module list
    js/shell.js                 injects the sidebar, wordmarks, theme, page menu
    js/home.js                  draws the front page from site.config.js
    js/picker.js                the styled <select> menu, shared
    js/motion.js                scroll reveals
    images/sidverse-icon.png    favicon and link-preview image
    images/portrait-cutout.png  the front-page portrait

modules/<name>/                 each keeps its own css/, js/ and assets/
docs/PROJECT.md                 this file
tools/                          screenshot and audit scripts (see tools/README.md)
```

Nothing is shared between two modules except the top-level `assets/`.

The front-page card thumbnails are not files in this repo. Each module's `image`
in `site.config.js` is a full `https://` URL; point it at a local path instead if
you would rather keep them here.

---

## 3. The shell

`assets/js/shell.js` runs on every page and injects the parts that must look
identical everywhere:

- **The rail** - the vertical strip of module icons, and the theme switch at its
  foot. On a phone it collapses behind the hamburger at top left.
- **The wordmark** - each bar carries an empty anchor (`.wordmark`, `.brand`,
  `.nav__brand`, `.navbar .logo`); shell.js fills it with a tinted tile holding
  the module's icon, then the name. **Do not hardcode a name in the markup.** It
  will be overwritten, and it will drift.
- **The language gloss** - the small translation under the module name, e.g.
  `Italian - "Every Journey Leaves a Story"`. Set in `site.config.js`.
- **The page menu** - the three-dot button on narrow screens. It collects the
  page's own nav groups into one sheet.

### The page menu trap

The sheet does not clone the module's nav; it **moves** the real nodes into
itself. Any styling those nodes had as a dropdown comes with them. Three modules
needed neutralising inside `.pmenu__sheet`, and a fourth will too if you add one:

- **Travel** - `.nav-links` is a fixed panel at `opacity: 0` until its own
  toggle opens it. Inside the sheet it is forced static and visible.
- **Favourites** - `.nav__links` is a full-screen fixed layer (`height: 100dvh`,
  `z-index: 110`). Left alone it sits invisibly over the whole viewport and
  swallows every tap. Its dropdown panel also has `pointer-events: none` and
  collapses to `max-height: 0` on `:hover` and `:focus-within` - which made the
  list vanish the instant a thumb touched it.
- **Books and Cinema** - only their round tool buttons needed the row treatment
  (`.iconbtn` and `.icon-btn` respectively; both are handled in
  `components.css`).

The sheet also sits **inside** the bar, so a module's bar rules still reach its
contents. Travel's links needed `!important` on colour for that reason: the
hero's light-on-dark rules are scoped to `.navbar:not(.scrolled)` and outrank
anything reasonable.

---

## 4. The theme

`assets/css/tokens.css` is the palette. Every colour, font, size, radius and
shadow is a `--p-*` custom property, and each module gets its accent from a
`[data-section="…"]` block.

One toggle at the foot of the rail sets `data-theme` on `<html>` and stores the
choice under `sidverse:theme`. The inline snippet in every page's `<head>` reads
the same key before the stylesheets load, so a dark page never flashes light.

**If you add a rule, use a token, not a literal.** `var(--p-surface)` for a
panel, `var(--p-ink)` for text, `var(--p-line)` for a border, `var(--p-deep)`
with `var(--p-on-deep)` for a band meant to stay dark in both themes. A hex will
look right in whichever theme you were viewing and wrong in the other.

**The exception:** chrome that always sits over a photograph. The favourites
lightbox - caption, name, close button, arrows, dots - is deliberately fixed
light (`#fff` on `rgba(0,0,0,…)`), because tokens invert in dark mode and left
it dark on dark.

### Load order matters

Modules load their own CSS first, then `universal.css` and `components.css`. So
a shared rule of **equal** specificity beats a module rule. Two consequences:

- A module override may need higher specificity than looks necessary.
- Before adding a rule to a module, check whether `components.css` already
  governs it. The travel gallery's column count, the books hero padding and the
  scope-picker hover all live there, and edits made in the module file did
  nothing until they were moved.

---

## 5. Data

Each section keeps its own workbook and its own Apps Script. Nothing is shared
at the data layer.

| Section | Sheet ID | Tabs |
|---|---|---|
| Cinema | `1UhTK_0IqotZila6-SFMVYtmP863qcWAt4Jk1JBj3ETs` | All Watched, Watchlist, People |
| Books | `1SPNRwytBNr4b5OtTnKe1kkH9nU0w8UEt4LWl4bVKte8` | Books Read, Want to Read |
| Travel | `1CtRBUNbgxf-Z-pEfwoKW9O5NTCUxTsbpTGBrfox9gSk` | Places, Monuments, Goals, Activities, Treks |
| Food | `1feutMD3Idg8OTc8fBBKnquIPxRD-pj0Wg6BSgrQpPK0` | one tab |
| Favourites | published link only | Actors, Actress, Superheroes, Supervillains |
| Journal | none - JSON in `modules/journal/data/` | - |

**Columns are matched by header name, never by position.** Reorder them freely.
Renaming one is safe only if the new spelling is already in that section's alias
list: `COLUMN_ALIASES` in the Apps Script **and** the alias table in
`js/data/sheets.js`. Both sides must carry it. Where two columns name the same
field, the **first wins** - so delete the old column when you rename one.

### The Apps Scripts

| File | Does |
|---|---|
| `modules/cinema/assets/apps_script/SidCinemas_Bridge.gs` | reads all three tabs in one request; writes ticks and rows |
| `modules/books/assets/apps_script/Code.gs` | reads both tabs; writes rows and edition marks |
| `modules/books/assets/apps_script/OtherVersions.gs` | a manual job: fills `Other Versions` and `Count` from Open Library |
| `modules/food/assets/apps_script/Code.gs` | reads the sheet; writes dishes; signs Cloudinary uploads |

Each script's `SECRET` must equal `APPS_SCRIPT_TOKEN` in that module's
`config.js`. Both pairs currently match. Cinema's token reads like a
placeholder - `THIS-IS-A-LONG-RANDOM-STRING-FOR-APPS-SCRIPT-TOKEN` - but it is
the live value; change it in **both** files together or writes stop.

Food is the exception to the pair: it has no token. Its Apps Script checks
the password on every write instead, reading a Script Property named
`ADMIN_PASSWORD` in preference to the constant in `Code.gs`.

**After every script edit:** Deploy → Manage deployments → pencil → New version
→ Deploy. The site sees the last *deployed* version, not the last saved one.
Creating a *new* deployment gives a new URL and breaks the config.

### The books edition model

Both books tabs carry the same eight columns:

```
Title | ISBN | Author | Thumbnail Url | Genre | Other Versions | Count | Summary
```

`Other Versions` holds one line per edition, formatted
`ISBN · Language · Publisher · Year`. `Count` is the number of those lines, and
`OtherVersions.gs` maintains it.

This drives four card states:

| State | Colour | Meaning |
|---|---|---|
| `is-read` | green | a book on **Books Read**, one ISBN per book |
| `is-version` | yellow | another edition of a book already read |
| `is-queued` | purple | a book on **Want to Read** |
| `is-queued` + note | purple | another edition of a readlist book; hovering says so |

A match is either by ISBN or, failing that, by title and author - the code keeps
a `via: "isbn" | "guess"` distinction, and a guess is worded as one. A card the
lookup missed can be filed by hand with **Mark as another edition of a book I
have read**.

### The journal

The journal only ever **reads**. Stories are written in a separate editor that
commits JSON through the GitHub API. Two files matter, under
`modules/journal/data/`:

- **`index.json`** - a flat list, one entry per story: `id`, `title`, `date`,
  `thumb`. `date` must be `YYYY-MM-DD`, because sorting compares those strings
  directly; any other format sorts wrongly and silently.
- **`posts/<id>.json`** - one complete story, photographs embedded as data URLs.

The two must agree. An index entry with no matching file opens onto *"Story not
found."*; a file with no index entry is invisible. Deleting a story means
removing both.

---

## 6. Passwords

`LaxSid@12345` opens all three writable modules.

| Module | Constant | File |
|---|---|---|
| Cinema | `OWNER_PASSWORD` | `modules/cinema/js/config.js` |
| Books | `OWNER_PASSWORD` | `modules/books/js/config.js` |
| Food | `ADMIN_PASSWORD` | `modules/food/assets/js/config.js` |

The browser check only decides whether the form opens. **Every write is checked
again server-side** by the Apps Script, so the password in these files is a
gate, not the lock.

Food's Apps Script reads a Script Property named `ADMIN_PASSWORD` in
preference to the constant in `Code.gs`, so setting that property keeps the
password out of the file if you'd rather.

### The gate

All three ask the same way, in two steps: **"This is Siddhesh's …"** with
**No, go back** / **Yes, I'm Siddhesh**, then the password. On a phone the
buttons stack with the affirmative on top. Cinema and Books draw it as a modal
over the page; Food draws the same modal from
`modules/food/assets/js/gate.js`.

---

## 7. The travel hero

The angled fan of photographs is the most intricate thing in the project and the
easiest to break. It is worth understanding before touching it.

Four **places**, not four images. Place 0 is the front of the fan; each step
back is 10px narrower at 9:16, 4% smaller and 30px further away. A card takes
the look of the place it is in, so moving up a place means a card *grows into*
it - the places never move.

`modules/travel/js/hero-fan.js` writes `--fw`, `--fh`, `--fk`, `--fz`, `--fi`
and `--fml` onto each card. Adding photographs to `assets/hero/` and rerunning
the `.bat` is all that is needed; the fan's geometry never changes.

Four things will break it:

1. **Do not wrap the cards in another element.** A `transform-style: preserve-3d`
   wrapper between `.hero-fan`'s perspective and the cards breaks hit-testing for
   anything at a negative `translateZ` - cards 2, 3 and 4 stop responding to
   hover while still looking correct. Cards must be direct children of
   `#heroFan`.
2. **Do not clip the window.** Cards outside the fan fade to `opacity: 0`, which
   is what lets a hovered card grow past either edge uncut.
3. **Slide the row with the first card's `margin-left`,** not a transform on the
   row. A transform on the parent flattens the 3D and costs hit-testing again.
4. **Do not size cards with one box and a scale.** Each place has its own exact
   width and height. A uniform box renders photographs into a larger layer and
   scales them down, which is visible as edge softening.

On a phone the fan is dropped for a scroll-snap strip: one card at 74% width
with 13% of its neighbours showing.

### The footer

`shell.js` builds one footer for every module: the quote from `footerLine`, an
optional feature card, and the signature. A module with `ownFooter: true`
(currently only Cinema) keeps its own and is left alone; the rest have their
original footer markup hidden rather than removed, since it is often wired to
that module's scripts.

A module with one place worth going can add a `footerFeature` to its entry in
`site.config.js` - eyebrow, title, an emphasised word, a line of copy, a CTA
label and three image URLs. Travel uses it for the gallery, and puts it in the
page rather than the footer: an empty `<section data-feature-slot>` anywhere on
the page takes the card instead. The card hides itself on the page it points
at, the same way the small footer links do.

---

## 8. Favicon and link previews

Every page carries the same head block, built from
`assets/images/sidverse-icon.png`:

- `<link rel="icon">` and `apple-touch-icon`, at the right relative depth.
- Open Graph: `og:image` on the **absolute** URL
  `https://laxman-sidhu.github.io/SidVerse/assets/images/sidverse-icon.png`,
  with `og:image:width`, `:height` and `:type` so WhatsApp and Telegram render
  on first fetch rather than after a re-crawl.
- Twitter card set to `summary`, not `summary_large_image` - the icon is square
  and the large card crops to 2:1.

If the site moves off GitHub Pages, the absolute URL in all sixteen pages must
change with it.

---

## 9. Running and deploying

The pages use ES modules, which browsers refuse to load over `file://`.
Double-clicking `index.html` will not work. Serve the folder:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

To publish, push the whole folder to a repository with `index.html` at the root
and turn on GitHub Pages (Settings → Pages → Deploy from a branch, `main`, `/`).
There is no build step, so a change is live as soon as Pages finishes.

---

## 10. Changing things

| To change | Edit |
|---|---|
| Site name, tagline, intro, portrait | `assets/js/site.config.js` |
| A module's footer quote, links or feature card | `assets/js/site.config.js` |
| Which modules exist, their order, blurbs, card images | `assets/js/site.config.js` |
| A module's display name or language gloss | `assets/js/site.config.js` |
| Any colour, font, radius, shadow or size | `assets/css/tokens.css` |
| One module's accent | its `[data-section="…"]` block in `tokens.css` |
| How a button, field, card, sheet or picker is drawn | `assets/css/components.css` |
| A module's sheet, token or password | that module's `config.js` |
| The favourites collections | `modules/favourites/js/config.js` |

Renaming the site is one string.

---

## 11. Troubleshooting

**A nav link in the three-dot menu does nothing.** Its module's own dropdown
styling came with it into the sheet. Look for `position: fixed`, `opacity: 0`,
`pointer-events: none`, or a `:hover` / `:focus-within` rule that collapses it.
See §3.

**A CSS change had no effect.** `components.css` and `universal.css` load after
every module. A shared rule of equal specificity wins. See §4.

**Writes stopped working.** Either the script was saved but not redeployed, or
`SECRET` and `APPS_SCRIPT_TOKEN` have drifted apart. See §5.

**A column's data vanished.** It was renamed to a spelling not in the alias
list, or a duplicate column earlier in the sheet is winning. See §5.

**Fan images stopped responding to hover.** Something was wrapped around the
cards. See §7.

**A colour looks wrong in one theme.** A literal hex was used where a token
belongs. See §4.

**A story shows "Story not found."** `index.json` has an entry whose `id` has no
file in `posts/`. See §5.

---

## 12. Still to do

- The six front-page card images in `site.config.js` are borrowed `https://`
  URLs from elsewhere on the web. Swap each `image` for one of your own
  photographs, or a local path under `assets/images/`.
- Dark mode on Travel is partial. `modules/travel/css/style.css` carries roughly
  380 colours written as literal hex or `rgba()` rather than through a variable,
  and `theme.css` cannot reach those. The shell, cards and type follow the
  theme; some washes and dark sections keep their light values.

Everything else is configured and working.

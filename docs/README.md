# Pitara

*A box of everything I keep.*

Six personal logs — films, books, travel, food, favourites and a journal — merged
into one site. Plain HTML, CSS and JavaScript. No framework, no build step, no
server. What you push is what runs.

---

## Structure

```
index.html                      the front page

assets/
    css/tokens.css              THE PALETTE — every colour, font and radius
    css/base.css                reset and a few primitives
    css/shell.css               the sidebar: rail, panel, theme switch
    css/universal.css           shared bars, footers, inputs, scrollbars
    css/home.css                the front page only
    js/site.config.js           name, owner, intro and the module list
    js/shell.js                 injects the sidebar and owns the theme toggle
    js/home.js                  draws the front page from site.config.js
    img/                        portrait, favicon, and cards/ thumbnails

modules/
    cinema/     index, watched, watchlist            TMDB + Google Sheet
    books/      index, library, readlist, editions   Google Books + Open Library
    travel/     index, gallery                       Sheets + Leaflet + EmailJS
    swaad/      index, add                           Sheets + Cloudinary
    favourites/ index, category                      one published Sheet
    journal/    index, story, data/                  JSON files on disk

docs/
    README.md                   this file
    SETUP.md                    deploying, and what still needs filling in
```

Every module under `modules/` keeps its own `css/`, `js/` and `assets/`, exactly
as it did when it was its own project. Nothing is shared between two modules
except the files in the top-level `assets/`.

---

## The theme

`assets/css/tokens.css` is the only place a colour is chosen. Every section has
a `theme.css` loaded **after** its own stylesheet, which re-points that
section's variables at the shared tokens:

```css
/* cinema/css/theme.css */
:root {
  --paper: var(--p-bg);
  --ink:   var(--p-ink);
  ...
}
```

No rule is restyled — only the variables the rules were already written
against. That is why 11,000 lines of original CSS still work untouched, and why
changing `--p-bg` in one file moves all six sections onto new paper.

Each section changes exactly one thing: its accent.

The palette is drawn from soft pastel boards — warm cream paper, soft
green-charcoal ink, and six muted accents:

| Module | Accent |
|---|---|
| Cinema | blush |
| Books | pink lavender |
| Travel | sage |
| Swaad | peach |
| Favourites | pastel blue |
| Journal | muted flax |

Travel's pastel families and the Museum's five washes are kept as families —
they are how one card is told from another on those pages — but each one is
**re-pointed onto the new palette's hues**, so those rooms belong to the same
house as everything else.

**Type is shared everywhere:** Outfit for display, Manrope for body, JetBrains
Mono for labels, Caveat for anything handwritten. Every page requests the same
four in one link.

### Light and dark

One choice, offered in two places — a dot on the rail and a labelled button in
the panel — both driving the same state. It sets `data-theme` on `<html>` and
remembers the choice per device, so the whole site turns over at once — this
used to be a per-module control that only Cinema had.

Every module's `theme.css` carries a matching `[data-theme="dark"]` block. That
restating is not redundancy: `:root` and `[data-theme="dark"]` have the same
specificity, so without it the light mapping in the later file would outrank a
module's own dark tokens and the toggle would appear to do nothing.

Each page also sets the theme from `localStorage` in a tiny inline script before
the stylesheets load, so a dark page never flashes light first.

The modules originally carried around 380 colours written as literal hex or
`rgba()` rather than through a variable — navbars, footers, search fields, hero
bands — and those were what made dark mode look half-finished. They have been
converted by role: near-whites became surfaces, pale tints became `color-mix`
onto the surface so the hue survives while the paper underneath flips, and bands
that are *meant* to be dark in both themes became `--p-deep` with `--p-on-deep`
text. Saturated mid-tones were left alone, because an accent reads on either
paper.

### One footer, six lines

Every module gets the same footer, injected by `shell.js`: the module's own
one-line thought on the left, its links in the middle, and the same signature on
the right. The line and any links come from that module's entry in
`site.config.js`, so changing what a footer says is a one-line edit.

A module with `ownFooter: true` is left alone — Cinema's was already the right
shape and is what the universal one was modelled on. Every other module's
original footer is *hidden* rather than deleted, because that markup is often
wired to that module's own scripts.

### components.css

`assets/css/universal.css` unified the *surfaces* — bar backgrounds, footers,
scrollbars, selection. `assets/css/components.css` loads after it and unifies
the *dimensions*, which is where the modules still fell apart: a navbar was
44px in one room and 66px in the next, a button 25px here and 47px there, a
hero 32px on one page and 76px on another.

It sets height, type, shape and state. It does **not** set background or text
colour on module components, so each room keeps its identity. It matches
classes the modules already share (`.topbar`, `.navbar`, `.nav`, `.btn`,
`.card`, `.empty`); a module using a different class is simply not matched and
keeps its own look — the same contract `universal.css` uses. No class or id is
renamed, so nothing JavaScript queries is disturbed.

One idiom worth knowing: anything that decides a **height** (`min-height`,
`padding-block`) is set at normal specificity, while anything that decides
**horizontal room** (`padding-inline`) is wrapped in `:where()` so it carries
zero specificity and a module always wins. That is what lets every control be
exactly 40px (or 32px when small) without a search field's leading magnifier
landing on top of its own placeholder.

### One size, everywhere

Five modules used to carry a CSS `zoom` — Cinema and Books at `.70`, Swaad
`.78`, Travel `.80` (on top of a `87.5%` root font-size) and Favourites `.88` —
each counter-zooming the sidebar by `1/scale` to keep the chrome one size.

That is gone. It was not preserving an old design; it was the thing making the
site look like five sites:

| | before | after |
|---|---|---|
| body text | 10.5 – 16px | **16px** |
| hero | 32 – 76px | **~66px** |
| navbar | 44 – 66px | **64px** |
| buttons | 25 – 47px | **40px / 32px** |

`zoom` also does not scale media queries, so a module at `.70` laid out 1.43x
wider than its own breakpoints believed — which is why Books' chip row was
clipped under the hero — and Firefox below 126 ignores it entirely, rendering
those pages oversized. Every page is now correct at 100% browser zoom, and
`pageScale()` in `cinema/js/core/util.js` returns 1 as it was written to.


### One background, one navbar

Two more things moved out of the modules and into the shared layer.

**The page wash** is painted once, on `<body>` in `base.css`, and every
full-width band in every room is cleared by `components.css` §19 and §24. Each
module used to paint its own — Travel alone ran lavender, cream, yellow, green
and beige down a single page — which is what produced the visible seams and
made the rooms read as separate sites. The wash uses fixed lavender and blush
rather than the section accent on purpose: reading it from `--p-accent` made
the paper itself change hue room to room. Section identity lives in the
accents, buttons and cards, not in the paper.

Travel's bands had to be cleared **by id** (`#places`, `#goals`, …) because ids
outrank classes and the class-based rule never reached them.

**The navbar** was five different structures doing one job — Cinema
`.topbar > .wrap`, Books a JS-built `.nav__inner`, Travel `nav.navbar`, Swaad a
`.topbar` with no inner wrapper at all, and Favourites `header.nav > .container`.
§21 gives all five one shell, one row, one brand treatment, and one alignment:
brand hard left on the content's own left edge, everything else pushed right.

### Two traps worth knowing

**A token has a role.** Most invisible text on this site came from a token used
outside its role — `--p-line` (a border) as text, `--p-deep` (a dark band) as
text, `--paper`/`--p-surface` as text. The last one is the subtle case: cream
text was correct while a band painted itself dark, and became invisible the
moment §19 made that band transparent. If a rule says `color: var(--paper)`,
check what it is sitting on.

**Composed controls own their frame.** A search box is one control built from a
shell, a borderless input and a button. Giving every `<input>` its own border
draws a second box inside the pill. §23 strips the frame from fields inside a
shell — which means a module that relied on the field to draw the pill has to
draw it on the wrapper instead (see §26 for Swaad).


### motion.css and motion.js

Entrances, scroll reveals, hero parallax and the theme cross-fade.

**The rule that shapes both files:** nothing is hidden unless JavaScript is
present to reveal it again. Every rule that sets `opacity: 0` is scoped to
`html[data-motion]`, and `motion.js` sets that attribute only once it knows it
can finish the job — it checks for `IntersectionObserver` and stands down
entirely under `prefers-reduced-motion`. If the script is blocked, errors, or
meets an old browser, no element is ever hidden and the page simply appears.

There is also a four-second failsafe: anything still un-revealed by then is
shown regardless. A stalled image or a mis-measured container must never leave
content invisible because a decoration did not fire.

`tools/motiontest.py` and `tools/scrolltest.py` check both halves of that —
the first loads every page with `motion.js` aborted and counts hidden text, the
second scrolls each page and asserts nothing is left un-revealed.

### One content width

`--p-shell` is 1440px and every room reads it. Travel used to cap its
`.container` at 1600px while everything else used 1240px, so the same row of
cards was visibly wider in one room than the next. Navbars are the deliberate
exception: they span the full window, brand hard left and tools hard right.

### universal.css

`assets/css/universal.css` loads last on every page. Each module keeps its own
navbar and footer markup — the contents differ and should — but the surface,
blur, border, inputs, scrollbars and selection colour all come from here, so
moving between modules feels like moving around one site rather than six. It
also normalises the wordmark each module shows in its own bar — the name
differs, the way it is drawn should not — and gives fixed bars the same left
offset as the rail, which is what stopped Travel's navbar running underneath
it.

---

## Navigation

An app shell in two states.

**Collapsed** — a floating pill of icons, vertically centred against the left
edge: Home, then the six modules, then the theme switch. Each icon shows its
plain name on hover — Cinema, Books, Travel, Food — and the current module
wears its own accent.

**Expanded** — the hamburger at the top left folds into a cross, and the pill
grows into the full panel: the panel is clipped down to the pill's own rounded
footprint while closed, so opening reads as the same object expanding rather
than a drawer arriving. Names only, no descriptions. Escape or the scrim closes
it.

The rail *floats* rather than pushing the page, so every module's own layout is
untouched — pages only clear its 74px. Each module keeps its own bar for moving
around inside itself; this is the one that moves between them.

It is injected by `assets/js/shell.js` — a plain script, not a module, because
four modules load their code as modules and two do not. A page opts in with
three lines plus the pre-paint snippet:

```html
<html data-section="cinema">
<script defer src="../../assets/js/site.config.js"></script>
<script defer src="../../assets/js/shell.js" data-root="../.."></script>
```

`data-section` picks the accent. `data-root` says how far up the site root is.

---

## Data

Each section keeps its **own** Google Sheet and its **own** Apps Script, exactly
as before. Nothing was merged at the data layer, and nothing shares a
spreadsheet.

| Module | Source | Writes |
|---|---|---|
| Cinema | Sheet, 3 tabs | Apps Script bridge |
| Books | Sheet, 2 tabs | Apps Script bridge |
| Travel | Sheet, 5 tabs, published CSV | read-only |
| Swaad | Sheet, published CSV | Apps Script + Cloudinary |
| Favourites | one published Sheet | read-only |
| Journal | JSON files in `journal/data/` | published from the editor |

**Every write asks for the password first.** It is `LaxSid@12345` on Cinema and
Books, checked in the browser. Swaad asks too, but checks server-side — see
`docs/SETUP.md`.

---

## Running it

The pages use ES modules, which browsers refuse to load over `file://`, so
double-clicking `index.html` will not work. Serve the folder:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

To publish, push the whole folder to a repository with `index.html` at the root
and turn on GitHub Pages (Settings → Pages → Deploy from a branch, `main`, `/`).
There is no build step, so a change is live as soon as Pages finishes.

---

## Changing things

| To change | Edit |
|---|---|
| The site's name, tagline, intro, portrait | `assets/js/site.config.js` |
| Which modules exist, their order, blurbs, card images | `assets/js/site.config.js` |
| Any colour, font, radius or shadow | `assets/css/tokens.css` |
| Any size — type scale, spacing, bar/control height | `assets/css/tokens.css` |
| How a button, field, card or empty state is drawn | `assets/css/components.css` |
| One module's accent | the `[data-section="…"]` line in `tokens.css` |
| A module's sheet, keys or password | that module's `config.js` |
| The favourites collections | `modules/favourites/js/config.js` |

Renaming the site is one string. `site.config.js` feeds the wordmark, the
switcher, the front page and the footer.

---

### Images

Two placeholders are waiting for real photographs:

- `assets/img/portrait.jpg` — the front-page hero.
- `modules/books/assets/images/reading.svg` — the Books hero cut-out. It uses
  the same shape as Swaad's: a background-removed subject floating on soft
  colour blobs. Drop a cut-out photo in at that path (any format, update the
  `src`) and it drops straight in.

### Card images

Each module's front-page card has an `image` in `site.config.js`. They point at
generated SVG placeholders under `assets/img/cards/`. Drop real photographs in
at the same paths — or point `image` at any `https://` URL — and nothing else
needs touching. A module with no `image` gets a tinted panel rather than a
broken-image glyph.

---

## What is still to do

See `docs/SETUP.md`. In short: drop in your own portrait and card photographs.
Everything else is configured and working.

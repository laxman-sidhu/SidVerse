# Setup

What is already done, what is left, and how the parts that need a hand work.

---

## Still to do

### 1. The Books token

The `/exec` URL is in `modules/books/js/config.js` and the bridge is deployed.
One thing is still a placeholder: `APPS_SCRIPT_TOKEN` reads
`pitara-books-change-this-to-a-long-random-string`.

**Writes will be refused until this matches.** Open the workbook →
**Extensions → Apps Script**, set `SECRET` at the top of `Code.gs` to a long
random string, put the *same* string in `APPS_SCRIPT_TOKEN`, then redeploy:

> **Deploy → Manage deployments → pencil → New version → Deploy.**
> Saving the file changes nothing the site can see, and creating a *new*
> deployment gives a new URL that breaks `APPS_SCRIPT_URL`.

While you are in there, run `testSetup` once from the function dropdown. It
reports your row counts and the columns it found and changes nothing. Paste
`modules/books/assets/apps_script/OtherVersions.gs` in as a second file too — it
fills the Other Versions and Count columns, is run by hand, and already points
at the `Books Read` and `Want to Read` tabs.

### 2. Your portrait, the Books hero, and the card images

`assets/img/portrait.jpg` is a placeholder. Drop your own in at the same path,
or point `portrait` in `assets/js/site.config.js` somewhere else. Roughly 4:5
and it will sit correctly; the crop is anchored near the top so a face is not
sliced off.

The Books hero uses a cut-out at `modules/books/assets/images/reading.svg` —
same idea as Swaad's, a background-removed subject floating on soft colour. Swap
in a photo of yourself reading and update the `src` in
`modules/books/index.html`.

The six front-page cards each have an `image` in the same file, pointing at
generated SVG placeholders in `assets/img/cards/`. Replace them at the same
paths, or point `image` at any `https://` URL. Roughly 16:9. A module with no
`image` falls back to a tinted panel rather than a broken-image glyph.

---

## Passwords

**Every edit anywhere on the site asks first.** The password is `LaxSid@12345`.

| Section | Where it is checked | Where the value lives |
|---|---|---|
| Cinema | in the browser | `modules/cinema/js/config.js` → `OWNER_PASSWORD` |
| Books | in the browser | `modules/books/js/config.js` → `OWNER_PASSWORD` |
| Swaad | on the server | Apps Script → Script Properties |

Cinema and Books check the password in the page, so it gates the buttons and not
the sheet. What actually protects those workbooks is `APPS_SCRIPT_TOKEN`, which
the bridge verifies before it touches a cell.

### Swaad is different, on purpose

`ADMIN_PASSWORD` in `modules/swaad/assets/js/config.js` reads
`"CHANGE_THIS_PASSWORD"`. **Leave it.** That literal string is a sentinel, not
an unfilled blank:

```js
const localGate = ADMIN_PASSWORD && ADMIN_PASSWORD !== "CHANGE_THIS_PASSWORD";
```

`add.js` only checks a password in the browser when that value is set to
something else. Leaving it as the sentinel sends every attempt to Apps Script to
be checked against the `ADMIN_PASSWORD` script property instead. The form still
asks — the answer just never sits in a file anyone can read.

So Swaad's real password is whichever value you set in
**Extensions → Apps Script → Project Settings → Script Properties**. Set it to
`LaxSid@12345` and all three sections agree.

Swaad needs a second property there too, `CLOUDINARY_API_SECRET`, without which
uploads and the folder browser will not work. That secret must only ever live
there: Apps Script signs each upload server-side and returns only the signature.

### Cinema's token is not a placeholder

`APPS_SCRIPT_TOKEN` in `modules/cinema/js/config.js` reads
`THIS-IS-A-LONG-RANDOM-STRING-FOR-APPS-SCRIPT-TOKEN`. It looks like something
that was never replaced. It is the real deployed value, and there is a comment
above it saying so. Do not "fix" it without changing `SECRET` in the bridge at
the same time.

---

## How the journal works

There is no editor here. The journal in this site only ever **reads**. Stories
are written and published from the separate Journal Writing project, which
commits JSON straight into a repository through the GitHub API.

Two files matter, both under `modules/journal/data/`:

**`index.json`** — a flat list, one lightweight entry per story. This is the
only thing `modules/journal/index.html` reads, and it is what draws the cards:

```json
[
  {
    "id": "my-first-trip",
    "title": "My First Trip",
    "date": "2026-06-28",
    "thumb": "data:image/jpeg;base64,..."
  }
]
```

Four fields. `id` must match the filename in `posts/`. `date` must be
`YYYY-MM-DD`, because the page sorts newest-first by comparing those strings
directly — any other format sorts wrongly and silently. `thumb` is a small
base64 image and is what appears on the card; a story with no `thumb` gets a
flower glyph instead, which is fine.

**`posts/<id>.json`** — one complete story: its pages, and every element on
them, with photographs embedded as data URLs so the file is self-contained.
`modules/journal/story.html` fetches exactly one of these, by the `?id=` in the URL.

### Replacing the samples

Two of Dhanashri's stories are in there now so the page has something real to
render. To swap in your own:

1. Copy your story files into `journal/data/posts/`.
2. Replace `modules/journal/data/index.json` with your own — or, simpler, copy the
   `index.json` from your journal's `data/` folder wholesale, since the editor
   maintains it for you every time you publish.

The two have to agree. An entry in `index.json` whose `id` has no matching file
in `posts/` gives a card that opens onto *"Story not found."*; a file in
`posts/` with no entry in the index is simply invisible. The editor keeps both
in step automatically — it writes the post, then reads, updates and writes back
the index. Editing by hand is the only way they drift apart.

Deleting a story means removing both: the file **and** its index entry.

---

## The sheets

Each section keeps its own workbook and its own script. Nothing is shared.

| Section | Sheet ID | Tabs |
|---|---|---|
| Cinema | `1UhTK_0IqotZila6-SFMVYtmP863qcWAt4Jk1JBj3ETs` | All Watched, Watchlist, People |
| Books | `1SPNRwytBNr4b5OtTnKe1kkH9nU0w8UEt4LWl4bVKte8` | Books Read, Want to Read |
| Travel | `1CtRBUNbgxf-Z-pEfwoKW9O5NTCUxTsbpTGBrfox9gSk` | Places, Monuments, Goals, Activities, Treks |
| Swaad | `1feutMD3Idg8OTc8fBBKnquIPxRD-pj0Wg6BSgrQpPK0` | one tab |
| Favourites | published link only | Actors, Actress, Superheroes, Supervillains |

**Columns are matched by header name, never by position**, in Cinema and Books
alike. Reorder them freely. Renaming one is safe as long as the new spelling is
already in that section's alias list — `COLUMN_ALIASES` in the bridge and the
alias tables in `js/data/sheets.js`. Both sides have to carry the spelling.

Where two columns name the same field — `Name` added, `Movie` left behind — the
**first wins**, on both sides. Delete the old column when you rename one, or it
will sit there holding a value nothing reads.

### The Books tabs

Both tabs carry the same eight columns:

```
Title | ISBN | Author | Thumbnail Url | Genre | Other Versions | Count | Summary
```

There is no reader column, and the site no longer has a concept of one. `Count`
is the number of lines in `Other Versions`, and `OtherVersions.gs` maintains it.

---

## Light and dark

One toggle, at the foot of the sidebar. It sets `data-theme` on `<html>`, stores
the choice under `sidcinema-theme` (Cinema's original key, so a device that had
already chosen dark keeps it), and every module follows.

Every module is tokenised and turns over completely. The literal colours that
originally made this look half-finished — Books' white navbar, Swaad's sage bar
and search field, Travel's cream bands, the Museum's pastel nav and footer,
Journal's invisible headings — have all been converted to tokens.

Cinema keeps 23 literals of its own, which is deliberate: it shipped with a
hand-built dark theme that already handles them.

**If you add a rule, use a token, not a literal.** `var(--p-surface)` for a
panel, `var(--p-ink)` for text, `var(--p-line)` for a border, `var(--p-deep)`
with `var(--p-on-deep)` for a band meant to stay dark in both themes. A literal
hex will look right in whichever theme you happened to be viewing and wrong in
the other.

---

## Adding a module later

1. Make the folder under `modules/`, with its own `index.html`, `css/`, `js/`.
2. Add a `css/theme.css` mapping its variables onto the `--p-*` tokens — and a
   `[data-theme="dark"]` block, or the site toggle will not reach it.
3. Add `data-section="key"` to `<html>`, the pre-paint snippet, and the two
   chrome script tags with `data-root="../.."`.
4. Add an entry to `sections` in `assets/js/site.config.js` (including an
   `image`), and one accent line in `assets/css/tokens.css`.

The sidebar and the front page both build themselves from that list, so there is
nothing else to touch.

---

## Troubleshooting

**A section shows no data, and the console says CORS.**
That section's Apps Script deployment is not set to "Anyone", or its
`APPS_SCRIPT_URL` is wrong. Open the `/exec` URL directly in a browser: it
should answer with JSON, not a Google sign-in page.

**Reads work, writes fail with "Not authorised".**
`SECRET` in the bridge and `APPS_SCRIPT_TOKEN` in that section's `config.js`
are not identical. Watch for a trailing space.

**An edit to a bridge changed nothing.**
Apps Script serves the last *deployed* version, not the last saved one.
**Deploy → Manage deployments → pencil → New version → Deploy.**

**The write buttons do nothing.**
Either `APPS_SCRIPT_URL` or the password is blank in that section's
`config.js`. With either missing the section runs read-only on purpose, and says
so rather than failing silently.

**Data is stale after editing the spreadsheet by hand.**
Cinema and Books read live through Apps Script, so this should not happen. If it
does, the published-CSV fallback is being used because the bridge failed — and
that path goes through Google's cache, which lags by minutes. Check the console.
Travel, Swaad and Favourites read the published CSV by design and will always
lag a few minutes.

**Cinema and Books look smaller than the other modules.**
They are, deliberately: both apply `zoom: 0.7` above 1024px, because both were
drawn a size too large. `--ui-scale` in each module's stylesheet is the one
number that controls it. The sidebar counter-scales, and those two modules pad
the page in their own scaled units, so the chrome is the same size everywhere.

**A page flashes light before going dark.**
Its pre-paint snippet is missing from `<head>`. It has to be the first thing in
the head, before any stylesheet.

# Audit tooling

Seven scripts that turn "does dark mode still work" into a command. They drive a
headless Chromium over every page of the site, so they catch what a manual
sweep misses — a label that only fails contrast in dark, a grid that only
overflows at 768px, a control that is 25px in one module and 47px in another.

Serve the site first:

```bash
python3 -m http.server 8899
pip install playwright && playwright install chromium
```

| Script | What it answers | Run |
|---|---|---|
| `contrast.py` | Does any text fail WCAG AA, in either theme? Composites real backgrounds through transparency, skips text over images. | `python3 contrast.py light` / `dark` |
| `responsive.py` | Does any page scroll sideways at any width? Reports the offending element. | `python3 responsive.py 1440,1024,768,390` |
| `measure.py` | Are type, bar height and control height consistent across modules? | `python3 measure.py` |
| `tinytext.py` | Is anything rendering below 11.5px? | `python3 tinytext.py` |
| `shot.py` | Full-page screenshots of every page in both themes. | `python3 shot.py ./out light,dark 1440` |
| `motiontest.py` | Does any content stay hidden when `motion.js` is blocked? | `python3 motiontest.py` |
| `scrolltest.py` | Does any reveal stay stuck after scrolling the page through? | `python3 scrolltest.py` |

All seven point at `http://localhost:8899`. The first five cover all 16 pages;
`motiontest.py` and `scrolltest.py` cover the eight that carry reveals.

**Known clean baseline:** contrast 0 dark / 2 light, overflow 0 at 1440, 1024,
768, 430 and 390, body 16px everywhere, hero 65.6px, navbar 64-65px, controls
40px/32px, no sub-11px text.

The two light findings are the auditor's own limitation, not page defects.
`contrast.py` approximates a gradient background by averaging its colour stops.
Travel's hero overlay runs `rgba(deep, .82)` on the left, where the text sits,
fading to `.30` on the right; the average reads as mid-grey and flags white
text at 2.6:1. On the page the text sits on the `.82` end and reads fine.

### The blind spot this tool used to have

`contrast.py` originally skipped any text whose ancestor had a
`background-image`, to avoid false positives over photographs. That is exactly
where Travel's hero headline lived — it painted `#37333f` on a dark band and
still passed a 0/0 run. The tool now composites gradient stops instead of
skipping, excludes genuine gradient text (`-webkit-text-fill-color:
transparent`) and colour-emoji runs, and **reports** raster skips rather than
hiding them. That change surfaced two more invisible-text bugs on its first
run.

A clean audit is only worth as much as what the audit agrees to look at.

Note that external data (Google Sheets, TMDB, Open Library) will not load
without network access, so card grids audit as empty/error states. Those states
are themselves worth checking — they are what a reader sees when a sheet is
slow.

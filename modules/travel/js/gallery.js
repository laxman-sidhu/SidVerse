// SidTrails gallery - a windowed grid: every tile reserves its height up front, mounts its media near the viewport and drops it again far away, so hundreds of items stay smooth. Media comes from the Photos tab through js/photos.js.

// How far ahead of the viewport (in screen-heights) to mount a tile, and how far behind to unmount it.
const MOUNT_SCREENS  = 1.5;
const UNMOUNT_SCREENS = 6;

// Placeholder shape before a tile's real ratio is known (1 = square).
const DEFAULT_ASPECT = 1;

// Gallery column of the Photos tab, as [{ name, url, kind }].
async function loadGallery() {
  if (!window.SidPhotos) return [];
  try {
    const data = await window.SidPhotos.load();
    return data.gallery;
  } catch (e) {
    return [];
  }
}

// ─── LAYOUT METRICS ─── Read the grid's row unit, gap and a real column width ONCE (and again on resize). Everything downstream computes spans from these cached numbers, so loading an image never forces a per-image layout read - the old code's main source of jank.
const GRID = document.getElementById('galleryGrid');
const metrics = { colWidth: 0, rowH: 6, gap: 12 };
let DEFAULT_SPAN = 1;

function measureMetrics() {
  const cs = getComputedStyle(GRID);
  metrics.rowH = parseFloat(cs.getPropertyValue('grid-auto-rows')) || 6;
  metrics.gap  = parseFloat(cs.getPropertyValue('row-gap'))
              || parseFloat(cs.getPropertyValue('gap')) || 12;
  // Measure an actual rendered cell - accounts for the `1fr` distribution that a pure template calculation would miss.
  const cell = GRID.firstElementChild;
  if (cell) {
    const w = cell.getBoundingClientRect().width;
    if (w) metrics.colWidth = w;
  }
  if (!metrics.colWidth) metrics.colWidth = 160; // pre-build fallback estimate
  DEFAULT_SPAN = spanFor(1, DEFAULT_ASPECT);
}

// Convert an aspect ratio into a grid-row span using the cached column width. span N occupies: N*rowH + (N-1)*gap → N = (px + gap) / (rowH + gap).
function spanFor(w, h) {
  if (!w || !h || !metrics.colWidth) return DEFAULT_SPAN || 1;
  const px = metrics.colWidth * (h / w);
  return Math.max(1, Math.ceil((px + metrics.gap) / (metrics.rowH + metrics.gap)));
}

function reserveSpan(it) {
  const span = (it.w && it.h) ? spanFor(it.w, it.h) : DEFAULT_SPAN;
  it.el.style.gridRowEnd = 'span ' + span;
}

// ─── ITEM STATE ───
let ITEMS = [];

// Build a lightweight placeholder cell - no media yet. The real <img>/<video> is attached later by mountMedia() when the tile nears the viewport.
function createCell(it, i) {
  const el = document.createElement('div');
  el.className = 'gallery-item is-placeholder';
  el.dataset.index = String(i);
  el.dataset.kind = it.kind;
  if (it.kind === 'video') {
    const badge = document.createElement('span');
    badge.className = 'gallery-video-badge';
    badge.textContent = 'Video';
    el.appendChild(badge);
  }
  el.addEventListener('click', () => openModalAt(i));
  it.el = el;
  return el;
}

// Attach the real media to a tile. Called when the tile scrolls near view.
function mountMedia(it) {
  if (it.mounted) return;
  it.mounted = true;

  if (it.kind === 'image') {
    const img = document.createElement('img');
    img.className = 'media';
    img.alt = it.name;
    img.decoding = 'async';
    img.loading = 'lazy';            // harmless extra backstop
    img.addEventListener('load', () => {
      if (img.naturalWidth && img.naturalHeight) {
        it.w = img.naturalWidth;
        it.h = img.naturalHeight;
        it.loaded = true;
        reserveSpan(it);             // snap to true ratio (no getBoundingClientRect)
      }
      it.el.classList.remove('is-placeholder');
      img.classList.add('loaded');
    }, { once: true });
    img.addEventListener('error', () => { it.el.style.display = 'none'; }, { once: true });
    img.src = window.SidPhotos.cdn(it.url, 'f_auto,q_auto,w_900');
    it.media = img;
    it.el.appendChild(img);
  } else {
    const video = document.createElement('video');
    video.className = 'media';
    video.src = it.url;
    video.preload = 'metadata';
    const still = window.SidPhotos.poster(it.url);
    if (still) video.poster = still;
    video.muted = true;
    video.playsInline = true;
    video.addEventListener('loadedmetadata', () => {
      if (video.videoWidth && video.videoHeight) {
        it.w = video.videoWidth;
        it.h = video.videoHeight;
        it.loaded = true;
        reserveSpan(it);
      }
      it.el.classList.remove('is-placeholder');
      video.classList.add('loaded');
    }, { once: true });
    video.addEventListener('error', () => { it.el.style.display = 'none'; }, { once: true });
    it.media = video;
    it.el.insertBefore(video, it.el.firstChild); // keep the badge layered on top
  }
}

// Detach media from a tile that has scrolled far away - frees memory/decoded bitmaps. The reserved height is kept, so re-mounting causes no layout shift.
function unmountMedia(it) {
  if (!it.mounted) return;
  it.mounted = false;
  const m = it.media;
  if (m) {
    if (it.kind === 'video') { try { m.pause(); } catch (_) {} }
    m.removeAttribute('src');
    if (it.kind === 'video' && m.load) { try { m.load(); } catch (_) {} }
    m.remove();
  }
  it.media = null;
  it.el.classList.add('is-placeholder');
}

// ─── WINDOWING (IntersectionObservers) ─── mountObs fires when a tile enters the lookahead zone → attach media. evictObs fires when a tile leaves the larger zone → detach media.
let mountObs = null;
let evictObs = null;

function setupObservers() {
  const vh = window.innerHeight || 800;
  if (mountObs) mountObs.disconnect();
  if (evictObs) evictObs.disconnect();

  mountObs = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        const it = ITEMS[+e.target.dataset.index];
        if (it) mountMedia(it);
      }
    }
  }, { root: null, rootMargin: Math.round(vh * MOUNT_SCREENS) + 'px 0px' });

  evictObs = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) {
        const it = ITEMS[+e.target.dataset.index];
        if (it) unmountMedia(it);
      }
    }
  }, { root: null, rootMargin: Math.round(vh * UNMOUNT_SCREENS) + 'px 0px' });

  ITEMS.forEach(it => { mountObs.observe(it.el); evictObs.observe(it.el); });
}

// Recompute spans on resize (column width changes). Uses each item's known dimensions where it has them, the default square otherwise. Debounced, and does no per-image layout reads.
let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    measureMetrics();
    ITEMS.forEach(reserveSpan);
    setupObservers(); // viewport height changed → refresh the windows
  }, 150);
}, { passive: true });

// ─── MODAL STATE & BEHAVIOUR ───
const galleryState = { items: [], index: 0 };

// Warm the next/previous image so arrow navigation feels instant.
function preloadNeighbors() {
  const n = galleryState.items.length;
  if (n < 2) return;
  [1, -1].forEach(d => {
    const it = galleryState.items[((galleryState.index + d) % n + n) % n];
    if (it && it.kind === 'image') { const im = new Image(); im.src = window.SidPhotos.cdn(it.url, 'f_auto,q_auto,w_2000'); }
  });
}

function openModalAt(index) {
  if (!galleryState.items.length) return;
  const n = galleryState.items.length;
  galleryState.index = ((index % n) + n) % n;
  const item = galleryState.items[galleryState.index];
  const stage = document.getElementById('modalStage');
  stage.innerHTML = '';
  if (item.kind === 'image') {
    const img = document.createElement('img');
    img.src = window.SidPhotos.cdn(item.url, 'f_auto,q_auto,w_2000');
    img.alt = item.name;
    stage.appendChild(img);
  } else {
    const video = document.createElement('video');
    video.src = item.url;
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    stage.appendChild(video);
  }
  document.getElementById('modalCounter').textContent =
    `${galleryState.index + 1} / ${n}`;
  const showNav = n > 1;
  document.getElementById('modalPrev').hidden = !showNav;
  document.getElementById('modalNext').hidden = !showNav;
  const modal = document.getElementById('modal');
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  preloadNeighbors();
}

function closeModal() {
  const modal = document.getElementById('modal');
  modal.classList.remove('open');
  document.body.style.overflow = '';
  const stage = document.getElementById('modalStage');
  const v = stage.querySelector('video');
  if (v) { try { v.pause(); } catch (_) {} }
  stage.innerHTML = '';
}

function shift(delta) {
  openModalAt(galleryState.index + delta);
}

// ─── INIT ───
async function init() {
  const loadingEl = document.getElementById('galleryLoading');
  const grid      = document.getElementById('galleryGrid');
  const empty     = document.getElementById('galleryEmpty');
  const meta      = document.getElementById('galleryMeta');

  const files = await loadGallery();
  loadingEl.hidden = true;

  if (files.length === 0) {
    empty.hidden = false;
    return;
  }

  ITEMS = files.map((f, i) => ({
    name: f.name,
    url: f.url,
    kind: f.kind,
    w: 0,
    h: 0,
    el: null,
    media: null,
    mounted: false,
    loaded: false,
    index: i,
  }));
  galleryState.items = ITEMS;

  grid.hidden = false;

  // Phase 1 - build every placeholder cell in one fragment, insert once.
  const frag = document.createDocumentFragment();
  ITEMS.forEach((it, i) => frag.appendChild(createCell(it, i)));
  grid.appendChild(frag);

  // Phase 2 - measure real geometry, then reserve each tile's true height so the page is its correct length before any media downloads.
  measureMetrics();
  ITEMS.forEach(reserveSpan);

  // Phase 3 - start the windowed loading (or mount everything if IO is absent).
  if ('IntersectionObserver' in window) {
    setupObservers();
  } else {
    ITEMS.forEach(mountMedia);
  }

  document.getElementById('itemCount').innerHTML =
    `<strong>${files.length}</strong> ${files.length === 1 ? 'item' : 'items'}`;
  meta.hidden = false;
}

// ─── EVENT BINDINGS ───
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalPrev').addEventListener('click', (e) => {
  e.stopPropagation();
  shift(-1);
});
document.getElementById('modalNext').addEventListener('click', (e) => {
  e.stopPropagation();
  shift(1);
});
document.getElementById('modal').addEventListener('click', (e) => {
  if (e.target.id === 'modal') closeModal();
});
document.addEventListener('keydown', (e) => {
  const open = document.getElementById('modal').classList.contains('open');
  if (!open) return;
  if (e.key === 'Escape')           closeModal();
  else if (e.key === 'ArrowRight') { e.preventDefault(); shift(1); }
  else if (e.key === 'ArrowLeft')  { e.preventDefault(); shift(-1); }
});

init();


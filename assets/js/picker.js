// A styled option list, shared by every module. The CLOSED control was already ours; the open one never was - the browser draws that popup and honours almost nothing, so the items sat hard against its left edge with no padding to give and no rule that could. On a pointer device the native popup is suppressed and this is drawn instead. The <select> stays exactly where it is and remains the state: it keeps its label, its value, its change event and its 16px, so every caller that reads or writes .value is untouched and nothing here has to be told when options change.

const HTML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

function esc(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, ch => HTML_ESCAPES[ch]);
}

// Zoom compounds down the tree, and the menu writes its px into that space.
function pageScale(element) {
  let scale = 1;
  for (let node = element; node && node.nodeType === 1; node = node.parentElement) {
    const value = parseFloat(getComputedStyle(node).zoom);
    if (value > 0) scale *= value;
  }
  return scale;
}

// Which selects get the treatment. An explicit list, so a <select> added later is plain until someone decides otherwise.
const UPGRADE = ".facets__select, .scopepick__select, .scopepick select, .gate__select, .selectwrap select, #sortSelect";

// A multi-pick control is a button, not a <select>: the browser draws `multiple` as a list box, which no bar on this site has room for. The hidden <select multiple> beside the button is still the state, so readers and writers work exactly as they do for a single pick.
const MULTI = "[data-multi]";

// Beyond this many the summary counts instead of naming, which is shorter than any list of three.
const NAMED_PICKS = 2;

const GAP = 6;
const MARGIN = 10;

// The menu grows to its longest option; this is where it stops growing.
const MAX_WIDTH = 460;

let menu = null;
let owner = null;      // the select the open menu belongs to
let active = -1;       // the highlighted item
let wired = false;
let typed = "";
let typedAt = 0;

// A finger cannot hover. The platform picker on a phone is better than anything here - a wheel on iOS, a dialog on Android - so touch is left alone entirely.
function isTouch() {
  return window.matchMedia("(hover: none)").matches;
}

function isMulti(node) {
  return Boolean(node && node.matches && node.matches(MULTI));
}

// The <select> that carries the state: itself for a single pick, the hidden one beside the button for a multi.
function storeFor(node) {
  if (!isMulti(node)) return node;
  const wrap = node.closest(".facets__wrap") || node.parentElement;
  return wrap ? wrap.querySelector("select[multiple]") : null;
}

// What the closed control says: the fallback when nothing is picked, the names while there are few, a count once there are more.
function summarise(trigger) {
  const store = storeFor(trigger);
  if (!store) return;
  const picked = [...store.selectedOptions];
  trigger.classList.toggle("is-empty", picked.length === 0);
  if (!picked.length) trigger.textContent = trigger.dataset.all || "Any";
  else if (picked.length <= NAMED_PICKS) trigger.textContent = picked.map(option => option.textContent).join(", ");
  else trigger.textContent = `${picked.length} selected`;
}

export function refresh(root) {
  (root || document).querySelectorAll(MULTI).forEach(summarise);
}

function options(select) {
  return [...select.options].map((option, index) => ({
    index,
    value: option.value,
    label: option.textContent,
    disabled: option.disabled,
    chosen: index === select.selectedIndex
  }));
}

// The box the menu lines up with: the wrapper is the visible control wherever there is one, and the select itself is only the visible control when there is not.
function anchorFor(select) {
  return select.closest(".facets__wrap, .scopepick, .sortfield, .selectwrap") || select;
}

// Arrow keys and type-ahead walk the options either way, so they ask for the store rather than the owner.
function ownerOptions() {
  const store = owner ? storeFor(owner) : null;
  return store ? store.options : [];
}

function close({ focus = false } = {}) {
  if (!menu) return;
  menu.remove();
  menu = null;
  active = -1;
  const was = owner;
  owner = null;
  if (was) {
    was.setAttribute("aria-expanded", "false");
    if (focus) was.focus();
  }
}

function place() {
  if (!menu || !owner) return;

  // The rect is in viewport pixels and the menu writes its px into the zoomed space it lives in, so every measurement crosses over here and nowhere else.
  const scale = pageScale(menu);
  const box = anchorFor(owner).getBoundingClientRect();
  const viewWidth = window.innerWidth / scale;
  const viewHeight = window.innerHeight / scale;
  const top = box.top / scale;
  const bottom = box.bottom / scale;

  // The control is the floor and not the ceiling: a long option widens the menu rather than being cut down to "All indu...".
  const room = Math.min(MAX_WIDTH, viewWidth - MARGIN * 2);
  menu.style.maxWidth = `${room}px`;
  menu.style.minWidth = `${Math.min(box.width / scale, room)}px`;

  // Below unless there is not room and there is more of it above.
  const under = viewHeight - bottom - GAP - MARGIN;
  const over = top - GAP - MARGIN;
  const above = menu.offsetHeight > under && over > under;

  // Borders only for now; once max-height lands this same gap counts the scrollbar too.
  const edges = menu.offsetWidth - menu.clientWidth;
  menu.style.maxHeight = `${Math.max(120, above ? over : under)}px`;
  menu.style.top = above ? "auto" : `${bottom + GAP}px`;
  menu.style.bottom = above ? `${viewHeight - top + GAP}px` : "auto";

  // A scrollbar takes its width out of the labels, which sizing to content never budgeted for.
  const bar = menu.offsetWidth - menu.clientWidth - edges;
  if (bar > 0) menu.style.minWidth = `${Math.min(menu.offsetWidth + bar, room)}px`;

  // Wider than its control and up against the edge - as in the right-hand drawer - so it grows leftward from that control instead of flattening against the window.
  const anchorLeft = box.left / scale;
  const wanted = anchorLeft + menu.offsetWidth > viewWidth - MARGIN
    ? box.right / scale - menu.offsetWidth
    : anchorLeft;
  menu.style.left = `${Math.max(MARGIN, Math.min(wanted, viewWidth - menu.offsetWidth - MARGIN))}px`;
}

function paintActive({ reveal = true } = {}) {
  if (!menu) return;
  [...menu.children].forEach((item, index) => {
    item.classList.toggle("is-active", index === active);
    // Guarded: not every environment implements it, and failing to scroll must not stop the list working.
    if (reveal && index === active && typeof item.scrollIntoView === "function") {
      item.scrollIntoView({ block: "nearest" });
    }
  });
}

// A multi stays open: picking three genres should be three clicks, not three round trips through the menu.
function toggle(index) {
  const store = storeFor(owner);
  const option = store && store.options[index];
  if (!option || option.disabled) return;

  option.selected = !option.selected;
  const item = menu ? menu.querySelector(`.pickmenu__item[data-index="${index}"]`) : null;
  if (item) {
    item.classList.toggle("is-chosen", option.selected);
    item.setAttribute("aria-selected", String(option.selected));
  }

  summarise(owner);
  const view = store.ownerDocument.defaultView || window;
  store.dispatchEvent(new view.Event("change", { bubbles: true }));
}

function choose(index) {
  if (!owner) return;
  // Held before close(), which clears owner: dispatching on it afterwards threw, and the change event is the only thing that tells the page to repaint.
  const select = owner;
  const option = select.options[index];
  if (!option || option.disabled) return;
  const changed = select.selectedIndex !== index;
  select.selectedIndex = index;
  close({ focus: true });
  // Built in the element's OWN realm: a page rendered inside another window has a different Event constructor, and dispatchEvent rejects a foreign one.
  const view = select.ownerDocument.defaultView || window;
  // Setting .value in script does not fire this, and every caller listens for it.
  if (changed) select.dispatchEvent(new view.Event("change", { bubbles: true }));
}

function open(control) {
  close();

  const multi = isMulti(control);
  const store = storeFor(control);
  if (!store) return;
  owner = control;

  // On <body> and fixed, not inside the control: .panel__body scrolls, .topbar has a backdrop-filter, and either would clip this away or trap it.
  menu = document.createElement("div");
  menu.className = multi ? "pickmenu pickmenu--multi" : "pickmenu";
  menu.setAttribute("role", "listbox");
  if (multi) menu.setAttribute("aria-multiselectable", "true");
  menu.innerHTML = options(store).map(option => {
    const on = multi ? store.options[option.index].selected : option.chosen;
    return `<div class="pickmenu__item${on ? " is-chosen" : ""}${option.disabled ? " is-off" : ""}" `
      + `role="option" aria-selected="${on}" data-index="${option.index}">`
      + (multi ? '<span class="pickmenu__tick" aria-hidden="true"></span>' : "")
      + `<span class="pickmenu__label">${esc(option.label)}</span></div>`;
  }).join("");

  document.body.appendChild(menu);
  control.setAttribute("aria-expanded", "true");

  // The pointer drives the SAME highlight the arrow keys do, so the row under the mouse lights up without a second :hover state lighting a second row. On the menu itself, so it is dropped with it. No reveal: scrolling the list to a row the mouse is already on would then shift it out from under the pointer.
  menu.addEventListener("mousemove", event => {
    const item = event.target.closest(".pickmenu__item");
    if (!item || item.classList.contains("is-off")) return;
    const index = Number(item.dataset.index);
    if (index === active) return;
    active = index;
    paintActive({ reveal: false });
  });

  // Nothing is highlighted in a multi until a key moves: its "chosen" is every ticked row, not one.
  active = multi ? -1 : store.selectedIndex;
  place();
  paintActive();
}

// Native selects stop at the ends rather than wrapping, and a wrap from the last option round to "All ..." would clear the filter on one extra keypress.
function moveTo(from, by) {
  const list = ownerOptions();
  if (!list.length) return;
  for (let next = from; next >= 0 && next < list.length; next += by) {
    if (!list[next].disabled) {
      active = next;
      paintActive();
      return;
    }
  }
}

function step(by) {
  moveTo(active + by, by);
}

// Typing jumps, the way the native list does.
function jump(letter) {
  if (!owner) return;
  const now = Date.now();
  typed = now - typedAt > 900 ? letter : typed + letter;
  typedAt = now;

  const list = [...ownerOptions()];
  const from = typed.length === 1 ? active + 1 : active;
  for (let i = 0; i < list.length; i++) {
    const index = (from + i) % list.length;
    if (!list[index].disabled && list[index].textContent.toLowerCase().startsWith(typed)) {
      active = index;
      paintActive();
      return;
    }
  }
}

export function attach() {
  if (wired) return;
  wired = true;

  // Delegated, so a rebuilt panel or a dialog opened later needs no re-wiring.
  document.addEventListener("mousedown", event => {
    // A multi has no native popup to suppress, so touch gets this menu too rather than a list box nothing has room for.
    const trigger = event.target.closest ? event.target.closest(MULTI) : null;
    if (trigger) {
      event.preventDefault();
      const same = owner === trigger;
      close();
      if (!same) {
        trigger.focus();
        open(trigger);
      }
      return;
    }

    const select = event.target.closest ? event.target.closest(UPGRADE) : null;

    if (select && !isTouch()) {
      // The only thing that reliably stops the browser drawing its own popup.
      event.preventDefault();
      const same = owner === select;
      close();
      if (!same) {
        select.focus();
        open(select);
      }
      return;
    }

    if (menu && !event.target.closest(".pickmenu")) close();
  });

  document.addEventListener("click", event => {
    const item = event.target.closest(".pickmenu__item");
    if (!item) return;
    if (isMulti(owner)) toggle(Number(item.dataset.index));
    else choose(Number(item.dataset.index));
  });

  document.addEventListener("keydown", event => {
    const control = event.target.closest
      ? event.target.closest(`${MULTI}, ${UPGRADE}`)
      : null;

    if (control && !menu && (isMulti(control) || !isTouch())) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        open(control);
      }
      return;
    }

    if (!menu) return;

    if (event.key === "Escape") { event.preventDefault(); close({ focus: true }); }
    else if (event.key === "ArrowDown") { event.preventDefault(); step(1); }
    else if (event.key === "ArrowUp") { event.preventDefault(); step(-1); }
    else if (event.key === "Home") { event.preventDefault(); moveTo(0, 1); }
    else if (event.key === "End") { event.preventDefault(); moveTo(ownerOptions().length - 1, -1); }
    else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (active < 0) return;
      if (isMulti(owner)) toggle(active);
      else choose(active);
    }
    else if (event.key === "Tab") close();
    else if (event.key.length === 1) jump(event.key.toLowerCase());
  });

  // Capture, or a scroll inside the drawer never reaches this and the menu is left floating where the control used to be. Its OWN scroll is the list being read, though, and closing on that made the list unreadable past its first screen.
  window.addEventListener("scroll", event => {
    const where = event.target;
    if (menu && where && where.nodeType && menu.contains(where)) return;
    close();
  }, true);
  window.addEventListener("resize", () => close());
}

import { CLOUDINARY } from "./config.js";
import { post, formatDate, fetchDishes, addPending, cdn } from "./api.js";
import { askOwner, hasKey } from "./gate.js";
import { childrenOf, listChildren, createFolder, addPath, learnFromUrls } from "./folders.js";

const $ = s => document.querySelector(s);

const key = () => sessionStorage.getItem("sidbites:key") || "";
const slug = v => v.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const esc = s => String(s || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let uploadedUrl = "";
let pickedFile = null;
let folderPath = CLOUDINARY.baseFolder;

const rating = $("#fRating");

/* ---------- boot ---------- */

bindLock();
bindForm();
bindFiles();
bindFolders();
paintRating();
loadKnownValues();


function show(panel) {
  ["#lockPanel", "#formPanel", "#donePanel"].forEach(id => { $(id).hidden = id !== panel; });
}

function showError(el, msg) {
  el.textContent = msg;
  el.hidden = !msg;
}

// fills the place, location and cuisine suggestions from what is already in the sheet
async function loadKnownValues() {
  try {
    const dishes = await fetchDishes();
    learnFromUrls(dishes.map(d => d.image));
    const fill = (id, k) => {
      const values = [...new Set(dishes.map(d => d[k]).filter(Boolean))].sort();
      $(`#${id}`).innerHTML = values.map(v => `<option value="${esc(v)}">`).join("");
    };
    fill("placeList", "place");
    fill("locList", "location");
    fill("cuisineList", "cuisine");
    renderFolders();
  } catch (_) {}
}

/* ---------- unlock ---------- */

// The gate asks who you are, then the password. Apps Script still checks every
// write, so the copy in config.js only decides whether the form opens.
async function bindLock() {
  if (hasKey()) return showForm();
  if (!(await askOwner())) {
    // Declined, so there is nothing on this page to see.
    window.location.href = "index.html";
    return;
  }
  try {
    await post({ action: "auth", password: sessionStorage.getItem("sidbites:key") });
    showForm();
  } catch (_) {
    // The sheet turned it down, so ask again rather than stranding the page.
    sessionStorage.removeItem("sidbites:key");
    bindLock();
  }
}

function showForm() {
  const date = $("#fDate");
  if (!date.value) {
    const now = new Date();
    date.value = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }
  show("#formPanel");
  renderFolders();
  syncFolders();
  $("#fDish").focus();
}

/* ---------- form ---------- */

function paintRating() {
  $("#ratingOut").textContent = rating.value;
  rating.style.setProperty("--pct", `${((rating.value - 1) / 9) * 100}%`);
}

function bindForm() {
  rating.addEventListener("input", paintRating);

  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.toggle("is-on", t === tab));
      $("#pane-upload").hidden = tab.dataset.tab !== "upload";
      $("#pane-url").hidden = tab.dataset.tab !== "url";
    });
  });

  $("#fDish").addEventListener("blur", () => {
    const id = $("#fPublicId");
    if (!id.value && $("#fDish").value) id.value = slug($("#fDish").value);
  });

  $("#fPublicId").addEventListener("blur", e => { e.target.value = slug(e.target.value); });
  $("#fUrl").addEventListener("input", e => preview(e.target.value.trim()));
  $("#addForm").addEventListener("submit", save);
  $("#againBtn").addEventListener("click", () => { resetForm(); show("#formPanel"); $("#fDish").focus(); });
}

/* ---------- folders ---------- */

function renderFolders() {
  const crumbs = folderPath.split("/");

  $("#folderCrumbs").innerHTML = crumbs.map((name, i) => {
    const path = crumbs.slice(0, i + 1).join("/");
    const last = i === crumbs.length - 1 ? " is-last" : "";
    const sep = i ? `<span class="crumb__sep">/</span>` : "";
    return `${sep}<button type="button" class="crumb${last}" data-path="${esc(path)}">${esc(name)}</button>`;
  }).join("");

  const kids = childrenOf(folderPath);
  $("#folderList").innerHTML = kids.length
    ? kids.map(n => `<button type="button" class="folder__chip" data-name="${esc(n)}">${esc(n)}</button>`).join("")
    : `<span class="folder__empty">No folders inside this one yet.</span>`;

  $("#folderHint").textContent = `Photo goes to ${folderPath}/`;

  $("#folderCrumbs").querySelectorAll(".crumb").forEach(btn => {
    btn.addEventListener("click", () => goTo(btn.dataset.path));
  });
  $("#folderList").querySelectorAll(".folder__chip").forEach(btn => {
    btn.addEventListener("click", () => goTo(`${folderPath}/${btn.dataset.name}`));
  });
}

function goTo(path) {
  folderPath = path;
  renderFolders();
  syncFolders();
}

// pulls the real folder list from Cloudinary through Apps Script
async function syncFolders() {
  const target = folderPath;
  const ok = await listChildren(target, key());
  if (ok && target === folderPath) renderFolders();
}

function bindFolders() {
  $("#folderAdd").addEventListener("click", addFolder);
  $("#fNewFolder").addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); addFolder(); }
  });
}

async function addFolder() {
  const input = $("#fNewFolder");
  const name = slug(input.value);
  if (!name) return input.focus();

  const path = `${folderPath}/${name}`;
  addPath(path);
  input.value = "";
  goTo(path);
  await createFolder(path, key());
}

/* ---------- files ---------- */

function bindFiles() {
  const drop = $("#drop");
  const fileInput = $("#fFile");

  fileInput.addEventListener("change", () => setFile(fileInput.files[0]));

  ["dragenter", "dragover"].forEach(ev =>
    drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add("is-over"); }));

  ["dragleave", "drop"].forEach(ev =>
    drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove("is-over"); }));

  drop.addEventListener("drop", e => setFile(e.dataTransfer.files[0]));
}

function setFile(file) {
  if (!file || !file.type.startsWith("image/")) return;
  pickedFile = file;
  uploadedUrl = "";
  $("#dropTitle").textContent = file.name;
  preview(URL.createObjectURL(file));
}

function preview(src) {
  $("#preview").hidden = !src;
  if (src) $("#previewImg").src = src;
}

/* ---------- cloudinary ---------- */

async function uploadToCloudinary(file, publicId, onProgress) {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folderPath);
  if (publicId) form.append("public_id", publicId);

  if (CLOUDINARY.mode === "signed") {
    const params = { folder: folderPath, timestamp: Math.round(Date.now() / 1000) };
    if (publicId) params.public_id = publicId;

    let sig;
    try {
      sig = await post({ action: "signature", password: key(), params });
    } catch (_) {
      throw new Error("Could not sign the upload. Check CLOUDINARY_API_SECRET in your Apps Script properties.");
    }

    form.append("api_key", CLOUDINARY.apiKey || sig.apiKey);
    form.append("timestamp", params.timestamp);
    form.append("signature", sig.signature);
  } else {
    if (!CLOUDINARY.uploadPreset || CLOUDINARY.uploadPreset.startsWith("PASTE")) {
      throw new Error("Add your Cloudinary upload preset to config.js first.");
    }
    form.append("upload_preset", CLOUDINARY.uploadPreset);
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/image/upload`);
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(e.loaded / e.total); };
    xhr.onload = () => {
      let res = {};
      try { res = JSON.parse(xhr.responseText); } catch (_) {}
      if (res.secure_url) resolve(res.secure_url);
      else reject(new Error((res.error && res.error.message) || "Cloudinary refused that upload."));
    };
    xhr.onerror = () => reject(new Error("The upload failed. Check your connection."));
    xhr.send(form);
  });
}

/* ---------- save ---------- */

function saving(on, step, pct) {
  $("#saving").hidden = !on;
  if (step) $("#savingStep").textContent = step;
  $("#progressBar").style.width = pct === undefined ? "0" : `${Math.round(pct * 100)}%`;
  document.body.style.overflow = on ? "hidden" : "";
}

async function save(e) {
  e.preventDefault();
  const err = $("#addError");
  const onUploadTab = !$("#pane-upload").hidden;
  showError(err, "");

  if (onUploadTab && !pickedFile && !uploadedUrl) return showError(err, "Pick a photo, or switch to the link tab.");
  if (!onUploadTab && !$("#fUrl").value.trim()) return showError(err, "Paste an image link, or switch to the upload tab.");

  try {
    let image = $("#fUrl").value.trim();

    if (onUploadTab) {
      if (!uploadedUrl) {
        saving(true, "Uploading photo", 0);
        uploadedUrl = await uploadToCloudinary(
          pickedFile,
          slug($("#fPublicId").value) || slug($("#fDish").value),
          p => saving(true, p < 1 ? "Uploading photo" : "Processing photo", p)
        );
      }
      image = uploadedUrl;
    }

    saving(true, "Saving to the sheet", 1);
    const dish = {
      dish: $("#fDish").value.trim(),
      place: $("#fWhere").value.trim(),
      location: $("#fLocation").value.trim(),
      image,
      date: formatDate($("#fDate").value),
      rating: rating.value,
      cuisine: $("#fCuisine").value.trim()
    };

    await post({ action: "add", password: key(), dish });
    addPending(dish);

    saving(false);
    $("#doneImg").src = cdn(dish.image, "f_auto,q_auto,w_600");
    $("#doneImg").alt = dish.dish;
    $("#doneTitle").textContent = dish.dish;
    $("#doneNote").textContent = `${dish.rating}/10 at ${dish.place}. It is in the sheet and on the log.`;
    show("#donePanel");
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    saving(false);
    if (/password/i.test(error.message)) sessionStorage.removeItem("sidbites:key");
    showError(err, error.message);
  }
}

function resetForm() {
  $("#addForm").reset();
  uploadedUrl = "";
  pickedFile = null;
  $("#dropTitle").textContent = "Choose a photo or drop it here";
  preview("");
  paintRating();
  const now = new Date();
  $("#fDate").value = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  showError($("#addError"), "");
}

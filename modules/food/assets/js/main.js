import { init } from "./app.js";
import { askOwner, hasKey } from "./gate.js";

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();

// The gate is asked here rather than on the form page, so the answer arrives
// before the page changes instead of after it.
document.addEventListener("click", async event => {
  const add = event.target.closest(".btn-add");
  if (!add || hasKey()) return;
  event.preventDefault();
  if (await askOwner()) window.location.href = add.getAttribute("href");
});

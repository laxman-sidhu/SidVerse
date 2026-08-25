// The owner gate. A bare password box reads as a wall, so the question comes first and the field only appears after Yes. Same two steps, same wording and same button order as the film diary and the book diary.

import { ADMIN_PASSWORD, SITE } from "./config.js";

let gate = null;
let settle = null;

const owner = () => SITE.author || "Siddhesh";

function build() {
  if (gate) return gate;

  gate = document.createElement("div");
  gate.className = "gate";
  gate.hidden = true;
  gate.innerHTML = `
    <div class="gate__backdrop" data-gate-close></div>
    <div class="gate__panel" role="dialog" aria-modal="true" aria-labelledby="gateTitle">
      <h2 class="gate__title" id="gateTitle">This is ${owner()}\u2019s food log</h2>
      <p class="gate__text">Only ${owner()} can add to this log. Everything else is yours to browse.</p>
      <div data-step="who">
        <div class="gate__actions">
          <button type="button" class="gate__btn gate__btn--ghost" data-gate-close>No, go back</button>
          <button type="button" class="gate__btn gate__btn--solid" data-gate-yes>Yes, I\u2019m ${owner()}</button>
        </div>
      </div>
      <div data-step="password" hidden>
        <label class="gate__label" for="gatePassword">Password</label>
        <input class="gate__input" id="gatePassword" type="password" autocomplete="current-password" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022">
        <p class="gate__error" hidden>That is not it. Try again.</p>
        <div class="gate__actions">
          <button type="button" class="gate__btn gate__btn--ghost" data-gate-close>Cancel</button>
          <button type="button" class="gate__btn gate__btn--solid" data-gate-submit>Sign in</button>
        </div>
      </div>
    </div>`;

  document.body.appendChild(gate);

  gate.addEventListener("click", event => {
    if (event.target.closest("[data-gate-close]")) close(false);
    if (event.target.closest("[data-gate-yes]")) step("password");
    if (event.target.closest("[data-gate-submit]")) submit();
  });

  gate.querySelector("#gatePassword").addEventListener("keydown", event => {
    if (event.key === "Enter") submit();
    if (event.key === "Escape") close(false);
  });

  return gate;
}

function step(name) {
  gate.querySelector('[data-step="who"]').hidden = name !== "who";
  gate.querySelector('[data-step="password"]').hidden = name !== "password";
  if (name === "password") setTimeout(() => gate.querySelector("#gatePassword").focus(), 60);
}

function submit() {
  const field = gate.querySelector("#gatePassword");
  if (field.value && field.value === ADMIN_PASSWORD) {
    sessionStorage.setItem("sidbites:key", field.value);
    close(true);
    return;
  }
  gate.querySelector(".gate__error").hidden = false;
  field.select();
}

function close(ok) {
  if (!gate) return;
  gate.hidden = true;
  document.body.classList.remove("gate-open");
  const done = settle;
  settle = null;
  if (done) done(ok);
}

// Resolves true once the password is accepted, false if the gate is dismissed.
export function askOwner() {
  const node = build();
  node.querySelector(".gate__error").hidden = true;
  node.querySelector("#gatePassword").value = "";
  step("who");
  node.hidden = false;
  document.body.classList.add("gate-open");
  return new Promise(resolve => { settle = resolve; });
}

export const hasKey = () => Boolean(sessionStorage.getItem("sidbites:key"));

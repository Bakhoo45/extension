// UMT Captcha Autofill
//
// The portal prints the captcha in plain text inside <span class="captcha">, so
// there is nothing to solve and nothing to guess: read it and put it in the code
// field. This only touches the login form. It never reads the password, and it
// never submits the form.

(function () {
  "use strict";

  const CAPTCHA_SELECTOR = "span.captcha";
  const CODE_INPUT = "#SecurityCode";
  const FALLBACK_INPUT = 'input[name="SecurityCode"]';

  let lastFilled = null;

  function readCaptcha() {
    const el = document.querySelector(CAPTCHA_SELECTOR);
    if (!el) return "";
    // The span is rendered as " K7EDk ", so strip every whitespace character.
    return (el.textContent || "").replace(/\s+/g, "");
  }

  function fill(force) {
    const input = document.querySelector(CODE_INPUT) || document.querySelector(FALLBACK_INPUT);
    if (!input) return false;

    const code = readCaptcha();
    if (!code) return false;

    // Do not overwrite a code the user typed themselves.
    const current = (input.value || "").trim();
    if (!force && current && current !== lastFilled) return false;
    if (current === code) return false;

    input.value = code;
    lastFilled = code;

    // The field has onkeypress="validate(event)" and paste handlers, which a
    // direct value assignment bypasses. Fire the usual events anyway so any
    // listener on the form sees a normal change.
    for (const type of ["input", "change", "keyup", "blur"]) {
      input.dispatchEvent(new Event(type, { bubbles: true }));
    }
    input.style.outline = "2px solid #22c55e";
    setTimeout(() => { input.style.outline = ""; }, 1200);
    return true;
  }

  function start() {
    // The captcha is server-rendered, but the page may still be settling.
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      const done = fill(false);
      if (done || tries >= 20) clearInterval(timer);
    }, 250);

    // A failed login reloads the page; a successful one navigates away. If the
    // captcha is ever swapped in place, catch that too.
    const observer = new MutationObserver(() => {
      const code = readCaptcha();
      if (code && code !== lastFilled) fill(false);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });

    // Clicking the field after it was cleared should refill it.
    document.addEventListener("click", (e) => {
      const input = document.querySelector(CODE_INPUT);
      if (input && e.target === input && !input.value) fill(true);
    }, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();

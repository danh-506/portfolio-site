// Runs synchronously, before CSS paints, to avoid a flash of the wrong
// theme. Deliberately NOT loaded with defer or type="module" — this must
// block parsing and execute immediately. It only ever reads a stored
// preference and sets an attribute; it does not build any UI, so it is
// safe to run this early.
(function () {
  try {
    var stored = localStorage.getItem("theme-preference");
    if (stored === "light" || stored === "dark") {
      document.documentElement.setAttribute("data-theme", stored);
    }
    // If stored is null or "auto", we leave data-theme unset, so the
    // CSS prefers-color-scheme baseline in tokens.css takes over.
  } catch (err) {
    // localStorage unavailable (private browsing, disabled, quota, etc).
    // Fail silently — the CSS prefers-color-scheme baseline still applies.
  }
})();
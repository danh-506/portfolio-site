// Progressive enhancement: builds a theme picker control and inserts it
// into the page. If this script never runs (JS disabled/blocked/fails),
// no control appears at all — there is nothing inert or misleading left
// behind, and the CSS prefers-color-scheme baseline in tokens.css still
// drives light/dark automatically.

const STORAGE_KEY = "theme-preference";

function getStoredTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredTheme(value) {
  try {
    if (value === "auto") {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, value);
    }
  } catch {
    // localStorage unavailable — theme still applies for this page load
    // via applyTheme() below, it just won't persist across reloads.
  }
}

function applyTheme(value) {
  if (value === "auto") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", value);
  }
}

function buildPicker(current) {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "theme-picker";

  const legend = document.createElement("legend");
  legend.textContent = "Theme";
  fieldset.append(legend);

  const options = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "auto", label: "Auto" },
  ];

  for (const { value, label } of options) {
    const id = `theme-${value}`;

    const wrapper = document.createElement("label");
    wrapper.setAttribute("for", id);
    wrapper.className = "theme-picker__option";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "theme";
    input.id = id;
    input.value = value;
    input.checked = value === current;

    input.addEventListener("change", () => {
      applyTheme(value);
      setStoredTheme(value);
    });

    const text = document.createTextNode(` ${label}`);

    wrapper.append(input, text);
    fieldset.append(wrapper);
  }

  return fieldset;
}

function init() {
  // "auto" means no explicit choice stored — CSS prefers-color-scheme
  // baseline governs, and theme-init.js will not have set data-theme.
  const current = getStoredTheme() ?? "auto";
  const picker = buildPicker(current);

  const mountPoint = document.querySelector("header nav");
  if (mountPoint) {
    mountPoint.after(picker);
  }
}

init();
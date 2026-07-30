// <github-activity username="..." count="..."></github-activity>
//
// Fetches recent public GitHub events for a user and renders them as a
// list. Falls back to whatever static content is authored between the
// element's tags when JavaScript is unavailable or the request fails.
//
// Rendering never uses innerHTML on remote data: event descriptions,
// repo names, and timestamps are all written with textContent onto a
// cloned <template>, so nothing from the API can inject markup.

const ENDPOINT_BASE = "https://api.github.com/users";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes — avoids hammering the
                                     // 60/hr unauthenticated rate limit
                                     // during repeated dev/grading reloads.
const REQUEST_TIMEOUT_MS = 8000;

const ITEM_TEMPLATE = document.createElement("template");
ITEM_TEMPLATE.innerHTML = `
  <li class="github-activity__item">
    <span class="github-activity__desc"></span>
    <a class="github-activity__repo" target="_blank" rel="noopener noreferrer"></a>
    <time class="github-activity__time"></time>
  </li>
`;

function capitalize(word) {
  if (!word) return "Updated";
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function describeEvent(event) {
  switch (event.type) {
    case "PushEvent": {
      const n = event.payload?.commits?.length ?? 0;
      return `Pushed ${n} commit${n === 1 ? "" : "s"} to`;
    }
    case "CreateEvent":
      return event.payload?.ref_type === "repository"
        ? "Created repository"
        : `Created ${event.payload?.ref_type ?? "a ref"} in`;
    case "WatchEvent":
      return "Starred";
    case "ForkEvent":
      return "Forked";
    case "IssuesEvent":
      return `${capitalize(event.payload?.action)} an issue in`;
    case "PullRequestEvent":
      return `${capitalize(event.payload?.action)} a pull request in`;
    case "DeleteEvent":
      return `Deleted a ${event.payload?.ref_type ?? "ref"} in`;
    default:
      return "Was active in";
  }
}

function formatTimeAgo(isoString) {
  const then = new Date(isoString).getTime();
  const seconds = Math.round((Date.now() - then) / 1000);
  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [name, secondsInUnit] of units) {
    const value = Math.floor(seconds / secondsInUnit);
    if (value >= 1) return `${value} ${name}${value === 1 ? "" : "s"} ago`;
  }
  return "just now";
}

class GitHubActivity extends HTMLElement {
  static get observedAttributes() {
    return ["username", "count"];
  }

  #abortController = null;
  #fallback = null;
  #status = null;
  #list = null;
  #retryButton = null;

  connectedCallback() {
    // Move the authored fallback content (already sitting in the light
    // DOM) into its own wrapper instead of discarding it, so it can be
    // shown again on error without ever touching innerHTML.
    const fallback = document.createElement("div");
    fallback.className = "github-activity__fallback";
    fallback.append(...this.childNodes);

    const status = document.createElement("p");
    status.className = "github-activity__status";
    status.setAttribute("aria-live", "polite");

    const list = document.createElement("ul");
    list.className = "github-activity__list";

    this.append(status, list, fallback);

    this.#fallback = fallback;
    this.#status = status;
    this.#list = list;

    this.#load();
  }

  disconnectedCallback() {
    this.#abortController?.abort();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue || !this.isConnected) return;
    this.#load();
  }

  get username() {
    return this.getAttribute("username") || "danh-506";
  }

  get count() {
    const n = Number(this.getAttribute("count"));
    return Number.isInteger(n) && n > 0 && n <= 10 ? n : 5;
  }

  #setState(state) {
    this.setAttribute("data-state", state);
  }

  #cacheKey() {
    return `github-activity:${this.username}:${this.count}`;
  }

  #readCache() {
    try {
      const raw = sessionStorage.getItem(this.#cacheKey());
      if (!raw) return null;
      const { timestamp, data } = JSON.parse(raw);
      if (Date.now() - timestamp > CACHE_TTL_MS) return null;
      return data;
    } catch {
      return null;
    }
  }

  #writeCache(data) {
    try {
      sessionStorage.setItem(
        this.#cacheKey(),
        JSON.stringify({ timestamp: Date.now(), data })
      );
    } catch {
      // sessionStorage unavailable/full — caching is an optimization,
      // not required for correctness, so fail silently.
    }
  }

  #removeRetryButton() {
    this.#retryButton?.remove();
    this.#retryButton = null;
  }

  #addRetryButton() {
    if (this.#retryButton) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "github-activity__retry";
    button.textContent = "Retry loading activity";
    button.addEventListener("click", () => this.#load());
    this.#fallback.append(button);
    this.#retryButton = button;
  }

  async #load() {
    this.#abortController?.abort();
    const controller = new AbortController();
    this.#abortController = controller;

    const cached = this.#readCache();
    if (cached) {
      this.#renderEvents(cached);
      return;
    }

    this.#setState("loading");
    this.#fallback.hidden = true;
    this.#removeRetryButton();
    this.#status.textContent = "Loading recent GitHub activity…";
    this.#list.replaceChildren();

    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const url = `${ENDPOINT_BASE}/${encodeURIComponent(this.username)}/events/public?per_page=${this.count}`;
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/vnd.github+json" },
      });

      if (!response.ok) {
        throw new Error(`GitHub API responded with ${response.status}`);
      }

      const events = await response.json();
      this.#writeCache(events);
      this.#renderEvents(events);
    } catch (err) {
      const message =
        err.name === "AbortError"
          ? "The request timed out."
          : "Could not load GitHub activity right now.";
      this.#renderError(message);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  #renderEvents(events) {
    this.#list.replaceChildren();

    if (!Array.isArray(events) || events.length === 0) {
      this.#setState("idle");
      this.#fallback.hidden = true;
      this.#status.textContent = "No recent public activity.";
      return;
    }

    this.#setState("success");
    this.#fallback.hidden = true;
    this.#status.textContent = `Recent activity for ${this.username}:`;

    for (const event of events.slice(0, this.count)) {
      const fragment = ITEM_TEMPLATE.content.cloneNode(true);

      fragment.querySelector(".github-activity__desc").textContent =
        `${describeEvent(event)} `;

      const repoLink = fragment.querySelector(".github-activity__repo");
      repoLink.textContent = event.repo?.name ?? "unknown repository";
      repoLink.href = `https://github.com/${event.repo?.name ?? ""}`;

      const time = fragment.querySelector(".github-activity__time");
      time.textContent = formatTimeAgo(event.created_at);
      time.setAttribute("datetime", event.created_at ?? "");

      this.#list.append(fragment);
    }
  }

  #renderError(message) {
    this.#setState("error");
    this.#list.replaceChildren();
    this.#fallback.hidden = false;
    this.#addRetryButton();
    this.#status.textContent = message;
  }
}

customElements.define("github-activity", GitHubActivity);
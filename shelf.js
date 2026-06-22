const state = { games: [], platform: "All", region: "All", query: "", sort: "platform" };
const el = {
  stats: document.querySelector("#heroStats"),
  count: document.querySelector("#resultCount"),
  shelf: document.querySelector("#gameShelf"),
  empty: document.querySelector("#emptyState"),
  platformFilters: document.querySelector("#platformFilters"),
  regionFilters: document.querySelector("#regionFilters"),
  search: document.querySelector("#searchInput"),
  sort: document.querySelector("#sortSelect"),
  summary: document.querySelector("#filterSummary"),
  clear: document.querySelector("#clearFilters"),
  dialog: document.querySelector("#gameDialog"),
  dialogClose: document.querySelector("#dialogClose"),
  dialogCover: document.querySelector("#dialogCover"),
  dialogTitle: document.querySelector("#dialogTitle"),
  dialogPlatform: document.querySelector("#dialogPlatform"),
  dialogBadges: document.querySelector("#dialogBadges"),
  dialogDetails: document.querySelector("#dialogDetails"),
  dialogNote: document.querySelector("#dialogNote"),
};

init();

async function init() {
  const response = await fetch("data/collection-games.json");
  const payload = await response.json();
  state.games = payload.games || [];
  renderStats();
  renderFilters();
  render();
  bindEvents();
}

function bindEvents() {
  el.search.addEventListener("input", () => { state.query = el.search.value.trim().toLowerCase(); render(); });
  el.sort.addEventListener("change", () => { state.sort = el.sort.value; render(); });
  el.clear.addEventListener("click", () => { state.platform = "All"; state.region = "All"; state.query = ""; el.search.value = ""; renderFilters(); render(); });
  el.shelf.addEventListener("click", (event) => {
    const button = event.target.closest("[data-game-id]");
    const game = state.games.find((item) => item.id === button?.dataset.gameId);
    if (game) openGame(game);
  });
  el.dialogClose.addEventListener("click", () => el.dialog.close());
  el.dialog.addEventListener("click", (event) => { if (event.target === el.dialog) el.dialog.close(); });
}

function renderStats() {
  const value = state.games.reduce((sum, game) => sum + (game.price || 0), 0);
  const platforms = new Set(state.games.map((game) => game.platform)).size;
  const countries = new Set(state.games.map((game) => game.country)).size;
  const complete = state.games.filter((game) => /cib/i.test(game.ownership)).length;
  el.stats.innerHTML = [
    [state.games.length, "Physical games"],
    [platforms, "Consoles"],
    [countries, "Countries"],
    [`€${Math.round(value).toLocaleString("en")}`, "Collection value"],
  ].map(([valueText, label]) => `<div class="hero-stat"><strong>${valueText}</strong><span>${label}</span></div>`).join("");
  el.stats.title = `${complete} complete-in-box games`;
}

function renderFilters() {
  const platforms = counts(state.games.map((game) => game.platform));
  const regions = counts(state.games.map((game) => game.region));
  el.platformFilters.innerHTML = filterButtons("platform", platforms, state.platform);
  el.regionFilters.innerHTML = filterButtons("region", regions, state.region);
  el.platformFilters.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => { state.platform = button.dataset.value; renderFilters(); render(); }));
  el.regionFilters.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => { state.region = button.dataset.value; renderFilters(); render(); }));
}

function filterButtons(type, entries, active) {
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  return [["All", total], ...entries].map(([label, count]) => `<button class="filter-chip${active === label ? " active" : ""}" type="button" data-value="${escapeHtml(label)}" aria-pressed="${active === label}">${escapeHtml(shortPlatform(label))}<small>${count}</small></button>`).join("");
}

function render() {
  const games = state.games.filter((game) => {
    const matchesPlatform = state.platform === "All" || game.platform === state.platform;
    const matchesRegion = state.region === "All" || game.region === state.region;
    const haystack = `${game.title} ${game.platform} ${game.publisher} ${game.developer} ${game.genre}`.toLowerCase();
    return matchesPlatform && matchesRegion && (!state.query || haystack.includes(state.query));
  }).sort(sorter());
  el.count.textContent = `(${games.length})`;
  const parts = [state.platform !== "All" ? shortPlatform(state.platform) : "", state.region !== "All" ? state.region : "", state.query ? `“${state.query}”` : ""].filter(Boolean);
  el.summary.textContent = parts.length ? `Filtered by ${parts.join(" · ")}` : "Showing the complete collection";
  el.shelf.innerHTML = games.map(gameCard).join("");
  el.empty.hidden = games.length > 0;
}

function gameCard(game) {
  const issue = game.ownership === "Loose" ? "loose" : game.notes || !/cib|new/i.test(game.ownership) ? "issue" : "";
  return `<article class="game">
    <button class="game-cover-button" type="button" data-game-id="${escapeHtml(game.id)}" aria-label="View ${escapeHtml(game.title)}">
      <div class="cover-wrap">
        <span class="cover-fallback"><strong>${escapeHtml(platformCode(game.platform))}</strong><span>${escapeHtml(game.title)}</span></span>
        ${game.cover ? `<img src="${escapeHtml(coverUrl(game.cover))}" alt="${escapeHtml(game.title)} cover" loading="lazy" decoding="async">` : ""}
        <span class="region-flag">${escapeHtml(regionCode(game.country))}</span>
        <span class="condition-dot ${issue}" title="${escapeHtml(game.ownership)}"></span>
      </div>
      <span class="game-copy">
        <span class="game-title">${escapeHtml(game.title)}</span>
        <span class="game-meta"><span class="game-platform">${escapeHtml(shortPlatform(game.platform))}</span><span class="game-value">${game.price != null ? `€${game.price.toFixed(0)}` : "—"}</span></span>
      </span>
    </button>
  </article>`;
}

function openGame(game) {
  el.dialogCover.src = game.cover ? coverUrl(game.cover) : "assets/Icon.png";
  el.dialogCover.alt = `${game.title} cover`;
  el.dialogTitle.textContent = game.title;
  el.dialogPlatform.textContent = `${shortPlatform(game.platform)} · ${game.country}`;
  el.dialogBadges.innerHTML = [game.ownership, game.releaseType, game.genre].filter(Boolean).map((value) => `<span>${escapeHtml(value)}</span>`).join("");
  const details = [
    ["Publisher", game.publisher], ["Developer", game.developer], ["Region", game.country],
    ["Box", game.boxCondition || completenessLabel(game)], ["Manual", game.manualCondition || completenessLabel(game)],
    ["Value", game.price != null ? `€${game.price.toFixed(2)}` : "—"], ["Metacritic", game.metacritic || "—"],
  ];
  el.dialogDetails.innerHTML = details.map(([term, value]) => `<dt>${term}</dt><dd>${escapeHtml(String(value || "—"))}</dd>`).join("");
  el.dialogNote.hidden = !game.notes;
  el.dialogNote.textContent = game.notes || "";
  el.dialog.showModal();
}

function sorter() {
  if (state.sort === "title") return (a, b) => a.title.localeCompare(b.title);
  if (state.sort === "newest") return (a, b) => new Date(b.createdAt) - new Date(a.createdAt) || a.title.localeCompare(b.title);
  if (state.sort === "value") return (a, b) => (b.price || 0) - (a.price || 0) || a.title.localeCompare(b.title);
  return (a, b) => a.platform.localeCompare(b.platform) || a.title.localeCompare(b.title);
}

function counts(values) {
  const map = new Map();
  values.forEach((value) => map.set(value, (map.get(value) || 0) + 1));
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function shortPlatform(value) {
  return ({ "Sony PlayStation": "PS1", "Sony PlayStation 2": "PS2", "Sony PlayStation 4": "PS4", "Sony PlayStation 5": "PS5", "Nintendo Switch": "Switch", "Nintendo Switch 2": "Switch 2", "Nintendo DS": "DS", "Nintendo 3DS": "3DS", "Nintendo 64": "N64" })[value] || value;
}
function platformCode(value) { return shortPlatform(value).replace("Switch", "NSW").toUpperCase(); }
function regionCode(value) { return ({ Japan: "JP", "United Kingdom": "UK", "United States of America": "US", Spain: "ES", France: "FR", Germany: "DE", Taiwan: "TW", China: "CN", Australia: "AU", World: "WW" })[value] || value.slice(0, 2).toUpperCase(); }
function completenessLabel(game) { return /cib|new/i.test(game.ownership) ? "Included" : game.ownership === "Loose" ? "Missing" : "Not recorded"; }
function coverUrl(value) { return value.includes("howlongtobeat.com/games/") ? `/api/cover?src=${encodeURIComponent(value)}` : value; }
function escapeHtml(value) { return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]); }

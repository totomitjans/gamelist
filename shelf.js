const SESSION_KEY = "gamelist-editor";
const SITE_VERSION = "v159";
const VERSION_STORAGE_KEY = "gamelist:site-version";
const VIEW_KEY = "shelf:view-mode:v2";
const LAYOUT_KEY = "shelf:layout:v2";
const LOCAL_DRAFT_KEY = "shelf:draft-data:v2";
const DEFAULT_LAYOUT = ["playing", "trophies", "kpis", "filters", "library"];
const DEFAULT_HIDDEN_MODULES = ["playing", "trophies"];
const STORE_OPTIONS = ["Amazon", "eBay", "GAME.es", "Xtralife", "Retro Island NY", "GameStop", "Walmart"];
const DEFAULT_PRICE_STORES = ["Amazon", "eBay", "Xtralife", "GAME.es", "Retro Island NY"];
const MAX_PRICE_STORES = 5;
const THEMES = {
  shabii: { title: "Shabii's Shelf", icon: "assets/Icon_shelf.png", color: "#ff0039" },
  kash: { title: "Kash's Shelf", icon: "assets/kh_icon.png", color: "#005cff" },
};
const MODULE_NAMES = { playing: "Playing & recently finished", trophies: "Achievements", kpis: "Collection highlights", filters: "Search and filters", library: "Shelf" };
const PLATFORM_OPTIONS = [
  "Nintendo Switch", "Nintendo Switch 2", "Sony PlayStation 5", "Sony PlayStation 4",
  "Sony PlayStation 2", "Sony PlayStation", "Nintendo 3DS", "Nintendo DS", "Nintendo 64",
];
const COUNTRY_OPTIONS = [
  ["Australia", "Australia"], ["China", "China"], ["Europe", "EU"], ["France", "France"], ["Germany", "Germany"],
  ["Japan", "Japan"], ["Spain", "Spain"], ["Taiwan", "Taiwan"], ["United Kingdom", "United Kingdom"],
  ["United States of America", "United States"], ["World", "World"],
];

const state = {
  sourceGames: [],
  additions: [],
  overrides: {},
  games: [],
  gamelistGames: [],
  gamelistSettings: loadSharedSettings(),
  trophyActivity: null,
  cardTrophies: {},
  canEdit: sessionStorage.getItem(SESSION_KEY) === "true",
  editingId: "",
  lookupResults: [],
  filters: { query: "", platform: "all", region: "all", condition: "all", category: "all", tab: "all", sort: "platform", direction: "asc" },
  viewMode: localStorage.getItem(VIEW_KEY) === "list" ? "list" : "grid",
  layout: loadLayout(),
};

const el = {
  stats: document.querySelector("#shelfStats"),
  count: document.querySelector("#resultCount"),
  shelf: document.querySelector("#gameShelf"),
  empty: document.querySelector("#emptyState"),
  search: document.querySelector("#searchInput"),
  platform: document.querySelector("#platformFilter"),
  region: document.querySelector("#regionFilter"),
  condition: document.querySelector("#conditionFilter"),
  category: document.querySelector("#categoryFilter"),
  sort: document.querySelector("#sortFilter"),
  sortDirection: document.querySelector("#sortDirectionButton"),
  view: document.querySelector("#viewToggleButton"),
  clear: document.querySelector("#clearFilters"),
  login: document.querySelector("#loginButton"),
  addButton: document.querySelector("#addGameButton"),
  layoutButton: document.querySelector("#layoutButton"),
  modules: document.querySelector("#shelfModules"),
  tabs: document.querySelector("#shelfTabs"),
  playingCarousel: document.querySelector("#playingCarousel"),
  finishedCarousel: document.querySelector("#finishedCarousel"),
  playingFinished: document.querySelector("#shelfPlayingFinished"), playingCount: document.querySelector("#shelfPlayingCount"),
  playingPrev: document.querySelector("#shelfPlayingPrev"), playingNext: document.querySelector("#shelfPlayingNext"),
  trophyCard: document.querySelector("#shelfTrophyCard"),
  achievementProfile: document.querySelector("#shelfAchievementProfileLink"),
  footerUpdate: document.querySelector("#footerDataUpdate"),
  footerVersion: document.querySelector("#footerVersion"),
  scrollTop: document.querySelector("#scrollTopButton"),
  floatingActions: document.querySelector("#floatingEditActions"), floatingAdd: document.querySelector("#floatingAddButton"),
  detailDialog: document.querySelector("#detailDialog"),
  detailClose: document.querySelector("#detailClose"),
  detailTitle: document.querySelector("#detailTitle"),
  detailStudio: document.querySelector("#detailStudio"), detailMeta: document.querySelector("#detailMeta"),
  detailDates: document.querySelector("#detailDates"), detailDescription: document.querySelector("#detailDescription"),
  detailCover: document.querySelector("#detailCover"),
  detailChips: document.querySelector("#detailChips"), detailGuides: document.querySelector("#detailGuides"),
  detailNote: document.querySelector("#detailNote"),
  detailActions: document.querySelector("#detailActions"),
  detailCondition: document.querySelector("#detailCondition"), detailConditionPanel: document.querySelector("#detailConditionPanel"), detailLinks: document.querySelector("#detailLinks"),
  detailGuideLinks: document.querySelector("#detailGuideLinks"), detailStorePrices: document.querySelector("#detailStorePrices"),
  fetchValue: document.querySelector("#fetchValueButton"), detailPricePanel: document.querySelector("#detailPricePanel"), detailPriceSummary: document.querySelector("#detailPriceSummary"),
  detailPriceGraph: document.querySelector("#detailPriceGraph"), detailTrophies: document.querySelector("#shelfDetailTrophies"),
  detailTrophyCount: document.querySelector("#shelfTrophyCount"), detailTrophyList: document.querySelector("#shelfTrophyList"),
  addDialog: document.querySelector("#addDialog"),
  addForm: document.querySelector("#addGameForm"),
  addClose: document.querySelector("#addClose"),
  addCancel: document.querySelector("#addCancel"),
  lookupInput: document.querySelector("#lookupInput"),
  lookupButton: document.querySelector("#lookupButton"),
  lookupResults: document.querySelector("#lookupResults"),
  fields: {
    title: document.querySelector("#titleInput"), platform: document.querySelector("#platformInput"),
    country: document.querySelector("#countryInput"), price: document.querySelector("#priceInput"),
    owners: document.querySelector("#ownersInput"), category: document.querySelector("#categoryInput"),
    releaseDate: document.querySelector("#releaseDateInput"), trophyName: document.querySelector("#trophyNameInput"),
    upc: document.querySelector("#upcInput"), sku: document.querySelector("#skuInput"), asin: document.querySelector("#asinInput"),
    epid: document.querySelector("#epidInput"), pricechartingId: document.querySelector("#pricechartingIdInput"),
    websites: document.querySelector("#websitesInput"),
    publisher: document.querySelector("#publisherInput"), developer: document.querySelector("#developerInput"),
    genre: document.querySelector("#genreInput"), cover: document.querySelector("#coverInput"), notes: document.querySelector("#notesInput"), description: document.querySelector("#shelfDescriptionInput"),
    coverProject: document.querySelector("#coverProjectInput"),
  },
  coverProjectButton: document.querySelector("#coverProjectButton"),
  conditionFields: { game: document.querySelector("#conditionGameInput"), manual: document.querySelector("#conditionManualInput"), box: document.querySelector("#conditionBoxInput"), other: document.querySelector("#conditionOtherInput"), sealed: document.querySelector("#conditionSealedInput") },
  layoutDialog: document.querySelector("#layoutDialog"),
  layoutForm: document.querySelector("#layoutForm"),
  layoutClose: document.querySelector("#layoutClose"),
  layoutList: document.querySelector("#layoutList"),
  platformOptions: document.querySelector("#shelfPlatformOptions"),
  settingsTheme: document.querySelector("#shelfSettingsTheme"), settingsDefaultOrder: document.querySelector("#shelfSettingsDefaultOrder"),
  settingsCurrency: document.querySelector("#shelfSettingsCurrency"), settingsRegion: document.querySelector("#shelfSettingsRegion"),
  settingsStores: document.querySelector("#shelfSettingsStores"),
  settingsPsnUser: document.querySelector("#shelfSettingsPsnUser"), settingsMicrosoftUser: document.querySelector("#shelfSettingsMicrosoftUser"),
  settingsSteamUser: document.querySelector("#shelfSettingsSteamUser"), settingsDefaultOwner: document.querySelector("#shelfSettingsDefaultOwner"),
  completedDialog: document.querySelector("#shelfCompletedDialog"), completedClose: document.querySelector("#shelfCompletedClose"), completedList: document.querySelector("#shelfCompletedList"),
  deleteShelfButton: document.querySelector("#deleteShelfButton"),
  deleteShelfDialog: document.querySelector("#deleteShelfDialog"), deleteShelfForm: document.querySelector("#deleteShelfForm"),
  deleteShelfClose: document.querySelector("#deleteShelfClose"), deleteShelfCancel: document.querySelector("#deleteShelfCancel"),
  deleteShelfPassword: document.querySelector("#deleteShelfPassword"), deleteShelfError: document.querySelector("#deleteShelfError"),
  deleteShelfConfirm: document.querySelector("#deleteShelfConfirm"),
  authDialog: document.querySelector("#authDialog"),
  authForm: document.querySelector("#authForm"),
  authClose: document.querySelector("#authClose"),
  authCancel: document.querySelector("#authCancel"),
  authPassword: document.querySelector("#authPasswordInput"),
  authError: document.querySelector("#authError"),
};
let selectOverflowPopover = null;
let selectMeasureContext = null;

init();

async function init() {
  if (await checkSiteVersion()) return;
  applyTheme();
  registerServiceWorker();
  bindTextureParallax();
  populateEditorOptions();
  bindEvents();
  const [shelfData, auth, gamelistData] = await Promise.all([
    fetch("/api/shelf", { cache: "no-store" }).then((response) => response.ok ? response.json() : null).catch(() => null),
    fetch("/api/auth", { cache: "no-store" }).then((response) => response.ok).catch(() => false),
    fetch("/api/sync", { cache: "no-store" }).then((response) => response.ok ? response.json() : null).catch(() => null),
  ]);
  state.sourceGames = shelfData?.sourceGames || [];
  const draft = loadDraft();
  state.additions = draft.games || shelfData?.games || [];
  state.overrides = draft.overrides || shelfData?.overrides || {};
  state.layout = normalizeLayout(shelfData?.layout || state.layout);
  state.canEdit = state.canEdit || auth;
  state.updatedAt = shelfData?.updatedAt || "";
  state.gamelistGames = gamelistData?.games || [];
  state.gamelistSettings = gamelistData?.settings || state.gamelistSettings;
  state.filters.sort = shelfSortForDefault(state.gamelistSettings.defaultOrder);
  applyTheme();
  loadTrophyActivity();
  rebuildGames();
  renderAll();
}
function loadSharedSettings() { try { return JSON.parse(localStorage.getItem("gamelist:settings:v1") || "{}"); } catch { return {}; } }

function bindEvents() {
  el.search.addEventListener("input", () => { state.filters.query = el.search.value.trim().toLowerCase(); renderLibrary(); });
  el.platform.addEventListener("change", () => { state.filters.platform = el.platform.value; renderLibrary(); });
  el.region.addEventListener("change", () => { state.filters.region = el.region.value; renderLibrary(); });
  el.condition.addEventListener("change", () => { state.filters.condition = el.condition.value; renderLibrary(); });
  el.category.addEventListener("change", () => { state.filters.category = el.category.value; renderLibrary(); });
  el.sort.addEventListener("change", () => { state.filters.sort = el.sort.value; if (["added", "time", "value"].includes(state.filters.sort)) state.filters.direction = "desc"; renderChrome(); renderLibrary(); });
  el.sortDirection.addEventListener("click", () => { state.filters.direction = state.filters.direction === "asc" ? "desc" : "asc"; renderChrome(); renderLibrary(); });
  el.view.addEventListener("click", toggleView);
  el.playingPrev.addEventListener("click", () => slidePlaying(-1));
  el.playingNext.addEventListener("click", () => slidePlaying(1));
  el.playingCarousel.addEventListener("scroll", updatePlayingControls, { passive: true });
  el.finishedCarousel.addEventListener("scroll", updateFinishedControls, { passive: true });
  el.clear.addEventListener("click", clearFilters);
  el.login.addEventListener("click", toggleEditMode);
  el.addButton.addEventListener("click", () => openEditor());
  el.floatingAdd.addEventListener("click", () => openEditor());
  el.layoutButton.addEventListener("click", openLayout);
  el.scrollTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  el.footerVersion.addEventListener("click", clearSiteCachesAndReload);
  window.addEventListener("scroll", () => el.scrollTop.classList.toggle("visible", window.scrollY > 420), { passive: true });
  window.addEventListener("storage", (event) => { if (event.key === "gamelist-editor-signal") refreshSharedAuth(); });
  window.addEventListener("focus", refreshSharedAuth);
  window.addEventListener("resize", () => { updatePlayingControls(); updateFinishedControls(); }, { passive: true });
  document.addEventListener("pointerover", handleSelectOverflowTitle);
  document.addEventListener("focusin", handleSelectOverflowTitle);
  document.addEventListener("pointerout", handleSelectOverflowLeave);
  document.addEventListener("focusout", handleSelectOverflowLeave);

  el.shelf.addEventListener("click", handleShelfClick);
  el.shelf.addEventListener("keydown", (event) => { if (event.key !== "Enter" && event.key !== " ") return; const card = event.target.closest("[data-id]"); if (!card || event.target.closest("button, a, input")) return; event.preventDefault(); const game = state.games.find((item) => item.id === card.dataset.id); if (game) openDetails(game); });
  el.detailActions.addEventListener("click", handleDetailAction);
  el.fetchValue.addEventListener("click", fetchCollectionValue);
  el.tabs.addEventListener("click", (event) => { const tab = event.target.closest("[data-shelf-tab]"); if (!tab) return; state.filters.tab = tab.dataset.shelfTab; renderLibrary(); });
  el.detailClose.addEventListener("click", () => closeDialog(el.detailDialog));
  el.detailDialog.addEventListener("click", (event) => { if (event.target === el.detailDialog) closeDialog(el.detailDialog); });

  el.addClose.addEventListener("click", () => closeDialog(el.addDialog));
  el.addCancel.addEventListener("click", () => closeDialog(el.addDialog));
  el.addDialog.addEventListener("click", (event) => { if (event.target === el.addDialog) closeDialog(el.addDialog); });
  el.addForm.addEventListener("submit", saveEditor);
  el.lookupButton.addEventListener("click", lookupGame);
  el.lookupInput.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); lookupGame(); } });
  el.lookupResults.addEventListener("click", chooseLookupResult);
  el.coverProjectButton.addEventListener("click", findCoverProjectCover);
  Object.values(el.conditionFields).forEach((input) => input.addEventListener("change", () => syncConditionInputs(input)));
  document.addEventListener("error", handleCoverImageError, true);

  el.layoutClose.addEventListener("click", () => closeDialog(el.layoutDialog));
  el.layoutDialog.addEventListener("click", (event) => { if (event.target === el.layoutDialog) closeDialog(el.layoutDialog); });
  el.layoutForm.addEventListener("submit", saveLayout);
  el.layoutList.addEventListener("click", handleLayoutMove);
  el.completedClose.addEventListener("click", () => closeDialog(el.completedDialog));
  el.completedDialog.addEventListener("click", (event) => { if (event.target === el.completedDialog) closeDialog(el.completedDialog); });
  el.deleteShelfButton.addEventListener("click", openDeleteShelfDialog);
  el.deleteShelfClose.addEventListener("click", () => closeDialog(el.deleteShelfDialog));
  el.deleteShelfCancel.addEventListener("click", () => closeDialog(el.deleteShelfDialog));
  el.deleteShelfDialog.addEventListener("click", (event) => { if (event.target === el.deleteShelfDialog) closeDialog(el.deleteShelfDialog); });
  el.deleteShelfForm.addEventListener("submit", deletePhysicalGamesList);

  el.authClose.addEventListener("click", () => closeDialog(el.authDialog));
  el.authCancel.addEventListener("click", () => closeDialog(el.authDialog));
  el.authDialog.addEventListener("click", (event) => { if (event.target === el.authDialog) closeDialog(el.authDialog); });
  el.authForm.addEventListener("submit", submitAuth);
}

function rebuildGames() {
  const source = state.sourceGames.map((game) => ({ ...game, ...(state.overrides[game.id] || {}), sourceRecord: true }));
  state.games = [...source, ...state.additions.map((game) => ({ ...game, sourceRecord: false }))];
}

function renderAll() {
  applyLayout();
  renderChrome();
  renderFilters();
  renderStats();
  renderGamelistModules();
  renderLibrary();
}

function renderChrome() {
  document.body.classList.toggle("can-edit", state.canEdit);
  document.body.classList.toggle("list-view-mode", state.viewMode === "list");
  el.addButton.hidden = !state.canEdit;
  el.layoutButton.hidden = !state.canEdit;
  el.floatingActions.classList.toggle("visible", state.canEdit);
  el.login.innerHTML = state.canEdit
    ? `<svg class="pause-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"></path></svg><span class="button-label">Stop Editing</span>`
    : `<svg class="pencil-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l11-11a2.8 2.8 0 0 0-4-4L4 16v4Z"></path><path d="M13.5 6.5l4 4"></path></svg>`;
  el.login.title = state.canEdit ? "Stop Editing" : "Edit";
  el.login.setAttribute("aria-label", el.login.title);
  el.view.title = state.viewMode === "grid" ? "Show as list" : "Show as grid";
  el.view.innerHTML = state.viewMode === "grid" ? linesIcon() : gridIcon();
  el.sortDirection.innerHTML = sortArrowIcon(state.filters.direction === "desc");
  el.sortDirection.classList.toggle("desc", state.filters.direction === "desc");
  el.sortDirection.title = `Sort ${state.filters.direction === "desc" ? "descending" : "ascending"}`;
  el.footerUpdate.textContent = state.updatedAt ? `Last edit ${formatDate(state.updatedAt)}` : "Collection imported 22 Jun 2026";
  el.footerVersion.textContent = `${SITE_VERSION} · Shelf · ${state.sourceGames.length} source games${state.additions.length ? ` · ${state.additions.length} added` : ""}`;
}

function applyTheme() {
  const key = THEMES[state.gamelistSettings.theme] ? state.gamelistSettings.theme : "shabii";
  const theme = THEMES[key];
  document.documentElement.classList.toggle("theme-kash", key === "kash");
  document.body.classList.toggle("theme-kash", key === "kash");
  document.title = theme.title;
  document.querySelector("meta[name='theme-color']")?.setAttribute("content", theme.color);
  document.querySelector("link[rel='icon']")?.setAttribute("href", theme.icon);
  const brandMark = document.querySelector(".brand-mark");
  const brandText = document.querySelector(".brand span:last-child");
  if (brandMark) brandMark.src = theme.icon;
  if (brandText) brandText.textContent = theme.title;
}

function renderStats() {
  const value = state.games.reduce((sum, game) => sum + (Number(game.price) || 0), 0);
  const valueText = state.gamelistSettings.currency === "USD" ? `$${Math.round(value).toLocaleString("en")}` : `${Math.round(value).toLocaleString("en")}€`;
  el.stats.innerHTML = [
    [state.games.length, "Physical games", "stat-backlog"],
    [new Set(state.games.map((game) => game.platform)).size, "Platforms", "stat-available"],
    [valueText, "Estimated value", "stat-done"],
  ].map(([valueText, label, className]) => `<div class="stat glass ${className}"><strong>${escapeHtml(valueText)}</strong><span>${escapeHtml(label)}</span></div>`).join("");
}

function renderFilters() {
  const platforms = uniqueSorted(state.games.map((game) => game.platform));
  const countries = uniqueSorted(state.games.map((game) => game.country));
  const categories = uniqueSorted(state.games.flatMap((game) => [...String(game.genre || "").split(","), ...(game.genres || [])].map((value) => value.trim()).filter(Boolean)));
  el.platform.innerHTML = `<option value="all">All consoles</option>${platforms.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(shortPlatform(value))}</option>`).join("")}`;
  el.region.innerHTML = `<option value="all">All regions</option>${countries.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(regionName(value))}</option>`).join("")}`;
  el.category.innerHTML = `<option value="all">All categories</option>${categories.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("")}`;
  el.platform.value = state.filters.platform;
  el.region.value = state.filters.region;
  el.category.value = state.filters.category;
  el.sort.value = state.filters.sort;
  [el.platform, el.region, el.condition, el.category, el.sort].forEach(updateSelectOverflowTitle);
}

function renderLibrary() {
  const games = filteredGames();
  const gamelistCount = state.games.filter((game) => game.source === "gamelist" || (game.tags || []).includes("Gamelist")).length;
  el.tabs.hidden = !gamelistCount;
  el.tabs.innerHTML = gamelistCount ? `<button class="${state.filters.tab === "all" ? "active" : ""}" data-shelf-tab="all" type="button">All</button><button class="${state.filters.tab === "gamelist" ? "active" : ""}" data-shelf-tab="gamelist" type="button">Gamelist <span>${gamelistCount}</span></button>` : "";
  el.count.textContent = `${games.length} ${games.length === 1 ? "game" : "games"}`;
  el.shelf.innerHTML = games.map(gameCard).join("");
  el.shelf.querySelectorAll(".game-card.has-art").forEach(setupShelfParallax);
  el.empty.hidden = games.length > 0;
}

function filteredGames() {
  return state.games.filter((game) => {
    const haystack = `${game.title} ${game.platform} ${game.publisher} ${game.developer} ${game.genre} ${game.notes} ${(game.tags || []).join(" ")} ${(game.owners || []).join(" ")}`.toLowerCase();
    return (state.filters.platform === "all" || game.platform === state.filters.platform)
      && (state.filters.region === "all" || game.country === state.filters.region)
      && conditionMatches(game, state.filters.condition)
      && (state.filters.category === "all" || [...String(game.genre || "").split(","), ...(game.genres || [])].map((value) => value.trim()).includes(state.filters.category))
      && (state.filters.tab === "all" || game.source === "gamelist" || (game.tags || []).includes("Gamelist"))
      && (!state.filters.query || haystack.includes(state.filters.query));
  }).sort(sorter(state.filters.sort));
}

function gameCard(game) {
  const fallbackCover = coverUrl(game.cover || "") || platformFallback(game.platform);
  const cover = fallbackCover;
  const studio = [game.developer, game.publisher && game.publisher !== game.developer ? game.publisher : ""].filter(Boolean).join(" · ");
  const owners = (game.owners || []).map(ownerBadge).join("");
  const ownerClasses = `${(game.owners || []).includes("Judy") ? " owner-card-judy" : ""}${(game.owners || []).includes("Jordi") ? " owner-card-jordi" : ""}`;
  const tags = [...(game.tags || []), game.category && game.category !== "Game" ? game.category : "", ...String(game.genre || "").split(",")].map((tag) => String(tag).trim()).filter((tag, index, list) => tag && normalize(tag) !== "game" && list.indexOf(tag) === index);
  const condition = conditionLabel(game);
  return `<article class="game-card glass${cover ? " has-art" : ""}${ownerClasses}" data-id="${escapeHtml(game.id)}" role="button" tabindex="0"${cover ? ` style="--card-art:url('${escapeCss(cover)}')"` : ""}>
    <button class="cover-button" type="button" data-action="details" aria-label="View ${escapeHtml(game.title)}">
      <img src="${escapeHtml(cover)}" data-cover-fallback="${escapeHtml(fallbackCover)}" alt="${escapeHtml(game.title)} cover" loading="lazy" decoding="async">
    </button>
    <div class="game-main">
      <div class="title-line"><div class="title-wrap"><h3 class="${(game.owners || []).includes("Judy") ? "owner-judy" : ""} ${(game.owners || []).includes("Jordi") ? "owner-jordi" : ""}">${escapeHtml(game.title)}</h3><div class="title-owners">${owners}</div></div>${state.canEdit ? `<button class="icon-button edit-action editor-only" type="button" data-action="edit" title="Edit" aria-label="Edit">${pencilIcon()}</button>` : ""}</div>
      <div class="studio-line">${escapeHtml(studio || game.genre || "Physical edition")}</div>
      <div class="meta"><span class="region-flag" title="${escapeHtml(game.country)}">${flagIcon(game.country)}</span>${platformBadge(game.platform)}${conditionBadge(condition)}</div>
      <div class="chips">${tags.map((tag) => `<span class="chip ${normalize(tag) === "gamelist" ? "accent" : ""}">${escapeHtml(tag)}</span>`).join("")}</div>
      <div class="card-trophies">${shelfCardTrophies(game)}</div>
    </div>
    ${game.notes ? `<p class="notes shelf-card-notes">${escapeHtml(game.notes)}</p>` : ""}
    ${game.description ? `<p class="shelf-card-description">${escapeHtml(game.description)}</p>` : ""}
  </article>`;
}

function conditionBadge(condition) { const tone = condition === "Complete +" ? "complete-plus" : normalize(condition).replace(/ /g, "-"); return `<span class="condition-pill condition-${tone}"><img src="assets/platforms/disk.png" alt="" width="18" height="18"><span>${escapeHtml(condition)}</span></span>`; }

function handleShelfClick(event) {
  const card = event.target.closest("[data-id]");
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (!card) return;
  const game = state.games.find((item) => item.id === card.dataset.id);
  if (!game) return;
  if (action === "edit") openEditor(game);
  else openDetails(game);
}

function openDetails(game) {
  el.detailDialog.dataset.id = game.id;
  el.detailDialog.dataset.projection = game._gamelistProjection ? "true" : "false";
  el.detailTitle.textContent = game.title;
  el.detailTitle.classList.toggle("owner-judy", (game.owners || []).includes("Judy"));
  el.detailTitle.classList.toggle("owner-jordi", (game.owners || []).includes("Jordi"));
  el.detailStudio.textContent = [game.developer, game.publisher && game.publisher !== game.developer ? game.publisher : ""].filter(Boolean).join(" · ");
  el.detailMeta.innerHTML = `${game.country ? `<span class="region-flag" title="${escapeHtml(game.country)}">${flagIcon(game.country)}</span>` : ""}${platformBadge(game.platform)}`;
  const fallbackCover = coverUrl(game.cover || "") || platformFallback(game.platform);
  el.detailCover.src = fallbackCover;
  el.detailCover.dataset.coverFallback = fallbackCover;
  el.detailCover.parentElement.classList.remove("has-wrap");
  el.detailCover.alt = `${game.title} cover`;
  const detailTags = [...(game.tags || []), game.category && game.category !== "Game" ? game.category : "", ...String(game.genre || "").split(",")].map((value) => String(value).trim()).filter((value, index, list) => value && normalize(value) !== "game" && list.indexOf(value) === index);
  el.detailChips.innerHTML = `${(game.owners || []).map(ownerBadge).join("")}${detailTags.map((value) => `<span class="chip ${normalize(value) === "gamelist" ? "accent" : ""}">${escapeHtml(value)}</span>`).join("")}`;
  const categories = [...String(game.genre || "").split(","), ...(game.genres || [])].map((value) => value.trim()).filter(Boolean);
  el.detailDates.innerHTML = `${game.releaseDate ? `<span class="release-pill"><small>Release</small><strong>${escapeHtml(formatDate(game.releaseDate))}</strong></span>` : ""}${game.createdAt ? `<span class="history-pill history-date-pill"><small>Added</small><strong>${escapeHtml(formatDate(game.createdAt))}</strong></span>` : ""}${categories.map((value) => `<span class="chip genre">${escapeHtml(value)}</span>`).join("")}`;
  el.detailNote.hidden = !game.notes;
  el.detailNote.textContent = game.notes || "";
  el.detailDescription.textContent = game.description || "";
  el.detailDescription.hidden = !game.description;
  el.detailCondition.innerHTML = ["game", "manual", "box", "other", "sealed"].map((key) => `<label class="check-filter toggle-check detail-condition-check"><input type="checkbox" ${conditionValue(game, key) ? "checked" : ""} disabled><span>${escapeHtml(key[0].toUpperCase() + key.slice(1))}</span></label>`).join("");
  el.detailConditionPanel.hidden = Boolean(game._gamelistProjection);
  const links = websiteLinks(game);
  el.detailLinks.innerHTML = links.map((link) => `<a class="store-button" href="${escapeHtml(link)}" target="_blank" rel="noreferrer"><img src="${escapeHtml(siteIcon(link))}" alt="">${escapeHtml(linkLabel(link))}</a>`).join("");
  el.detailGuideLinks.innerHTML = guideLinks(game).map(([label, link]) => `<a class="guide-button" href="${escapeHtml(link)}" target="_blank" rel="noreferrer"><img src="${escapeHtml(guideIcon(label))}" alt=""><span>${escapeHtml(label)}</span></a>`).join("");
  loadStorePrices(game);
  el.detailPricePanel.hidden = Boolean(game._gamelistProjection);
  if (!game._gamelistProjection) renderPriceDetails(game);
  loadShelfTrophies(game);
  el.detailActions.innerHTML = state.canEdit && !game._gamelistProjection ? `<button class="ghost-button" type="button" data-detail-action="edit">Edit game</button>${game.sourceRecord ? `<button class="ghost-button" type="button" data-detail-action="reset">Reset changes</button>` : `<button class="danger-button" type="button" data-detail-action="delete">Delete</button>`}` : "";
  openDialog(el.detailDialog);
}

function handleDetailAction(event) {
  const action = event.target.closest("[data-detail-action]")?.dataset.detailAction;
  const game = state.games.find((item) => item.id === el.detailDialog.dataset.id);
  if (!action || !game || !state.canEdit) return;
  if (action === "edit") { closeDialog(el.detailDialog); openEditor(game); }
  if (action === "reset") resetGame(game);
  if (action === "delete") deleteGame(game);
}

function openEditor(game = null) {
  if (!state.canEdit) return openAuth();
  state.editingId = game?.id || "";
  state.lookupResults = [];
  el.lookupResults.innerHTML = "";
  el.lookupInput.value = game?.title || "";
  const values = game || { platform: "Nintendo Switch", country: "United Kingdom", game: true, box: true, manual: true, category: "Game" };
  for (const [key, input] of Object.entries(el.fields)) input.value = values[key] ?? "";
  el.fields.owners.value = (values.owners || []).join(", ");
  el.fields.websites.value = websiteLinks(values).join(", ");
  Object.entries(el.conditionFields).forEach(([key, input]) => { input.checked = conditionValue(values, key); });
  syncConditionInputs();
  el.addForm.querySelector(".modal-head h2").textContent = game ? "Edit physical game" : "Add physical game";
  el.addForm.querySelector("button[type='submit']").textContent = game ? "Save changes" : "Add to Shelf";
  openDialog(el.addDialog);
}

async function lookupGame() {
  const query = el.lookupInput.value.trim();
  if (!query) return;
  el.lookupButton.disabled = true;
  el.lookupButton.classList.add("is-loading");
  el.lookupButton.title = "Fetching game information";
  el.lookupResults.innerHTML = `<div class="lookup-loading">Searching game databases…</div>`;
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = response.ok ? await response.json() : { results: [] };
    state.lookupResults = (data.results || []).slice(0, 8);
    el.lookupResults.innerHTML = state.lookupResults.length ? state.lookupResults.map((result, index) => {
      const platforms = (result.platforms || [result.platform]).filter(Boolean);
      return `<button class="lookup-result" type="button" data-result-index="${index}"><img src="${escapeHtml(coverUrl(result.cover || "") || "assets/Icon.png")}" alt=""><span><strong>${escapeHtml(result.title)}</strong><small>${escapeHtml(platforms.join(" · ") || "Platform unknown")}</small></span><span>Use this</span></button>`;
    }).join("") : `<div class="lookup-loading">No close match found. You can still enter the details manually.</div>`;
  } catch {
    el.lookupResults.innerHTML = `<div class="lookup-loading">Lookup is unavailable right now. Manual entry still works.</div>`;
  } finally {
    el.lookupButton.disabled = false;
    el.lookupButton.classList.remove("is-loading");
    el.lookupButton.title = "Fetch info";
  }
}

async function chooseLookupResult(event) {
  const button = event.target.closest("[data-result-index]");
  if (!button) return;
  const result = state.lookupResults[Number(button.dataset.resultIndex)];
  if (!result) return;
  el.fields.title.value = result.title || el.fields.title.value;
  el.fields.platform.value = bestCollectionPlatform(result.platforms || [result.platform], el.fields.platform.value);
  el.fields.publisher.value = result.publisher || "";
  el.fields.developer.value = result.developer || "";
  el.fields.genre.value = (result.genres || []).join(", ");
  el.fields.cover.value = result.cover || "";
  el.fields.releaseDate.value = result.releaseDate || "";
  el.fields.websites.value = Object.values(result.storeLinks || {}).filter(Boolean).join(", ");
  el.fields.category.value = (result.genres || [])[0] || "Game";
  el.fields.description.value = result.description || "";
  el.lookupResults.innerHTML = `<div class="lookup-loading">Matching the physical edition…</div>`;
  const physical = await fetchPhysicalMetadata(result.title);
  if (physical) applyPhysicalMetadata(physical);
  el.lookupResults.innerHTML = `<div class="lookup-selected physical-lookup-selected"><img src="${physical ? "https://www.pricecharting.com/images/favicon.ico" : "assets/Icon_shelf.png"}" alt=""><span>${physical ? `Using ${escapeHtml(physical.productName || result.title)}${physical.consoleName ? ` · ${escapeHtml(physical.consoleName)}` : ""}. Confirm the region and edition before saving.` : `Game information loaded. No exact physical edition match was found, so confirm the release and identifiers manually.`}</span></div>`;
}

async function fetchPhysicalMetadata(title) {
  try {
    const params = new URLSearchParams({ title, platform: shortPlatform(el.fields.platform.value), region: el.fields.country.value, currency: state.gamelistSettings.currency || "EUR" });
    if (el.fields.upc.value.trim()) params.set("upc", el.fields.upc.value.trim());
    if (el.fields.pricechartingId.value.trim()) params.set("id", el.fields.pricechartingId.value.trim());
    const response = await fetch(`/api/collection-price?${params}`);
    const data = await response.json();
    return response.ok && !data.error ? data : null;
  } catch { return null; }
}

function applyPhysicalMetadata(data) {
  if (data.releaseDate) el.fields.releaseDate.value = data.releaseDate;
  if (data.upc) el.fields.upc.value = data.upc;
  if (data.sku) el.fields.sku.value = data.sku;
  if (data.asin) el.fields.asin.value = data.asin;
  if (data.epid) el.fields.epid.value = data.epid;
  if (data.productId) el.fields.pricechartingId.value = data.productId;
  if (data.genre && !el.fields.genre.value) el.fields.genre.value = data.genre;
  if (data.publisher && !el.fields.publisher.value) el.fields.publisher.value = data.publisher;
  if (data.image) el.fields.cover.value = data.image;
}

async function saveEditor(event) {
  event.preventDefault();
  if (!state.canEdit) return;
  const existing = state.games.find((game) => game.id === state.editingId);
  const game = {
    ...(existing || {}),
    id: existing?.id || `shelf-${crypto.randomUUID()}`,
    title: el.fields.title.value.trim(), platform: el.fields.platform.value, country: el.fields.country.value,
    region: regionFor(el.fields.country.value), ...conditionFromInputs(),
    price: numberOrNull(el.fields.price.value), publisher: el.fields.publisher.value.trim(), developer: el.fields.developer.value.trim(),
    genre: el.fields.genre.value.trim(), cover: rawCoverUrl(el.fields.cover.value.trim()), notes: el.fields.notes.value.trim(),
    owners: splitValues(el.fields.owners.value), category: el.fields.category.value.trim() || "Game",
    releaseDate: el.fields.releaseDate.value, trophyName: el.fields.trophyName.value.trim(), websites: splitValues(el.fields.websites.value),
    upc: el.fields.upc.value.trim(), sku: el.fields.sku.value.trim(), asin: el.fields.asin.value.trim(), epid: el.fields.epid.value.trim(),
    pricechartingId: el.fields.pricechartingId.value.trim(), description: el.fields.description.value.trim(),
    coverProject: el.fields.coverProject.value.trim(),
    createdAt: existing?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString(), recordType: "Owned", releaseType: existing?.releaseType || "Official",
  };
  if (!game.title) return;
  if (existing?.sourceRecord) state.overrides[game.id] = stripRuntimeFields(game);
  else {
    const index = state.additions.findIndex((item) => item.id === game.id);
    if (index >= 0) state.additions[index] = stripRuntimeFields(game);
    else state.additions.unshift(stripRuntimeFields(game));
  }
  await persistShelf();
  rebuildGames();
  renderAll();
  closeDialog(el.addDialog);
}

async function resetGame(game) {
  delete state.overrides[game.id];
  await persistShelf();
  rebuildGames();
  renderAll();
  closeDialog(el.detailDialog);
}

async function deleteGame(game) {
  if (game.sourceRecord) return;
  state.additions = state.additions.filter((item) => item.id !== game.id);
  await persistShelf();
  rebuildGames();
  renderAll();
  closeDialog(el.detailDialog);
}

async function persistShelf() {
  const payload = { games: state.additions, overrides: state.overrides, layout: state.layout };
  localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(payload));
  try {
    const password = sessionStorage.getItem(`${SESSION_KEY}:password`) || "";
    const response = await fetch("/api/shelf", { method: "PUT", headers: { "Content-Type": "application/json", "x-edit-password": password }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error("Save failed");
    const data = await response.json();
    state.updatedAt = data.updatedAt || new Date().toISOString();
    localStorage.removeItem(LOCAL_DRAFT_KEY);
  } catch {
    state.updatedAt = new Date().toISOString();
  }
}

async function toggleEditMode() {
  if (!state.canEdit) return openAuth();
  await fetch("/api/auth", { method: "DELETE" }).catch(() => {});
  state.canEdit = false;
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(`${SESSION_KEY}:password`);
  signalAuthChange();
  renderAll();
}

function openAuth() {
  el.authPassword.value = "";
  el.authError.hidden = true;
  openDialog(el.authDialog);
  requestAnimationFrame(() => el.authPassword.focus());
}

async function submitAuth(event) {
  event.preventDefault();
  const response = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: el.authPassword.value }) }).catch(() => null);
  if (!response?.ok) { el.authError.hidden = false; return; }
  state.canEdit = true;
  sessionStorage.setItem(SESSION_KEY, "true");
  sessionStorage.setItem(`${SESSION_KEY}:password`, el.authPassword.value);
  signalAuthChange();
  closeDialog(el.authDialog);
  renderAll();
}

async function refreshSharedAuth() {
  const active = await fetch("/api/auth", { cache: "no-store" }).then((response) => response.ok).catch(() => state.canEdit);
  if (active === state.canEdit) return;
  state.canEdit = active;
  if (active) sessionStorage.setItem(SESSION_KEY, "true");
  else sessionStorage.removeItem(SESSION_KEY);
  renderAll();
}

function signalAuthChange() { localStorage.setItem("gamelist-editor-signal", String(Date.now())); }

function openLayout() {
  renderLayoutEditor();
  openDialog(el.layoutDialog);
}

function renderLayoutEditor() {
  el.layoutList.className = "settings-layout";
  el.layoutList.innerHTML = state.layout.order.map((key, index) => {
    const visible = !state.layout.hidden.includes(key);
    return `<article class="settings-layout-card ${visible ? "" : "is-hidden-section"}" data-layout-key="${key}"><div class="settings-wire wire-${key === "library" ? "list" : key === "filters" ? "search" : key}" aria-hidden="true">${Array.from({ length: 6 }, () => "<span></span>").join("")}</div><strong>${escapeHtml(MODULE_NAMES[key])}</strong><div class="settings-layout-actions"><button class="icon-button" type="button" data-layout-move="-1" ${index === 0 ? "disabled" : ""} aria-label="Move up">↑</button><button class="icon-button" type="button" data-layout-move="1" ${index === state.layout.order.length - 1 ? "disabled" : ""} aria-label="Move down">↓</button><label class="check-filter toggle-check settings-visible-check"><input type="checkbox" data-layout-visible value="${key}" ${visible ? "checked" : ""}><span>${visible ? "Show" : "Hide"}</span></label></div></article>`;
  }).join("");
  const settings = normalizePriceSettings(state.gamelistSettings);
  el.settingsTheme.value = THEMES[state.gamelistSettings.theme] ? state.gamelistSettings.theme : "shabii";
  el.settingsDefaultOrder.value = ["custom", "time", "name"].includes(state.gamelistSettings.defaultOrder) ? state.gamelistSettings.defaultOrder : "custom";
  el.settingsCurrency.value = settings.currency;
  el.settingsRegion.value = settings.region;
  el.settingsPsnUser.value = state.gamelistSettings.psnUser || "";
  el.settingsMicrosoftUser.value = state.gamelistSettings.microsoftUser || "";
  el.settingsSteamUser.value = state.gamelistSettings.steamUser || "";
  el.settingsDefaultOwner.value = state.gamelistSettings.defaultOwner || "";
  el.settingsStores.innerHTML = STORE_OPTIONS.map((store) => `<label class="check-filter toggle-check settings-store-check"><input type="checkbox" value="${escapeHtml(store)}" ${settings.stores.includes(store) ? "checked" : ""}><span>${escapeHtml(store)}</span></label>`).join("");
  el.settingsStores.querySelectorAll("input").forEach((input) => input.addEventListener("change", () => {
    const checked = [...el.settingsStores.querySelectorAll("input:checked")];
    if (checked.length > MAX_PRICE_STORES) input.checked = false;
  }));
  el.settingsTheme.onchange = () => { state.gamelistSettings.theme = el.settingsTheme.value; applyTheme(); };
}

function handleLayoutMove(event) {
  const button = event.target.closest("[data-layout-move]");
  const row = button?.closest("[data-layout-key]");
  if (!button || !row) return;
  const from = state.layout.order.indexOf(row.dataset.layoutKey);
  const to = from + Number(button.dataset.layoutMove);
  if (from < 0 || to < 0 || to >= state.layout.order.length) return;
  [state.layout.order[from], state.layout.order[to]] = [state.layout.order[to], state.layout.order[from]];
  renderLayoutEditor();
}

async function saveLayout(event) {
  event.preventDefault();
  state.layout.hidden = state.layout.order.filter((key) => !el.layoutList.querySelector(`[data-layout-visible][value="${key}"]`)?.checked);
  localStorage.setItem(LAYOUT_KEY, JSON.stringify(state.layout));
  const stores = [...el.settingsStores.querySelectorAll("input:checked")].map((input) => input.value).filter((store) => STORE_OPTIONS.includes(store)).slice(0, MAX_PRICE_STORES);
  state.gamelistSettings = { ...state.gamelistSettings, theme: el.settingsTheme.value, defaultOrder: el.settingsDefaultOrder.value, currency: el.settingsCurrency.value, region: el.settingsRegion.value, psnUser: el.settingsPsnUser.value.trim(), microsoftUser: el.settingsMicrosoftUser.value.trim(), steamUser: el.settingsSteamUser.value.trim(), defaultOwner: el.settingsDefaultOwner.value.trim(), stores, storeSettingsVersion: 2 };
  localStorage.setItem("gamelist:settings:v1", JSON.stringify(state.gamelistSettings));
  state.filters.sort = shelfSortForDefault(state.gamelistSettings.defaultOrder);
  await Promise.all([persistShelf(), persistGamelistSettings()]);
  applyLayout();
  applyTheme();
  renderAll();
  if (!state.layout.hidden.includes("trophies") && !state.trophyActivity) loadTrophyActivity();
  closeDialog(el.layoutDialog);
}

function normalizePriceSettings(settings = {}) {
  const selectedStores = Array.isArray(settings.stores) ? settings.stores.filter((store) => STORE_OPTIONS.includes(store)) : DEFAULT_PRICE_STORES;
  const stores = settings.storeSettingsVersion === 2 || selectedStores.includes("eBay") ? selectedStores : [...selectedStores, "eBay"];
  return {
    currency: settings.currency === "USD" ? "USD" : "EUR",
    region: ["ES", "US", "UK"].includes(settings.region) ? settings.region : "ES",
    stores: stores.slice(0, MAX_PRICE_STORES),
  };
}

async function persistGamelistSettings() {
  const password = sessionStorage.getItem(`${SESSION_KEY}:password`) || "";
  const response = await fetch("/api/sync", { method: "PUT", headers: { "Content-Type": "application/json", "x-edit-password": password }, body: JSON.stringify({ settingsOnly: true, settings: state.gamelistSettings }) });
  if (!response.ok) throw new Error("Price settings could not be synced");
}

function openDeleteShelfDialog() {
  el.deleteShelfPassword.value = "";
  el.deleteShelfError.hidden = true;
  closeDialog(el.layoutDialog);
  openDialog(el.deleteShelfDialog);
  requestAnimationFrame(() => el.deleteShelfPassword.focus());
}

async function deletePhysicalGamesList(event) {
  event.preventDefault();
  const password = el.deleteShelfPassword.value;
  if (!password) return;
  el.deleteShelfConfirm.disabled = true;
  el.deleteShelfConfirm.textContent = "Deleting…";
  try {
    const response = await fetch("/api/shelf", { method: "DELETE", headers: { "x-edit-password": password } });
    if (!response.ok) { el.deleteShelfError.hidden = false; return; }
    const data = await response.json();
    state.sourceGames = [];
    state.additions = [];
    state.overrides = {};
    state.updatedAt = data.updatedAt || new Date().toISOString();
    localStorage.removeItem(LOCAL_DRAFT_KEY);
    rebuildGames();
    renderAll();
    closeDialog(el.deleteShelfDialog);
  } catch {
    el.deleteShelfError.textContent = "Shelf could not be deleted. Try again.";
    el.deleteShelfError.hidden = false;
  } finally {
    el.deleteShelfConfirm.disabled = false;
    el.deleteShelfConfirm.textContent = "Delete physical games";
  }
}

function applyLayout() {
  const order = new Map(state.layout.order.map((key, index) => [key, index]));
  el.modules.querySelectorAll("[data-module]").forEach((section) => {
    section.style.order = String(order.get(section.dataset.module) ?? 99);
    section.hidden = state.layout.hidden.includes(section.dataset.module);
  });
}

function toggleView() {
  state.viewMode = state.viewMode === "grid" ? "list" : "grid";
  localStorage.setItem(VIEW_KEY, state.viewMode);
  renderChrome();
}

function clearFilters() {
  state.filters = { query: "", platform: "all", region: "all", condition: "all", category: "all", tab: "all", sort: state.filters.sort, direction: state.filters.direction };
  el.search.value = "";
  el.condition.value = "all";
  el.category.value = "all";
  renderFilters();
  renderLibrary();
}

function openDialog(dialog) { dialog.showModal(); document.body.classList.add("dialog-open"); }
function closeDialog(dialog) { if (dialog.open) dialog.close(); document.body.classList.toggle("dialog-open", document.querySelector("dialog[open]") !== null); }

function populateEditorOptions() {
  el.platformOptions.innerHTML = PLATFORM_OPTIONS.map((platform) => `<option value="${platform}">${shortPlatform(platform)}</option>`).join("");
  el.fields.country.innerHTML = COUNTRY_OPTIONS.map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
}

function loadLayout() {
  try {
    const value = JSON.parse(localStorage.getItem(LAYOUT_KEY) || "{}");
    const order = Array.isArray(value.order) ? value.order.filter((key) => DEFAULT_LAYOUT.includes(key)) : [];
    const hasSavedLayout = Array.isArray(value.order);
    return { order: [...order, ...DEFAULT_LAYOUT.filter((key) => !order.includes(key))], hidden: hasSavedLayout && Array.isArray(value.hidden) ? value.hidden.filter((key) => DEFAULT_LAYOUT.includes(key)) : [...DEFAULT_HIDDEN_MODULES] };
  } catch { return { order: [...DEFAULT_LAYOUT], hidden: [...DEFAULT_HIDDEN_MODULES] }; }
}

function normalizeLayout(value) {
  const order = Array.isArray(value?.order) ? value.order.filter((key) => DEFAULT_LAYOUT.includes(key)) : [];
  const hidden = Array.isArray(value?.hidden) ? value.hidden.filter((key) => DEFAULT_LAYOUT.includes(key)) : [...DEFAULT_HIDDEN_MODULES];
  return { order: [...order, ...DEFAULT_LAYOUT.filter((key) => !order.includes(key))], hidden };
}

function loadDraft() { try { return JSON.parse(localStorage.getItem(LOCAL_DRAFT_KEY) || "{}"); } catch { return {}; } }
function setupShelfParallax(card) {
  card.addEventListener("pointermove", (event) => { if (event.pointerType === "touch") return; const rect = card.getBoundingClientRect(); const x = ((event.clientX - rect.left) / rect.width - .5) * -18; const y = ((event.clientY - rect.top) / rect.height - .5) * -18; card.style.setProperty("--art-x", `${x.toFixed(2)}px`); card.style.setProperty("--art-y", `${y.toFixed(2)}px`); });
  card.addEventListener("pointerleave", () => { card.style.setProperty("--art-x", "0px"); card.style.setProperty("--art-y", "0px"); });
}
function bindTextureParallax() { if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; let frame = 0; window.addEventListener("pointermove", (event) => { if (frame) return; frame = requestAnimationFrame(() => { frame = 0; const x = ((event.clientX / window.innerWidth) - .5) * -14; const y = ((event.clientY / window.innerHeight) - .5) * -14; document.documentElement.style.setProperty("--grid-x", `${x.toFixed(2)}px`); document.documentElement.style.setProperty("--grid-y", `${y.toFixed(2)}px`); }); }, { passive: true }); }
function renderGamelistModules() {
  const playing = state.gamelistGames.filter((game) => game.playing && !game.deletedAt);
  const finished = state.gamelistGames.filter((game) => game.completedAt && !game.deletedAt).sort((a, b) => String(b.completedAt).localeCompare(String(a.completedAt))).slice(0, 12);
  el.playingCarousel.innerHTML = playing.map(gamelistProjectionCard).join("");
  el.finishedCarousel.innerHTML = finished.map(finishedProjectionCard).join("");
  el.playingCarousel.querySelectorAll(".game-card.has-art").forEach(setupShelfParallax);
  [...el.playingCarousel.querySelectorAll("[data-gamelist-id]"), ...el.finishedCarousel.querySelectorAll("[data-gamelist-id]")].forEach((card) => { const open = () => { const game = state.gamelistGames.find((item) => item.id === card.dataset.gamelistId); if (game) openDetails(projectedDetailGame(game)); }; card.addEventListener("click", open); card.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); } }); });
  const playingModule = el.playingCarousel.closest("[data-module]");
  playingModule.hidden = state.layout.hidden.includes("playing") || !playing.length;
  el.playingFinished.hidden = !finished.length;
  el.playingCount.textContent = `Playing ${playing.length} ${playing.length === 1 ? "game" : "games"}`;
  requestAnimationFrame(() => { updatePlayingControls(); updateFinishedControls(); });
}
function projectedDetailGame(game) { const shelf = state.games.find((item) => item.gamelistId === game.id || game.shelfId === item.id); return { ...(shelf || {}), ...game, country: shelf?.country || "", genre: shelf?.genre || (game.genres || []).join(", "), category: shelf?.category || "", notes: shelf?.notes || game.notes || "", _gamelistProjection: true }; }
function slidePlaying(direction) { const card = el.playingCarousel.querySelector(".game-card"); const gap = Number.parseFloat(getComputedStyle(el.playingCarousel).columnGap) || 0; el.playingCarousel.scrollBy({ left: direction * (card ? card.getBoundingClientRect().width + gap : el.playingCarousel.clientWidth), behavior: "smooth" }); }
function updatePlayingControls() { const max = Math.max(0, el.playingCarousel.scrollWidth - el.playingCarousel.clientWidth - 1); const overflow = max > 2; const section = el.playingCarousel.closest(".playing-section"); const atStart = !overflow || el.playingCarousel.scrollLeft <= 2; const atEnd = !overflow || el.playingCarousel.scrollLeft >= max; section?.classList.toggle("playing-at-start", atStart); section?.classList.toggle("playing-at-end", atEnd); el.playingPrev.hidden = !overflow; el.playingNext.hidden = !overflow; el.playingPrev.disabled = atStart; el.playingNext.disabled = atEnd; }
function updateFinishedControls() { const max = Math.max(0, el.finishedCarousel.scrollWidth - el.finishedCarousel.clientWidth - 1); const overflow = max > 2; el.playingFinished.classList.toggle("finished-has-overflow", overflow); el.playingFinished.classList.toggle("finished-at-start", !overflow || el.finishedCarousel.scrollLeft <= 2); el.playingFinished.classList.toggle("finished-at-end", !overflow || el.finishedCarousel.scrollLeft >= max); }
function gamelistProjectionCard(game) {
  const cover = coverUrl(game.cover || "") || platformFallback(game.platform);
  const owners = Array.isArray(game.owners) ? game.owners : [];
  const ownerClasses = `${owners.includes("Judy") ? " owner-card-judy" : ""}${owners.includes("Jordi") ? " owner-card-jordi" : ""}`;
  const studio = [game.developer, game.publisher && game.publisher !== game.developer ? game.publisher : ""].filter(Boolean).join(" · ");
  const tags = [...(game.genres || []), ...(game.tags || [])];
  const badges = `${platformBadge(game.platform)}${game.digital ? `<span class="digital-pill">Digital</span>` : ""}${game.emulator ? `<span class="emulator-pill">Emulator</span>` : ""}${game.coop ? `<span class="coop-pill">Coop</span>` : ""}${game.stream ? `<span class="stream-pill">Stream</span>` : ""}${game.replayCount ? `<span class="replay-pill">Replay ${escapeHtml(game.replayCount)}</span>` : ""}`;
  const dates = `${game.startedAt ? `<span class="history-pill history-date-pill"><small>Started</small><strong>${escapeHtml(formatDate(game.startedAt))}</strong></span>` : ""}`;
  return `<article class="game-card playing-card glass has-art${ownerClasses}" data-gamelist-id="${escapeHtml(game.id)}" role="button" tabindex="0" style="--card-art:url('${escapeCss(cover)}')">
    <button class="cover-button" type="button" tabindex="-1"><img src="${escapeHtml(cover)}" alt="${escapeHtml(game.title)} cover" loading="lazy"></button>
    <div class="game-main"><div class="title-line"><div class="title-wrap"><h3 class="${owners.includes("Judy") ? "owner-judy" : ""} ${owners.includes("Jordi") ? "owner-jordi" : ""}">${escapeHtml(game.title)}</h3><div class="title-owners">${owners.map(ownerBadge).join("")}</div></div></div><div class="studio-line">${escapeHtml(studio)}</div><div class="meta">${badges}</div><div class="play-dates">${dates}</div><div class="chips">${tags.map((tag) => `<span class="chip">${escapeHtml(tag)}</span>`).join("")}</div><div class="card-trophies">${shelfCardTrophies(game)}</div></div>${game.description ? `<p class="notes">${escapeHtml(game.description)}</p>` : ""}
  </article>`;
}
function activityGameFor(game) {
  const query = normalize(game.trophyName || game.title);
  return (state.trophyActivity?.games || []).find((item) => { const title = normalize(item.title || item.game || ""); return title && (title === query || title.includes(query) || query.includes(title)); }) || null;
}
function activityProgressFor(game) {
  const remote = activityGameFor(game);
  const cached = remote?.npCommunicationId ? state.cardTrophies[remote.npCommunicationId] : null;
  if (cached?.total) return Math.round((cached.earned / cached.total) * 100);
  const match = String(remote?.game || "").match(/(\d{1,3})%/);
  return match ? Math.min(100, Number(match[1])) : null;
}
function shelfCardTrophies(game) {
  const remote = activityGameFor(game);
  const cacheKey = remote?.npCommunicationId || remote?.id || "";
  const cached = cacheKey ? state.cardTrophies[cacheKey] : null;
  if (cacheKey && !cached) loadShelfCardTrophies(game, remote);
  const query = normalize(game.trophyName || game.title);
  const recent = (state.trophyActivity?.achievements || []).filter((item) => { const value = normalize(item.game || ""); return value && (value.includes(query) || query.includes(value)); });
  const trophies = (cached?.trophies?.length ? cached.trophies : recent).slice(0, 3);
  if (!trophies.length && cached?.loading) return `<div class="card-trophy-head">${trophyIcon()}<span>Loading trophies...</span></div>`;
  if (!trophies.length) return "";
  const progress = activityProgressFor(game);
  return `<div class="card-trophy-head">${trophyIcon()}<span>Latest trophies</span>${progress != null ? `<span class="psn-progress-pill card-trophy-progress"><em style="--progress:${progress}%"></em><strong>${progress}%</strong></span>` : ""}</div><div class="card-trophy-list">${trophies.map((item) => `<span class="card-trophy trophy-${trophyTone(item.type || item.rarity)}" title="${escapeHtml([item.title, item.earnedAt].filter(Boolean).join(" · "))}"><img src="${escapeHtml(item.icon || platformLogo("PS5"))}" alt=""><span>${escapeHtml(item.title || "Trophy")}</span>${item.earnedAt ? `<small class="card-trophy-meta">${escapeHtml(item.earnedAt)}</small>` : ""}</span>`).join("")}</div>`;
}
async function loadShelfCardTrophies(game, remote) {
  const cacheKey = remote?.npCommunicationId || remote?.id || "";
  if (!cacheKey || state.cardTrophies[cacheKey]) return;
  state.cardTrophies[cacheKey] = { loading: true, trophies: [], earned: 0, total: 0 };
  try {
    const params = new URLSearchParams({ id: cacheKey, service: remote.npServiceName || "trophy", user: state.gamelistSettings.psnUser || "" });
    const response = await fetch(`/api/trophies?${params}`);
    const data = await response.json();
    const all = Array.isArray(data.trophies) ? data.trophies : [];
    state.cardTrophies[cacheKey] = { loading: false, trophies: all.filter((item) => item.earned).sort((a, b) => Date.parse(b.rawEarnedAt || b.earnedAt || 0) - Date.parse(a.rawEarnedAt || a.earnedAt || 0)).slice(0, 3), earned: all.filter((item) => item.earned).length, total: all.length };
  } catch { state.cardTrophies[cacheKey] = { loading: false, trophies: [], earned: 0, total: 0 }; }
  renderGamelistModules();
  renderLibrary();
}
function finishedProjectionCard(game) {
  const cover = coverUrl(game.cover || "") || platformFallback(game.platform);
  const progress = activityProgressFor(game);
  const badges = `${platformBadge(game.platform)}${game.digital ? `<span class="digital-pill">Digital</span>` : ""}${game.emulator ? `<span class="emulator-pill">Emulator</span>` : ""}${game.coop ? `<span class="coop-pill">Coop</span>` : ""}${game.platinum ? `<span class="platinum-pill">Completed</span>` : ""}`;
  return `<button class="achievement-game playing-finished-game ${game.platinum ? "completed-trophy-card" : ""}" type="button" data-gamelist-id="${escapeHtml(game.id)}"><img src="${escapeHtml(cover)}" alt="" loading="lazy"><div><strong class="${game.platinum ? "completed-achievements-title" : ""}">${escapeHtml(game.title)}</strong><span class="playing-finished-tags">${badges}</span><span>${escapeHtml(formatDate(game.completedAt))}</span>${progress != null ? `<em style="--progress:${progress}%"></em>` : ""}</div></button>`;
}
async function loadTrophyActivity() {
  const module = el.trophyCard.closest("[data-module]");
  const user = state.gamelistSettings.psnUser || "";
  el.trophyCard.innerHTML = `<span class="lookup-loading">Loading trophy activity…</span>`;
  try {
    const response = await fetch(`/api/achievements?user=${encodeURIComponent(user)}&schema=3`);
    state.trophyActivity = response.ok ? await response.json() : null;
    el.achievementProfile.href = state.trophyActivity?.sourceUrl || "https://www.playstation.com/";
    el.achievementProfile.textContent = "PSN activity";
    const summary = state.trophyActivity?.summary?.trophies || {};
    const latest = (state.trophyActivity?.achievements || []).slice(0, 6);
    const counts = [["Platinum", Number(summary.platinum || 0)], ["Gold", Number(summary.gold || 0)], ["Silver", Number(summary.silver || 0)], ["Bronze", Number(summary.bronze || 0)]];
    const total = counts.reduce((sum, [, count]) => sum + count, 0);
    const completed = Number(summary.platinum || (state.trophyActivity?.platinums || []).length || 0);
    el.trophyCard.innerHTML = `<div class="achievement-summary"><button class="achievement-kpi platinum-highlight" type="button" data-achievement-action="completed"><strong class="kpi-with-icon">${trophyIcon()}${completed}</strong><span>COMPLETED</span></button><div class="achievement-kpi trophy-kpi"><strong>${total}</strong><span>TROPHIES</span></div><div class="achievement-kpi"><strong>${state.trophyActivity?.summary?.level || 0}</strong><span>LEVEL</span></div><div class="rarity-graph">${counts.map(([type, count]) => `<span class="rarity-bar rarity-${type.toLowerCase()}"><em style="--bar:${Math.max(7, total ? Math.round(count / Math.max(...counts.map(([, value]) => value), 1) * 100) : 7)}%"></em><small>${type}</small><strong>${count}</strong></span>`).join("")}</div></div><span class="achievement-subtitle trophy-subtitle">Latest Achievements</span>${latest.map((item, index) => `<button class="achievement-card ${index === 0 ? "latest" : ""} trophy-${trophyTone(item.rarity)}" type="button" data-achievement-game="${escapeHtml(item.game || "")}"><img class="achievement-icon" src="${escapeHtml(item.icon || platformLogo(item.platform || "PS5"))}" alt=""><div><strong>${escapeHtml(item.title || "Trophy")}</strong><span class="achievement-game-name">${escapeHtml(item.game || "")}</span><span class="achievement-card-meta playing-finished-tags">${platformBadge(item.platform || "PlayStation")}${item.earnedAt ? `<span class="achievement-earned-date">${escapeHtml(item.earnedAt)}</span>` : ""}</span></div></button>`).join("")}`;
    el.trophyCard.querySelector("[data-achievement-action='completed']")?.addEventListener("click", openCompletedGames);
    el.trophyCard.querySelectorAll("[data-achievement-game]").forEach((button) => button.addEventListener("click", () => openGamelistGameByTitle(button.dataset.achievementGame)));
    renderGamelistModules();
    renderLibrary();
  } catch { el.trophyCard.innerHTML = `<span>Trophy activity is unavailable.</span>`; }
  module.hidden = state.layout.hidden.includes("trophies");
}
function openGamelistGameByTitle(title) { const query = normalize(title); if (!query) return; const game = state.gamelistGames.find((item) => { const value = normalize(item.title); return value === query || value.includes(query) || query.includes(value); }); if (game) openDetails(projectedDetailGame(game)); }
function openCompletedGames() {
  const remote = state.trophyActivity?.platinums || [];
  const completed = remote.length ? remote : state.gamelistGames.filter((game) => game.platinum || game.completedAt);
  el.completedList.innerHTML = completed.map((item) => { const title = item.title || item.game || "Completed game"; const local = state.gamelistGames.find((game) => normalize(game.title) === normalize(title)); const cover = local?.cover || item.cover || platformLogo(item.platform || local?.platform || "PS5"); return `<button class="platinum-card" type="button" data-completed-title="${escapeHtml(title)}"><img class="platinum-icon" src="${escapeHtml(cover)}" alt=""><div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(item.trophyName || item.earnedAt || "Completed")}</span></div></button>`; }).join("") || `<span class="muted">No completed games found.</span>`;
  el.completedList.querySelectorAll("[data-completed-title]").forEach((button) => button.addEventListener("click", () => { closeDialog(el.completedDialog); openGamelistGameByTitle(button.dataset.completedTitle); }));
  openDialog(el.completedDialog);
}
function conditionValue(game, key) {
  if (typeof game?.[key] === "boolean") return game[key];
  const old = String(game?.ownership || "").toLowerCase();
  if (key === "game") return true;
  if (key === "box") return /cib|boxed|new/.test(old);
  if (key === "manual") return /cib/.test(old);
  if (key === "other") return /\+/.test(old);
  if (key === "sealed") return /new|sealed/.test(old);
  return false;
}
function conditionLabel(game) {
  if (conditionValue(game, "sealed")) return "Sealed";
  if (conditionValue(game, "game") && conditionValue(game, "box")) return conditionValue(game, "manual") || conditionValue(game, "other") ? "Complete +" : "Complete";
  return "Loose";
}
function syncConditionInputs(changed) {
  if (changed === el.conditionFields.sealed && changed.checked) {
    el.conditionFields.game.checked = true; el.conditionFields.box.checked = true; el.conditionFields.other.checked = true; el.conditionFields.manual.checked = false;
  }
  if (!el.conditionFields.game.checked || !el.conditionFields.box.checked) el.conditionFields.sealed.checked = false;
  el.conditionFields.sealed.disabled = !el.conditionFields.game.checked || !el.conditionFields.box.checked;
}
function conditionFromInputs() { return Object.fromEntries(Object.entries(el.conditionFields).map(([key, input]) => [key, input.checked])); }
function splitValues(value) { return String(value || "").split(",").map((item) => item.trim()).filter(Boolean); }
function websiteLinks(game) { return [...new Set([...(game.websites || []), ...Object.values(game.storeLinks || {})].filter(Boolean))]; }
function linkLabel(value) { try { return new URL(value).hostname.replace(/^www\./, ""); } catch { return "Website"; } }
function siteIcon(value) { const host = (() => { try { return new URL(value).hostname; } catch { return ""; } })(); if (host.includes("playstation")) return "assets/sites/playstation.png"; if (host.includes("nintendo")) return "assets/sites/nintendo.png"; if (host.includes("steam")) return "assets/sites/steam.png"; if (host.includes("howlongtobeat")) return "assets/sites/howlongtobeat.png"; return host ? `https://${host}/favicon.ico` : "assets/Icon.png"; }
function guideIcon(label) { if (label === "HowLongToBeat") return "assets/sites/howlongtobeat.png"; if (label === "Neoseeker") return "assets/sites/neoseeker.png"; return "assets/sites/wikipedia.ico"; }
function guideLinks(game) { return [["HowLongToBeat", `https://howlongtobeat.com/?q=${encodeURIComponent(game.title)}`], ["Neoseeker", `https://www.neoseeker.com/search/?q=${encodeURIComponent(`${game.title} guide`)}`], ["Wikipedia", `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(game.title)}`]]; }
async function loadStorePrices(game) { el.detailStorePrices.innerHTML = `<span class="muted">Checking store prices…</span>`; try { const settings = normalizePriceSettings(state.gamelistSettings); const stores = settings.stores.join(","); const region = settings.region; const currency = settings.currency; const response = await fetch(`/api/prices?title=${encodeURIComponent(game.title)}&platform=${encodeURIComponent(shortPlatform(game.platform))}&region=${encodeURIComponent(region)}&currency=${encodeURIComponent(currency)}&stores=${encodeURIComponent(stores)}`); const data = await response.json(); const prices = data.prices || []; const available = prices.filter((price) => price.numericPrice != null).sort((a, b) => a.numericPrice - b.numericPrice); const best = available[0]?.store; el.detailStorePrices.innerHTML = prices.map((price) => { const label = price.price || `- ${currency === "USD" ? "$" : "€"}`; return `<a class="price-link ${best === price.store && price.price ? "best" : ""} ${price.price ? "has-price" : "missing-price"}" href="${escapeHtml(price.url || "#")}" target="_blank" rel="noreferrer" title="${escapeHtml(price.store)}"><img class="store-icon" src="${escapeHtml(storeIcon(price.store))}" alt=""><strong>${escapeHtml(label)}</strong></a>`; }).join("") || `<span class="muted">No store prices found.</span>`; } catch { el.detailStorePrices.innerHTML = `<span class="muted">Store prices unavailable.</span>`; } }
function storeIcon(store) { if (String(store).startsWith("Amazon")) return "assets/stores/amazon.ico"; if (store === "eBay") return "https://www.ebay.com/favicon.ico"; if (store === "Xtralife") return "assets/stores/xtralife.ico"; if (store === "GAME.es") return "assets/stores/game.ico"; if (store === "Retro Island NY") return "assets/stores/retroisland.png"; if (store === "GameStop") return "https://www.gamestop.com/favicon.ico"; if (store === "Walmart") return "https://www.walmart.com/favicon.ico"; if (String(store).startsWith("Nintendo")) return "assets/sites/nintendo.png"; if (String(store).startsWith("PlayStation")) return "assets/sites/playstation.png"; if (store === "Steam") return "assets/sites/steam.png"; if (store === "Xbox") return "assets/platforms/xbox.png"; return "assets/Icon.png"; }
function renderPriceDetails(game) {
  const prices = game.collectionPrices || {};
  const rows = [["Loose", prices.loose], ["Complete", prices.complete], ["Sealed", prices.sealed]].filter(([, value]) => value != null);
  const symbol = game.priceCurrency === "USD" ? "$" : "€";
  const identifiers = [["UPC", game.upc], ["SKU", game.sku], ["ASIN", game.asin], ["eBay ID", game.epid], ["PriceCharting", game.pricechartingId]].filter(([, value]) => value);
  const priceMarkup = rows.length ? `<div class="collection-price-grid">${rows.map(([label, value]) => `<span><small>${label}</small><strong>${symbol}${Number(value).toFixed(2)}</strong></span>`).join("")}</div>` : `<span class="muted">No collection value fetched yet.</span>`;
  const identifierMarkup = identifiers.length ? `<div class="collection-product-meta">${identifiers.map(([label, value]) => `<span><small>${label}</small><strong>${escapeHtml(value)}</strong></span>`).join("")}</div>` : "";
  el.detailPriceSummary.innerHTML = `${priceMarkup}${identifierMarkup}`;
  const history = game.priceHistory || [];
  el.detailPriceGraph.innerHTML = priceGraph(history);
  el.detailPriceGraph.hidden = history.length < 1;
}
function priceGraph(history) {
  if (!history.length) return "";
  const values = history.map((item) => Number(item.value)).filter(Number.isFinite); const min = Math.min(...values); const max = Math.max(...values); const range = Math.max(1, max - min);
  const coords = values.map((value, index) => ({ x: values.length === 1 ? 300 : 24 + index * (552 / (values.length - 1)), y: values.length === 1 ? 75 : 126 - ((value - min) / range) * 102, value }));
  const points = coords.map(({ x, y }) => `${x},${y}`).join(" ");
  return `<line x1="24" y1="126" x2="576" y2="126" stroke="rgba(255,255,255,.14)"/><polyline points="${points}" fill="none" stroke="var(--accent)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>${coords.map(({ x, y, value }) => `<circle cx="${x}" cy="${y}" r="4" fill="var(--accent)"><title>${value.toFixed(2)}</title></circle>`).join("")}<text x="24" y="145" fill="rgba(255,255,255,.48)" font-size="10">${escapeHtml(history[0]?.date || "")}</text><text x="576" y="145" fill="rgba(255,255,255,.48)" font-size="10" text-anchor="end">${escapeHtml(history.at(-1)?.date || "")}</text>`;
}
async function fetchCollectionValue() {
  const game = state.games.find((item) => item.id === el.detailDialog.dataset.id); if (!game) return;
  el.fetchValue.disabled = true; el.fetchValue.textContent = "Fetching…";
  try {
    const params = new URLSearchParams({ title: game.title, platform: shortPlatform(game.platform), region: game.country || game.region || "", currency: state.gamelistSettings.currency || "EUR" });
    if (game.pricechartingId) params.set("id", game.pricechartingId); else if (game.upc) params.set("upc", game.upc);
    const response = await fetch(`/api/collection-price?${params}`);
    const data = await response.json();
    if (!response.ok || data.error) { el.detailPriceSummary.innerHTML = `<span class="auth-error">${escapeHtml(data.error || "No matching physical edition was found.")}</span>`; return; }
    game.collectionPrices = data.prices;
    const condition = conditionLabel(game); const historyKey = condition === "Sealed" ? "sealed" : condition.startsWith("Complete") ? "complete" : "loose"; const mainValue = data.prices[historyKey];
    game.price = mainValue ?? data.mainValue;
    game.priceCurrency = data.currency || "USD";
    game.priceHistory = (data.history?.[historyKey]?.length ? data.history[historyKey] : [...(game.priceHistory || []), { date: String(data.checkedAt || "").slice(0, 10), value: game.price }]).filter((item) => item.value != null).slice(-60);
    game.releaseDate = data.releaseDate || game.releaseDate; game.upc = data.upc || game.upc; game.sku = data.sku || game.sku; game.asin = data.asin || game.asin; game.epid = data.epid || game.epid; game.pricechartingId = data.productId || game.pricechartingId;
    const clean = stripRuntimeFields(game); const index = state.additions.findIndex((item) => item.id === game.id);
    if (game.sourceRecord) state.overrides[game.id] = clean; else if (index >= 0) state.additions[index] = clean;
    await persistShelf(); renderPriceDetails(game); renderStats();
  } catch (error) { el.detailPriceSummary.innerHTML = `<span class="auth-error">${escapeHtml(error?.message || "Collection value is unavailable.")}</span>`; } finally { el.fetchValue.disabled = false; el.fetchValue.textContent = "Fetch value"; }
}
async function loadShelfTrophies(game) {
  const query = normalize(game.trophyName || game.title); const games = state.trophyActivity?.games || [];
  const match = games.find((item) => normalize(item.title || item.game || "").includes(query) || query.includes(normalize(item.title || item.game || "")));
  const id = match?.npCommunicationId || match?.id || "";
  if (!id) { el.detailTrophies.hidden = true; return; }
  el.detailTrophies.hidden = false; el.detailTrophyList.innerHTML = `<span>Loading trophies…</span>`;
  try { const response = await fetch(`/api/trophies?id=${encodeURIComponent(id)}&service=${encodeURIComponent(match.npServiceName || "trophy")}&user=${encodeURIComponent(state.gamelistSettings.psnUser || "")}`); const data = await response.json(); const trophies = data.trophies || []; el.detailTrophyCount.textContent = `${trophies.filter((item) => item.earned).length}/${trophies.length}`; el.detailTrophyList.innerHTML = trophies.map((item) => `<article class="detail-trophy-card trophy-${trophyTone(item.type)} ${item.earned ? "earned" : "missing"}"><img src="${escapeHtml(item.icon || "assets/platforms/playstation.png")}" alt=""><div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml([item.earned ? item.earnedAt : "Missing", item.rarity].filter(Boolean).join(" · "))}</span>${item.description ? `<p>${escapeHtml(item.description)}</p>` : ""}</div></article>`).join(""); } catch { el.detailTrophies.hidden = true; }
}
function pencilIcon() { return `<svg class="pencil-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l11-11a2.8 2.8 0 0 0-4-4L4 16v4Z"></path><path d="M13.5 6.5l4 4"></path></svg>`; }
function trophyIcon() { return `<svg class="trophy-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8v4a4 4 0 0 1-8 0V4Z"></path><path d="M8 6H5a3 3 0 0 0 3 3"></path><path d="M16 6h3a3 3 0 0 1-3 3"></path><path d="M12 12v4"></path><path d="M9 20h6"></path><path d="M10 16h4v4h-4z"></path></svg>`; }
function sortArrowIcon(desc = false) { return `<svg class="sort-arrow-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${desc ? "M12 3.5v17" : "M12 20.5v-17"}"></path><path d="${desc ? "M6.5 15l5.5 5.5 5.5-5.5" : "M6.5 9l5.5-5.5L17.5 9"}"></path></svg>`; }
function linesIcon() { return `<svg class="view-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14"></path></svg>`; }
function gridIcon() { return `<svg class="view-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="4.5" y="4.5" width="5.5" height="5.5"></rect><rect x="14" y="4.5" width="5.5" height="5.5"></rect><rect x="4.5" y="14" width="5.5" height="5.5"></rect><rect x="14" y="14" width="5.5" height="5.5"></rect></svg>`; }
function ownerBadge(owner) { return `<span class="owner-pill owner-${normalize(owner)}">${escapeHtml(owner)}</span>`; }
function trophyTone(value) { const text = String(value || "").toLowerCase(); if (text.includes("platinum")) return "platinum"; if (text.includes("gold")) return "gold"; if (text.includes("silver")) return "silver"; return "bronze"; }
function handleSelectOverflowTitle(event) { const select = event.target.closest?.("select"); if (select && updateSelectOverflowTitle(select)) showSelectOverflowPopover(select); }
function handleSelectOverflowLeave(event) { if (event.target.closest?.("select")) hideSelectOverflowPopover(); }
function updateSelectOverflowTitle(select) { const label = select?.selectedOptions?.[0]?.textContent?.trim() || ""; if (!label) return false; selectMeasureContext ||= document.createElement("canvas").getContext("2d"); const style = getComputedStyle(select); selectMeasureContext.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`; const available = select.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0) - 4; const clipped = selectMeasureContext.measureText(label).width > available; select.classList.toggle("is-clipped", clipped); return clipped; }
function showSelectOverflowPopover(select) { if (!selectOverflowPopover) { selectOverflowPopover = document.createElement("div"); selectOverflowPopover.className = "select-overflow-popover"; document.body.appendChild(selectOverflowPopover); } selectOverflowPopover.textContent = select.selectedOptions?.[0]?.textContent?.trim() || ""; const rect = select.getBoundingClientRect(); selectOverflowPopover.style.left = `${Math.min(Math.max(rect.left, 12), Math.max(12, window.innerWidth - 280))}px`; selectOverflowPopover.style.top = `${Math.min(rect.bottom + 6, window.innerHeight - 48)}px`; selectOverflowPopover.classList.add("visible"); }
function hideSelectOverflowPopover() { selectOverflowPopover?.classList.remove("visible"); }
function registerServiceWorker() { if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("/service-worker.js").catch(() => {})); }
async function checkSiteVersion() { try { const response = await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" }); if (!response.ok) return false; const remote = await response.json(); const remoteVersion = String(remote.version || "").trim(); if (!remoteVersion) return false; const current = localStorage.getItem(VERSION_STORAGE_KEY); if (!current || current === remoteVersion || remoteVersion === SITE_VERSION) { localStorage.setItem(VERSION_STORAGE_KEY, remoteVersion); return false; } await clearSiteCaches(); localStorage.setItem(VERSION_STORAGE_KEY, remoteVersion); window.location.reload(); return true; } catch { return false; } }
async function clearSiteCaches() { if ("caches" in window) { const keys = await caches.keys(); await Promise.all(keys.filter((key) => key.startsWith("gamelist-cache-")).map((key) => caches.delete(key))); } if ("serviceWorker" in navigator) { const registrations = await navigator.serviceWorker.getRegistrations(); await Promise.all(registrations.map((registration) => registration.update().catch(() => {}))); } }
async function clearSiteCachesAndReload() { await clearSiteCaches(); localStorage.setItem(VERSION_STORAGE_KEY, SITE_VERSION); window.location.reload(); }
function stripRuntimeFields(game) { const { sourceRecord, ...clean } = game; return clean; }
function numberOrNull(value) { const number = Number(value); return Number.isFinite(number) && value !== "" ? number : null; }
function firstGenre(value) { return String(value).split(",")[0].trim(); }
function rawCoverUrl(value) { try { const url = new URL(value, location.origin); return url.searchParams.get("src") || value; } catch { return value; } }
function coverUrl(value) { return value.includes("howlongtobeat.com/games/") ? `/api/cover?src=${encodeURIComponent(value)}` : value; }
function coverProjectUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^\d+$/.test(raw)) return `https://www.thecoverproject.net/download_cover.php?src=cdn&cover_id=${raw}`;
  try {
    const url = new URL(raw);
    const id = url.searchParams.get("cover_id");
    if (id && /thecoverproject\.net$/i.test(url.hostname)) return `https://www.thecoverproject.net/download_cover.php?src=cdn&cover_id=${encodeURIComponent(id)}`;
    return raw;
  } catch { return ""; }
}
function findCoverProjectCover() {
  const title = el.fields.title.value.trim() || el.lookupInput.value.trim();
  const platform = shortPlatform(el.fields.platform.value);
  const query = `site:thecoverproject.net/view.php "${title}" "${platform}"`;
  window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer");
}
function handleCoverImageError(event) {
  const image = event.target;
  if (!(image instanceof HTMLImageElement) || !image.dataset.coverFallback || image.dataset.fallbackUsed) return;
  image.dataset.fallbackUsed = "true";
  image.closest(".has-wrap")?.classList.remove("has-wrap");
  image.src = image.dataset.coverFallback;
}
function platformFallback(platform) { const key = normalize(platform); if (key.includes("switch")) return "assets/platforms/switch.png"; if (key.includes("3ds")) return "assets/platforms/3ds.png"; if (key.includes("ds")) return "assets/platforms/nds.png"; if (key.includes("64")) return "assets/platforms/n64.png"; return "assets/platforms/playstation.png"; }
function coverClass(platform) { const value = shortPlatform(platform).toLowerCase().replace(/\s+/g, ""); return `cover-${value === "switch2" ? "switch2" : value}`; }
function shortPlatform(value) { return ({ "Sony PlayStation": "PS1", "Sony PlayStation 2": "PS2", "Sony PlayStation 4": "PS4", "Sony PlayStation 5": "PS5", "Nintendo Switch": "Switch", "Nintendo Switch 2": "Switch 2", "Nintendo DS": "DS", "Nintendo 3DS": "3DS", "Nintendo 64": "N64" })[value] || value; }
function flagAsset(country) { return `assets/flags/${({ "United Kingdom": "gb", Spain: "es", "United States of America": "us", Japan: "jp", Taiwan: "tw", France: "fr", Germany: "de", Australia: "au", China: "cn", Europe: "eu", World: "world" })[country] || "world"}.svg`; }
function flagIcon(country, withClass = false) { return `<img${withClass ? ` class="detail-flag"` : ""} src="${flagAsset(country)}" alt="" width="47" height="31" decoding="async">`; }
function platformBadge(platform) { return `<span class="platform-badge ${platformClass(platform)}" title="${escapeHtml(shortPlatform(platform))}"><span class="platform-icon"><img src="${platformLogo(platform)}" alt="" width="18" height="18" decoding="async"></span><span class="platform-label">${escapeHtml(shortPlatform(platform))}</span></span>`; }
function platformLogo(platform) { const value = normalize(shortPlatform(platform)); if (value === "n64") return "assets/platforms/n64.png"; if (value === "ds") return "assets/platforms/nds.png"; if (value === "3ds") return "assets/platforms/3ds.png"; if (value.includes("switch")) return "assets/platforms/switch.png"; if (value.includes("xbox") || value === "x360" || value === "xone") return "assets/platforms/xbox.png"; if (value.includes("steam") || value === "pc") return "assets/platforms/steam.png"; return "assets/platforms/playstation.png"; }
function platformClass(platform) { const value = normalize(shortPlatform(platform)); if (value === "n64") return "platform-n64"; if (value === "ds") return "platform-ds"; if (value === "3ds") return "platform-3ds"; if (value.includes("switch")) return "platform-nintendo"; if (value.includes("xbox") || value === "x360" || value === "xone") return "platform-xbox"; if (value.includes("steam") || value === "pc") return "platform-pc"; if (value.includes("ps") || value.includes("playstation")) return "platform-playstation"; return "platform-generic"; }
function regionName(country) { return country === "United States of America" ? "United States" : country; }
function regionFor(country) { if (country === "Japan") return "Japan"; if (country === "Taiwan") return "Taiwan"; if (country === "United States of America") return "USA"; if (["United Kingdom", "Spain", "France", "Germany", "Europe"].includes(country)) return country === "Spain" ? "Spain" : "Europe"; return country || "Other"; }
function countValues(values) { const map = new Map(); values.filter(Boolean).forEach((value) => map.set(value, (map.get(value) || 0) + 1)); return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])); }
function conditionMatches(game, condition) { const label = conditionLabel(game).toLowerCase(); if (condition === "all") return true; if (condition === "complete") return label === "complete"; if (condition === "complete-plus") return label === "complete +"; if (condition === "loose") return label === "loose"; if (condition === "sealed") return label === "sealed"; return true; }
function sorter(type) { const direction = state.filters.direction === "desc" ? -1 : 1; if (type === "custom") return (a, b) => direction * ((a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) || a.title.localeCompare(b.title)); if (type === "title" || type === "name") return (a, b) => direction * a.title.localeCompare(b.title); if (type === "added" || type === "time") return (a, b) => direction * (new Date(a.createdAt || 0) - new Date(b.createdAt || 0)); if (type === "value") return (a, b) => direction * ((a.price || 0) - (b.price || 0)); if (type === "region") return (a, b) => direction * (a.country.localeCompare(b.country) || a.title.localeCompare(b.title)); return (a, b) => direction * (a.platform.localeCompare(b.platform) || a.title.localeCompare(b.title)); }
function uniqueSorted(values) { return [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base" })); }
function shelfSortForDefault(value) { if (value === "time") return "time"; if (value === "name") return "title"; return "custom"; }
function bestCollectionPlatform(platforms, fallback) {
  const value = platforms.map(normalize).join(" ");
  if (value.includes("nintendo switch 2")) return "Nintendo Switch 2";
  if (value.includes("nintendo switch")) return "Nintendo Switch";
  if (value.includes("playstation 5")) return "Sony PlayStation 5";
  if (value.includes("playstation 4")) return "Sony PlayStation 4";
  if (value.includes("playstation 2")) return "Sony PlayStation 2";
  if (value.includes("playstation")) return "Sony PlayStation";
  if (value.includes("nintendo 3ds")) return "Nintendo 3DS";
  if (value.includes("nintendo ds")) return "Nintendo DS";
  if (value.includes("nintendo 64")) return "Nintendo 64";
  return fallback || "Nintendo Switch";
}
function normalize(value) { return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim(); }
function formatDate(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "22 Jun 2026" : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date); }
function escapeCss(value) { return String(value).replace(/["'()\\]/g, "\\$&"); }
function escapeHtml(value) { return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]); }

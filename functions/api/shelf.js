import { isEditorRequest } from "./editor-auth.js";

const KV_KEY = "shelf-data";

export async function onRequestGet({ env }) {
  if (!env.GAMELIST) return json({ sourceGames: [], games: [], overrides: {} });
  const data = await env.GAMELIST.get(KV_KEY, "json");
  return json(data || { sourceGames: [], games: [], overrides: {} });
}

export async function onRequestPut({ request, env }) {
  if (!env.GAMELIST) return json({ error: "Missing GAMELIST KV binding" }, 501);
  if (!env.EDIT_PASSWORD) return json({ error: "Missing EDIT_PASSWORD secret" }, 503);
  if (!await isEditorRequest(request, env)) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.games) || !body.overrides || typeof body.overrides !== "object") {
    return json({ error: "Expected { games: [], overrides: {} }" }, 400);
  }
  const existing = await env.GAMELIST.get(KV_KEY, "json") || {};
  const previousIds = new Set([...(existing.sourceGames || []), ...(existing.games || [])].map((game) => game.id));
  const newlyAdded = body.games.filter((game) => !previousIds.has(game.id));
  const data = {
    sourceGames: Array.isArray(existing.sourceGames) ? existing.sourceGames : [],
    games: body.games.slice(0, 1000),
    overrides: body.overrides,
    updatedAt: new Date().toISOString(),
  };
  await env.GAMELIST.put(KV_KEY, JSON.stringify(data));
  await syncShelfGamesToBacklog(env, body.games, newlyAdded);
  return json({ ok: true, updatedAt: data.updatedAt });
}

async function syncShelfGamesToBacklog(env, allShelfGames, games) {
  const list = await env.GAMELIST.get("gamelist-data", "json") || { games: [], settings: {} };
  const shelfById = new Map(allShelfGames.map((game) => [game.id, game]));
  let changed = false;
  const listGames = (list.games || []).map((game) => {
    const linked = shelfById.get(game.shelfId);
    if (!linked) return game;
    const owners = Array.isArray(linked.owners) ? linked.owners : [];
    if (JSON.stringify(game.owners || []) === JSON.stringify(owners)) return game;
    changed = true;
    return { ...game, owners, updatedAt: new Date().toISOString() };
  });
  const known = new Set(listGames.flatMap((game) => [game.shelfId, game.id]).filter(Boolean));
  const additions = games.filter((game) => !game.gamelistId && !known.has(game.id)).map((game) => ({
    id: `shelf-${game.id}`,
    shelfId: game.id,
    title: game.title,
    platform: shortPlatform(game.platform),
    section: "backlog",
    digital: false,
    playing: false,
    platinum: false,
    completedAt: "",
    owners: Array.isArray(game.owners) ? game.owners : [],
    statuses: [],
    tags: Array.isArray(game.tags) ? game.tags.filter((tag) => tag !== "Gamelist") : [],
    genres: String(game.genre || "").split(",").map((value) => value.trim()).filter(Boolean),
    publisher: game.publisher || "",
    developer: game.developer || "",
    cover: game.cover || "",
    releaseDate: game.releaseDate || "",
    description: game.description || "",
    igdbUrl: game.igdbUrl || "",
    storeLinks: game.storeLinks || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    order: 0,
  }));
  if (!additions.length && !changed) return;
  await env.GAMELIST.put("gamelist-data", JSON.stringify({
    games: [...additions, ...listGames],
    settings: list.settings || {},
    updatedAt: new Date().toISOString(),
  }));
}

function shortPlatform(value) {
  return ({
    "Sony PlayStation": "PS1", "Sony PlayStation 2": "PS2", "Sony PlayStation 3": "PS3",
    "Sony PlayStation 4": "PS4", "Sony PlayStation 5": "PS5", "Nintendo Switch": "Switch",
    "Nintendo Switch 2": "Switch 2", "Nintendo DS": "DS", "Nintendo 3DS": "3DS", "Nintendo 64": "N64",
  })[value] || value || "Unknown";
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

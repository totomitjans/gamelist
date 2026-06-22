import fs from "node:fs/promises";

const sourceFile = new URL("../data/2026_06_22_ge_collection.csv", import.meta.url);
const outputFile = new URL("../data/collection-games.json", import.meta.url);
const rows = parseCsv(await fs.readFile(sourceFile, "utf8"));
const sourceGames = rows.filter((row) => String(row.Category || "").trim().toLowerCase() === "games");

let previous = { games: [] };
try {
  previous = JSON.parse(await fs.readFile(outputFile, "utf8"));
} catch {}

const coverCache = new Map((previous.games || []).map((game) => [gameKey(game), game.cover || ""]));
const games = sourceGames.map((row, index) => ({
  id: `collection-${index + 1}`,
  title: row.Title,
  platform: row.Platform,
  country: row.Country,
  region: regionFor(row.Country),
  releaseType: row.ReleaseType,
  publisher: clean(row.Publisher),
  developer: clean(row.Developer),
  genre: clean(row.Genre),
  createdAt: row.CreatedAt,
  recordType: row.UserRecordType,
  ownership: row.Ownership,
  price: numberValue(row.YourPrice),
  paid: numberValue(row.PricePaid),
  itemCondition: clean(row.ItemCondition),
  boxCondition: clean(row.BoxCondition),
  manualCondition: clean(row.ManualCondition),
  notes: clean(row.Notes),
  tags: clean(row.Tags),
  metacritic: numberValue(row.metacritic),
  cover: coverCache.get(`${row.Title}::${row.Platform}`) || "",
}));

const pending = games.filter((game) => !game.cover);
let completed = 0;
const workers = Array.from({ length: 8 }, async () => {
  while (pending.length) {
    const game = pending.shift();
    try {
      const response = await fetch(`http://127.0.0.1:8790/api/search?q=${encodeURIComponent(lookupTitle(game.title))}`);
      const data = response.ok ? await response.json() : { results: [] };
      game.cover = bestCover(game, data.results || []);
    } catch {
      game.cover = "";
    }
    completed += 1;
    if (completed % 20 === 0 || completed === sourceGames.length) {
      console.log(`covers ${completed}/${sourceGames.length}`);
    }
  }
});

await Promise.all(workers);
const payload = {
  generatedAt: new Date().toISOString(),
  source: "2026_06_22_ge_collection.csv",
  total: games.length,
  games,
};
await fs.writeFile(outputFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`wrote ${games.length} games to data/collection-games.json`);

function bestCover(game, results) {
  const wanted = normalize(game.title);
  const platform = normalizePlatform(game.platform);
  const scored = results.map((result, index) => {
    const found = normalize(result.title);
    let score = wanted === found ? 10 : 0;
    if (wanted && found && (wanted.includes(found) || found.includes(wanted))) score += 3;
    const platforms = (result.platforms || [result.platform]).map(normalizePlatform);
    if (platforms.includes(platform)) score += 4;
    return { result, score: score - index * 0.01 };
  }).filter((entry) => entry.result.cover).sort((a, b) => b.score - a.score);
  return scored[0]?.result?.cover || "";
}

function normalizePlatform(value) {
  const text = normalize(value);
  if (text.includes("switch 2")) return "switch 2";
  if (text.includes("switch")) return "switch";
  if (text.includes("playstation 5")) return "ps5";
  if (text.includes("playstation 4")) return "ps4";
  if (text.includes("playstation 2")) return "ps2";
  if (text === "sony playstation" || text === "playstation") return "ps1";
  if (text.includes("3ds")) return "3ds";
  if (text.includes("nintendo ds")) return "ds";
  if (text.includes("nintendo 64")) return "n64";
  return text;
}

function regionFor(country) {
  const value = String(country || "");
  if (value === "Japan") return "Japan";
  if (value === "Taiwan") return "Taiwan";
  if (value === "United States of America") return "USA";
  if (["United Kingdom", "Spain", "France", "Germany"].includes(value)) return value === "Spain" ? "Spain" : "Europe";
  return value || "Other";
}

function numberValue(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function clean(value) {
  const text = String(value || "").trim();
  return !text || text === "?" || text === "Missing Field" ? "" : text;
}

function normalize(value) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function lookupTitle(value) {
  const aliases = {
    "Beyblade Metal Fusion: Cyber Pegasus": "Beyblade Metal Fusion",
    "Pokémon Black Version": "Pokemon Black",
    "Pokémon Black Version 2": "Pokemon Black 2",
    "Pokémon Pearl Version": "Pokemon Diamond and Pearl",
    "Pokémon SoulSilver Version [Pokéwalker Bundle]": "Pokemon SoulSilver",
    "Pokémon White Version": "Pokemon White",
    "Fire Emblem: Three Houses Limited Edition": "Fire Emblem Three Houses",
    "Gyakuten Saiban 123: Naruhodo Selection": "Ace Attorney Trilogy",
    "River City Girls 1+2": "River City Girls 2",
    "Rockman EXE Advanced Collection": "Mega Man Battle Network Legacy Collection",
    "Super Mario Galaxy 1 & 2": "Super Mario Galaxy 1 2",
    "Gravity Daze": "Gravity Rush",
    "Gravity Daze 2 [Limited Edition]": "Gravity Rush 2",
    "Danganronpa Decadence": "Danganronpa 1 2 Reload",
    "Super Mario Galaxy 1 & 2": "Super Mario Galaxy",
  };
  return String(aliases[value] || value || "")
    .replace(/\s*\[[^\]]+\]\s*/g, " ")
    .replace(/Pokémon/g, "Pokemon")
    .replace(/\s+/g, " ")
    .trim();
}

function gameKey(game) {
  return `${game.title}::${game.platform}`;
}

function parseCsv(text) {
  const lines = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      lines.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    lines.push(row);
  }
  const headers = lines.shift() || [];
  return lines.filter((values) => values.some(Boolean)).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
}

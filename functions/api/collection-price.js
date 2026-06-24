const API_URL = "https://www.pricecharting.com/api/product";
const SITE_URL = "https://www.pricecharting.com";

export async function onRequestGet({ request, env = {} }) {
  const url = new URL(request.url);
  const title = clean(url.searchParams.get("title"), 160);
  const platform = clean(url.searchParams.get("platform"), 80);
  const region = clean(url.searchParams.get("region"), 80);
  const currency = ["EUR", "USD"].includes(String(url.searchParams.get("currency") || "").toUpperCase()) ? String(url.searchParams.get("currency")).toUpperCase() : "EUR";
  const requestedId = cleanIdentifier(url.searchParams.get("id"));
  const requestedUpc = cleanIdentifier(url.searchParams.get("upc"));
  const requestedUrl = cleanPriceChartingUrl(url.searchParams.get("url"));
  const searchMode = url.searchParams.get("mode") === "search";
  if (!title && !requestedId && !requestedUpc && !requestedUrl) return json({ error: "Missing title, product id, UPC, or PriceCharting URL" }, 400);

  const query = [title, physicalRegionTerm(region), priceChartingPlatformTerm(platform)].filter(Boolean).join(" ");
  const searchUrl = `${SITE_URL}/search-products?type=prices&region-name=all&exclude-variants=false&q=${encodeURIComponent(requestedUpc || title || query)}`;
  const fallbackUrls = directProductUrls(title, platform, region);
  const token = env.PRICECHARTING_TOKEN || globalThis.process?.env?.PRICECHARTING_TOKEN || "";
  try {
    if (searchMode) {
      let results = rankCandidates(await fetchPublicCandidates(searchUrl), query);
      if (!results.length) results = rankCandidates(await fetchDirectCandidates(fallbackUrls, query, searchUrl), query);
      return json({ results: results.slice(0, 12), searchUrl, source: "PriceCharting" });
    }
    const apiProduct = token ? await fetchApiProduct(token, { id: requestedId, upc: requestedUpc, query }) : null;
    const [publicProduct, retailProduct] = await Promise.all([
      fetchPublicProduct({ query, searchUrl, requestedId: requestedId || apiProduct?.id || "", requestedUrl, fallbackUrls }),
      fetchXtralifeProduct({ title, platform, region }).catch(() => null),
    ]);
    const product = convertCurrency(mergeProduct(apiProduct, publicProduct, retailProduct, { title, platform, searchUrl }), currency, publicProduct?.forexRates);
    if (!product.productId && !Object.values(product.prices).some((value) => value != null)) {
      return json({ error: "No matching physical edition found", searchUrl, prices: {}, history: {} }, 404);
    }
    return json({ ...product, checkedAt: new Date().toISOString(), source: "PriceCharting", currency: product.currency || currency });
  } catch (error) {
    return json({ error: error?.message || "Physical edition lookup failed", searchUrl, prices: {}, history: {} }, 502);
  }
}

async function fetchXtralifeProduct({ title, platform, region }) {
  if (!title || !/spain|europe|united kingdom|france|germany|australia/i.test(region || "Spain")) return null;
  const endpoint = new URL("https://api.xtralife.com/public-api/v1/search-sku");
  endpoint.searchParams.set("term", title);
  endpoint.searchParams.set("filters", "[]");
  endpoint.searchParams.set("storefrontId", "1");
  endpoint.searchParams.set("page", "1");
  endpoint.searchParams.set("howMany", "24");
  const response = await fetch(endpoint, { headers: browserHeaders(), cf: { cacheTtl: 3600, cacheEverything: true } });
  if (!response.ok) return null;
  const data = await response.json();
  const products = (Array.isArray(data.body?.results) ? data.body.results : []).filter((product) => !product.isDigital && /fisico|physical/.test(normalize(characteristicValue(product, "formato") || "Físico")));
  const wantedTitle = normalize(title);
  const wantedPlatform = normalize(platform);
  const match = products.map((product, index) => {
    const productTitle = normalize(product.name);
    const productPlatform = normalize(`${product.cc1} ${characteristicValue(product, "platform")}`);
    const tokens = wantedTitle.split(" ").filter((token) => token.length > 1);
    const titleScore = tokens.filter((token) => productTitle.includes(token)).length / Math.max(1, tokens.length);
    const exactTitleBonus = productTitle === wantedTitle ? 0.35 : 0;
    return { product, compatible: physicalPlatformMatches(wantedPlatform, productPlatform), score: titleScore + exactTitleBonus + 0.25 - index * 0.002 };
  }).filter((entry) => entry.compatible && entry.score >= 0.95).sort((a, b) => b.score - a.score)[0]?.product;
  if (!match) return null;
  const genres = (match.characteristics || []).filter((item) => item.name === "genre").map((item) => String(item.value || "").trim()).filter(Boolean);
  return {
    retailer: "Xtralife",
    sku: String(match.id || ""),
    catalogNumber: characteristicValue(match, "ref-proveedor"),
    edition: characteristicValue(match, "editionName") || characteristicValue(match, "edition") || match.cc2 || "",
    regionName: characteristicValue(match, "region").trim(),
    releaseDate: isoDate(characteristicValue(match, "launchDate")),
    publisher: characteristicValue(match, "editor"),
    developer: characteristicValue(match, "desarrollador"),
    genre: genres.join(", "),
  };
}

function physicalPlatformMatches(wanted, found) {
  if (!wanted) return true;
  if (wanted === "switch") return /(^| )switch( |$)/.test(found) && !/switch 2/.test(found);
  if (wanted === "switch 2" || wanted === "switch2") return /switch 2/.test(found);
  if (/^ps[1-5]$/.test(wanted)) return found.includes(wanted);
  return found.includes(wanted);
}

function characteristicValue(product, name) {
  return String((product?.characteristics || []).find((item) => item.name === name)?.value || "");
}

async function fetchApiProduct(token, { id, upc, query }) {
  const endpoint = new URL(API_URL);
  endpoint.searchParams.set("t", token);
  if (id) endpoint.searchParams.set("id", id);
  else if (upc) endpoint.searchParams.set("upc", upc);
  else endpoint.searchParams.set("q", query);
  const response = await fetch(endpoint, { cf: { cacheTtl: 3600, cacheEverything: true } });
  if (!response.ok) return null;
  const data = await response.json();
  if (data.status && data.status !== "success") return null;
  return {
    productId: String(data.id || ""), productName: data["product-name"] || "", consoleName: data["console-name"] || "",
    releaseDate: isoDate(data["release-date"]), upc: String(data.upc || ""), asin: String(data.asin || ""),
    epid: String(data.epid || ""), genre: String(data.genre || ""),
    prices: { loose: cents(data["loose-price"]), complete: cents(data["cib-price"]), sealed: cents(data["new-price"]),
      graded: cents(data["graded-price"]), box: cents(data["box-only-price"]), manual: cents(data["manual-only-price"]) },
  };
}

async function fetchPublicCandidates(searchUrl) {
  const response = await fetch(searchUrl, { headers: browserHeaders(), cf: { cacheTtl: 3600, cacheEverything: true } });
  if (!response.ok) return [];
  return parseSearchCandidates(await response.text());
}

async function fetchPublicProduct({ query, searchUrl, requestedId, requestedUrl, fallbackUrls = [] }) {
  const candidates = requestedUrl ? [] : await fetchPublicCandidates(searchUrl);
  const candidate = requestedUrl ? { url: requestedUrl, productId: requestedId } : candidates.find((item) => requestedId && item.productId === requestedId) || bestCandidate(candidates, query);
  if (!candidate?.url && fallbackUrls.length) return (await fetchDirectCandidates(fallbackUrls, query, searchUrl))[0] || null;
  if (!candidate?.url) return candidate || null;
  const productResponse = await fetch(candidate.url, { headers: browserHeaders(), cf: { cacheTtl: 3600, cacheEverything: true } });
  if (!productResponse.ok) return candidate;
  const html = await productResponse.text();
  const chart = parseChart(html);
  return {
    ...candidate,
    productName: candidate.productName || attributeHeading(html),
    consoleName: candidate.consoleName || consoleNameFromProductUrl(candidate.url),
    releaseDate: isoDate(attributeValue(html, "Release Date")),
    upc: attributeValue(html, "UPC"), asin: attributeValue(html, "ASIN (Amazon)"), epid: attributeValue(html, "ePID (eBay)"),
    productId: attributeValue(html, "PriceCharting ID") || candidate.productId,
    genre: attributeValue(html, "Genre"), publisher: attributeValue(html, "Publisher"), rating: attributeValue(html, "ESRB Rating"),
    image: metaContent(html, "og:image") || itemImage(html), history: chart,
    prices: { ...(candidate.prices || {}), loose: priceCellById(html, "used_price") ?? candidate.prices?.loose, complete: priceCellById(html, "complete_price") ?? candidate.prices?.complete, sealed: priceCellById(html, "new_price") ?? candidate.prices?.sealed, graded: priceCellById(html, "graded_price") ?? candidate.prices?.graded, box: priceCellById(html, "boxonly_price") ?? candidate.prices?.box, manual: priceCellById(html, "manualonly_price") ?? candidate.prices?.manual },
    forexRates: parseForexRates(html),
  };
}

async function fetchDirectCandidates(urls, query, searchUrl) {
  const products = await Promise.all(urls.map((requestedUrl) => fetchPublicProduct({ query, searchUrl, requestedId: "", requestedUrl })));
  return products.filter((product) => product?.productId && product?.productName);
}

function parseSearchCandidates(html) {
  return [...String(html).matchAll(/<tr[^>]+id="product-(\d+)"[\s\S]*?<\/tr>/gi)].map((match) => {
    const row = match[0];
    const link = row.match(/href="(https:\/\/www\.pricecharting\.com\/(?:[a-z]{2}\/)?game\/[^"]+)"/i)?.[1] || "";
    const titleCell = row.match(/<td class="title">([\s\S]*?)<\/td>/i)?.[1] || "";
    const consoleCell = row.match(/<td class="console[^>]*>([\s\S]*?)<\/td>/i)?.[1] || "";
    const consoleName = text(consoleCell);
    const rawProductName = text(titleCell);
    return {
      productId: match[1], url: decodeHtml(link), productName: consoleName && rawProductName.endsWith(consoleName) ? rawProductName.slice(0, -consoleName.length).trim() : rawProductName, consoleName,
      prices: { loose: moneyCell(row, "used_price"), complete: moneyCell(row, "cib_price"), sealed: moneyCell(row, "new_price") },
    };
  });
}

function bestCandidate(candidates, query) {
  return rankCandidates(candidates, query)[0] || null;
}

function rankCandidates(candidates, query) {
  const wanted = normalize(query);
  return candidates.map((item, index) => {
    const value = normalize(`${item.productName} ${item.consoleName}`);
    const tokens = wanted.split(" ").filter((token) => token.length > 1 || /^\d$/.test(token));
    const overlap = tokens.filter((token) => value.includes(token)).length;
    return { item, score: overlap / Math.max(1, tokens.length) - index * 0.002 };
  }).sort((a, b) => b.score - a.score).map(({ item }) => item);
}

function parseChart(html) {
  const raw = String(html).match(/VGPC\.chart_data\s*=\s*(\{[\s\S]*?\});/)?.[1];
  if (!raw) return {};
  try {
    const data = JSON.parse(raw);
    return { loose: chartPoints(data.used), complete: chartPoints(data.cib), sealed: chartPoints(data.new),
      box: chartPoints(data.boxonly), manual: chartPoints(data.manualonly), graded: chartPoints(data.graded) };
  } catch { return {}; }
}

function chartPoints(points) {
  return (Array.isArray(points) ? points : []).filter((point) => Array.isArray(point) && point.length >= 2 && Number(point[1]) > 0)
    .slice(-60).map(([timestamp, value]) => ({ date: new Date(Number(timestamp)).toISOString().slice(0, 10), value: Number(value) / 100 }));
}

function mergeProduct(api, page, retail, fallback) {
  const prices = { ...(page?.prices || {}), ...(withoutNulls(api?.prices || {})) };
  const history = page?.history || {};
  return {
    productId: api?.productId || page?.productId || "", productName: api?.productName || page?.productName || fallback.title,
    consoleName: api?.consoleName || page?.consoleName || fallback.platform, releaseDate: retail?.releaseDate || api?.releaseDate || page?.releaseDate || "",
    upc: api?.upc || page?.upc || "", asin: api?.asin || page?.asin || "", epid: api?.epid || page?.epid || "",
    sku: retail?.sku || "", catalogNumber: retail?.catalogNumber || "", edition: retail?.edition || "", regionName: retail?.regionName || "",
    genre: api?.genre || page?.genre || retail?.genre || "", publisher: page?.publisher || retail?.publisher || "", developer: retail?.developer || "", rating: page?.rating || "", image: page?.image || "",
    prices, history, mainValue: prices.sealed ?? prices.complete ?? prices.loose ?? prices.graded ?? null,
    productUrl: page?.url || "", searchUrl: fallback.searchUrl, retailer: retail?.retailer || "",
  };
}

function convertCurrency(product, currency, rates = {}) {
  if (currency === "USD") return { ...product, currency: "USD" };
  const rate = Number(rates?.[currency]);
  if (!Number.isFinite(rate) || rate <= 0) return { ...product, currency: "USD" };
  const convert = (value) => value == null ? null : Math.round(Number(value) * rate * 100) / 100;
  const prices = Object.fromEntries(Object.entries(product.prices || {}).map(([key, value]) => [key, convert(value)]));
  const history = Object.fromEntries(Object.entries(product.history || {}).map(([key, points]) => [key, (points || []).map((point) => ({ ...point, value: convert(point.value) }))]));
  return { ...product, prices, history, mainValue: convert(product.mainValue), currency };
}

function attributeValue(html, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = String(html).match(new RegExp(`<td[^>]*class="title"[^>]*>\\s*${escaped}:?\\s*<\\/td>\\s*<td[^>]*class="details"[^>]*>([\\s\\S]*?)<\\/td>`, "i"));
  return text(match?.[1] || "").replace(/^none$/i, "");
}
function attributeHeading(html) { return text(String(html).match(/<div id="full_details"[\s\S]*?<h2>([\s\S]*?)<\/h2>/i)?.[1] || "").replace(/\s*\([^)]*\)\s*(?:Details|Detalles)\s*$/i, ""); }
function metaContent(html, property) { return decodeHtml(String(html).match(new RegExp(`<meta[^>]+property="${property}"[^>]+content="([^"]+)"`, "i"))?.[1] || ""); }
function itemImage(html) { return decodeHtml(String(html).match(/<img[^>]+src=['"]([^'"]+)['"][^>]+itemprop=['"]image['"]/i)?.[1] || ""); }
function priceCellById(html, id) { const cell = String(html).match(new RegExp(`<td[^>]+id="${id}"[^>]*>([\\s\\S]*?)<\\/td>`, "i"))?.[1] || ""; const value = text(cell).match(/(?:\$|€|£)\s*([\d,.]+)/)?.[1]?.replace(/,/g, ""); const number = Number(value); return Number.isFinite(number) && number > 0 ? number : null; }
function parseForexRates(html) { try { return JSON.parse(String(html).match(/VGPC\.forex_rates\s*=\s*(\{[^;]+\})/)?.[1] || "{}"); } catch { return {}; } }
function moneyCell(row, className) { const cell = row.match(new RegExp(`<td[^>]+class="[^"]*${className}[^"]*"[^>]*>([\\s\\S]*?)<\\/td>`, "i"))?.[1] || ""; const value = text(cell).replace(/[^0-9.]/g, ""); const number = Number(value); return Number.isFinite(number) && number > 0 ? number : null; }
function cents(value) { const number = Number(value); return Number.isFinite(number) && number > 0 ? number / 100 : null; }
function withoutNulls(value) { return Object.fromEntries(Object.entries(value).filter(([, item]) => item != null)); }
function physicalRegionTerm(region) { const value = normalize(region); if (/japan|jp/.test(value)) return "JP"; if (/spain|europe|france|germany|united kingdom|uk|australia/.test(value)) return "PAL"; if (/united states|usa|ntsc/.test(value)) return "NTSC"; if (/taiwan|asia/.test(value)) return "Asian English"; return ""; }
function priceChartingPlatformTerm(platform) { const value = normalize(platform); const playstation = value.match(/^(?:ps|playstation)\s*([1-5])$/); if (playstation) return `Playstation ${playstation[1]}`; if (value === "switch") return "Nintendo Switch"; if (value === "switch 2") return "Nintendo Switch 2"; if (value === "xone") return "Xbox One"; if (value === "x360") return "Xbox 360"; return platform; }
function directProductUrls(title, platform, region) { const titleSlug = slug(title); const consoleSlug = slug(priceChartingPlatformTerm(platform)); if (!titleSlug || !consoleSlug) return []; const prefix = physicalRegionTerm(region) === "PAL" ? "pal-" : physicalRegionTerm(region) === "JP" ? "jp-" : ""; return [...new Set([`${SITE_URL}/game/${prefix}${consoleSlug}/${titleSlug}`, `${SITE_URL}/game/${consoleSlug}/${titleSlug}`])]; }
function slug(value) { return normalize(value).replace(/\s+/g, "-"); }
function isoDate(value) { const textValue = String(value || "").trim(); if (!textValue) return ""; const leadingDate = textValue.match(/^\d{4}-\d{2}-\d{2}/)?.[0]; if (leadingDate) return leadingDate; const date = new Date(`${textValue} UTC`); return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10); }
function text(value) { return decodeHtml(String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()); }
function decodeHtml(value) { return String(value || "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#43;/g, "+").replace(/&nbsp;/g, " "); }
function normalize(value) { return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim(); }
function clean(value, max) { return String(value || "").trim().slice(0, max); }
function cleanIdentifier(value) { return String(value || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64); }
function cleanPriceChartingUrl(value) { try { const url = new URL(String(value || "")); return url.hostname === "www.pricecharting.com" && /^\/(?:[a-z]{2}\/)?game\//i.test(url.pathname) ? `${url.origin}${url.pathname}` : ""; } catch { return ""; } }
function consoleNameFromProductUrl(value) { try { const parts = new URL(value).pathname.split("/").filter(Boolean); const gameIndex = parts.indexOf("game"); const slug = parts[gameIndex + 1] || ""; return slug.split("-").map((part, index) => index === 0 && ["pal", "jp"].includes(part) ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1)).join(" "); } catch { return ""; } }
function browserHeaders() { return { "Accept": "text/html,application/xhtml+xml", "Accept-Language": "en-US,en;q=0.9", "User-Agent": "Mozilla/5.0 (compatible; GamelistShelf/1.0)" }; }
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=900" } }); }

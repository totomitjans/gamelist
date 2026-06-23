const API_URL = "https://www.pricecharting.com/api/product";

export async function onRequestGet({ request, env = {} }) {
  const url = new URL(request.url);
  const title = String(url.searchParams.get("title") || "").trim().slice(0, 160);
  const platform = String(url.searchParams.get("platform") || "").trim().slice(0, 80);
  const token = env.PRICECHARTING_TOKEN || globalThis.process?.env?.PRICECHARTING_TOKEN || "";
  const searchUrl = `https://www.pricecharting.com/search-products?type=prices&q=${encodeURIComponent(`${title} ${platform}`.trim())}`;
  if (!title) return json({ error: "Missing title" }, 400);
  if (!token) return json({ needsSetup: true, searchUrl, prices: {} });
  try {
    const endpoint = new URL(API_URL);
    endpoint.searchParams.set("t", token);
    endpoint.searchParams.set("q", `${title} ${platform}`.trim());
    const response = await fetch(endpoint, { cf: { cacheTtl: 3600, cacheEverything: true } });
    if (!response.ok) throw new Error(`PriceCharting request failed (${response.status})`);
    const data = await response.json();
    const prices = { loose: cents(data.loose_price), complete: cents(data.cib_price), sealed: cents(data.new_price), graded: cents(data.graded_price) };
    return json({ productName: data["product-name"] || title, consoleName: data["console-name"] || platform,
      productId: data.id || "", prices, mainValue: prices.sealed ?? prices.complete ?? prices.loose ?? prices.graded ?? null,
      searchUrl, checkedAt: new Date().toISOString() });
  } catch (error) {
    return json({ error: error.message, searchUrl, prices: {} }, 502);
  }
}

function cents(value) { const number = Number(value); return Number.isFinite(number) && number > 0 ? number / 100 : null; }
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } }); }

const ALLOWED_HOST = "howlongtobeat.com";

export async function onRequestGet({ request }) {
  const source = new URL(request.url).searchParams.get("src") || "";
  let url;
  try {
    url = new URL(source);
  } catch {
    return new Response("Invalid cover URL", { status: 400 });
  }
  if (url.protocol !== "https:" || url.hostname !== ALLOWED_HOST || !url.pathname.startsWith("/games/")) {
    return new Response("Cover source not allowed", { status: 403 });
  }
  const response = await fetch(url, {
    headers: {
      Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      Referer: "https://howlongtobeat.com/",
      "User-Agent": "Mozilla/5.0 (compatible; GamelistCoverShelf/1.0)",
    },
  });
  if (!response.ok) return new Response("Cover unavailable", { status: 502 });
  return new Response(response.body, {
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "image/jpeg",
      "Cache-Control": "public, max-age=604800, s-maxage=2592000",
    },
  });
}

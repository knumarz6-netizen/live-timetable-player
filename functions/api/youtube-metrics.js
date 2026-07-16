const CONFIG_KEY = "stage-config";
const CACHE_TTL_SECONDS = 60;

export const onRequestGet = async (context) => {
  const cache = getEdgeCache();
  const cacheKey = cache ? createCacheKey(context.request) : null;
  const cachedResponse = cacheKey ? await cache.match(cacheKey) : null;

  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await createMetricsResponse(context.env);

  if (cacheKey) {
    const cacheWrite = cache.put(cacheKey, response.clone());
    if (typeof context.waitUntil === "function") {
      context.waitUntil(cacheWrite);
    } else {
      await cacheWrite;
    }
  }

  return response;
};

async function createMetricsResponse(env) {
  const videoIds = await getConfiguredVideoIds(env);
  const apiKey = env?.YOUTUBE_API_KEY;

  if (!apiKey || videoIds.length === 0) {
    return Response.json(
      { metrics: {}, available: false },
      { headers: cacheHeaders() },
    );
  }

  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.searchParams.set("part", "statistics,liveStreamingDetails");
    url.searchParams.set("id", videoIds.join(","));
    url.searchParams.set("key", apiKey);

    const response = await fetch(url);
    if (!response.ok) {
      return Response.json(
        { metrics: {}, available: false },
        { status: 200, headers: cacheHeaders() },
      );
    }

    const payload = await response.json();
    const metrics = Object.fromEntries(
      (Array.isArray(payload?.items) ? payload.items : []).map((video) => [
        video.id,
        {
          concurrentViewers: toNonNegativeInteger(video.liveStreamingDetails?.concurrentViewers),
          viewCount: toNonNegativeInteger(video.statistics?.viewCount),
        },
      ]),
    );

    return Response.json({ metrics, available: true }, { headers: cacheHeaders() });
  } catch {
    return Response.json(
      { metrics: {}, available: false },
      { status: 200, headers: cacheHeaders() },
    );
  }
}

function getEdgeCache() {
  return typeof caches !== "undefined" ? caches.default : null;
}

function createCacheKey(request) {
  const url = new URL(request.url);
  url.pathname = "/api/youtube-metrics/cache";
  url.search = "";
  return new Request(url.toString());
}

async function getConfiguredVideoIds(env) {
  if (!env?.STAGE_CONFIG) {
    return [];
  }

  try {
    const config = await env.STAGE_CONFIG.get(CONFIG_KEY, { type: "json" });
    return [...new Set(
      ["neo", "void", "echo"]
        .map((stageId) => extractVideoId(config?.[stageId]?.youtubeUrl))
        .filter(Boolean),
    )];
  } catch {
    return [];
  }
}

function extractVideoId(urlOrId) {
  if (typeof urlOrId !== "string") {
    return null;
  }

  const input = urlOrId.trim();
  if (/^[\w-]{11}$/.test(input)) {
    return input;
  }

  try {
    const url = new URL(input);
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.replace(/^\/+/, "").slice(0, 11) || null;
    }
    if (url.hostname.includes("youtube.com")) {
      return url.searchParams.get("v")?.slice(0, 11) ?? null;
    }
  } catch {
    return null;
  }

  return null;
}

function toNonNegativeInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : null;
}

function cacheHeaders() {
  return {
    "Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}, s-maxage=${CACHE_TTL_SECONDS}`,
  };
}

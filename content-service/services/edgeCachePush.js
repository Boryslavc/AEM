const { logger } = require("../logs/pinoLogger");

const EDGE_CACHE_URL = process.env.EDGE_CACHE_URL || "";
const INTERNAL_SECRET = process.env.EDGE_CACHE_INTERNAL_SECRET || "";

/**
 * Push updated page content to edge-cache so subsequent GETs can be served from cache.
 * No-op if EDGE_CACHE_URL is not set. Fire-and-forget; does not block the response.
 */
function pushPageToEdgeCache(path, payload) {
    if (!EDGE_CACHE_URL) return;
    const url = `${EDGE_CACHE_URL.replace(/\/$/, "")}/internal/cache`;
    const headers = {
        "Content-Type": "application/json",
        ...(INTERNAL_SECRET && { "X-Internal-Secret": INTERNAL_SECRET })
    };
    fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ path, ...payload })
    }).then((res) => {
        if (!res.ok) {
            logger.warn({ path, status: res.status }, "Edge cache push failed");
        }
    }).catch((err) => {
        logger.warn({ err, path }, "Edge cache push error");
    });
}

module.exports = { pushPageToEdgeCache };

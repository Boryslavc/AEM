const express = require("express");
const router = express.Router();
const cache = require("../cache/memoryCache");
const { buildGetCacheKeyForPath } = require("../utils/cacheKey");
const parseTTL = require("../utils/parseTTL");

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || "";

function checkInternalAuth(req, res, next) {
    if (INTERNAL_SECRET && req.get("X-Internal-Secret") !== INTERNAL_SECRET) {
        return res.status(403).json({ error: "Forbidden" });
    }
    next();
}

/**
 * POST /internal/cache
 * Body: { path, data, etag, lastModified?, cacheControl? }
 * Called by content-service after create/update to push new content into edge cache.
 */
router.post("/cache", checkInternalAuth, (req, res) => {
    const { path, data, etag, lastModified, cacheControl } = req.body || {};
    if (!path || data === undefined) {
        return res.status(400).json({ error: "Missing path or data" });
    }
    const ttlMs = parseTTL(cacheControl || "max-age=300");
    const key = buildGetCacheKeyForPath(path, "");
    cache.set(key, {
        data,
        expiresAt: Date.now() + ttlMs,
        etag: etag || null,
        lastModified: lastModified || null
    });
    res.status(201).json({ message: "Cache updated", path });
});

module.exports = router;

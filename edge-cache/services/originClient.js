const axios = require("axios");
const cache = require('../cache/memoryCache');
const buildCacheKey = require('../utils/cacheKey');
const { isCacheable, getTTL } = require('../config/cacheRules');

const BASE_URL = process.env.ORIGIN || "http://localhost:3000";

async function handleRequest(req, res) {
    if (!isCacheable(req)) {
        const response = await sendRequestToOrigin(req);
        return res.status(response.status).send(response.data);
    }

    const cacheKey = buildCacheKey(req);
    const cached = cache.get(cacheKey);

    // Cache HIT
    if (cached && cached.expiresAt > Date.now()) {
        res.set('X-Cache', 'HIT');
        return res.status(200).send(cached.data);
    }

    // Cache EXPIRED -> revalidate
    if (cached && cached.expiresAt <= Date.now()) {
        const response = await sendRequestToOrigin(req, {
            'If-None-Match': cached.etag,
            'If-Modified-Since': cached.lastModified
        });

        if (response.status === 304) {
            // Content unchanged, refresh TTL
            cached.expiresAt = Date.now() + getTTL(req);
            res.set('X-Cache', 'REVALIDATED');
            return res.status(200).send(cached.data);
        }

        // Content changed, update cache
        const data = buildCacheData(req, response);
        cache.set(cacheKey, data);
        res.set('X-Cache', 'EXPIRED');
        return res.status(response.status).send(response.data);
    }

    // Cache MISS (no cached entry)
    const response = await sendRequestToOrigin(req);
    const data = buildCacheData(req, response);
    cache.set(cacheKey, data);
    res.set('X-Cache', 'MISS');
    return res.status(response.status).send(response.data);
}

async function sendRequestToOrigin(req, conditionalHeaders = {}) {
    const response = await axios.get(`${BASE_URL}${req.originalUrl}`, {
        headers: conditionalHeaders,
        validateStatus: (status) => status < 500
    });
    return response;
}

function buildCacheData(request, response){
    const expirationDate = getTTL(request) + Date.now();
    const data = {
        data: response.data,
        expiresAt: expirationDate,
        etag: response.headers['etag'],
        lastModified: response.headers['last-modified']
    };
    return data;
}

module.exports = { handleRequest };
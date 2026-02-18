const axios = require("axios");
const cache = require('../cache/memoryCache');
const buildCacheKey = require('../utils/cacheKey');
const { isCacheable } = require('../config/cacheRules');
const parseTTL = require('../utils/parseTTL');

const BASE_URL = process.env.ORIGIN || "http://localhost:3000";

async function handleRequest(req, res) {
    if (!isCacheable(req)) {
        const response = await sendRequestToOrigin(req);
        if (response.status >= 200 && response.status < 300 && ['PUT', 'POST', 'DELETE'].includes(req.method)) {
            cache.delByPrefix(`GET:${req.originalUrl}:lang=`);
        }
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
            // Content unchanged, refresh TTL (use origin's Cache-Control from response)
            cached.expiresAt = Date.now() + parseTTL(response.headers['cache-control']);
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
    const url = `${BASE_URL}${req.originalUrl}`;
    const hasConditional = Object.keys(conditionalHeaders).length > 0;
    const method = hasConditional ? 'GET' : req.method;
    const headers = { ...conditionalHeaders };
    if (req.get('Content-Type')) headers['Content-Type'] = req.get('Content-Type');
    const config = {
        method,
        url,
        headers,
        validateStatus: (status) => status < 500
    };
    if ((method === 'PUT' || method === 'POST') && req.body !== undefined) {
        config.data = req.body;
    }
    const response = await axios(config);
    return response;
}

function buildCacheData(request, response){
    const expirationDate = Date.now() + parseTTL(response.headers['cache-control']);
    const data = {
        data: response.data,
        expiresAt: expirationDate,
        etag: response.headers['etag'],
        lastModified: response.headers['last-modified']
    };
    return data;
}

module.exports = { handleRequest };
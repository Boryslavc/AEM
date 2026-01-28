const axios = require("axios");
const cache = require('../cache/memoryCache');
const buildCacheKey = require('../utils/cacheKey');
const { isCacheable, getTTL } = require('../config/cacheRules');

const BASE_URL = process.env.ORIGIN || "http://localhost:3000";

async function handleRequest(req, res){
    const cacheKey = buildCacheKey(req);
    if(isCacheable(req)){
        const cached = cache.get(cacheKey);
        if(cached){
            console.log("Cache Hit");
            res.set(cached.headers);
            res.set('X-Cache', 'HIT');
            return res.status(cached.status).send(cached.data);
        }
    }

    try{
        const response = await axios.get(
            `${BASE_URL}${req.originalUrl}`
        );
        if(isCacheable(req)){
            const data = buildCacheData(req, response);
            cache.set(cacheKey, data);
        }
        res.set("X-Cache", "MISS");
        console.log("Cache miss");
        res.status(response.status).send(response.data);
    }
    catch(err){
        res.status(502).json({ error: 'Bad Gateway' });
    }
}

function buildCacheData(request, response){
    const expirationDate = getTTL(request) + Date.now();
    const data = {
        headers: response.headers,
        status: response.status,
        data: response.data,
        expiresAt: expirationDate
    };
    return data;
}

module.exports = { handleRequest };
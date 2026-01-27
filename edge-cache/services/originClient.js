const axios = require("axios");
const cache = require('../cache/memoryCache');
const buildCacheKey = require('../utils/cacheKey');
const { isCacheable, getTTL } = require('../config/cacheRules');

const BASE_URL = process.env.ORIGIN || "http://localhost:3000";

async function handleRequest(req, res){
    console.log("Started handling request");
    const cacheKey = buildCacheKey(req);

    if(isCacheable(req)){
        const cached = cache.get(req);
        if(cached){
            console.log("Was cached");
            res.set(cached.headers);
            res.set('X-Cache', 'HIT');
            return res.status(cached.status).send(cached.body);
        }
    }

    try{
        console.log("Sending request to content service " + `${BASE_URL}${req.originalUrl}`)
        const response = await axios.get(
            `${BASE_URL}${req.originalUrl}`
        );

        if(isCacheable(req)){
            const expirationDate = getTTL(req);
            cache.set(cacheKey,{
                headers: response.headers,
                status: response.status,
                data: response.data,
                expiresAt: expirationDate
            })
        }
        res.set("X-Cache", "MISS");
        res.status(response.status).send(response.data);
    }
    catch(err){
        res.status(502).json({ error: 'Bad Gateway' });
    }
}

module.exports = { handleRequest };
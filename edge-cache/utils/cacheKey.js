function buildCacheKey(req){
    const lang = req.headers['accept-language'] || '';
    return `${req.method}:${req.originalUrl}:lang=${lang}`;
}

module.exports = buildCacheKey;
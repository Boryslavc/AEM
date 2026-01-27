function buildCacheKey(req){
    const lang = req.headers['accept-language'] || '';
    return `${req.method}:${req.originalURL}:lang=${lang}`;
}

module.exports = buildCacheKey;
function buildCacheKey(req){
    const lang = req.headers['accept-language'] || '';
    return `${req.method}:${req.originalUrl}:lang=${lang}`;
}

/** Build cache key for a GET request to the given path (used for invalidation and cache push). */
function buildGetCacheKeyForPath(path, acceptLanguage = '') {
    return `GET:${path}:lang=${acceptLanguage}`;
}

module.exports = buildCacheKey;
module.exports.buildGetCacheKeyForPath = buildGetCacheKeyForPath;
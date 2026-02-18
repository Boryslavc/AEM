function parseTTL(cacheControlHeader) {
    if (!cacheControlHeader) return 300000;
    const sMaxAge = /s-maxage=(\d+)/.exec(cacheControlHeader);
    if (sMaxAge) return parseInt(sMaxAge[1], 10) * 1000;
    const maxAge = /max-age=(\d+)/.exec(cacheControlHeader);
    if (maxAge) return parseInt(maxAge[1], 10) * 1000;
    return 300000;
}

module.exports = parseTTL;

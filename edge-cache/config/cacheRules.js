function isCacheable(req){
    if(req.method !== "GET") return false;
    if(req.originalUrl.startsWith("/health")) return false;
    return true;
}

module.exports= {isCacheable};
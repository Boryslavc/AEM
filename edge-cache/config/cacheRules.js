function isCacheable(req){
    if(req.method !== "GET") return false;
    if(req.originalUrl.startsWith("/health")) return false;
    return true;
}

function getTTL(req){
    if(req.originalUrl.startsWith("/content")) return 60_000;
    return 5000;
}

module.exports= {isCacheable, getTTL};
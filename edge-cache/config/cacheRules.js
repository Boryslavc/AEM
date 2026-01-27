function isCacheable(req){
    if(req.method !== "Get") return false;
    if(req.originalURL.startsWith("/health")) return false;
    return true;
}

function getTTL(req){
    if(req.originalURL.startsWith("/content")) return 60_000;
    return 5000;
}

module.exports= {isCacheable, getTTL};
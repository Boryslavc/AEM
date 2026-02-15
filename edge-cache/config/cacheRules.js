function isCacheable(req){
    if(req.method !== "GET") return false;
    if(req.originalUrl.startsWith("/health")) return false;
    return true;
}

function getTTL(req){
    if(req.originalUrl.includes("/pages/")) return 300_000;
    if(req.originalUrl.includes("/assets/")) return 86400_000;
    return 5000;
}

module.exports= {isCacheable, getTTL};
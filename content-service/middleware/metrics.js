const metrics = {
    totalRequests: 0,
    totalLatency: 0
};

module.exports = function (req, res, next) {
    const start = Date.now();

    res.on('finish', () => {
        metrics.totalRequests++;
        metrics.totalLatency += (Date.now() - start);
    });

    next();
};

// TODO: 
// Optional: expose metrics endpoint
// GET /metrics -> average latency, total requests

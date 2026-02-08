const pino = require("pino");
const pino_http = require("pino-http");

const coreLogger = pino({
    level:"info",

    timestamp: pino.stdTimeFunctions.isoTime,
    
    // To remove noise from log output
    base: null,
    serializers:{
        res: () => {},
        req: () => {}
    }
});

const pinoLogger = pino_http({
    logger: coreLogger,
    
    autoLogging: {
        ignore: (req) => req.url === '/health'
    },

    customProps: (req, res) => {
        if(res.writableFinished || res.headersSent){
        return{
            url: req.originalUrl,
            responseTime: res.responseTime,
            status: res.statusCode,
            cache: res.getHeader("X-Cache") || "N/A",
            } 
        }
        return {};
    },

    //Remove default message noise
    customSuccessMessage: () => "",

    serializers: {
        req: () => {},
        res: () => {}
    },
});

module.exports = { 
    logger: coreLogger,
    httpLogger: pinoLogger
};
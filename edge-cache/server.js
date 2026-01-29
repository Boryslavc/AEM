const express = require("express");
const app = express();

const proxyRoute = require("./routes/proxy");
const pinoLogger = require("./logs/pinoLogger");
const { handleRequest } = require('./services/originClient');
const { handleError } = require("./utils/errorHandler");

require("dotenv").config({ path: "./config/.env" });

const PORT = process.env.PORT || 4000;
const ORIGIN = process.env.ORIGIN || 'http://localhost:3000';

app.use(pinoLogger);
app.use("/", proxyRoute);

app.use((err, req, res, next) =>{
    console.error(err.stack);
    res.status(500).send("Something broke!");
});

app.listen(PORT, () => console.log(`Edge Cache listening on port ${PORT}!`));
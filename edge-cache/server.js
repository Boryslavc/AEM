const express = require("express");
const app = express();

//const proxyRoute = require("./routes/proxy");
const requestLogger = require("./middleware/requestLogger");
const { handleRequest } = require('./services/originClient');

require("dotenv").config({ path: "./config/.env" });
const PORT = process.env.PORT || 4000;
const ORIGIN = process.env.ORIGIN || 'http://localhost:3000';

app.use(requestLogger);
app.use("/",handleRequest);

app.listen(PORT, () => console.log(`Edge Cache listening on port ${PORT}!`));
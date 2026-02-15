require("dotenv").config();

const express = require("express");
const app = express();

const proxyRoute = require("./routes/proxy");
const pinoLogger = require("./logs/pinoLogger");

const PORT = process.env.PORT || 4000;

app.use(pinoLogger);
app.use("/", proxyRoute);

app.use((err, req, res, next) =>{
    console.error(err.stack);
    res.status(500).send(`Something broke! ${err.message}`);
});

app.listen(PORT, () => console.log(`Edge Cache listening on port ${PORT}!`));
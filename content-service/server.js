require("dotenv").config();

const express = require("express");
const app = express();
const routes = require("./routes/content");
const { httpLogger } = require("./logs/pinoLogger");
const { initDatabase } = require("./db/init");

const PORT = process.env.PORT || 3000;


app.use(express.json());
app.use(httpLogger);


app.use("/", routes);

app.get("/health", (req, res)=> res.json({status: "UP"}));

app.use((err, req, res, next) => {
    res.status(500).send(`Something broke! Error: ${err.message}`);
    }
)

initDatabase()
    .then(() => {
        app.listen(PORT, () => console.log(`Content service listening on port ${PORT}`));
    })
    .catch(err => {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    });
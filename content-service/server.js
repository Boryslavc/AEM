const express = require("express");
const app = express();
const routes = require("./routes/content");
const logger = require("./logs/pinoLogger");

const PORT = process.env.PORT || "3000";


app.use(express.json());
app.use(logger);


app.use("/content", routes);

app.get("/health", (req, res)=> res.json({status: "UP"}));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
    }
)

app.listen(PORT, () => console.log(`Content service listening on port ${PORT}`));
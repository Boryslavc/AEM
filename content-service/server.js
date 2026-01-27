const express = require("express");
const app = express();
const routes = require("./routes/content");
const logger = require("./middleware/logger");
const metrics = require("./middleware/metrics");

const PORT = process.env.PORT || "3000";

app.use(express.json());
app.use(logger);
app.use(metrics);

app.use("/content", routes);

app.get("/health", (req, res)=> res.json({status: "UP"}));

app.listen(PORT, () => console.log(`Content service listening on port ${PORT}`));
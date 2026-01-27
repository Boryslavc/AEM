const express = require("express");
const router = express.Router();
const { handleRequest } = require('../services/originClient');

//Allow all incoming get request
router.get("/:all", handleRequest);

module.exports = router;
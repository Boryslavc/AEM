const express = require("express");
const router = express.Router();
const { handleRequest } = require('../services/originClient');

router.all("/pages", handleRequest);



module.exports = router;
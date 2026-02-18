const express = require("express");
const router = express.Router();
const { handleRequest } = require('../services/originClient');

router.all("/*splat", handleRequest);



module.exports = router;
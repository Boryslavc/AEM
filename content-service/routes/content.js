const express = require("express");
const router = express.Router();
const contentController = require("../controllers/contentController");

router.get("/:contentType?", contentController.getContent);

module.exports = router;
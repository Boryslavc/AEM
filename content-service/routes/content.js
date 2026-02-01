const express = require("express");
const router = express.Router();
const contentController = require("../controllers/contentController");

router.get("/:contentType/:contentName/:version", contentController.getContent);
router.post("/", contentController.createPage);
router.post("/:contentType/:contentName/versions", contentController.createVersion);
router.delete("/:contentType/:contentName", contentController.deletePage);

module.exports = router;
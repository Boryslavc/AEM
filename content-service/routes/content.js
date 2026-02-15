const express = require("express");
const router = express.Router();
const pageController = require("../controllers/pageController");
const assetController = require("../controllers/assetController");

router.get("/pages/:client/:lang/:pageName", pageController.getPage);
router.post("/pages/:client/:lang/:pageName", pageController.createPage);
router.put("/pages/:client/:lang/:pageName", pageController.updatePage);
router.delete("/pages/:client/:lang/:pageName", pageController.deletePage);

router.get("/assets/:assetName", assetController.getAsset);

module.exports = router;
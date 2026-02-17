const express = require("express");
const router = express.Router();
const pageController = require("../controllers/pageController");
const assetController = require("../controllers/assetController");

router.get("/pages/:client/:lang/:version/:pageName", pageController.getPage);
router.post("/pages/:client/:lang/:version/:pageName", pageController.createPage);
router.put("/pages/:client/:lang/:version/:pageName", pageController.updatePage);
router.delete("/pages/:client/:lang/:version/:pageName", pageController.deletePage);

router.get("/assets/:assetName", assetController.getAsset);

module.exports = router;
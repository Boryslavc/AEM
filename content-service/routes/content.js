const express = require("express");
const router = express.Router();
const pageController = require("../controllers/pageController");

router.get("/pages/:client/:lang/:version/:pageName", pageController.getPage);
router.post("/pages/:client/:lang/:version/:pageName", pageController.createPage);
router.put("/pages/:client/:lang/:version/:pageName", pageController.updatePage);
router.delete("/pages/:client/:lang/:version/:pageName", pageController.deletePage);

module.exports = router;

const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const { runTask } = require("../utils/taskQueue");

const assetsPath = path.join(__dirname, "../data/assets");

function getAsset(req, res) {
    const { assetName } = req.params;
    
    runTask(async () => {
        const filePath = path.join(assetsPath, assetName);
        
        if (!fsSync.existsSync(filePath)) {
            return res.status(404).send("Asset not found");
        }
        
        res.set("Content-Type", "text/css");
        res.set("Cache-Control", "max-age=86400");
        res.sendFile(filePath);
    }).catch(() => res.status(500).send("Server error"));
}

module.exports = { getAsset };

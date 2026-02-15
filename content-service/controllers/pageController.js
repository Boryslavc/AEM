const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const { runTask } = require("../utils/taskQueue");

const pagesPath = path.join(__dirname, "../data/pages");

function getPage(req, res) {
    const { client, lang, pageName } = req.params;
    
    runTask(async () => {
        const filePath = path.join(pagesPath, client, lang, `${pageName}.html`);
        const metaPath = path.join(pagesPath, client, lang, `${pageName}.meta.json`);
        
        if (!fsSync.existsSync(filePath)) {
            return res.status(404).send("Page not found");
        }
        
        const html = await fs.readFile(filePath, "utf-8");
        
        if (fsSync.existsSync(metaPath)) {
            const meta = JSON.parse(await fs.readFile(metaPath, "utf-8"));
            res.set("Cache-Control", meta.cacheControl);
            res.set("Last-Modified", new Date(meta.lastModified).toUTCString());
            res.set("ETag", meta.etag);
        } else {
            res.set("Cache-Control", "max-age=300");
        }
        
        res.set("Content-Type", "text/html");
        res.set("X-Client", client);
        res.set("X-Language", lang);
        res.send(html);
    }).catch(() => res.status(500).send("Server error"));
}

function createPage(req, res) {
    res.status(501).send("Not implemented");
}

function updatePage(req, res) {
    res.status(501).send("Not implemented");
}

function deletePage(req, res) {
    res.status(501).send("Not implemented");
}

module.exports = { getPage, createPage, updatePage, deletePage };

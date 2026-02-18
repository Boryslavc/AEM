const pool = require('../db/pool');
const { runTask } = require("../utils/taskQueue");
const { logger } = require("../logs/pinoLogger");
const { pushPageToEdgeCache } = require("../services/edgeCachePush");

function getPage(req, res) {
    runTask(async () => {
        const { client, lang, version, pageName } = req.params;
        
        const result = await pool.query(
            'SELECT * FROM pages WHERE client = $1 AND language = $2 AND version = $3 AND page_name = $4',
            [client, lang, version, pageName]
        );

        if (result.rows.length === 0) {
            return res.status(404).send("Page not found");
        }

        const page = result.rows[0];
        
        res.set('Cache-Control', page.cache_control);
        res.set('ETag', page.etag);
        res.set('Last-Modified', page.last_modified.toUTCString());
        res.set("Content-Type", "text/html");
        res.set("X-Client", client);
        res.set("X-Language", lang);
        res.set("X-Version", version);
        res.send(page.html_content);
    }).catch(err => {
        logger.error({ err, params: req.params }, 'Failed to read page');
        if(!res.headersSent) 
            res.status(500).send("Server error");
    });
}

function createPage(req, res) {
    runTask(async () => {
        const { client, lang, version, pageName } = req.params;

        if(!req.body || !req.body.html)
            return res.status(400).send("Missing html body");

        const timestamp = Date.now();
        const cacheControl = req.get("Cache-Control") || "max-age=300";
        const etag = `"${client}-${lang}-${version}-${pageName}-${timestamp}"`;

        try {
            await pool.query(
                `INSERT INTO pages (client, language, version, page_name, html_content, cache_control, etag)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [client, lang, version, pageName, req.body.html, cacheControl, etag]
            );

            logger.info({ client, lang, version, pageName }, "Page created successfully");
            const path = `/pages/${client}/${lang}/${version}/${pageName}`;
            pushPageToEdgeCache(path, {
                data: req.body.html,
                etag,
                lastModified: new Date().toUTCString(),
                cacheControl
            });
            res.status(201).json({ 
                message: "Page created", 
                path: `/${client}/${lang}/${version}/${pageName}` 
            });
        } catch(err) {
            if(err.code === '23505') {
                return res.status(400).send("Page already exists");
            }
            throw err;
        }
    }).catch(err => {
        logger.error({ err, params: req.params }, 'Failed to create page');
        if (!res.headersSent) {
            res.status(500).send("Server error");
        }
    });
}

function updatePage(req, res) {
    runTask(async () => {
        const { client, lang, version, pageName } = req.params;

        if (!req.body || !req.body.html) {
            return res.status(400).send("Missing HTML content");
        }

        const timestamp = Date.now();
        const etag = `"${client}-${lang}-${version}-${pageName}-${timestamp}"`;

        const result = await pool.query(
            `UPDATE pages 
             SET html_content = $1, etag = $2, last_modified = NOW()
             WHERE client = $3 AND language = $4 AND version = $5 AND page_name = $6`,
            [req.body.html, etag, client, lang, version, pageName]
        );

        if (result.rowCount === 0) {
            return res.status(404).send("Page not found");
        }

        logger.info({ client, lang, version, pageName }, "Page updated successfully");
        const path = `/pages/${client}/${lang}/${version}/${pageName}`;
        const cacheControl = req.get("Cache-Control") || "max-age=300";
        pushPageToEdgeCache(path, {
            data: req.body.html,
            etag,
            lastModified: new Date().toUTCString(),
            cacheControl
        });
        res.json({ 
            message: "Page updated", 
            path: `/${client}/${lang}/${version}/${pageName}` 
        });
    }).catch((err) => {
        logger.error({ err, params: req.params }, 'Failed to update page');
        if (!res.headersSent) {
            res.status(500).send("Server error");
        }
    });
}

function deletePage(req, res) {
    runTask(async () => {
        const { client, lang, version, pageName } = req.params;

        const result = await pool.query(
            'DELETE FROM pages WHERE client = $1 AND language = $2 AND version = $3 AND page_name = $4',
            [client, lang, version, pageName]
        );

        if (result.rowCount === 0) {
            return res.status(404).send("Page not found");
        }

        logger.info({ client, lang, version, pageName }, "Page deleted successfully");
        res.json({ message: "Page deleted" });
    }).catch((err) => {
        logger.error({ err, params: req.params }, 'Failed to delete page');
        if (!res.headersSent) {
            res.status(500).send("Server error");
        }
    });
}

module.exports = { getPage, createPage, updatePage, deletePage };

const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const { runTask } = require("../utils/taskQueue");
const { logger } = require("../logs/pinoLogger");

const pagesPath = path.join(__dirname, "../data/pages");

function getPage(req, res) {
    runTask(async () => {
        const { client, lang, version, pageName } = req.params;
        const filePath = path.join(pagesPath, client, lang, version, `${pageName}.html`);
        const metaPath = path.join(pagesPath, client, lang, version, `${pageName}.meta.json`);
        
        try{
            const html = await fs.readFile(filePath, "utf-8" );

            //try to read meta file
            let meta;
            try{
                json = await fs.readFile(metaPath, "utf-8");
                meta = JSON.parse(json);
            }
            catch(err){
                if(err.code !== "ENOENT"){
                    logger.warn({err, metaPath}, "Meta file not found")
                }
            }

            if(meta){
                res.set('Cache-Control', meta.cacheControl);
                res.set('ETag', meta.etag);
                res.set('Last-Modified', meta.lastModified)
            }
            else{
                res.set('Cache-Control', 'max-age=300')
            }

            res.set("Content-Type", "text/html");
            res.set("X-Client", client);
            res.set("X-Language", lang);
            res.set("X-Version", version);
            res.send(html);
        }
        catch(err){
            if(err.code === "ENOENT"){
                logger.debug({err, filePath}, "Page not found")
                res.status(404).send("Page not found")
            }

            throw err; // throw error again for the outer handler
        }
        
    }).catch(err => {
        logger.error({ err, params: req.params }, 'Failed to read page');
        if(!res.headersSent) 
            res.status(500).send("Server error");
    });
}

function createPage(req, res) {
    runTask(async () => {
        const { client, lang, version, pageName } = req.params;
        const versionDir = path.join(pagesPath, client, lang, version);
        const filePath = path.join(versionDir, `${pageName}.html`);
        const metaPath = path.join(versionDir, `${pageName}.meta.json`);

        if(!req.body || !req.body.html)
            return res.status(400).send("Missing html body")

        try{
            await fs.mkdir(versionDir, {recursive: true});

            // write with exclusive flag, to prevent race conditions
            try{
                await fs.writeFile(filePath, req.body.html, {
                    encoding : "utf-8", 
                    flag : "wx"
                });
            }
            catch(err){
                if(err.code === "EEXIST"){
                    return res.status(400).send("Page already exists");
                }
                throw err;
            }

            const metaData = buildMetaData(req);
            await fs.writeFile(metaPath, JSON.stringify(metaData, null, 2), "utf-8");

            logger.info({filePath, metaPath}, "Page created successfully");
            res.status(201).json({ 
                    message: "Page created", 
                    path: `/${client}/${lang}/${version}/${pageName}` 
                });
        }
        catch(err){
            //Just a clean up on failure
            try{
                await fs.unlink(filePath);
                await fs.unlink(metaPath);
            }
            catch(cleanUpErr){
                logger.error({cleanUpErr, filePath, metaPath}, "Failed to clean up files");
                throw cleanUpErr
            }
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
        const filePath = path.join(pagesPath, client, lang, version, `${pageName}.html`);
        const metaPath = path.join(pagesPath, client, lang, version, `${pageName}.meta.json`);

        if (!req.body || !req.body.html) {
                return res.status(400).send("Missing HTML content");
        }

        let meta;
        try{
            //read an existing meta file to verify file exists
            meta = await fs.readFile(metaPath, "utf-8").then(data => JSON.parse(data))
        }
        catch(err){
            if(err.code === "ENOENT"){
                return res.status(404).send("Page not found");
            }

            logger.warn({err, metaPath}, "Failed to read meta file - creating new one");
            meta = buildMetaData(req);
        }

        await fs.writeFile(filePath, req.body.html, "utf-8");

        //update metadata
        const timestamp = Date.now();
        meta.lastModified = new Date().toISOString();
        meta.etag = `"${client}-${lang}-${version}-${pageName}-${timestamp}"`;

        await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), "utf-8");

        logger.info({filePath}, "Page was updated succsessfully");
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
        const filePath = path.join(pagesPath, client, lang, version, `${pageName}.html`);
        const metaPath = path.join(pagesPath, client, lang, version, `${pageName}.meta.json`);

        try{
            await fs.unlink(filePath);

            //Try to delete meta file, don't fail if it doesn't exist
            try{
                await fs.unlink(metaPath);
            }
            catch(err){
                if(err.code !== "ENOENT"){
                    logger.warn({err, metaPath}, "Failed to delete meta file")
                }
            }

            logger.info({filePath}, "Page deleted successfully");
            res.json({ message : "Page deleted" });
        }
        catch(err){
            if (err.code === 'ENOENT') {
                logger.debug({ filePath }, 'Page not found for deletion');
                return res.status(404).send("Page not found");
            }
            throw err;
        }
        
    }).catch((err) => {
        logger.error({ err, params: req.params }, 'Failed to delete page');
        if (!res.headersSent) {
            res.status(500).send("Server error");
        }
    });
}

function buildMetaData(req) {
    const { client, lang, version, pageName } = req.params;
    const timestamp = Date.now();
    
    return {
        client,
        language: lang,
        version,
        pageName,
        contentType: req.get("Content-Type") || "text/html",
        cacheControl: req.get("Cache-Control") || "max-age=300",
        createdAt: new Date().toISOString(),
        etag: `"${client}-${lang}-${version}-${pageName}-${timestamp}"`,
        lastModified: new Date().toISOString()
    };
}

module.exports = { getPage, createPage, updatePage, deletePage };

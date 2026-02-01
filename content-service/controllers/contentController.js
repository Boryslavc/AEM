const fs = require("fs");
const path = require("path");
const { versions } = require("process");

const dataPath = path.join(__dirname, "../data/data.json");

function loadData() {
    return JSON.parse(fs.readFileSync(dataPath, "utf-8"));
}

function saveData(data) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

function getContent(req, res){
    const contentPath = req.path;
    const {contentType, contentName, version} = req.params;

    const data = loadData()
    const page = data.pages.find((p) => p.contentType === contentType && p.contentName === contentName);
    if(!page) return res.status(404).json({error: "Content not found"});

    const properVersion = page.versions.find((v) => v.version === version);
    if(!properVersion) return res.status(404).json({error: "Version not found"});

    res.json(properVersion["content"]);
}

function createPage(req, res) {
    const { contentType, contentName, initialVersion } = req.body;

    if (!contentType || !contentName || !initialVersion) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const data = loadData();

    const exists = data.pages.some(
        p => p.contentType === contentType && p.contentName === contentName
    );

    if (exists) {
        return res.status(409).json({ error: "Page already exists" });
    }

    data.pages.push({
        primaryType: "cq:Page",
        contentType,
        contentName,
        versions: [initialVersion]
    });

    saveData(data);
    res.status(201).json({ message: "Page created" });
}

function createVersion(req, res) {
    const { contentType, contentName } = req.params;
    const newVersion = req.body;

    if (!newVersion || !newVersion.version || !newVersion.content) {
        return res.status(400).json({ error: "Invalid version payload" });
    }

    const data = loadData();
    const page = data.pages.find(
        p => p.contentType === contentType && p.contentName === contentName
    );

    if (!page) {
        return res.status(404).json({ error: "Page not found" });
    }

    const versionExists = page.versions.some(v => v.version === newVersion.version);
    if (versionExists) {
        return res.status(409).json({ error: "Version already exists" });
    }

    page.versions.push(newVersion);
    saveData(data);

    res.status(201).json({ message: "Version created" });
}

function deletePage(req, res) {
    const { contentType, contentName } = req.params;
    const data = loadData();

    const index = data.pages.findIndex(
        p => p.contentType === contentType && p.contentName === contentName
    );

    if (index === -1) {
        return res.status(404).json({ error: "Page not found" });
    }

    data.pages.splice(index, 1);
    saveData(data);

    res.status(204).send();
}

function verifyRequiredActionParameters(req, action){

}

module.exports = { getContent, createPage, createVersion, deletePage };
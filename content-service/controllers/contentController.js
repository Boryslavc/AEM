const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname,"../data/data.json");
//TODO: don't save all data in memory at once, might increase overtime and take too much space
let contentData = JSON.parse(fs.readFileSync(filePath, {encoding:"utf-8"})); 

function getContent(req, res){
    console.log("Started getting content");
    const contentPath = req.path;
    const version = req.query.version || "latest";
    const lang = req.query.lang || "en";

    const segments = contentPath.split("/").filter(Boolean);
    console.log("Segments:" + segments.toString());
    let node = contentData;

    for(let segment of segments){
        if (node[segment]) node = node[segment];
        else return res.status(404).json({ error: 'Content not found' });
    }

    // Simple versioning & language variant simulation
    if (node.versions && node.versions[version]) node = node.versions[version];
    if (node.languages && node.languages[lang]) node = node.languages[lang];

    res.json(node);
}

module.exports = { getContent };
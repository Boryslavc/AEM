const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname,"../data/data.json");
//TODO: don't save all data in memory at once, might increase overtime and take too much space, 
// replace in memory caching entirely
let rawData = fs.readFileSync(filePath, {encoding: "utf-8"});
let contentData = JSON.parse(rawData).pages; 

function getContent(req, res){
    const contentPath = req.path;
    const {contentType, contentName, version} = req.params;
   
    const page = contentData.find((p) => p.contentType === contentType && p.contentName === contentName);
    if(!page) return res.status(404).json({error: "Content not found"});

    const properVersion = page.versions.find((v) => v.version === version);
    if(!properVersion) return res.status(404).json({error: "Version not found"});

    res.json(properVersion["jcr:content"]);
}

module.exports = { getContent };
import fs from "fs";
let content = fs.readFileSync("tests/api.test.js", "utf8");
content = content.replace(/`, \);/g, "`);");
content = content.replace(/`,\);/g, "`);");
fs.writeFileSync("tests/api.test.js", content);
console.log("Fixed trailing commas");

const fs = require("fs");
const path = require("path");

module.exports = function handler(req, res) {
  const tmapKey = process.env.TMAP_APP_KEY || "";
  const htmlPath = path.join(process.cwd(), "_index.html");

  try {
    const html = fs.readFileSync(htmlPath, "utf-8").replace(
      "TMAP_APP_KEY_PLACEHOLDER",
      tmapKey
    );
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(html);
  } catch (err) {
    res.status(500).send("Error loading app");
  }
};

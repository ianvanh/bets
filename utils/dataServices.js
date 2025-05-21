const fs = require('fs');
const path = require('path');
const dataPath = path.join(__dirname, '../data/matches.json');

function readLocalFile() {
  if (!fs.existsSync(dataPath)) return {};
  return JSON.parse(fs.readFileSync(dataPath));
}

function writeLocalFile(json) {
  fs.writeFileSync(dataPath, JSON.stringify(json, null, 2));
}

module.exports = {
  loadData: async () => readLocalFile(),
  saveData: async (json) => writeLocalFile(json)
};
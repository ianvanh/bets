const fs = require('fs');
const path = require('path');
const { isProduction } = require('../config');
const remoteStorage = require('./remoteStorage');

const dataPath = path.join(__dirname, '../data', 'matches.json');

let cache = null;
let cacheTime = 0;

async function loadData() {
  if (isProduction) {
    if (cache && Date.now() - cacheTime < 5 * 60 * 1000) return cache;
    const content = await remoteStorage.readData();
    cache = content;
    cacheTime = Date.now();
    return cache;
  } else {
    if (!fs.existsSync(dataPath)) return {};
    return JSON.parse(fs.readFileSync(dataPath));
  }
}

async function saveData(json) {
  if (isProduction) {
    await remoteStorage.writeData(json);
    cache = json;
    cacheTime = Date.now();
  } else {
    fs.writeFileSync(dataPath, JSON.stringify(json, null, 2));
  }
}

module.exports = {
  loadData,
  saveData
};
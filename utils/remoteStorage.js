const fetch = require('node-fetch');
const { github } = require('../config');

let cache = null;
let cacheTime = 0;
const urlGit = 'https://api.github.com/repos/ianvanh/bets/contents/data/matches.json'

async function fetchRemoteFile() {
  const res = await fetch(urlGit, {
    headers: {
      'Authorization': `Bearer ${github.token}`,
      'Accept': 'application/vnd.github.v3.raw'
    }
  });

  if (!res.ok) throw new Error('No se pudo leer el archivo remoto');
  return await res.text();
}

async function writeRemoteFile(content) {
  const getSha = await fetch(urlGit, {
    headers: {
      'Authorization': `Bearer ${github.token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  const current = await getSha.json();

  const res = await fetch(urlGit, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${github.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: 'Update matches.json',
      content: Buffer.from(content).toString('base64'),
      sha: current.sha,
      branch: 'main'
    })
  });

  if (!res.ok) throw new Error('Error al escribir en GitHub');
  return await res.json();
}

module.exports = {
  async readData() {
    if (cache && Date.now() - cacheTime < 5 * 60 * 1000) return cache; // 5 min cache
    const content = await fetchRemoteFile();
    cache = JSON.parse(content);
    cacheTime = Date.now();
    return cache;
  },
  async writeData(json) {
    const content = JSON.stringify(json, null, 2);
    const result = await writeRemoteFile(content);
    cache = json;
    cacheTime = Date.now();
    return result;
  }
};
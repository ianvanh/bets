const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { github } = require('../config');

const localPath = path.join(__dirname, '../data/matches.json');
const urlGit = 'https://api.github.com/repos/ianvanh/bets/contents/data/matches.json';

async function getSha() {
  const res = await axios.get(urlGit, {
    headers: {
      Authorization: `Bearer ${github.token}`,
      Accept: 'application/vnd.github.v3+json'
    }
  });

  return res.data.sha;
}

async function syncToGithub() {
  const json = fs.readFileSync(localPath, 'utf-8');
  const sha = await getSha();

  const res = await axios.put(urlGit, {
    message: 'Sincronizar desde admin',
    content: Buffer.from(json).toString('base64'),
    sha: sha,
    branch: 'main'
  }, {
    headers: {
      Authorization: `Bearer ${github.token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    }
  });

  return res.data;
}

module.exports = { syncToGithub };
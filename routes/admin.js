const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const { info } = require('../config');
const { getWeekKey, getMatchData, updateMatchResults } = require('../utils/helpers');
const { loadData, saveData } = require('../utils/dataServices');

router.use((req, res, next) => {
  if (req.session.authenticated) {
    next();
  } else {
    res.redirect('/login');
  }
});

router.get('/', (req, res) => {
  updateMatchResults();
  res.render('admin');
});

router.post('/save-matches', async (req, res) => {
  try {
    const data = req.body;
    let storedData = await loadData();
    const weekKey = getWeekKey();

    if (!storedData[weekKey]) storedData[weekKey] = [];

    for (let i = 1; i <= 3; i++) {
      const eventId = data[`match${i}-id`];
      if (!eventId) continue;

      const matchData = await getMatchData(eventId);
      storedData[weekKey].push({
        match: matchData.matchName,
        datetime: data[`match${i}-datetime`] || new Date().toISOString(),
        logo1: matchData.homeBadge,
        logo2: matchData.awayBadge,
        homeTeam: matchData.homeName,
        awayTeam: matchData.awayName,
        odds: {
          "1": data[`match${i}-1`],
          "X": data[`match${i}-X`],
          "2": data[`match${i}-2`]
        },
        eventId,
        finished: false
      });
    }

    await saveData(storedData);
    res.redirect('/');
  } catch (e) {
    res.status(500).render("errores", {
      pageTitle: '....?',
      description: info.desc,
      dominio: info.dominio,
      errorMessage: '500 Error Interno'
    });
  }
});

router.get('/preview-match', async (req, res) => {
  try {
    const eventId = req.query.id;
    if (!eventId) return res.status(400).json({ error: 'ID requerido' });

    const matchData = await getMatchData(eventId);
    res.json(matchData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});


module.exports = router;
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

const { info } = require('../config');
const { loadData } = require('../utils/dataServices');
const { getTodayDate, getWeekKey } = require('../utils/helpers');

router.get('/', async (req, res) => {
  try {
    const allData = await loadData();
    const today = req.query.fecha || getTodayDate();
    const weekKey = getWeekKey();
    const weekData = allData[weekKey] || []
    
    const matchesToday = weekData
      .filter(m => moment(m.datetime).tz('America/Bogota').format('YYYY-MM-DD') === today)
      .slice(0, 3);
    
    const fondo = matchesToday.length === 0 ? "rgb(152, 203, 100)" : "#0a0a0a";
    res.render('index', {
      pageTitle: `${info.name_page} | Inicio`,
      description: info.desc,
      dominio: info.dominio,
      matchesToday,
      today,
      fondo
    });
  } catch (e) {
    res.status(500).render("errores", {
      pageTitle: `${info.name_page} | Error`,
      description: info.desc,
      dominio: info.dominio,
      errorMessage: "500 Error Interno"
    });
  }
});

module.exports = router;
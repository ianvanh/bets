const express = require('express');
const router = express.Router();
const moment = require('moment-timezone');

const { info } = require('../config');
const { loadData } = require('../utils/dataServices');
const { getTodayDate, getWeekKey, generarCombinaciones } = require('../utils/helpers');

router.get('/', async (req, res) => {
  try {
    const allData = await loadData();
    const today = req.query.fecha || getTodayDate();
    const weekKey = getWeekKey();
    const matches = allData[weekKey] || [];

    const matchesToday = matches
      .filter(m => moment(m.datetime).tz('America/Bogota').format('YYYY-MM-DD') === today)
      .slice(0, 3);

    if (!matchesToday || matchesToday.length === 0) {
      return res.redirect('/');
    }

    if (matchesToday.length !== 3) {
      return res.status(400).render('errores', {
        pageTitle: `${info.name_page} | Inicio`,
        description: info.desc,
        dominio: info.dominio,
        errorMessage: 'Se necesitan exactamente 3 partidos para generar las combinaciones'
      });
    }

    const { partidos, combinaciones, todosFinalizados } = generarCombinaciones(matchesToday);
    combinaciones.sort((a, b) => b.cuota - a.cuota);

    res.render('combinations', {
      pageTitle: `${info.name_page} | Combinaciones 1X2`,
      description: info.desc,
      dominio: info.dominio,
      fondo: '#0a0a0a',
      partidos,
      combinaciones,
      todosFinalizados
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
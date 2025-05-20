const express = require('express');
const router = express.Router();
const moment = require('moment-timezone');

const { info } = require('../config');
const { loadData } = require('../utils/dataServices');
const { generarResumenSemanal } = require('../utils/helpers');

router.get('/', async (req, res) => {
  try {
    const allData = await loadData();
    
    const semanas = Object.keys(allData).sort((a, b) => {
      return moment(b, "GGGG-[W]WW").diff(moment(a, "GGGG-[W]WW"));
    });

    const semanasConResumen = semanas.map(semana => {
      const base = moment(semana, "GGGG-[W]WW"); // Año y semana ISO
      const fechaInicio = base.clone().startOf('isoWeek'); // lunes
      const fechaFin = base.clone().endOf('isoWeek');     // domingo
    
      return {
        codigoSemana: semana,
        fechaInicio: fechaInicio.format('DD/MM/YYYY'),
        fechaFin: fechaFin.format('DD/MM/YYYY'),
        resumen: generarResumenSemanal(allData[semana])
      };
    });

    res.render('matches', {
      pageTitle: `${info.name_page} | Partidos por semana`,
      description: info.desc,
      dominio: info.dominio,
      fondo: '#0a0a0a',
      semanas: semanasConResumen,
      moment: moment
    });
  } catch (e) {
    res.status(500).render("errores", {
      pageTitle: `${info.name_page} | Error`,
      description: info.desc,
      dominio: info.dominio,
      errorMessage: "Error al cargar los partidos."
    });
  }
})

router.get('/detalle', (req, res) => {
  const semana = req.query.semana || '2025-W18';
  res.redirect(`/matches/${semana}`);
});

router.get('/:semana', async (req, res) => {
  try {
    const allData = await loadData();
    const semana = req.params.semana;
    const partidos = allData[semana];

    if (!partidos) {
      return res.status(404).render("errores", {
        pageTitle: `${info.name_page} | Error`,
        description: info.desc,
        dominio: info.dominio,
        errorMessage: `No se encontraron partidos para la semana ${semana}`
      });
    }

    const agrupadosPorDia = {};
    partidos.forEach(p => {
      const fecha = moment(p.datetime).format("YYYY-MM-DD");
      if (!agrupadosPorDia[fecha]) agrupadosPorDia[fecha] = [];
      agrupadosPorDia[fecha].push(p);
    });
    const cuotasDiarias = {};
    let cuotaTotalSemana = 0;

    for (const fecha in agrupadosPorDia) {
      const partidosDia = agrupadosPorDia[fecha];
      const finalizados = partidosDia.filter(p => p.finished);

      if (finalizados.length === 3) {
        const cuotaGanadora = finalizados.reduce((total, p) => {
          return total * parseFloat(p.odds[p.winner]);
        }, 1);
        cuotasDiarias[fecha] = cuotaGanadora.toFixed(2);
        cuotaTotalSemana += cuotaGanadora;
      }
    }

    res.render('detalle', {
      pageTitle: `${info.name_page} | Semana ${semana}`,
      description: info.desc,
      fondo: '#0a0a0a',
      dominio: info.dominio,
      semana: semana,
      fechaInicio: moment(semana, "YYYY-[W]WW").startOf('week').format('DD/MM/YYYY'),
      fechaFin: moment(semana, "YYYY-[W]WW").endOf('week').format('DD/MM/YYYY'),
      agrupadosPorDia,
      cuotasDiarias,
      cuotaTotalSemana: cuotaTotalSemana.toFixed(2),
      moment: moment
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
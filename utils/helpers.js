const moment = require('moment');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const { loadData, saveData } = require('./dataServices');

const imageCachePath = path.join(__dirname, '../data', 'imageCache.json');
let imageCache = fs.existsSync(imageCachePath) ? JSON.parse(fs.readFileSync(imageCachePath)) : {};

function getWeekKey() {
  return moment().tz('America/Bogota').format('GGGG-[W]WW');
}
function getTodayDate() {
  return moment().tz('America/Bogota').format('YYYY-MM-DD');
}

function generarCombinaciones(partidos) {
  if (partidos.length !== 3) {
    throw new Error('Se necesitan exactamente 3 partidos para generar las combinaciones');
  }

  const datosPartidos = partidos.map(partido => ({
    equipos: partido.match,
    local: partido.homeTeam || partido.match.split(' vs ')[0],
    visitante: partido.awayTeam || partido.match.split(' vs ')[1],
    cuotaLocal: partido.odds["1"] || 1.8,
    cuotaEmpate: partido.odds["X"] || 3.4,
    cuotaVisitante: partido.odds["2"] || 4.2,
    resultadoFinal: partido.winner || null,
    finished: partido.finished || false
  }));

  const resultados = ['1', 'X', '2'];
  
  const combinaciones = [];
  
  for (const res1 of resultados) {
    for (const res2 of resultados) {
      for (const res3 of resultados) {
        // Calcular la cuota multiplicada
        let cuotaMultiplicada = 1;
        let descripcion = [];
        let esGanadora = true;
        
        // Partido 1
        cuotaMultiplicada *= res1 === '1' ? datosPartidos[0].cuotaLocal : 
                            res1 === 'X' ? datosPartidos[0].cuotaEmpate : 
                            datosPartidos[0].cuotaVisitante;
        descripcion.push(`Partido 1: "${res1}"`);
        
        if (datosPartidos[0].finished && res1 !== datosPartidos[0].resultadoFinal) {
          esGanadora = false;
        }
        
        // Partido 2
        cuotaMultiplicada *= res2 === '1' ? datosPartidos[1].cuotaLocal : 
                            res2 === 'X' ? datosPartidos[1].cuotaEmpate : 
                            datosPartidos[1].cuotaVisitante;
        descripcion.push(`Partido 2: "${res2}"`);
        
        if (datosPartidos[1].finished && res2 !== datosPartidos[1].resultadoFinal) {
          esGanadora = false;
        }
        
        // Partido 3
        cuotaMultiplicada *= res3 === '1' ? datosPartidos[2].cuotaLocal : 
                            res3 === 'X' ? datosPartidos[2].cuotaEmpate : 
                            datosPartidos[2].cuotaVisitante;
        descripcion.push(`Partido 3: "${res3}"`);
        
        if (datosPartidos[2].finished && res3 !== datosPartidos[2].resultadoFinal) {
          esGanadora = false;
        }
        
        cuotaMultiplicada = parseFloat(cuotaMultiplicada.toFixed(2));
        
        combinaciones.push({
          combinacion: `${res1}${res2}${res3}`,
          descripcion: descripcion.join(' | '),
          cuota: cuotaMultiplicada.toFixed(2),
          esGanadora: esGanadora && datosPartidos.every(p => p.finished)
        });
      }
    }
  }
  
  return {
    partidos: datosPartidos,
    combinaciones: combinaciones,
    todosFinalizados: datosPartidos.every(p => p.finished)
  };
}
function generarResumenSemanal(partidos) {
  const resumen = {
    totalPartidos: partidos.length,
    partidosFinalizados: partidos.filter(p => p.finished).length,
    cuotaPromedioGanadora: 0,
    porcentajeAciertos: {
      "1": 0,
      "X": 0,
      "2": 0
    }
  };

  const partidosFinalizados = partidos.filter(p => p.finished);
  
  if (partidosFinalizados.length > 0) {
    const sumaCuotas = partidosFinalizados.reduce((sum, partido) => {
      return sum + parseFloat(partido.odds[partido.winner]);
    }, 0);
    resumen.cuotaPromedioGanadora = (sumaCuotas / partidosFinalizados.length).toFixed(2);
    
    const counts = partidosFinalizados.reduce((acc, partido) => {
      acc[partido.winner] = (acc[partido.winner] || 0) + 1;
      return acc;
    }, { "1": 0, "X": 0, "2": 0 });
    
    Object.keys(counts).forEach(key => {
      resumen.porcentajeAciertos[key] = ((counts[key] / partidosFinalizados.length) * 100).toFixed(1);
    });
  }
  
  return resumen;
}

async function getMatchData(eventId) {
  const API_BASE = 'https://api.sofascore.com/api/v1';
  const headers = {
    'User-Agent': 'Mozilla/5.0',
    'Referer': 'https://www.sofascore.com/'
  };

  const matchResponse = await axios.get(`${API_BASE}/event/${eventId}`, { headers });
  const event = matchResponse.data.event;

  const homeBadge = await getTeamBadgeWithCache(event.homeTeam.id, headers);
  const awayBadge = await getTeamBadgeWithCache(event.awayTeam.id, headers);

  return {
    matchName: `${event.homeTeam.name} vs ${event.awayTeam.name}`,
    homeName: event.homeTeam.name,
    awayName: event.awayTeam.name,
    homeBadge: homeBadge || '/public/default-badge.png',
    awayBadge: awayBadge || '/public/default-badge.png'
  };
}
async function getTeamBadgeWithCache(teamId, headers) {
  if (imageCache[teamId]) return imageCache[teamId];

  try {
    const response = await axios.get(`https://api.sofascore.com/api/v1/team/${teamId}/image`, {
      headers,
      responseType: 'arraybuffer'
    });

    const base64Image = Buffer.from(response.data, 'binary').toString('base64');
    const dataUrl = `data:image/png;base64,${base64Image}`;
    imageCache[teamId] = dataUrl;
    fs.writeFileSync(imageCachePath, JSON.stringify(imageCache, null, 2));
    return dataUrl;
  } catch (error) {
    console.error(`Error obteniendo escudo para equipo ${teamId}:`, error.message);
    return null;
  }
}
async function updateMatchResults() {
  const storedData = await loadData();
  const weekKey = getWeekKey();
  const weekMatches = storedData[weekKey] || [];

  let modified = false;
  for (let match of weekMatches) {
    if (match.finished || !match.eventId) continue;

    try {
      const { data } = await axios.get(`https://api.sofascore.com/api/v1/event/${match.eventId}`);
      const event = data.event;

      if (event.status.type === "finished") {
        match.finished = true;
        match.result = {
          home: event.homeScore.current,
          away: event.awayScore.current
        };

        if (event.homeScore.current > event.awayScore.current) {
          match.winner = "1";
        } else if (event.homeScore.current < event.awayScore.current) {
          match.winner = "2";
        } else {
          match.winner = "X";
        }

        modified = true;
      }
    } catch (err) {
      console.error("Error verificando estado del partido", err.message);
    }
  }

  if (modified) {
    await saveData(storedData);
  }
}

module.exports = {
  getWeekKey,
  getTodayDate,
  generarCombinaciones,
  generarResumenSemanal,
  getMatchData,
  updateMatchResults
}
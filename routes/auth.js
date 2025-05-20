const express = require('express');
const router = express.Router();

const { info } = require('../config');

router.post('/', (req, res) => {
  const { usuario, password } = req.body;
  if (usuario === process.env.USER && password === process.env.PASS) {
    req.session.authenticated = true;
    return res.redirect('/admin');
  } else {
    return res.render('login', {
      pageTitle: `${info.name_page} | Login`,
      description: info.desc,
      dominio: info.dominio,
      error: 'Credenciales incorrectas'
    });
  }
});

router.get('/', (req, res) => {
  res.render('login', {
    pageTitle: `${info.name_page} | Login`,
    description: info.desc,
    dominio: info.dominio
  });
});

module.exports = router;
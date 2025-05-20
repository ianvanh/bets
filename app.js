const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const port = process.env.PORT || 3000;
const { info } = require('./config');
require('dotenv').config();

app.use(session({
  secret: 'xIx2J4aV',
  resave: false,
  saveUninitialized: false
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((req, res, next) => {
  const ua = req.headers['user-agent'];
  const esMovil = /mobile|android|iphone|ipad|phone/i.test(ua);
  if (esMovil) {
    next();
  } else {
    res.render("errores", {
      pageTitle: `${info.name_page} | Error`,
      description: info.desc,
      dominio: info.dominio,
      errorMessage: "Solo disponible para dispositivos mobiles."
    });
  }
});

app.get('/logo', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/img/logo.png'));
});
app.get('/banner', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/img/banner.png'));
});

const indexRoute = require('./routes/index');
const combinationsRoute = require('./routes/combinations');
const matchesRoute = require('./routes/matches');
const loginRoute = require('./routes/auth');
const adminRoute = require('./routes/admin');

app.use('/', indexRoute);
app.use('/combinations', combinationsRoute);
app.use('/matches', matchesRoute);
app.use('/login', loginRoute);
app.use('/admin', adminRoute);
app.get('/ping', (req, res) => {
  res.status(200).send('Pong');
});

app.use((req, res, next) => {
  res.status(404).render("errores", {
    pageTitle: `${info.name_page} | Error`,
    description: info.desc,
    dominio: info.dominio,
    errorMessage: "Pagina no encontrada"
  });
});

app.listen(port, () => {
  console.log('Servidor iniciado en http://localhost:3000');
});
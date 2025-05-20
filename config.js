module.exports = {
  info: {
    name_page: 'Newbets',
    desc: 'Newbets, la mejor forma de ganarle al sistema.',
    dominio: 'https://bets-1ltd.onrender.com'
  },
  isProduction: process.env.NODE_ENV === 'production',
  github: {
    token: process.env.GITHUB_TOKEN
  }
};
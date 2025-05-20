module.exports = {
  info: {
    name_page: 'Newbets',
    desc: 'Newbets, la mejor forma de ganarle al sistema.',
    dominio: ''
  },
  isProduction: process.env.NODE_ENV === 'production',
  github: {
    token: process.env.GITHUB_TOKEN
  }
};
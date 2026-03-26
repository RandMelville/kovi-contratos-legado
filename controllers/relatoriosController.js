const relatoriosService = require('../services/relatoriosService')

async function inadimplentes(req, res) {
  try {
    res.json(await relatoriosService.inadimplentes())
  } catch (err) {
    res.status(500).send(err)
  }
}

async function frota(req, res) {
  try {
    res.json(await relatoriosService.frota())
  } catch (err) {
    res.status(500).send(err)
  }
}

module.exports = { inadimplentes, frota }

const pagamentosService = require('../services/pagamentosService')

async function registrar(req, res) {
  try {
    res.json(await pagamentosService.registrar(req.body))
  } catch (err) {
    res.status(err.status || 500).send(err.message)
  }
}

async function listarPorContrato(req, res) {
  try {
    res.json(await pagamentosService.listarPorContrato(req.params.id))
  } catch (err) {
    res.status(500).send(err)
  }
}

module.exports = { registrar, listarPorContrato }

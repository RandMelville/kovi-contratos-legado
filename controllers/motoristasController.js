const motoristasService = require('../services/motoristasService')

async function listar(req, res) {
  try {
    res.json(await motoristasService.listar())
  } catch (err) {
    res.status(500).send(err)
  }
}

async function buscarPorId(req, res) {
  try {
    res.json(await motoristasService.buscarPorId(req.params.id))
  } catch (err) {
    res.status(500).send(err)
  }
}

async function criar(req, res) {
  try {
    res.json(await motoristasService.criar(req.body))
  } catch (err) {
    res.status(500).send(err)
  }
}

async function atualizar(req, res) {
  try {
    res.json(await motoristasService.atualizar(req.params.id, req.body))
  } catch (err) {
    res.status(500).send(err)
  }
}

module.exports = { listar, buscarPorId, criar, atualizar }

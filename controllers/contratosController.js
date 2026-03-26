const contratosService = require('../services/contratosService')

async function listar(req, res) {
  try {
    res.json(await contratosService.listar())
  } catch (err) {
    res.status(500).send(err)
  }
}

async function buscarPorId(req, res) {
  try {
    res.json(await contratosService.buscarPorId(req.params.id))
  } catch (err) {
    res.status(500).send(err)
  }
}

async function criar(req, res) {
  try {
    res.json(await contratosService.criar(req.body))
  } catch (err) {
    res.status(err.status || 500).send(err.message)
  }
}

async function cancelar(req, res) {
  try {
    res.json(await contratosService.cancelar(req.params.id))
  } catch (err) {
    res.status(500).send(err)
  }
}

async function status(req, res) {
  try {
    res.json(await contratosService.status(req.params.id))
  } catch (err) {
    res.status(500).send(err)
  }
}

module.exports = { listar, buscarPorId, criar, cancelar, status }

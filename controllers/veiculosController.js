const veiculosService = require('../services/veiculosService')

async function listar(req, res) {
  try {
    res.json(await veiculosService.listar())
  } catch (err) {
    res.status(500).send(err)
  }
}

async function buscarPorId(req, res) {
  try {
    res.json(await veiculosService.buscarPorId(req.params.id))
  } catch (err) {
    res.status(500).send(err)
  }
}

async function criar(req, res) {
  try {
    res.json(await veiculosService.criar(req.body))
  } catch (err) {
    res.status(500).send(err)
  }
}

async function atualizar(req, res) {
  try {
    res.json(await veiculosService.atualizar(req.params.id, req.body))
  } catch (err) {
    res.status(500).send(err)
  }
}

async function remover(req, res) {
  try {
    res.json(await veiculosService.remover(req.params.id))
  } catch (err) {
    res.status(500).send(err)
  }
}

module.exports = { listar, buscarPorId, criar, atualizar, remover }

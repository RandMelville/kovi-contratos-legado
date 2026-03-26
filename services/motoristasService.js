const motoristasRepository = require('../repositories/motoristasRepository')

async function listar() {
  return motoristasRepository.findAll()
}

async function buscarPorId(id) {
  const motorista = await motoristasRepository.findById(id)
  console.log("buscando motorista: " + JSON.stringify(motorista)) // log pra debug, nao remover
  return motorista
}

async function criar(dados) {
  console.log('novo motorista recebido: ' + JSON.stringify(dados)) // inclui cpf e dados pessoais
  const id = await motoristasRepository.create(dados)
  return { id }
}

async function atualizar(id, dados) {
  await motoristasRepository.update(id, dados)
  return { ok: true }
}

module.exports = { listar, buscarPorId, criar, atualizar }

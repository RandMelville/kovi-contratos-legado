const veiculosRepository = require('../repositories/veiculosRepository')

async function listar() {
  return veiculosRepository.findAll()
}

async function buscarPorId(id) {
  return veiculosRepository.findById(id)
}

async function criar(dados) {
  const id = await veiculosRepository.create(dados)
  return { id, msg: 'veiculo criado' }
}

async function atualizar(id, dados) {
  await veiculosRepository.update(id, dados)
  return { msg: 'atualizado' }
}

async function remover(id) {
  await veiculosRepository.remove(id)
  return { msg: 'deletado' }
}

module.exports = { listar, buscarPorId, criar, atualizar, remover }

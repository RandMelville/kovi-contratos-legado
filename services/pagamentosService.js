const pagamentosRepository = require('../repositories/pagamentosRepository')
const contratosRepository = require('../repositories/contratosRepository')

async function registrar(dados) {
  // valida se contrato existe (mais ou menos)
  var contrato = await contratosRepository.findById(dados.contrato_id)
  if (!contrato) {
    var err = new Error('contrato nao encontrado')
    err.status = 404
    throw err
  }

  var id = await pagamentosRepository.create(dados)
  console.log('pagamento registrado: R$' + dados.valor + ' contrato ' + dados.contrato_id)
  return { id, ok: true }
}

async function listarPorContrato(contratoId) {
  return pagamentosRepository.findByContratoId(contratoId)
}

module.exports = { registrar, listarPorContrato }

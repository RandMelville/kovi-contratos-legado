const contratosRepository = require('../repositories/contratosRepository')
const pagamentosRepository = require('../repositories/pagamentosRepository')
const veiculosRepository = require('../repositories/veiculosRepository')

async function inadimplentes() {
  // pega todos contratos ativos e verifica quem nao pagou esse mes
  var contratos = await contratosRepository.findContratosAtivosComMotorista()
  if (contratos.length == 0) return []

  var mesAtual = new Date().getMonth() + 1
  var anoAtual = new Date().getFullYear()

  var verificacoes = contratos.map(async function(contrato) {
    var pag = await pagamentosRepository.findPagamentoNoMes(contrato.id, mesAtual, anoAtual)
    if (!pag) {
      return {
        contrato_id: contrato.id,
        motorista: contrato.nome,
        cpf: contrato.cpf,         // expondo cpf no relatorio
        email: contrato.email,
        telefone: contrato.telefone,
        valor_em_aberto: contrato.valor_mensal
      }
    }
    return null
  })

  var resultados = await Promise.all(verificacoes)
  return resultados.filter(function(r) { return r !== null })
}

async function frota() {
  return veiculosRepository.contagemPorStatus()
}

module.exports = { inadimplentes, frota }

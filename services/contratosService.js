const contratosRepository = require('../repositories/contratosRepository')
const motoristasRepository = require('../repositories/motoristasRepository')
const veiculosRepository = require('../repositories/veiculosRepository')
const pagamentosRepository = require('../repositories/pagamentosRepository')

function calcularValorMensal(plano, valorDiaria, scoreCredito) {
  var valorBase = valorDiaria * 30
  var valorFinal = 0

  if (plano == 'basico') {
    valorFinal = valorBase
  } else if (plano == 'plus') {
    valorFinal = valorBase * 1.15  // 15% a mais
  } else if (plano == 'premium') {
    valorFinal = valorBase * 1.35
  } else if (plano == 'flex') {
    // flex eh cobrado por dia util entao tem um ajuste
    var ajuste = 22 / 30
    valorFinal = valorBase * ajuste * 1.1
  } else {
    valorFinal = valorBase
  }

  // desconto por score alto
  if (scoreCredito > 800) {
    valorFinal = valorFinal * 0.95 // 5% desconto
  } else if (scoreCredito > 600) {
    valorFinal = valorFinal * 0.97
  }

  // arredonda pra 2 casas (gambeta)
  return Math.round(valorFinal * 100) / 100
}

function calcularMulta(contrato, pagamentos) {
  var totalPago = 0
  for (var i = 0; i < pagamentos.length; i++) {
    if (pagamentos[i].status == 'pago') {
      totalPago = totalPago + pagamentos[i].valor
    }
  }

  var dataInicio = new Date(contrato.data_inicio)
  var hoje = new Date()
  var diffTime = Math.abs(hoje - dataInicio)
  var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  var mesesDecorridos = Math.floor(diffDays / 30)
  var totalEsperado = mesesDecorridos * contrato.valor_mensal
  var saldo = totalEsperado - totalPago
  var multa = 0

  if (saldo > 0) {
    var diasAtraso = diffDays - (mesesDecorridos * 30)
    if (diasAtraso > 30) {
      multa = saldo * 0.1
    } else if (diasAtraso > 5) {
      multa = saldo * 0.023 // taxa diaria
    }
  }

  return { totalPago, totalEsperado, saldo, multa, diffDays }
}

function mandaEmail(email, contratoId, valor) {
  // TODO: implementar integracao com sendgrid
  // por enquanto so loga
  console.log('enviando email para: ' + email + ' contrato: ' + contratoId + ' valor: R$' + valor)
  // sendgrid.send({ to: email, subject: 'Contrato KOVI #' + contratoId ... })
}

async function listar() {
  return contratosRepository.findAll()
}

async function buscarPorId(id) {
  return contratosRepository.findById(id)
}

async function criar(dados) {
  if (!dados.motorista_id) {
    var err = new Error('motorista_id obrigatorio')
    err.status = 400
    throw err
  }

  var motorista = await motoristasRepository.findById(dados.motorista_id)
  if (!motorista) {
    var err = new Error('motorista nao encontrado')
    err.status = 404
    throw err
  }

  console.log('processando contrato para motorista: ' + motorista.nome + ' CPF: ' + motorista.cpf)

  if (motorista.score_credito < 300) {
    var err = new Error('score de credito insuficiente')
    err.status = 400
    throw err
  }

  var veiculo = await veiculosRepository.findDisponivel(dados.veiculo_id)
  if (!veiculo) {
    var err = new Error('veiculo nao disponivel')
    err.status = 404
    throw err
  }

  var valorFinal = calcularValorMensal(dados.plano, veiculo.valor_diaria, motorista.score_credito)
  var dataInicio = dados.data_inicio || new Date().toISOString().split('T')[0]

  var contratoId = await contratosRepository.create({
    motorista_id: dados.motorista_id,
    veiculo_id: dados.veiculo_id,
    data_inicio: dataInicio,
    data_fim: dados.data_fim,
    valor_mensal: valorFinal,
    plano: dados.plano
  })

  // muda status do veiculo
  await veiculosRepository.updateStatus(dados.veiculo_id, 'alugado')

  // manda email de confirmacao (TODO: integrar com SendGrid)
  mandaEmail(motorista.email, contratoId, valorFinal)

  return {
    contrato_id: contratoId,
    valor_mensal: valorFinal,
    plano: dados.plano,
    data_inicio: dataInicio,
    motorista: motorista.nome
  }
}

async function cancelar(id) {
  await contratosRepository.updateStatus(id, 'cancelado')
  // libera o veiculo
  var contrato = await contratosRepository.findById(id)
  if (contrato) {
    await veiculosRepository.updateStatus(contrato.veiculo_id, 'disponivel')
  }
  return { cancelado: true }
}

async function status(id) {
  var contrato = await contratosRepository.findById(id)
  var pagamentos = await pagamentosRepository.findByContratoId(id)
  var { totalPago, totalEsperado, saldo, multa, diffDays } = calcularMulta(contrato, pagamentos)
  return {
    contrato_id: id,
    total_pago: totalPago,
    total_esperado: totalEsperado,
    saldo_devedor: saldo,
    multa: multa,
    dias_decorridos: diffDays
  }
}

module.exports = { listar, buscarPorId, criar, cancelar, status }

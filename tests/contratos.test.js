process.env.DB_PATH = ':memory:'
const request = require('supertest')

let app
let db

beforeAll((done) => {
  db = require('../db')
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS veiculos (id INTEGER PRIMARY KEY AUTOINCREMENT, placa TEXT, modelo TEXT, ano INTEGER, status TEXT, valor_diaria REAL, km_atual INTEGER)`)
    db.run(`CREATE TABLE IF NOT EXISTS motoristas (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT, cpf TEXT, email TEXT, telefone TEXT, cnh TEXT, score_credito INTEGER)`)
    db.run(`CREATE TABLE IF NOT EXISTS contratos (id INTEGER PRIMARY KEY AUTOINCREMENT, motorista_id INTEGER, veiculo_id INTEGER, data_inicio TEXT, data_fim TEXT, valor_mensal REAL, status TEXT, plano TEXT, multa_acumulada REAL)`)
    db.run(`CREATE TABLE IF NOT EXISTS pagamentos (id INTEGER PRIMARY KEY AUTOINCREMENT, contrato_id INTEGER, valor REAL, data_pagamento TEXT, status TEXT, metodo TEXT)`, done)
  })
  app = require('../server')
})

async function criarMotorista(score) {
  const res = await request(app).post('/motoristas').send({
    nome: 'Teste', cpf: '000.000.000-00', email: 'teste@kovi.com',
    telefone: '11900000000', cnh: '00000000000', score_credito: score
  })
  return res.body.id
}

async function criarVeiculo(diaria = 100) {
  const res = await request(app).post('/veiculos').send({
    placa: 'TST' + Math.floor(Math.random() * 9999), modelo: 'Modelo Teste',
    ano: 2022, valor_diaria: diaria, km_atual: 0
  })
  return res.body.id
}

describe('POST /contratos — validações', () => {
  it('rejeita motorista com score < 300', async () => {
    const mid = await criarMotorista(200)
    const vid = await criarVeiculo()
    const res = await request(app).post('/contratos').send({
      motorista_id: mid, veiculo_id: vid, plano: 'basico',
      data_inicio: '2024-01-01', data_fim: '2024-12-31'
    })
    expect(res.status).toBe(400)
  })

  it('rejeita motorista inexistente', async () => {
    const res = await request(app).post('/contratos').send({
      motorista_id: 99999, veiculo_id: 1, plano: 'basico',
      data_inicio: '2024-01-01', data_fim: '2024-12-31'
    })
    expect(res.status).toBe(404)
  })

  it('rejeita veículo indisponível', async () => {
    const mid = await criarMotorista(700)
    const vid = await criarVeiculo()
    // primeira locação: ocupa o veículo
    await request(app).post('/contratos').send({
      motorista_id: mid, veiculo_id: vid, plano: 'basico',
      data_inicio: '2024-01-01', data_fim: '2024-12-31'
    })
    // segunda tentativa com o mesmo veículo
    const res = await request(app).post('/contratos').send({
      motorista_id: mid, veiculo_id: vid, plano: 'basico',
      data_inicio: '2024-02-01', data_fim: '2024-12-31'
    })
    expect(res.status).toBe(404)
  })
})

describe('POST /contratos — cálculo de planos', () => {
  it('plano basico: valor = diaria × 30', async () => {
    const mid = await criarMotorista(500)
    const vid = await criarVeiculo(100)
    const res = await request(app).post('/contratos').send({
      motorista_id: mid, veiculo_id: vid, plano: 'basico',
      data_inicio: '2024-01-01', data_fim: '2024-12-31'
    })
    expect(res.status).toBe(200)
    expect(res.body.valor_mensal).toBe(3000)
  })

  it('plano plus: valor = diaria × 30 × 1.15', async () => {
    const mid = await criarMotorista(500)
    const vid = await criarVeiculo(100)
    const res = await request(app).post('/contratos').send({
      motorista_id: mid, veiculo_id: vid, plano: 'plus',
      data_inicio: '2024-01-01', data_fim: '2024-12-31'
    })
    expect(res.status).toBe(200)
    expect(res.body.valor_mensal).toBe(3450)
  })

  it('plano premium: valor = diaria × 30 × 1.35', async () => {
    const mid = await criarMotorista(500)
    const vid = await criarVeiculo(100)
    const res = await request(app).post('/contratos').send({
      motorista_id: mid, veiculo_id: vid, plano: 'premium',
      data_inicio: '2024-01-01', data_fim: '2024-12-31'
    })
    expect(res.status).toBe(200)
    expect(res.body.valor_mensal).toBe(4050)
  })

  it('plano flex: valor = diaria × 22 × 1.1', async () => {
    const mid = await criarMotorista(500)
    const vid = await criarVeiculo(100)
    const res = await request(app).post('/contratos').send({
      motorista_id: mid, veiculo_id: vid, plano: 'flex',
      data_inicio: '2024-01-01', data_fim: '2024-12-31'
    })
    expect(res.status).toBe(200)
    // 100 * 30 * (22/30) * 1.1 = 2420
    expect(res.body.valor_mensal).toBe(2420)
  })
})

describe('POST /contratos — desconto por score', () => {
  it('score > 800: desconto de 5%', async () => {
    const mid = await criarMotorista(850)
    const vid = await criarVeiculo(100)
    const res = await request(app).post('/contratos').send({
      motorista_id: mid, veiculo_id: vid, plano: 'basico',
      data_inicio: '2024-01-01', data_fim: '2024-12-31'
    })
    expect(res.status).toBe(200)
    expect(res.body.valor_mensal).toBe(2850) // 3000 * 0.95
  })

  it('score > 600: desconto de 3%', async () => {
    const mid = await criarMotorista(650)
    const vid = await criarVeiculo(100)
    const res = await request(app).post('/contratos').send({
      motorista_id: mid, veiculo_id: vid, plano: 'basico',
      data_inicio: '2024-01-01', data_fim: '2024-12-31'
    })
    expect(res.status).toBe(200)
    expect(res.body.valor_mensal).toBe(2910) // 3000 * 0.97
  })
})

describe('POST /contratos — efeitos colaterais', () => {
  it('veículo muda para alugado após contrato criado', async () => {
    const mid = await criarMotorista(500)
    const vid = await criarVeiculo(100)
    await request(app).post('/contratos').send({
      motorista_id: mid, veiculo_id: vid, plano: 'basico',
      data_inicio: '2024-01-01', data_fim: '2024-12-31'
    })
    const veiculo = await request(app).get('/veiculos/' + vid)
    expect(veiculo.body.status).toBe('alugado')
  })
})

describe('PUT /contratos/:id/cancelar', () => {
  it('cancela contrato e libera veículo', async () => {
    const mid = await criarMotorista(500)
    const vid = await criarVeiculo(100)
    const contrato = await request(app).post('/contratos').send({
      motorista_id: mid, veiculo_id: vid, plano: 'basico',
      data_inicio: '2024-01-01', data_fim: '2024-12-31'
    })
    const cid = contrato.body.contrato_id

    const res = await request(app).put('/contratos/' + cid + '/cancelar')
    expect(res.status).toBe(200)
    expect(res.body.cancelado).toBe(true)

    // aguarda callback async de liberação do veículo
    await new Promise(r => setTimeout(r, 50))

    const veiculo = await request(app).get('/veiculos/' + vid)
    expect(veiculo.body.status).toBe('disponivel')
  })
})

describe('GET /contratos/:id/status', () => {
  it('retorna saldo devedor e multa', async () => {
    const mid = await criarMotorista(500)
    const vid = await criarVeiculo(100)
    const contrato = await request(app).post('/contratos').send({
      motorista_id: mid, veiculo_id: vid, plano: 'basico',
      data_inicio: '2024-01-01', data_fim: '2024-12-31'
    })
    const res = await request(app).get('/contratos/' + contrato.body.contrato_id + '/status')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('saldo_devedor')
    expect(res.body).toHaveProperty('multa')
    expect(res.body).toHaveProperty('total_pago')
    expect(res.body).toHaveProperty('total_esperado')
  })
})

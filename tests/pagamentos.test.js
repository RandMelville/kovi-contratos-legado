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

async function criarContratoCompleto() {
  const motorista = await request(app).post('/motoristas').send({
    nome: 'Pagante', cpf: '111.111.111-11', email: 'pag@kovi.com',
    telefone: '11900000001', cnh: '11111111111', score_credito: 700
  })
  const veiculo = await request(app).post('/veiculos').send({
    placa: 'PAG' + Math.floor(Math.random() * 9999), modelo: 'Carro Teste',
    ano: 2022, valor_diaria: 100, km_atual: 0
  })
  const contrato = await request(app).post('/contratos').send({
    motorista_id: motorista.body.id, veiculo_id: veiculo.body.id,
    plano: 'basico', data_inicio: '2024-01-01', data_fim: '2024-12-31'
  })
  return contrato.body.contrato_id
}

describe('POST /pagamentos', () => {
  it('rejeita contrato inexistente com 404', async () => {
    const res = await request(app).post('/pagamentos').send({
      contrato_id: 99999, valor: 3000, data_pagamento: '2024-01-05', metodo: 'pix'
    })
    expect(res.status).toBe(404)
  })

  it('registra pagamento válido', async () => {
    const cid = await criarContratoCompleto()
    const res = await request(app).post('/pagamentos').send({
      contrato_id: cid, valor: 3000, data_pagamento: '2024-01-05', metodo: 'pix'
    })
    expect(res.status).toBe(200)
    expect(res.body.id).toBeDefined()
    expect(res.body.ok).toBe(true)
  })
})

describe('GET /pagamentos/contrato/:id', () => {
  it('lista pagamentos de um contrato', async () => {
    const cid = await criarContratoCompleto()
    await request(app).post('/pagamentos').send({
      contrato_id: cid, valor: 3000, data_pagamento: '2024-01-05', metodo: 'boleto'
    })
    const res = await request(app).get('/pagamentos/contrato/' + cid)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThanOrEqual(1)
    expect(res.body[0].valor).toBe(3000)
    expect(res.body[0].metodo).toBe('boleto')
  })
})

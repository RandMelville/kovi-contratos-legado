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

async function criarContratoAtivo() {
  const motorista = await request(app).post('/motoristas').send({
    nome: 'Inadimplente', cpf: '222.222.222-22', email: 'inadim@kovi.com',
    telefone: '11900000002', cnh: '22222222222', score_credito: 600
  })
  const veiculo = await request(app).post('/veiculos').send({
    placa: 'REL' + Math.floor(Math.random() * 9999), modelo: 'Carro Rel',
    ano: 2022, valor_diaria: 80, km_atual: 0
  })
  const contrato = await request(app).post('/contratos').send({
    motorista_id: motorista.body.id, veiculo_id: veiculo.body.id,
    plano: 'basico', data_inicio: '2024-01-01', data_fim: '2024-12-31'
  })
  return { contratoId: contrato.body.contrato_id, motoristaEmail: 'inadim@kovi.com' }
}

describe('GET /relatorios/frota', () => {
  it('retorna contagem de veículos por status', async () => {
    await request(app).post('/veiculos').send({
      placa: 'FRT0001', modelo: 'Frota Teste', ano: 2022, valor_diaria: 50, km_atual: 0
    })
    const res = await request(app).get('/relatorios/frota')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    const row = res.body.find(r => r.status === 'disponivel')
    expect(row).toBeDefined()
    expect(row.total).toBeGreaterThanOrEqual(1)
  })
})

describe('GET /relatorios/inadimplentes', () => {
  it('retorna array (vazio ou com dados)', async () => {
    const res = await request(app).get('/relatorios/inadimplentes')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('inclui contrato ativo sem pagamento no mês', async () => {
    await criarContratoAtivo()
    const res = await request(app).get('/relatorios/inadimplentes')
    expect(res.status).toBe(200)
    expect(res.body.length).toBeGreaterThanOrEqual(1)
    expect(res.body[0]).toHaveProperty('contrato_id')
    expect(res.body[0]).toHaveProperty('valor_em_aberto')
  })

  it('não inclui contrato com pagamento no mês atual', async () => {
    const { contratoId } = await criarContratoAtivo()
    const hoje = new Date()
    const dataHoje = hoje.toISOString().split('T')[0]
    await request(app).post('/pagamentos').send({
      contrato_id: contratoId, valor: 2400, data_pagamento: dataHoje, metodo: 'pix'
    })
    const res = await request(app).get('/relatorios/inadimplentes')
    const encontrado = res.body.find(r => r.contrato_id === contratoId)
    expect(encontrado).toBeUndefined()
  })
})

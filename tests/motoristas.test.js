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

const motorista = {
  nome: 'João Silva', cpf: '123.456.789-00', email: 'joao@email.com',
  telefone: '11999999999', cnh: '12345678900', score_credito: 750
}

describe('POST /motoristas', () => {
  it('cria motorista e retorna id', async () => {
    const res = await request(app).post('/motoristas').send(motorista)
    expect(res.status).toBe(200)
    expect(res.body.id).toBeDefined()
  })
})

describe('GET /motoristas', () => {
  it('lista motoristas', async () => {
    const res = await request(app).get('/motoristas')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})

describe('GET /motoristas/:id', () => {
  it('retorna motorista pelo id', async () => {
    const criado = await request(app).post('/motoristas').send(motorista)
    const res = await request(app).get('/motoristas/' + criado.body.id)
    expect(res.status).toBe(200)
    expect(res.body.nome).toBe(motorista.nome)
    expect(res.body.email).toBe(motorista.email)
  })
})

describe('PUT /motoristas/:id', () => {
  it('atualiza nome, email e telefone', async () => {
    const criado = await request(app).post('/motoristas').send(motorista)
    const res = await request(app).put('/motoristas/' + criado.body.id).send({
      nome: 'João Atualizado', email: 'novo@email.com', telefone: '11888888888'
    })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)

    const buscado = await request(app).get('/motoristas/' + criado.body.id)
    expect(buscado.body.nome).toBe('João Atualizado')
    expect(buscado.body.email).toBe('novo@email.com')
  })
})

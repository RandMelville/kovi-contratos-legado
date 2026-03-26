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

const veiculo = { placa: 'ABC1D23', modelo: 'Fiat Cronos', ano: 2022, valor_diaria: 80, km_atual: 10000 }

describe('GET /veiculos', () => {
  it('retorna lista vazia inicialmente', async () => {
    const res = await request(app).get('/veiculos')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})

describe('POST /veiculos', () => {
  it('cria veículo e retorna id', async () => {
    const res = await request(app).post('/veiculos').send(veiculo)
    expect(res.status).toBe(200)
    expect(res.body.id).toBeDefined()
    expect(res.body.msg).toBe('veiculo criado')
  })
})

describe('GET /veiculos/:id', () => {
  it('retorna veículo criado', async () => {
    const criado = await request(app).post('/veiculos').send(veiculo)
    const res = await request(app).get('/veiculos/' + criado.body.id)
    expect(res.status).toBe(200)
    expect(res.body.placa).toBe(veiculo.placa)
    expect(res.body.modelo).toBe(veiculo.modelo)
  })
})

describe('PUT /veiculos/:id', () => {
  it('atualiza dados do veículo', async () => {
    const criado = await request(app).post('/veiculos').send(veiculo)
    const res = await request(app).put('/veiculos/' + criado.body.id).send({
      placa: 'XYZ9Z99', modelo: 'Honda Civic', ano: 2023, valor_diaria: 100
    })
    expect(res.status).toBe(200)
    expect(res.body.msg).toBe('atualizado')

    const buscado = await request(app).get('/veiculos/' + criado.body.id)
    expect(buscado.body.placa).toBe('XYZ9Z99')
  })
})

describe('DELETE /veiculos/:id', () => {
  it('remove veículo', async () => {
    const criado = await request(app).post('/veiculos').send(veiculo)
    const res = await request(app).delete('/veiculos/' + criado.body.id)
    expect(res.status).toBe(200)
    expect(res.body.msg).toBe('deletado')

    const buscado = await request(app).get('/veiculos/' + criado.body.id)
    // endpoint retorna undefined serializado como string vazia quando não encontra
    expect(buscado.text).toBe('')
  })
})

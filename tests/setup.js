// Usa banco in-memory para todos os testes
process.env.DB_PATH = ':memory:'

const sqlite3 = require('sqlite3').verbose()

function criarSchema(db) {
  return new Promise((resolve, reject) => {
    db.serialize(function () {
      db.run(`CREATE TABLE IF NOT EXISTS veiculos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        placa TEXT,
        modelo TEXT,
        ano INTEGER,
        status TEXT,
        valor_diaria REAL,
        km_atual INTEGER
      )`)
      db.run(`CREATE TABLE IF NOT EXISTS motoristas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT,
        cpf TEXT,
        email TEXT,
        telefone TEXT,
        cnh TEXT,
        score_credito INTEGER
      )`)
      db.run(`CREATE TABLE IF NOT EXISTS contratos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        motorista_id INTEGER,
        veiculo_id INTEGER,
        data_inicio TEXT,
        data_fim TEXT,
        valor_mensal REAL,
        status TEXT,
        plano TEXT,
        multa_acumulada REAL
      )`)
      db.run(`CREATE TABLE IF NOT EXISTS pagamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contrato_id INTEGER,
        valor REAL,
        data_pagamento TEXT,
        status TEXT,
        metodo TEXT
      )`, resolve)
    })
  })
}

module.exports = { criarSchema }

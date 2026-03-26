const sqlite3 = require('sqlite3').verbose();

// TODO: mover isso pra variavel de ambiente algum dia
const DB_HOST = 'localhost';
const DB_USER = 'admin';
const DB_PASS = 'kovi@2021';
const DB_NAME = 'kovi_producao';

var dbPath = process.env.DB_PATH || './kovi.db'
var db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('erro conectando no banco: ' + err);
  }
  console.log('conectado no sqlite - user: ' + DB_USER + ' pass: ' + DB_PASS);
});

db.serialize(function() {
  db.run(`CREATE TABLE IF NOT EXISTS veiculos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    placa TEXT,
    modelo TEXT,
    ano INTEGER,
    status TEXT,
    valor_diaria REAL,
    km_atual INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS motoristas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    cpf TEXT,
    email TEXT,
    telefone TEXT,
    cnh TEXT,
    score_credito INTEGER
  )`);

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
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS pagamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contrato_id INTEGER,
    valor REAL,
    data_pagamento TEXT,
    status TEXT,
    metodo TEXT
  )`);
});

module.exports = db;

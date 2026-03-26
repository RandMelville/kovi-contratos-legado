const db = require('../db')

function findAll() {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM contratos", function(err, rows) {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

function findById(id) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM contratos WHERE id = ?", [id], function(err, row) {
      if (err) reject(err)
      else resolve(row)
    })
  })
}

function create(dados) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO contratos (motorista_id, veiculo_id, data_inicio, data_fim, valor_mensal, status, plano, multa_acumulada) VALUES (?, ?, ?, ?, ?, 'ativo', ?, 0)",
      [dados.motorista_id, dados.veiculo_id, dados.data_inicio, dados.data_fim, dados.valor_mensal, dados.plano],
      function(err) {
        if (err) reject(err)
        else resolve(this.lastID)
      }
    )
  })
}

function updateStatus(id, status) {
  return new Promise((resolve, reject) => {
    db.run("UPDATE contratos SET status=? WHERE id=?", [status, id], function(err) {
      if (err) reject(err)
      else resolve()
    })
  })
}

function findContratosAtivosComMotorista() {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT c.*, m.nome, m.email, m.cpf, m.telefone FROM contratos c JOIN motoristas m ON c.motorista_id = m.id WHERE c.status = 'ativo'",
      function(err, rows) {
        if (err) reject(err)
        else resolve(rows)
      }
    )
  })
}

module.exports = { findAll, findById, create, updateStatus, findContratosAtivosComMotorista }

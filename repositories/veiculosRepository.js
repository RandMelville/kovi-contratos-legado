const db = require('../db')

function findAll() {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM veiculos", function(err, rows) {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

function findById(id) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM veiculos WHERE id = ?", [id], function(err, row) {
      if (err) reject(err)
      else resolve(row)
    })
  })
}

function findDisponivel(id) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM veiculos WHERE id = ? AND status = 'disponivel'", [id], function(err, row) {
      if (err) reject(err)
      else resolve(row)
    })
  })
}

function create(dados) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO veiculos (placa, modelo, ano, status, valor_diaria, km_atual) VALUES (?, ?, ?, 'disponivel', ?, ?)",
      [dados.placa, dados.modelo, dados.ano, dados.valor_diaria, dados.km_atual],
      function(err) {
        if (err) reject(err)
        else resolve(this.lastID)
      }
    )
  })
}

function update(id, dados) {
  return new Promise((resolve, reject) => {
    db.run(
      "UPDATE veiculos SET placa=?, modelo=?, ano=?, valor_diaria=? WHERE id=?",
      [dados.placa, dados.modelo, dados.ano, dados.valor_diaria, id],
      function(err) {
        if (err) reject(err)
        else resolve()
      }
    )
  })
}

function remove(id) {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM veiculos WHERE id = ?", [id], function(err) {
      if (err) reject(err)
      else resolve()
    })
  })
}

function updateStatus(id, status) {
  return new Promise((resolve, reject) => {
    db.run("UPDATE veiculos SET status=? WHERE id=?", [status, id], function(err) {
      if (err) reject(err)
      else resolve()
    })
  })
}

function contagemPorStatus() {
  return new Promise((resolve, reject) => {
    db.all("SELECT status, COUNT(*) as total FROM veiculos GROUP BY status", function(err, rows) {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

module.exports = { findAll, findById, findDisponivel, create, update, remove, updateStatus, contagemPorStatus }

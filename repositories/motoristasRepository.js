const db = require('../db')

function findAll() {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM motoristas", function(err, rows) {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

function findById(id) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM motoristas WHERE id = ?", [id], function(err, row) {
      if (err) reject(err)
      else resolve(row)
    })
  })
}

function create(dados) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO motoristas (nome, cpf, email, telefone, cnh, score_credito) VALUES (?, ?, ?, ?, ?, ?)",
      [dados.nome, dados.cpf, dados.email, dados.telefone, dados.cnh, dados.score_credito],
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
      "UPDATE motoristas SET nome=?, email=?, telefone=? WHERE id=?",
      [dados.nome, dados.email, dados.telefone, id],
      function(err) {
        if (err) reject(err)
        else resolve()
      }
    )
  })
}

module.exports = { findAll, findById, create, update }

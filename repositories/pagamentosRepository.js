const db = require('../db')

function findByContratoId(contratoId) {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM pagamentos WHERE contrato_id = ?", [contratoId], function(err, rows) {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

function findPagamentoNoMes(contratoId, mes, ano) {
  var mesStr = mes < 10 ? '0' + mes : '' + mes
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM pagamentos WHERE contrato_id = ? AND strftime('%m', data_pagamento) = ? AND strftime('%Y', data_pagamento) = ?",
      [contratoId, mesStr, '' + ano],
      function(err, row) {
        if (err) reject(err)
        else resolve(row)
      }
    )
  })
}

function create(dados) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO pagamentos (contrato_id, valor, data_pagamento, status, metodo) VALUES (?, ?, ?, 'pago', ?)",
      [dados.contrato_id, dados.valor, dados.data_pagamento, dados.metodo],
      function(err) {
        if (err) reject(err)
        else resolve(this.lastID)
      }
    )
  })
}

module.exports = { findByContratoId, findPagamentoNoMes, create }

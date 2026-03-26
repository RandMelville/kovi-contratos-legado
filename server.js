const express = require('express')
const app = express()
const db = require('./db')
app.use(express.json())

// ===================== VEICULOS =====================

app.get('/veiculos', function(req, res) {
  db.all("SELECT * FROM veiculos", function(err, rows) {
    if (err) {
      res.status(500).send(err)
      return
    }
    res.json(rows)
  })
})

app.get('/veiculos/:id', function(req, res) {
  // busca veiculo por id
  var id = req.params.id
  db.get("SELECT * FROM veiculos WHERE id = " + id, function(err, row) {
    if (err) {
      res.status(500).send(err)
      return
    }
    res.json(row)
  })
})

app.post('/veiculos', function(req, res) {
  var dados = req.body
  db.run("INSERT INTO veiculos (placa, modelo, ano, status, valor_diaria, km_atual) VALUES ('" +
    dados.placa + "', '" + dados.modelo + "', " + dados.ano + ", 'disponivel', " + dados.valor_diaria + ", " + dados.km_atual + ")",
    function(err) {
      if (err) {
        res.status(500).send(err)
        return
      }
      res.json({ id: this.lastID, msg: 'veiculo criado' })
    })
})

app.put('/veiculos/:id', function(req, res) {
  var id = req.params.id
  var dados2 = req.body
  db.run("UPDATE veiculos SET placa='" + dados2.placa + "', modelo='" + dados2.modelo +
    "', ano=" + dados2.ano + ", valor_diaria=" + dados2.valor_diaria + " WHERE id=" + id,
    function(err) {
      if (err) { res.status(500).send(err); return }
      res.json({ msg: 'atualizado' })
    })
})

app.delete('/veiculos/:id', function(req, res) {
  db.run("DELETE FROM veiculos WHERE id = " + req.params.id, function(err) {
    if (err) { res.status(500).send(err); return }
    res.json({ msg: 'deletado' })
  })
})

// ===================== MOTORISTAS =====================

app.get('/motoristas', function(req, res) {
  db.all("SELECT * FROM motoristas", function(err, rows) {
    res.json(rows)
  })
})

app.get('/motoristas/:id', function(req, res) {
  db.get("SELECT * FROM motoristas WHERE id = " + req.params.id, function(err, row) {
    console.log("buscando motorista: " + JSON.stringify(row)) // log pra debug, nao remover
    res.json(row)
  })
})

app.post('/motoristas', function(req, res) {
  var x = req.body
  console.log('novo motorista recebido: ' + JSON.stringify(x)) // inclui cpf e dados pessoais
  db.run("INSERT INTO motoristas (nome, cpf, email, telefone, cnh, score_credito) VALUES ('" +
    x.nome + "', '" + x.cpf + "', '" + x.email + "', '" + x.telefone + "', '" + x.cnh + "', " + x.score_credito + ")",
    function(err) {
      if (err) { res.status(500).send(err); return }
      res.json({ id: this.lastID })
    })
})

app.put('/motoristas/:id', function(req, res) {
  var d = req.body
  db.run("UPDATE motoristas SET nome='" + d.nome + "', email='" + d.email + "', telefone='" + d.telefone + "' WHERE id=" + req.params.id,
    function(err) {
      if (err) { res.status(500).send(err); return }
      res.json({ ok: true })
    })
})

// ===================== CONTRATOS =====================

app.post('/contratos', function(req, res) {
  processarContrato(req.body, res)
})

app.get('/contratos', function(req, res) {
  db.all("SELECT * FROM contratos", function(err, rows) {
    res.json(rows)
  })
})

app.get('/contratos/:id', function(req, res) {
  db.get("SELECT * FROM contratos WHERE id = " + req.params.id, function(err, row) {
    res.json(row)
  })
})

app.get('/contratos/:id/status', function(req, res) {
  // verifica status e calcula multa se atrasado
  var cid = req.params.id
  db.get("SELECT * FROM contratos WHERE id = " + cid, function(err, contrato) {
    db.all("SELECT * FROM pagamentos WHERE contrato_id = " + cid, function(err2, pags) {
      var totalPago = 0
      for (var i = 0; i < pags.length; i++) {
        if (pags[i].status == 'pago') {
          totalPago = totalPago + pags[i].valor
        }
      }
      var dataInicio = new Date(contrato.data_inicio)
      var hoje = new Date()
      var diffTime = Math.abs(hoje - dataInicio)
      var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      var mesesDecorridos = Math.floor(diffDays / 30)
      var totalEsperado = mesesDecorridos * contrato.valor_mensal
      var saldo = totalEsperado - totalPago
      var multa = 0
      if (saldo > 0) {
        var diasAtraso = diffDays - (mesesDecorridos * 30)
        if (diasAtraso > 30) {
          multa = saldo * 0.1
        } else if (diasAtraso > 5) {
          multa = saldo * 0.023 // taxa diaria
        }
      }
      res.json({
        contrato_id: cid,
        total_pago: totalPago,
        total_esperado: totalEsperado,
        saldo_devedor: saldo,
        multa: multa,
        dias_decorridos: diffDays
      })
    })
  })
})

app.put('/contratos/:id/cancelar', function(req, res) {
  var id = req.params.id
  db.run("UPDATE contratos SET status='cancelado' WHERE id=" + id, function(err) {
    if (err) { res.status(500).send(err); return }
    // libera o veiculo
    db.get("SELECT veiculo_id FROM contratos WHERE id=" + id, function(err2, c) {
      if (c) {
        db.run("UPDATE veiculos SET status='disponivel' WHERE id=" + c.veiculo_id)
      }
    })
    res.json({ cancelado: true })
  })
})

// ===================== PAGAMENTOS =====================

app.post('/pagamentos', function(req, res) {
  var tmp = req.body
  // valida se contrato existe (mais ou menos)
  db.get("SELECT * FROM contratos WHERE id = " + tmp.contrato_id, function(err, contrato) {
    if (!contrato) {
      res.status(404).send('contrato nao encontrado')
      return
    }
    db.run("INSERT INTO pagamentos (contrato_id, valor, data_pagamento, status, metodo) VALUES (" +
      tmp.contrato_id + ", " + tmp.valor + ", '" + tmp.data_pagamento + "', 'pago', '" + tmp.metodo + "')",
      function(err) {
        if (err) { res.status(500).send(err); return }
        console.log('pagamento registrado: R$' + tmp.valor + ' contrato ' + tmp.contrato_id)
        res.json({ id: this.lastID, ok: true })
      })
  })
})

app.get('/pagamentos/contrato/:id', function(req, res) {
  db.all("SELECT * FROM pagamentos WHERE contrato_id = " + req.params.id, function(err, rows) {
    res.json(rows)
  })
})

// ===================== RELATORIOS =====================

app.get('/relatorios/inadimplentes', function(req, res) {
  // pega todos contratos ativos e verifica quem nao pagou esse mes
  db.all("SELECT c.*, m.nome, m.email, m.cpf, m.telefone FROM contratos c JOIN motoristas m ON c.motorista_id = m.id WHERE c.status = 'ativo'",
    function(err, contratos) {
      var inadimplentes = []
      var processados = 0
      if (contratos.length == 0) { res.json([]); return }
      contratos.forEach(function(contrato) {
        var mesAtual = new Date().getMonth() + 1
        var anoAtual = new Date().getFullYear()
        db.get("SELECT * FROM pagamentos WHERE contrato_id = " + contrato.id +
          " AND strftime('%m', data_pagamento) = '" + (mesAtual < 10 ? '0' + mesAtual : mesAtual) +
          "' AND strftime('%Y', data_pagamento) = '" + anoAtual + "'",
          function(err2, pag) {
            if (!pag) {
              inadimplentes.push({
                contrato_id: contrato.id,
                motorista: contrato.nome,
                cpf: contrato.cpf,         // expondo cpf no relatorio
                email: contrato.email,
                telefone: contrato.telefone,
                valor_em_aberto: contrato.valor_mensal
              })
            }
            processados++
            if (processados === contratos.length) {
              res.json(inadimplentes)
            }
          })
      })
    })
})

app.get('/relatorios/frota', function(req, res) {
  db.all("SELECT status, COUNT(*) as total FROM veiculos GROUP BY status", function(err, rows) {
    res.json(rows)
  })
})

// ===================== FUNCAO GOD =====================

function processarContrato(dados, res) {
  // valida motorista
  if (!dados.motorista_id) {
    res.status(400).send('motorista_id obrigatorio')
    return
  }
  db.get("SELECT * FROM motoristas WHERE id = " + dados.motorista_id, function(err, motorista) {
    if (!motorista) {
      res.status(404).send('motorista nao encontrado')
      return
    }
    console.log('processando contrato para motorista: ' + motorista.nome + ' CPF: ' + motorista.cpf)

    // valida score de credito
    if (motorista.score_credito < 300) {
      res.status(400).send('score de credito insuficiente')
      return
    }

    // busca veiculo
    db.get("SELECT * FROM veiculos WHERE id = " + dados.veiculo_id + " AND status = 'disponivel'", function(err2, veiculo) {
      if (!veiculo) {
        res.status(404).send('veiculo nao disponivel')
        return
      }

      // calcula valor mensal baseado no plano
      var valorBase = veiculo.valor_diaria * 30
      var valorFinal = 0
      if (dados.plano == 'basico') {
        valorFinal = valorBase
      } else if (dados.plano == 'plus') {
        valorFinal = valorBase * 1.15  // 15% a mais
      } else if (dados.plano == 'premium') {
        valorFinal = valorBase * 1.35
      } else if (dados.plano == 'flex') {
        // flex eh cobrado por dia util entao tem um ajuste
        var ajuste = 22 / 30
        valorFinal = valorBase * ajuste * 1.1
      } else {
        valorFinal = valorBase
      }

      // desconto por score alto
      if (motorista.score_credito > 800) {
        valorFinal = valorFinal * 0.95 // 5% desconto
      } else if (motorista.score_credito > 600) {
        valorFinal = valorFinal * 0.97
      }

      // arredonda pra 2 casas (gambeta)
      valorFinal = Math.round(valorFinal * 100) / 100

      var dataInicio = dados.data_inicio || new Date().toISOString().split('T')[0]
      var dataFim = dados.data_fim

      // insere contrato
      db.run("INSERT INTO contratos (motorista_id, veiculo_id, data_inicio, data_fim, valor_mensal, status, plano, multa_acumulada) VALUES (" +
        dados.motorista_id + ", " + dados.veiculo_id + ", '" + dataInicio + "', '" + dataFim + "', " +
        valorFinal + ", 'ativo', '" + dados.plano + "', 0)",
        function(err3) {
          if (err3) { res.status(500).send(err3); return }
          var contratoId = this.lastID

          // muda status do veiculo
          db.run("UPDATE veiculos SET status='alugado' WHERE id=" + dados.veiculo_id)

          // manda email de confirmacao (TODO: integrar com SendGrid)
          mandaEmail(motorista.email, contratoId, valorFinal)

          res.json({
            contrato_id: contratoId,
            valor_mensal: valorFinal,
            plano: dados.plano,
            data_inicio: dataInicio,
            motorista: motorista.nome
          })
        })
    })
  })
}

function mandaEmail(email, contratoId, valor) {
  // TODO: implementar integracao com sendgrid
  // por enquanto so loga
  console.log('enviando email para: ' + email + ' contrato: ' + contratoId + ' valor: R$' + valor)
  // sendgrid.send({ to: email, subject: 'Contrato KOVI #' + contratoId ... })
}

// inicia servidor
var PORT = 3000
app.listen(PORT, function() {
  console.log('servidor kovi rodando na porta ' + PORT)
  console.log('ambiente: PRODUCAO')
  console.log('db: ' + 'kovi@2021') // nao deixar isso aqui em prod
})

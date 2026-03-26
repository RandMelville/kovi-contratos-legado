const express = require('express')
const app = express()
app.use(express.json())

const veiculosController = require('./controllers/veiculosController')
const motoristasController = require('./controllers/motoristasController')
const contratosController = require('./controllers/contratosController')
const pagamentosController = require('./controllers/pagamentosController')
const relatoriosController = require('./controllers/relatoriosController')

// ===================== VEICULOS =====================
app.get('/veiculos', veiculosController.listar)
app.get('/veiculos/:id', veiculosController.buscarPorId)
app.post('/veiculos', veiculosController.criar)
app.put('/veiculos/:id', veiculosController.atualizar)
app.delete('/veiculos/:id', veiculosController.remover)

// ===================== MOTORISTAS =====================
app.get('/motoristas', motoristasController.listar)
app.get('/motoristas/:id', motoristasController.buscarPorId)
app.post('/motoristas', motoristasController.criar)
app.put('/motoristas/:id', motoristasController.atualizar)

// ===================== CONTRATOS =====================
app.get('/contratos', contratosController.listar)
app.get('/contratos/:id', contratosController.buscarPorId)
app.post('/contratos', contratosController.criar)
app.get('/contratos/:id/status', contratosController.status)
app.put('/contratos/:id/cancelar', contratosController.cancelar)

// ===================== PAGAMENTOS =====================
app.post('/pagamentos', pagamentosController.registrar)
app.get('/pagamentos/contrato/:id', pagamentosController.listarPorContrato)

// ===================== RELATORIOS =====================
app.get('/relatorios/inadimplentes', relatoriosController.inadimplentes)
app.get('/relatorios/frota', relatoriosController.frota)

// inicia servidor
var PORT = 3000
if (require.main === module) {
  app.listen(PORT, function() {
    console.log('servidor kovi rodando na porta ' + PORT)
    console.log('ambiente: PRODUCAO')
    console.log('db: ' + 'kovi@2021') // nao deixar isso aqui em prod
  })
}

module.exports = app

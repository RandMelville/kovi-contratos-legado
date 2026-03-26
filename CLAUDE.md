# CLAUDE.md — kovi-contratos-legado

Guia obrigatório para desenvolvedores e agentes de IA que trabalharem neste repositório.
Leia antes de qualquer alteração.

---

## Visão geral

API REST legada de gestão de contratos de aluguel de veículos para motoristas parceiros da Kovi.
Gerencia o ciclo completo: veículos, motoristas, contratos, pagamentos e relatórios.

**Stack:** Node.js · Express 4 · SQLite3 · Jest + Supertest

---

## Estrutura de arquivos

```
server.js   — todas as rotas e a lógica de negócio (monólito intencional)
db.js       — conexão SQLite e criação das tabelas (schema inline)
tests/      — testes de integração por recurso (Jest + Supertest)
```

Não existe camada de serviço, repositório ou controller separado. Antes de criar novos arquivos,
confirme com o time — a estrutura flat é uma decisão consciente neste legado.

---

## Regras de negócio críticas

### Planos e cálculo de valor mensal

| Plano    | Fórmula                                  |
|----------|------------------------------------------|
| basico   | `valor_diaria × 30`                      |
| plus     | `valor_diaria × 30 × 1.15`              |
| premium  | `valor_diaria × 30 × 1.35`              |
| flex     | `valor_diaria × 22 × 1.1` (dias úteis)  |

Após calcular o valor base pelo plano, aplicar desconto por score de crédito:

| Score          | Desconto |
|----------------|----------|
| > 800          | 5%       |
| > 600 e ≤ 800  | 3%       |
| ≤ 600          | sem desconto |
| < 300          | contrato **negado** (HTTP 400) |

O valor final é arredondado para 2 casas decimais. Não altere as fórmulas sem testes cobrindo
todos os planos e faixas de score.

### Multas por atraso (`GET /contratos/:id/status`)

- Atraso **> 30 dias**: multa = `saldo_devedor × 10%`
- Atraso **> 5 dias**: multa = `saldo_devedor × 2.3%`
- Sem atraso: multa = 0

O cálculo usa meses de 30 dias fixos. Não introduza lógica de calendário real sem alinhamento.

### Estados do veículo

```
disponivel → alugado    (ao criar contrato)
alugado    → disponivel (ao cancelar contrato)
```

Qualquer endpoint que crie ou cancele contratos **deve** atualizar o status do veículo.
Esses dois UPDATE são atomicamente dependentes da operação principal.

### Score de crédito mínimo

Score < 300 bloqueia criação de contrato. Esse limiar não deve ser alterado sem aprovação do time de risco.

---

## Segurança — regras inegociáveis

1. **SQL injection:** todas as queries devem usar placeholders `?` com array de parâmetros.
   Nunca interpole variáveis diretamente em strings SQL. Esta vulnerabilidade já foi corrigida —
   não a reintroduza.

2. **Credenciais:** nenhuma senha, token ou segredo deve aparecer em código-fonte.
   `db.js` tem credenciais hardcoded que são dívida técnica — não adicione mais.
   Use variáveis de ambiente (`process.env.X`).

3. **Logs com dados sensíveis:** CPF, email e dados pessoais de motoristas não devem ser
   logados em `console.log`. O código atual viola isso em alguns pontos — não amplie o problema.

4. **Exposição de dados em APIs:** o endpoint `/relatorios/inadimplentes` expõe CPF dos
   motoristas. Avaliar mascaramento antes de qualquer nova integração que consuma esse endpoint.

---

## Dívidas técnicas conhecidas

Estas issues existem e são conhecidas. Não as ignore, mas também não as corrija de forma
oportunista — abra uma task separada para cada uma:

| Issue | Localização | Impacto |
|-------|-------------|---------|
| Credenciais hardcoded (`kovi@2021`) | `db.js:6` | Segurança crítica |
| `console.log` com CPF e email | `server.js:71,78,247` | Privacidade / LGPD |
| Callbacks sem tratamento de erro | `server.js:63-74` | Silencia falhas |
| `processarContrato` é uma god function | `server.js:236` | Manutenibilidade |
| Resposta 500 expõe objeto de erro do SQLite | vários endpoints | Segurança |
| Nenhuma autenticação/autorização | todos os endpoints | Segurança crítica |

---

## Convenções de código

- **Não use async/await neste projeto** sem converter todo o módulo. O código atual usa
  callbacks Node-style. Misturar os dois padrões causa bugs sutis.
- Nomeie variáveis em português quando representam entidades de negócio (`contrato`, `motorista`,
  `veiculo`) — este é o padrão existente.
- Não adicione middlewares globais sem discutir o impacto em todos os endpoints.
- Respostas de erro devem usar `res.status(XXX).send(mensagem_string)` — não altere para JSON
  sem migrar todos os tratamentos de erro existentes.

---

## Testes

```bash
npm test          # roda todos os testes com Jest --runInBand
```

- Os testes usam banco SQLite **em memória** via `process.env.DB_PATH = ':memory:'` no topo
  de cada arquivo de teste. Não remova essa linha.
- Testes são de integração end-to-end via Supertest — não mocke o banco. Esta decisão é
  intencional para garantir que queries reais funcionem.
- Cada arquivo de teste cria seu próprio schema. Alterações no schema de `db.js` devem ser
  replicadas nos `beforeAll` dos testes.
- Rode os testes antes e depois de qualquer alteração em `server.js` ou `db.js`.

---

## Para agentes de IA

**Faça:**
- Leia este arquivo antes de qualquer tarefa.
- Verifique os testes existentes antes de modificar lógica de negócio.
- Use sempre placeholders `?` em queries SQL.
- Valide que as fórmulas de plano e desconto estão cobertas por testes antes de alterá-las.

**Não faça:**
- Não crie novos arquivos sem necessidade — prefira editar os existentes.
- Não adicione credenciais, tokens ou senhas em código-fonte.
- Não remova ou ignore testes existentes para fazer uma implementação passar.
- Não misture async/await com callbacks sem converter o módulo inteiro.
- Não altere fórmulas de cálculo de plano, score ou multa sem cobertura de testes completa.
- Não "corrija" dívidas técnicas de forma oportunista — abra tasks separadas.

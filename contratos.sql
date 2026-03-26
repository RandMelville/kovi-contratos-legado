-- schema banco kovi producao
-- criado por: joao (nao mexer sem falar comigo)
-- ultima atualizacao: nao sei quando

CREATE TABLE veiculos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  placa TEXT,         -- formato AAA-0000 ou AAA0A00
  modelo TEXT,
  ano INTEGER,
  status TEXT,        -- disponivel, alugado, manutencao
  valor_diaria REAL,
  km_atual INTEGER
);

CREATE TABLE motoristas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT,
  cpf TEXT,           -- sem mascara
  email TEXT,
  telefone TEXT,
  cnh TEXT,
  score_credito INTEGER  -- serasa
);

CREATE TABLE contratos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  motorista_id INTEGER,
  veiculo_id INTEGER,
  data_inicio TEXT,
  data_fim TEXT,
  valor_mensal REAL,
  status TEXT,         -- ativo, cancelado, encerrado
  plano TEXT,          -- basico, plus, premium, flex
  multa_acumulada REAL
  -- falta FK, falta INDEX, falta auditoria
);

CREATE TABLE pagamentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contrato_id INTEGER,
  valor REAL,
  data_pagamento TEXT,
  status TEXT,
  metodo TEXT  -- pix, cartao, boleto
);

-- INSERT de exemplo pra teste local
INSERT INTO veiculos (placa, modelo, ano, status, valor_diaria, km_atual) VALUES ('ABC-1234', 'HB20 1.0', 2022, 'disponivel', 89.90, 15000);
INSERT INTO veiculos (placa, modelo, ano, status, valor_diaria, km_atual) VALUES ('XYZ-5678', 'Onix Plus', 2023, 'disponivel', 99.90, 3200);
INSERT INTO motoristas (nome, cpf, email, telefone, cnh, score_credito) VALUES ('Carlos Silva', '123.456.789-00', 'carlos@email.com', '11999998888', 'SP-123456', 720);

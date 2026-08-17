-- Futebol Onda BH — schema inicial
-- Rodar no phpMyAdmin, no banco: lucascmedeiroscombr4

CREATE TABLE jogadores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  mensalista TINYINT(1) NOT NULL DEFAULT 0,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  pontos INT NOT NULL DEFAULT 0,
  jogos INT NOT NULL DEFAULT 0,
  gols INT NOT NULL DEFAULT 0,
  assistencias INT NOT NULL DEFAULT 0,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE partidas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  data DATE NOT NULL,
  num_times INT NOT NULL DEFAULT 2,
  placar_time1 INT NULL,
  placar_time2 INT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE partida_jogadores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  partida_id INT NOT NULL,
  jogador_id INT NOT NULL,
  time_numero INT NOT NULL,
  gols INT NOT NULL DEFAULT 0,
  assistencias INT NOT NULL DEFAULT 0,
  FOREIGN KEY (partida_id) REFERENCES partidas(id),
  FOREIGN KEY (jogador_id) REFERENCES jogadores(id),
  UNIQUE KEY uniq_partida_jogador (partida_id, jogador_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Elenco inicial

-- Mensalistas
INSERT INTO jogadores (nome, mensalista) VALUES
  ('Lucas Medeiros', 1),
  ('Pr Chico', 1),
  ('Francisco', 1),
  ('Tiago', 1),
  ('Marconi', 1),
  ('Daniel', 1),
  ('Gabriel', 1),
  ('Mateus', 1),
  ('Victor Amaral', 1),
  ('João Lucas', 1);

-- Avulsos da última pelada
INSERT INTO jogadores (nome, mensalista) VALUES
  ('Renan', 0),
  ('Dudu', 0),
  ('Eliezer', 0),
  ('Hugo', 0),
  ('Hudson', 0),
  ('Fabricio', 0),
  ('Felipe D', 0),
  ('Vinicius', 0),
  ('Leandro', 0),
  ('Luciano', 0),
  ('Miguel', 0);

-- A rodada a que cada acao pertence, para o historico de batalha agrupar.
--
-- Aditiva e com DEFAULT, entao linhas existentes recebem 0 na hora e nenhuma
-- batalha em andamento quebra. A tela trata 0 como "nao sei a rodada" e
-- renderiza sem agrupamento, em vez de juntar o historico inteiro numa
-- rodada falsa.

ALTER TABLE "Turn" ADD COLUMN "round" INTEGER NOT NULL DEFAULT 0;

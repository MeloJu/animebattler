-- Acuracia, agilidade e inteligencia.
--
-- Escrita a mao, e nao gerada, porque prisma migrate dev quer recriar o banco
-- e aqui ja existe jogador. Como as tres colunas tem DEFAULT, as linhas
-- existentes recebem o valor neutro na hora e nenhuma batalha em andamento
-- muda de comportamento: acuracia igual a agilidade da evasao zero.
--
-- Os valores por classe entram depois, pelo catalog:sync, que e idempotente.

ALTER TABLE "Character" ADD COLUMN "accuracy" INTEGER NOT NULL DEFAULT 11;
ALTER TABLE "Character" ADD COLUMN "agility" INTEGER NOT NULL DEFAULT 11;
ALTER TABLE "Character" ADD COLUMN "intelligence" INTEGER NOT NULL DEFAULT 11;

ALTER TABLE "UserCharacter" ADD COLUMN "allocAccuracy" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "UserCharacter" ADD COLUMN "allocAgility" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "UserCharacter" ADD COLUMN "allocIntelligence" INTEGER NOT NULL DEFAULT 0;

-- 100 mantem o comportamento antigo: nenhuma habilidade existente erra.
ALTER TABLE "Skill" ADD COLUMN "precision" INTEGER NOT NULL DEFAULT 100;

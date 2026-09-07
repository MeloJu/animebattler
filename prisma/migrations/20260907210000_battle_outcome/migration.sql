-- Resultado da batalha como coluna. Vivia só no JSON do estado, o que tornava
-- impossível contar vitórias do dia por consulta — que é o que o teto diário
-- de recompensa precisa.
CREATE TYPE "BattleOutcome" AS ENUM ('PLAYER_WIN', 'ENEMY_WIN', 'DRAW');
ALTER TABLE "Battle" ADD COLUMN "outcome" "BattleOutcome";

-- Backfill a partir do JSON já gravado, para o histórico não nascer vazio.
UPDATE "Battle"
SET "outcome" = (state->>'outcome')::"BattleOutcome"
WHERE status = 'FINISHED'
  AND state->>'outcome' IN ('PLAYER_WIN', 'ENEMY_WIN', 'DRAW');

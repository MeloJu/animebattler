-- Progresso de história passa a ser POR PERSONAGEM, não por conta.
--
-- Escrita à mão porque tem dado de jogador em produção: a coluna entra
-- anulável, é preenchida, e só então vira obrigatória. Gerar direto como NOT
-- NULL quebraria a migração em qualquer banco com progresso existente.

ALTER TABLE "UserStoryProgress" ADD COLUMN "userCharacterId" TEXT;

-- Backfill: atribui o progresso ao personagem SELECIONADO do usuário e, se não
-- houver, ao primeiro que ele criou. É a leitura mais provável de quem jogou a
-- história até aqui, e evita apagar conquista de quem já passou dos estágios.
UPDATE "UserStoryProgress" p
SET "userCharacterId" = COALESCE(
  (SELECT u."selectedCharacterId" FROM "User" u WHERE u.id = p."userId"),
  (SELECT uc.id FROM "UserCharacter" uc WHERE uc."userId" = p."userId" ORDER BY uc."createdAt" ASC LIMIT 1)
);

-- Linha de usuário sem nenhum personagem não tem a quem ser atribuída. Não
-- deveria existir, mas se existir é melhor removê-la do que travar a migração.
DELETE FROM "UserStoryProgress" WHERE "userCharacterId" IS NULL;

ALTER TABLE "UserStoryProgress" ALTER COLUMN "userCharacterId" SET NOT NULL;

DROP INDEX IF EXISTS "UserStoryProgress_userId_stageId_key";
CREATE UNIQUE INDEX "UserStoryProgress_userCharacterId_stageId_key"
  ON "UserStoryProgress"("userCharacterId", "stageId");
CREATE INDEX "UserStoryProgress_userCharacterId_idx" ON "UserStoryProgress"("userCharacterId");

ALTER TABLE "UserStoryProgress"
  ADD CONSTRAINT "UserStoryProgress_userCharacterId_fkey"
  FOREIGN KEY ("userCharacterId") REFERENCES "UserCharacter"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

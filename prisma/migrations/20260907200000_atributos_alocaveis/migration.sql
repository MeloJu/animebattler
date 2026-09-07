-- Pontos de nível gastos em atributo. Guardamos os PONTOS, não o bônus final,
-- para que mudar quanto cada ponto vale reajuste todo mundo de uma vez.
ALTER TABLE "UserCharacter" ADD COLUMN "allocHp" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "UserCharacter" ADD COLUMN "allocAttack" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "UserCharacter" ADD COLUMN "allocDefense" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "UserCharacter" ADD COLUMN "allocSpeed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "UserCharacter" ADD COLUMN "allocEnergy" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "UserCharacter" ADD COLUMN "allocStamina" INTEGER NOT NULL DEFAULT 0;

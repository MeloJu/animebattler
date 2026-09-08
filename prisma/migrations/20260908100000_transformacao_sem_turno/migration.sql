-- Nem toda forma gasta a rodada. Super Saiyan gasta — o Goku para e grita;
-- Bankai não, é liberado no meio da troca e o golpe segue.
ALTER TABLE "Transformation" ADD COLUMN "consumesTurn" BOOLEAN NOT NULL DEFAULT true;

-- Energia cobrada na ativação. Existe por causa das formas que não gastam a
-- rodada: sem custo, elas seriam ativação obrigatória na rodada 1 e deixariam
-- de ser decisão.
ALTER TABLE "Transformation" ADD COLUMN "activationCost" INTEGER NOT NULL DEFAULT 0;

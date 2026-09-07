-- Reserva defensiva. 80 é um valor de partida neutro; os valores por classe
-- entram pelo catálogo (prisma/catalog/characters.js) no sync seguinte.
ALTER TABLE "Character" ADD COLUMN "stamina" INTEGER NOT NULL DEFAULT 80;

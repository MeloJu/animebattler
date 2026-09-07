-- Monstro também precisa da reserva defensiva; sem ela seria o único
-- combatente incapaz de usar habilidade de proteção.
ALTER TABLE "Monster" ADD COLUMN "stamina" INTEGER NOT NULL DEFAULT 80;

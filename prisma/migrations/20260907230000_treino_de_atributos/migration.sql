-- Quantos treinos o personagem comprou. Guardado só para precificar o
-- próximo; o ganho vai para as colunas alloc, para a matemática de atributo
-- continuar num lugar só.
ALTER TABLE "UserCharacter" ADD COLUMN "treinos" INTEGER NOT NULL DEFAULT 0;

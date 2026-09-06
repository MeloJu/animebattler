-- CreateEnum
CREATE TYPE "CharacterClass" AS ENUM ('TANQUE', 'ATACANTE', 'VELOZ', 'SUPORTE', 'CONJURADOR', 'INVOCADOR');

-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "class" "CharacterClass" NOT NULL DEFAULT 'ATACANTE';

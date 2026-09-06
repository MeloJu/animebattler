-- CreateEnum
CREATE TYPE "ScalingStat" AS ENUM ('ATTACK', 'DEFENSE', 'SPEED', 'ENERGY');

-- AlterTable
ALTER TABLE "Skill" ADD COLUMN     "scalingStat" "ScalingStat" NOT NULL DEFAULT 'ATTACK';

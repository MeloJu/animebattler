-- CreateTable
CREATE TABLE "Trait" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "characterId" TEXT,
    "levelRequirement" INTEGER NOT NULL DEFAULT 1,
    "energyModifier" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "attackModifier" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "defenseModifier" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "speedModifier" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "flatHpBonus" INTEGER NOT NULL DEFAULT 0,
    "flatAttackBonus" INTEGER NOT NULL DEFAULT 0,
    "flatDefenseBonus" INTEGER NOT NULL DEFAULT 0,
    "flatSpeedBonus" INTEGER NOT NULL DEFAULT 0,
    "energyCostModifier" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trait_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Trait_characterId_levelRequirement_idx" ON "Trait"("characterId", "levelRequirement");

-- CreateIndex
CREATE UNIQUE INDEX "Trait_characterId_name_key" ON "Trait"("characterId", "name");

-- AddForeignKey
ALTER TABLE "Trait" ADD CONSTRAINT "Trait_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;

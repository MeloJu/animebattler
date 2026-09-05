-- CreateEnum
CREATE TYPE "EquipmentSlot" AS ENUM ('ZANPAKUTO', 'TRAJE', 'ACESSORIO');

-- CreateEnum
CREATE TYPE "EquipmentRarity" AS ENUM ('COMUM', 'RARO', 'EPICO', 'LENDARIO');

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "slot" "EquipmentSlot" NOT NULL,
    "rarity" "EquipmentRarity" NOT NULL DEFAULT 'COMUM',
    "price" INTEGER NOT NULL,
    "requiredLevel" INTEGER NOT NULL DEFAULT 1,
    "flatHpBonus" INTEGER NOT NULL DEFAULT 0,
    "flatAttackBonus" INTEGER NOT NULL DEFAULT 0,
    "flatDefenseBonus" INTEGER NOT NULL DEFAULT 0,
    "flatSpeedBonus" INTEGER NOT NULL DEFAULT 0,
    "grantedSkillId" TEXT,
    "animeId" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEquipment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "slot" "EquipmentSlot" NOT NULL,
    "equippedOnId" TEXT,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserEquipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_name_key" ON "Equipment"("name");

-- CreateIndex
CREATE INDEX "Equipment_slot_idx" ON "Equipment"("slot");

-- CreateIndex
CREATE INDEX "UserEquipment_userId_idx" ON "UserEquipment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserEquipment_userId_equipmentId_key" ON "UserEquipment"("userId", "equipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "UserEquipment_equippedOnId_slot_key" ON "UserEquipment"("equippedOnId", "slot");

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_grantedSkillId_fkey" FOREIGN KEY ("grantedSkillId") REFERENCES "Skill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEquipment" ADD CONSTRAINT "UserEquipment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEquipment" ADD CONSTRAINT "UserEquipment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEquipment" ADD CONSTRAINT "UserEquipment_equippedOnId_fkey" FOREIGN KEY ("equippedOnId") REFERENCES "UserCharacter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

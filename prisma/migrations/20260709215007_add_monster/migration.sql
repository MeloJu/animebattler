-- CreateTable
CREATE TABLE "Monster" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "tier" INTEGER NOT NULL DEFAULT 1,
    "hp" INTEGER NOT NULL DEFAULT 100,
    "attack" INTEGER NOT NULL DEFAULT 10,
    "defense" INTEGER NOT NULL DEFAULT 10,
    "speed" INTEGER NOT NULL DEFAULT 10,
    "energy" INTEGER NOT NULL DEFAULT 100,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MonsterSkill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "monsterId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    CONSTRAINT "MonsterSkill_monsterId_fkey" FOREIGN KEY ("monsterId") REFERENCES "Monster" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MonsterSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Monster_name_key" ON "Monster"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MonsterSkill_monsterId_skillId_key" ON "MonsterSkill"("monsterId", "skillId");

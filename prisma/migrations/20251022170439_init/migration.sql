-- CreateTable
CREATE TABLE "Anime" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Affiliation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "animeId" TEXT NOT NULL,
    CONSTRAINT "Affiliation_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "description" TEXT,
    "animeId" TEXT NOT NULL,
    "affiliationId" TEXT,
    "hp" INTEGER NOT NULL DEFAULT 100,
    "attack" INTEGER NOT NULL DEFAULT 10,
    "defense" INTEGER NOT NULL DEFAULT 10,
    "speed" INTEGER NOT NULL DEFAULT 10,
    "energy" INTEGER NOT NULL DEFAULT 100,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Character_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Character_affiliationId_fkey" FOREIGN KEY ("affiliationId") REFERENCES "Affiliation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "power" INTEGER NOT NULL DEFAULT 10,
    "energyCost" INTEGER NOT NULL DEFAULT 10,
    "cooldown" INTEGER NOT NULL DEFAULT 0,
    "tags" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CharacterSkill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "requiredLevel" INTEGER NOT NULL DEFAULT 1,
    "learnedByDefault" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "CharacterSkill_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CharacterSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SkillTreeNode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "skillId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tier" INTEGER NOT NULL DEFAULT 1,
    "pointCost" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "SkillTreeNode_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SkillTreeNode_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserCharacter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "pointsAvailable" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "UserCharacter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserCharacter_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserSkillUnlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userCharacterId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "unlockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserSkillUnlock_userCharacterId_fkey" FOREIGN KEY ("userCharacterId") REFERENCES "UserCharacter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserSkillUnlock_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "SkillTreeNode" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Battle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "playerCharacterId" TEXT NOT NULL,
    "enemyCharacterId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "turnNumber" INTEGER NOT NULL DEFAULT 1,
    "state" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Battle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Battle_playerCharacterId_fkey" FOREIGN KEY ("playerCharacterId") REFERENCES "UserCharacter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Battle_enemyCharacterId_fkey" FOREIGN KEY ("enemyCharacterId") REFERENCES "Character" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Turn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "battleId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "actor" TEXT NOT NULL,
    "skillId" TEXT,
    "result" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Turn_battleId_fkey" FOREIGN KEY ("battleId") REFERENCES "Battle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Turn_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_Prerequisites" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_Prerequisites_A_fkey" FOREIGN KEY ("A") REFERENCES "SkillTreeNode" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_Prerequisites_B_fkey" FOREIGN KEY ("B") REFERENCES "SkillTreeNode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Anime_name_key" ON "Anime"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Anime_slug_key" ON "Anime"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Affiliation_animeId_name_key" ON "Affiliation"("animeId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Character_animeId_name_key" ON "Character"("animeId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_category_key" ON "Skill"("name", "category");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterSkill_characterId_skillId_key" ON "CharacterSkill"("characterId", "skillId");

-- CreateIndex
CREATE INDEX "SkillTreeNode_characterId_tier_idx" ON "SkillTreeNode"("characterId", "tier");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserCharacter_userId_characterId_key" ON "UserCharacter"("userId", "characterId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSkillUnlock_userCharacterId_nodeId_key" ON "UserSkillUnlock"("userCharacterId", "nodeId");

-- CreateIndex
CREATE INDEX "Turn_battleId_number_idx" ON "Turn"("battleId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "_Prerequisites_AB_unique" ON "_Prerequisites"("A", "B");

-- CreateIndex
CREATE INDEX "_Prerequisites_B_index" ON "_Prerequisites"("B");

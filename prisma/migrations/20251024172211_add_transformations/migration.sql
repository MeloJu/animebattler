-- CreateTable
CREATE TABLE "Transformation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "levelRequirement" INTEGER NOT NULL DEFAULT 1,
    "energyModifier" REAL NOT NULL DEFAULT 0,
    "attackModifier" REAL NOT NULL DEFAULT 0,
    "defenseModifier" REAL NOT NULL DEFAULT 0,
    "speedModifier" REAL NOT NULL DEFAULT 0,
    "flatHpBonus" INTEGER NOT NULL DEFAULT 0,
    "flatAttackBonus" INTEGER NOT NULL DEFAULT 0,
    "flatDefenseBonus" INTEGER NOT NULL DEFAULT 0,
    "flatSpeedBonus" INTEGER NOT NULL DEFAULT 0,
    "drainPerTurn" INTEGER NOT NULL DEFAULT 0,
    "unlocksSkillId" TEXT,
    "triggerType" TEXT NOT NULL DEFAULT 'MANUAL',
    "triggerPayload" JSONB,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transformation_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transformation_unlocksSkillId_fkey" FOREIGN KEY ("unlocksSkillId") REFERENCES "Skill" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserCharacterTransformation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userCharacterId" TEXT NOT NULL,
    "transformationId" TEXT NOT NULL,
    "unlockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unlockedAtLevel" INTEGER NOT NULL,
    CONSTRAINT "UserCharacterTransformation_userCharacterId_fkey" FOREIGN KEY ("userCharacterId") REFERENCES "UserCharacter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserCharacterTransformation_transformationId_fkey" FOREIGN KEY ("transformationId") REFERENCES "Transformation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL DEFAULT 'devuser',
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "selectedCharacterId" TEXT,
    CONSTRAINT "User_selectedCharacterId_fkey" FOREIGN KEY ("selectedCharacterId") REFERENCES "UserCharacter" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "passwordHash", "selectedCharacterId", "updatedAt", "username") SELECT "createdAt", "email", "id", "name", "passwordHash", "selectedCharacterId", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE TABLE "new_UserCharacter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "pointsAvailable" INTEGER NOT NULL DEFAULT 0,
    "nickname" TEXT NOT NULL DEFAULT 'Hero',
    "pvpWins" INTEGER NOT NULL DEFAULT 0,
    "npcWins" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activeTransformationId" TEXT,
    CONSTRAINT "UserCharacter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserCharacter_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserCharacter_activeTransformationId_fkey" FOREIGN KEY ("activeTransformationId") REFERENCES "Transformation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_UserCharacter" ("characterId", "createdAt", "experience", "id", "level", "nickname", "npcWins", "pointsAvailable", "pvpWins", "updatedAt", "userId") SELECT "characterId", "createdAt", "experience", "id", "level", "nickname", "npcWins", "pointsAvailable", "pvpWins", "updatedAt", "userId" FROM "UserCharacter";
DROP TABLE "UserCharacter";
ALTER TABLE "new_UserCharacter" RENAME TO "UserCharacter";
CREATE UNIQUE INDEX "UserCharacter_userId_characterId_key" ON "UserCharacter"("userId", "characterId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Transformation_characterId_levelRequirement_idx" ON "Transformation"("characterId", "levelRequirement");

-- CreateIndex
CREATE UNIQUE INDEX "UserCharacterTransformation_userCharacterId_transformationId_key" ON "UserCharacterTransformation"("userCharacterId", "transformationId");

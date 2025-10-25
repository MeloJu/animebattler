-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "selectedCharacterId" TEXT,
    CONSTRAINT "User_selectedCharacterId_fkey" FOREIGN KEY ("selectedCharacterId") REFERENCES "UserCharacter" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "passwordHash", "updatedAt") SELECT "createdAt", "email", "id", "name", "passwordHash", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
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
    CONSTRAINT "UserCharacter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserCharacter_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_UserCharacter" ("characterId", "experience", "id", "level", "pointsAvailable", "userId") SELECT "characterId", "experience", "id", "level", "pointsAvailable", "userId" FROM "UserCharacter";
DROP TABLE "UserCharacter";
ALTER TABLE "new_UserCharacter" RENAME TO "UserCharacter";
CREATE UNIQUE INDEX "UserCharacter_userId_characterId_key" ON "UserCharacter"("userId", "characterId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

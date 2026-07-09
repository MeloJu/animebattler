-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Skill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "power" INTEGER NOT NULL DEFAULT 10,
    "energyCost" INTEGER NOT NULL DEFAULT 10,
    "cooldown" INTEGER NOT NULL DEFAULT 0,
    "tags" JSONB NOT NULL,
    "effects" JSONB NOT NULL DEFAULT [],
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Skill" ("category", "cooldown", "createdAt", "description", "energyCost", "id", "name", "power", "tags", "updatedAt") SELECT "category", "cooldown", "createdAt", "description", "energyCost", "id", "name", "power", "tags", "updatedAt" FROM "Skill";
DROP TABLE "Skill";
ALTER TABLE "new_Skill" RENAME TO "Skill";
CREATE UNIQUE INDEX "Skill_name_category_key" ON "Skill"("name", "category");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

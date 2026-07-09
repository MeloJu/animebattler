-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SkillTreeNode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "skillId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tier" INTEGER NOT NULL DEFAULT 1,
    "pointCost" INTEGER NOT NULL DEFAULT 1,
    "flatHpBonus" INTEGER NOT NULL DEFAULT 0,
    "flatAttackBonus" INTEGER NOT NULL DEFAULT 0,
    "flatDefenseBonus" INTEGER NOT NULL DEFAULT 0,
    "flatSpeedBonus" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "SkillTreeNode_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SkillTreeNode_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SkillTreeNode" ("characterId", "description", "id", "name", "pointCost", "skillId", "tier") SELECT "characterId", "description", "id", "name", "pointCost", "skillId", "tier" FROM "SkillTreeNode";
DROP TABLE "SkillTreeNode";
ALTER TABLE "new_SkillTreeNode" RENAME TO "SkillTreeNode";
CREATE INDEX "SkillTreeNode_characterId_tier_idx" ON "SkillTreeNode"("characterId", "tier");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

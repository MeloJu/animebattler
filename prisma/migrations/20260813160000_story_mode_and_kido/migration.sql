ALTER TABLE "Battle" ADD COLUMN     "storyStageId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "coins" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "StoryChapter" (
    "id" TEXT NOT NULL,
    "animeId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoryChapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryStage" (
    "id" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "introText" TEXT NOT NULL,
    "outroText" TEXT NOT NULL,
    "enemyCharacterId" TEXT,
    "enemyMonsterId" TEXT,
    "enemyLevel" INTEGER NOT NULL DEFAULT 1,
    "xpReward" INTEGER NOT NULL DEFAULT 50,
    "coinReward" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoryStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserStoryProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserStoryProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCharacterSkill" (
    "id" TEXT NOT NULL,
    "userCharacterId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'STORY',
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCharacterSkill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoryChapter_slug_key" ON "StoryChapter"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "StoryChapter_animeId_order_key" ON "StoryChapter"("animeId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "StoryStage_chapterId_order_key" ON "StoryStage"("chapterId", "order");

-- CreateIndex
CREATE INDEX "UserStoryProgress_userId_idx" ON "UserStoryProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserStoryProgress_userId_stageId_key" ON "UserStoryProgress"("userId", "stageId");

-- CreateIndex
CREATE INDEX "UserCharacterSkill_userCharacterId_idx" ON "UserCharacterSkill"("userCharacterId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCharacterSkill_userCharacterId_skillId_key" ON "UserCharacterSkill"("userCharacterId", "skillId");

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_storyStageId_fkey" FOREIGN KEY ("storyStageId") REFERENCES "StoryStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryChapter" ADD CONSTRAINT "StoryChapter_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryStage" ADD CONSTRAINT "StoryStage_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "StoryChapter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryStage" ADD CONSTRAINT "StoryStage_enemyCharacterId_fkey" FOREIGN KEY ("enemyCharacterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryStage" ADD CONSTRAINT "StoryStage_enemyMonsterId_fkey" FOREIGN KEY ("enemyMonsterId") REFERENCES "Monster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStoryProgress" ADD CONSTRAINT "UserStoryProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStoryProgress" ADD CONSTRAINT "UserStoryProgress_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "StoryStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCharacterSkill" ADD CONSTRAINT "UserCharacterSkill_userCharacterId_fkey" FOREIGN KEY ("userCharacterId") REFERENCES "UserCharacter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCharacterSkill" ADD CONSTRAINT "UserCharacterSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


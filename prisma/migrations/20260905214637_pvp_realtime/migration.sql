-- AlterTable
ALTER TABLE "Battle" ADD COLUMN     "opponentCharacterId" TEXT,
ADD COLUMN     "opponentUserId" TEXT,
ADD COLUMN     "pendingHostAction" JSONB,
ADD COLUMN     "pendingOpponentAction" JSONB;

-- CreateTable
CREATE TABLE "PvpQueue" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userCharacterId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PvpQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PvpQueue_userId_key" ON "PvpQueue"("userId");

-- CreateIndex
CREATE INDEX "PvpQueue_joinedAt_idx" ON "PvpQueue"("joinedAt");

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_opponentUserId_fkey" FOREIGN KEY ("opponentUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_opponentCharacterId_fkey" FOREIGN KEY ("opponentCharacterId") REFERENCES "UserCharacter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PvpQueue" ADD CONSTRAINT "PvpQueue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PvpQueue" ADD CONSTRAINT "PvpQueue_userCharacterId_fkey" FOREIGN KEY ("userCharacterId") REFERENCES "UserCharacter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

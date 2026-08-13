import { prisma } from '@/app/lib/prisma'

/**
 * Capítulos com seus estágios, anotados com o progresso do usuário.
 *
 * Progressão é linear: o estágio de ordem N só fica jogável depois que o N-1
 * foi concluído. `locked` é derivado aqui, e não guardado no banco, pra não
 * existir a possibilidade de ficar dessincronizado do que o usuário realmente
 * completou.
 */
export async function getStoryChapters(userId: string) {
  const [chapters, progress] = await Promise.all([
    prisma.storyChapter.findMany({
      orderBy: { order: 'asc' },
      include: {
        anime: { select: { name: true, slug: true } },
        stages: {
          orderBy: { order: 'asc' },
          include: {
            enemyCharacter: { select: { name: true, imageUrl: true } },
            enemyMonster: { select: { name: true, imageUrl: true } },
          },
        },
      },
    }),
    prisma.userStoryProgress.findMany({ where: { userId }, select: { stageId: true } }),
  ])

  const completed = new Set(progress.map((p) => p.stageId))

  return chapters.map((chapter) => {
    let previousDone = true
    const stages = chapter.stages.map((stage) => {
      const isCompleted = completed.has(stage.id)
      const locked = !previousDone
      previousDone = isCompleted
      return { ...stage, completed: isCompleted, locked }
    })
    return {
      ...chapter,
      stages,
      completedCount: stages.filter((s) => s.completed).length,
    }
  })
}

/** Um estágio com o contexto necessário pra tela de detalhe. */
export async function getStageForUser(stageId: string, userId: string) {
  const stage = await prisma.storyStage.findUnique({
    where: { id: stageId },
    include: {
      chapter: { select: { id: true, title: true, slug: true } },
      enemyCharacter: true,
      enemyMonster: true,
    },
  })
  if (!stage) return null

  // Só precisa olhar o estágio imediatamente anterior: como a liberação é
  // encadeada, se o N-1 está concluído todos antes dele também estão.
  const [done, previous] = await Promise.all([
    prisma.userStoryProgress.findUnique({
      where: { userId_stageId: { userId, stageId } },
      select: { completedAt: true },
    }),
    stage.order > 1
      ? prisma.storyStage.findUnique({
          where: { chapterId_order: { chapterId: stage.chapterId, order: stage.order - 1 } },
          select: { id: true, title: true },
        })
      : Promise.resolve(null),
  ])

  const previousDone = previous
    ? Boolean(await prisma.userStoryProgress.findUnique({ where: { userId_stageId: { userId, stageId: previous.id } } }))
    : true

  return { stage, completed: Boolean(done), locked: !previousDone, previous }
}

/**
 * Chamado quando uma batalha termina em vitória. Se ela veio de um estágio do
 * modo história, registra o progresso e paga a moeda.
 *
 * A moeda só é creditada na PRIMEIRA vez. Rejogar um estágio continua valendo
 * o XP normal da batalha, mas não a recompensa — senão o estágio mais rentável
 * viraria uma torneira infinita de dinheiro.
 */
export async function recordStoryProgress(battleId: string): Promise<void> {
  const battle = await prisma.battle.findUnique({
    where: { id: battleId },
    select: {
      userId: true,
      storyStageId: true,
      storyStage: { select: { coinReward: true } },
    },
  })
  if (!battle?.storyStageId) return

  await prisma.$transaction(async (tx) => {
    // createMany + skipDuplicates em vez de upsert para saber, pela contagem,
    // se esta foi mesmo a primeira conclusão — um upsert não distingue.
    const inserted = await tx.userStoryProgress.createMany({
      data: [{ userId: battle.userId, stageId: battle.storyStageId! }],
      skipDuplicates: true,
    })
    if (inserted.count === 0) return

    const coins = battle.storyStage?.coinReward ?? 0
    if (coins > 0) {
      await tx.user.update({ where: { id: battle.userId }, data: { coins: { increment: coins } } })
    }
  })
}

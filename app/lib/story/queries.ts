import { prisma } from '@/app/lib/prisma'

/**
 * Capítulos com seus estágios, anotados com o progresso do usuário.
 *
 * Progressão é linear: o estágio de ordem N só fica jogável depois que o N-1
 * foi concluído. `locked` é derivado aqui, e não guardado no banco, pra não
 * existir a possibilidade de ficar dessincronizado do que o usuário realmente
 * completou.
 */
/**
 * Um userCharacterId nulo significa "ainda não escolheu personagem": os
 * capítulos são listados sem progresso nenhum, em vez de a tela ser negada.
 * Ver o comentário em app/story/page.tsx para por que não é um redirect.
 */
export async function getStoryChapters(userCharacterId: string | null) {
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
    userCharacterId
      ? prisma.userStoryProgress.findMany({ where: { userCharacterId }, select: { stageId: true } })
      : Promise.resolve([]),
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
/**
 * Lê o diálogo gravado como Json e devolve só o que tem forma de fala.
 *
 * Valida em vez de confiar: o campo é Json, então nada no banco garante o
 * formato. Uma linha malformada é descartada em silêncio — melhor uma cena
 * mais curta do que a tela do estágio quebrar por causa de conteúdo.
 */
export function parseDialogo(bruto: unknown): { speaker: string | null; text: string }[] {
  if (!Array.isArray(bruto)) return []
  return bruto.flatMap((linha) => {
    if (!linha || typeof linha !== 'object') return []
    const l = linha as Record<string, unknown>
    if (typeof l.text !== 'string' || l.text.length === 0) return []
    return [{ speaker: typeof l.speaker === 'string' ? l.speaker : null, text: l.text }]
  })
}

/**
 * Retrato de cada personagem que fala numa cena, indexado pelo nome.
 *
 * Quem não for encontrado simplesmente não entra no mapa, e a cena cai no
 * monograma — que é o mesmo fallback do resto do jogo. Isso deixa a fala de
 * quem não é personagem do elenco (um Hollow qualquer, uma voz sem corpo)
 * funcionar sem tratamento especial.
 */
export async function getRetratosDosFalantes(nomes: string[]): Promise<Record<string, string | null>> {
  const unicos = [...new Set(nomes)]
  if (unicos.length === 0) return {}
  const linhas = await prisma.character.findMany({
    where: { name: { in: unicos } },
    select: { name: true, imageUrl: true },
  })
  return Object.fromEntries(linhas.map((c) => [c.name, c.imageUrl]))
}

export async function getStageForUser(stageId: string, userCharacterId: string) {
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
      where: { userCharacterId_stageId: { userCharacterId, stageId } },
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
    ? Boolean(
        await prisma.userStoryProgress.findUnique({
          where: { userCharacterId_stageId: { userCharacterId, stageId: previous.id } },
        })
      )
    : true

  return { stage, completed: Boolean(done), locked: !previousDone, previous }
}

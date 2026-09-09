import { heroi, migrarEstado, vilao } from '@/app/lib/battle/engine'
import { prisma } from '@/app/lib/prisma'
import type { BattleStateGravado } from '@/app/lib/battle/types'

/** Quem está na fila agora (para a tela do lobby). */
export async function getQueueStatus(userId: string) {
  const [mine, total] = await Promise.all([
    prisma.pvpQueue.findUnique({
      where: { userId },
      include: { userCharacter: { include: { character: { select: { name: true } } } } },
    }),
    prisma.pvpQueue.count(),
  ])
  return { mine, total }
}

/**
 * A batalha PvP ativa do usuário, se houver.
 *
 * Procura nos dois lados (host e oponente) porque quem criou a batalha foi o
 * matchmaking, não o jogador — nenhum dos dois é "dono" no sentido usual.
 */
export async function getActivePvpBattle(userId: string) {
  return prisma.battle.findFirst({
    where: {
      status: 'ACTIVE',
      opponentUserId: { not: null },
      OR: [{ userId }, { opponentUserId: userId }],
    },
    select: { id: true },
  })
}

/**
 * Estado da arena PvP na perspectiva de quem está olhando.
 *
 * O motor sempre chama um lado de "player" e o outro de "enemy". Aqui isso é
 * traduzido para "eu" e "oponente" conforme quem pede, para que os dois
 * jogadores vejam a própria barra de HP à esquerda — sem isso, o convidado
 * veria a batalha invertida.
 */
export async function getPvpBattleView(battleId: string, userId: string) {
  const battle = await prisma.battle.findFirst({
    where: {
      id: battleId,
      opponentUserId: { not: null },
      OR: [{ userId }, { opponentUserId: userId }],
    },
    include: {
      playerCharacter: { include: { character: true } },
      opponentCharacter: { include: { character: true } },
      user: { select: { id: true, username: true } },
      opponentUser: { select: { id: true, username: true } },
      turns: { orderBy: { number: 'asc' } },
    },
  })
  if (!battle || !battle.opponentCharacter || !battle.opponentUser) return null

  const isHost = battle.userId === userId
  const state = migrarEstado(battle.state as unknown as BattleStateGravado)

  return {
    battle,
    isHost,
    /** Lado do motor que corresponde a quem está olhando. */
    me: {
      userId: isHost ? battle.userId : battle.opponentUserId!,
      username: isHost ? battle.user.username : battle.opponentUser.username,
      userCharacter: isHost ? battle.playerCharacter : battle.opponentCharacter,
      combatant: isHost ? heroi(state) : vilao(state),
      submitted: isHost ? battle.pendingHostAction !== null : battle.pendingOpponentAction !== null,
    },
    foe: {
      username: isHost ? battle.opponentUser.username : battle.user.username,
      userCharacter: isHost ? battle.opponentCharacter : battle.playerCharacter,
      combatant: isHost ? vilao(state) : heroi(state),
      submitted: isHost ? battle.pendingOpponentAction !== null : battle.pendingHostAction !== null,
    },
    state,
    turns: battle.turns,
  }
}

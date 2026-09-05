import { EventEmitter } from 'events'

/**
 * Barramento de eventos do PvP em tempo real.
 *
 * O jogador A submete a ação num Server Action; o jogador B precisa saber
 * disso sem recarregar a página. O caminho é: a action publica aqui, e a rota
 * SSE (api/pvp/[battleId]/events) — que está com a conexão aberta do B —
 * escuta e empurra.
 *
 * LIMITAÇÃO IMPORTANTE, de propósito: isto é memória de UM processo. Funciona
 * porque a app roda num container só. Com mais de uma réplica, o A e o B
 * poderiam cair em processos diferentes e o evento não cruzaria — a resposta
 * pra esse caso é um pub/sub externo (Redis), trocando só este arquivo. O
 * resto do PvP não sabe como o evento viaja.
 *
 * Em desenvolvimento o Hot Reload recria os módulos a cada alteração, o que
 * criaria um emitter novo e derrubaria os inscritos; por isso ele é guardado
 * no globalThis, mesmo padrão já usado pelo client do Prisma.
 */
const globalForPvp = globalThis as unknown as { pvpEmitter?: EventEmitter }

const emitter =
  globalForPvp.pvpEmitter ??
  (() => {
    const e = new EventEmitter()
    // Cada batalha tem 2 inscritos (os dois jogadores), mas abas duplicadas e
    // reconexões do EventSource somam. O default de 10 dispararia warning de
    // vazamento sem haver vazamento.
    e.setMaxListeners(0)
    return e
  })()

// Guardado no globalThis SEMPRE, inclusive em produção — e é aí que está a
// diferença pro padrão do client do Prisma, que só faz isso em dev.
//
// O Prisma guarda por causa do Hot Reload. Aqui o motivo é outro e vale em
// produção: o build do Next separa as rotas em bundles, e o módulo pode ser
// instanciado mais de uma vez — a Server Action que publica e o Route Handler
// que escuta acabam com emitters DIFERENTES. O sintoma é traiçoeiro: a
// conexão SSE abre normalmente (o cliente vê "ao vivo"), mas nenhum evento
// chega, porque quem emite não é o mesmo objeto que quem escuta.
globalForPvp.pvpEmitter = emitter

/** O que a arena precisa saber que mudou. O payload é mínimo de propósito:
 *  quem recebe vai buscar o estado no banco, que é a fonte da verdade. */
export type PvpEvent =
  | { type: 'ACTION_SUBMITTED'; byUserId: string }
  | { type: 'ROUND_RESOLVED'; turnNumber: number }
  | { type: 'BATTLE_FINISHED' }
  | { type: 'OPPONENT_LEFT' }

const channel = (battleId: string) => `battle:${battleId}`

export function publishPvpEvent(battleId: string, event: PvpEvent): void {
  emitter.emit(channel(battleId), event)
}

/** Devolve a função de cancelamento — a rota SSE chama no abort da conexão. */
export function subscribePvpEvents(battleId: string, listener: (event: PvpEvent) => void): () => void {
  emitter.on(channel(battleId), listener)
  return () => emitter.off(channel(battleId), listener)
}

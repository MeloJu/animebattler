import { prisma } from '@/app/lib/prisma'
import { getCurrentUser } from '@/app/lib/session'
import { subscribePvpEvents, type PvpEvent } from '@/app/lib/pvp/events'

// A resposta é um stream que fica aberto: não pode ser pré-renderada nem
// cacheada, senão o cliente recebe um corpo já fechado.
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Sem tráfego, proxies e balanceadores derrubam conexão ociosa. Um comentário
 *  SSE (linha iniciada por ':') serve de keep-alive sem virar evento. */
const KEEPALIVE_MS = 25_000

/**
 * Canal Server-Sent Events da arena PvP.
 *
 * SSE e não WebSocket porque o jogo é por turnos: o servidor precisa empurrar
 * ("o oponente jogou"), mas o cliente só precisa de POST comum pra agir — não
 * há necessidade de canal full-duplex. SSE roda em HTTP puro, funciona atrás
 * do Caddy sem configuração extra e o EventSource do navegador já reconecta
 * sozinho quando cai.
 *
 * O payload é mínimo (só o tipo do evento): quem recebe recarrega o estado do
 * servidor, que é a fonte da verdade. Mandar o estado por aqui criaria uma
 * segunda cópia pra divergir.
 */
export async function GET(request: Request, { params }: { params: Promise<{ battleId: string }> }) {
  const { battleId } = await params

  const user = await getCurrentUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  // Só os dois participantes escutam a batalha.
  const battle = await prisma.battle.findFirst({
    where: {
      id: battleId,
      opponentUserId: { not: null },
      OR: [{ userId: user.id }, { opponentUserId: user.id }],
    },
    select: { id: true },
  })
  if (!battle) return new Response('Not found', { status: 404 })

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      let closed = false
      const send = (chunk: string) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(chunk))
        } catch {
          closed = true
        }
      }

      const sendEvent = (event: PvpEvent) => send(`data: ${JSON.stringify(event)}\n\n`)

      // Primeiro byte imediato: confirma pro cliente que o canal abriu, em vez
      // de deixá-lo em "conectando" até o primeiro evento real.
      send(': conectado\n\n')

      const unsubscribe = subscribePvpEvents(battleId, sendEvent)
      const keepAlive = setInterval(() => send(': keep-alive\n\n'), KEEPALIVE_MS)

      const cleanup = () => {
        if (closed) return
        closed = true
        clearInterval(keepAlive)
        unsubscribe()
        try {
          controller.close()
        } catch {
          // já fechado pelo cliente
        }
      }

      request.signal.addEventListener('abort', cleanup)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      // Desliga o buffer do nginx, caso um dia entre um na frente. O Caddy já
      // faz streaming por padrão.
      'X-Accel-Buffering': 'no',
    },
  })
}

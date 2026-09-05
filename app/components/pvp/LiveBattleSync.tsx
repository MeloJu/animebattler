'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Ponte entre o canal SSE e o React Server Component da arena.
 *
 * Não recebe estado de jogo pelo evento de propósito: ao ser avisado de que
 * algo mudou, chama router.refresh(), e o servidor re-renderiza a página com
 * os dados do banco. Assim existe uma fonte da verdade só — o payload do
 * evento nunca pode divergir da batalha real.
 */
export function LiveBattleSync({ battleId }: { battleId: string }) {
  const router = useRouter()
  const [status, setStatus] = useState<'conectando' | 'ligado' | 'caiu'>('conectando')

  useEffect(() => {
    const source = new EventSource(`/api/pvp/${battleId}/events`)

    source.onopen = () => setStatus('ligado')

    source.onmessage = () => {
      // Qualquer evento significa "o servidor tem novidade"; o tipo específico
      // não muda o que fazemos aqui.
      router.refresh()
    }

    // O EventSource reconecta sozinho; o handler existe pra refletir isso na
    // UI, não pra reimplementar o retry.
    source.onerror = () => setStatus('caiu')

    return () => source.close()
  }, [battleId, router])

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs"
      title={status === 'ligado' ? 'Recebendo atualizações em tempo real' : 'Tentando reconectar'}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          status === 'ligado' ? 'bg-spirit' : status === 'conectando' ? 'bg-muted' : 'bg-danger'
        }`}
        aria-hidden
      />
      <span className="text-muted">
        {status === 'ligado' ? 'ao vivo' : status === 'conectando' ? 'conectando' : 'reconectando'}
      </span>
    </span>
  )
}

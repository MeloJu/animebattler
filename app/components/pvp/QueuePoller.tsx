'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Sonda a fila enquanto o jogador espera adversário.
 *
 * Aqui é sondagem, e não SSE como na arena, por um motivo concreto: o canal
 * SSE é por batalha, e quem está na fila ainda não tem batalha nenhuma pra
 * escutar. Abrir um canal só pra "avisar que apareceu alguém" exigiria um
 * segundo tipo de canal (por usuário) para uma espera que dura segundos.
 *
 * A página do lobby redireciona sozinha quando encontra a batalha ativa, então
 * o refresh basta.
 */
export function QueuePoller({ intervalMs = 2500 }: { intervalMs?: number }) {
  const router = useRouter()

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs)
    return () => clearInterval(id)
  }, [router, intervalMs])

  return null
}

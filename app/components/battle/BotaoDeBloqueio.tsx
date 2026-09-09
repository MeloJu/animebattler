'use client'

import { useFormStatus } from 'react-dom'
import { BLOQUEIO_REDUCAO } from '@/app/lib/battle/constants'
import type { CombatantState } from '@/app/lib/battle/types'

/**
 * Botão de erguer a guarda.
 *
 * O QUE ELE PRECISA DIZER, e que nenhum outro botão da tela dizia: bloquear
 * gasta a rodada. É a única ação que não faz nada ao adversário, e sem isso
 * escrito o jogador só descobre a troca depois de fazê-la.
 *
 * O segundo é o RISCO. Se a stamina não cobrir o que o golpe traria, a guarda
 * quebra, o dano entra inteiro e ainda se perde a rodada seguinte — a jogada
 * mais punitiva do combate. O botão mostra a reserva justamente para a
 * decisão ser tomada com o número à vista, e avisa quando ela está baixa.
 */
export function BotaoDeBloqueio({ combatente, custo }: { combatente: CombatantState; custo: number }) {
  const reserva = combatente.currentStamina ?? 0
  const maximo = combatente.maxStamina ?? 0
  const fracao = maximo > 0 ? reserva / maximo : 0

  return <Interior reserva={reserva} maximo={maximo} custo={custo} arriscado={fracao < 0.3} />
}

function Interior({
  reserva,
  maximo,
  custo,
  arriscado,
}: {
  reserva: number
  maximo: number
  custo: number
  arriscado: boolean
}) {
  // useFormStatus só enxerga o <form> ancestral, então precisa viver num filho.
  const { pending } = useFormStatus()
  const semGuarda = reserva < custo

  return (
    <button
      type="submit"
      disabled={semGuarda || pending}
      className={`rounded-md px-3 py-2 text-sm border text-left transition-all ${
        semGuarda
          ? 'border-border opacity-40 cursor-not-allowed'
          : 'border-amber-500/50 hover:bg-amber-500/10 hover:border-amber-500'
      } ${pending ? 'scale-[0.97] bg-amber-500/10' : ''}`}
    >
      <div className="flex items-baseline gap-2">
        <span className="font-medium">🛡️ Bloquear</span>
        <span className="text-xs shrink-0 tabular-nums text-amber-600 dark:text-amber-400">
          {custo} ST
        </span>
      </div>

      <div className="text-xs opacity-60 mt-0.5">
        Gasta a rodada · −{Math.round(BLOQUEIO_REDUCAO * 100)}% de dano
      </div>

      {semGuarda ? (
        <div className="text-xs opacity-70 mt-0.5">sem stamina para erguer a guarda</div>
      ) : (
        <div className={`text-xs mt-0.5 tabular-nums ${arriscado ? 'text-amber-600 dark:text-amber-400' : 'opacity-55'}`}>
          {reserva}/{maximo} de guarda{arriscado && ' — arrisca quebrar'}
        </div>
      )}

      {pending && <div className="text-xs text-accent mt-0.5">resolvendo…</div>}
    </button>
  )
}

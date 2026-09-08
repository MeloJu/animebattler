'use client'

import { useFormStatus } from 'react-dom'
import type { TransformationDef } from '@/app/lib/battle/types'

function pct(v: number): string | null {
  if (!v) return null
  const n = Math.round(v * 100)
  return `${n > 0 ? '+' : ''}${n}%`
}

/**
 * Botão de liberar uma forma.
 *
 * Antes era um botão comum, com o mesmo peso visual de qualquer outro, escrito
 * "Transformar: Bankai: Tensa Zangetsu". Ele não dizia o CUSTO — que agora é
 * de 34 a 44 de energia — nem se GASTA A RODADA, que é a regra que separa
 * Bankai de Super Saiyan e a que mais muda como se joga o momento.
 *
 * Sem energia, o botão diz por quê em vez de só apagar: um controle
 * desabilitado sem motivo obriga o jogador a adivinhar.
 */
export function BotaoDeForma({ forma, energiaAtual }: { forma: TransformationDef; energiaAtual: number }) {
  const custo = forma.activationCost ?? 0
  const gastaRodada = forma.consumesTurn !== false
  const falta = custo - energiaAtual
  const podeLiberar = falta <= 0

  const ganhos = [
    ['ATQ', pct(forma.attackModifier)],
    ['DEF', pct(forma.defenseModifier)],
    ['VEL', pct(forma.speedModifier)],
  ].filter((g): g is [string, string] => g[1] !== null)

  return (
    <Interior
      forma={forma}
      custo={custo}
      gastaRodada={gastaRodada}
      podeLiberar={podeLiberar}
      falta={falta}
      ganhos={ganhos}
    />
  )
}

function Interior({
  forma,
  custo,
  gastaRodada,
  podeLiberar,
  falta,
  ganhos,
}: {
  forma: TransformationDef
  custo: number
  gastaRodada: boolean
  podeLiberar: boolean
  falta: number
  ganhos: [string, string][]
}) {
  // useFormStatus só enxerga o form ancestral, então precisa estar num
  // componente filho do <form> — daí a separação.
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={!podeLiberar || pending}
      className={`w-full text-left rounded-md border px-3 py-2 transition-all ${
        podeLiberar
          ? 'border-accent/50 hover:border-accent hover:bg-accent/10'
          : 'border-border opacity-50 cursor-not-allowed'
      } ${pending ? 'scale-[0.98] opacity-70' : ''}`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-medium text-accent">{pending ? 'Liberando…' : forma.name}</span>
        <span className="text-xs shrink-0 tabular-nums text-spirit">{custo} EN</span>
      </div>

      <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 text-xs mt-1 tabular-nums">
        {ganhos.map(([rotulo, valor]) => (
          <span key={rotulo}>
            <span className="opacity-55">{rotulo} </span>
            <span className={valor.startsWith('-') ? 'text-red-500' : 'text-green-600 dark:text-green-400'}>
              {valor}
            </span>
          </span>
        ))}
        <span className={gastaRodada ? 'opacity-55' : 'text-green-600 dark:text-green-400'}>
          {gastaRodada ? 'gasta a rodada' : 'não gasta a rodada'}
        </span>
      </div>

      {!podeLiberar && <div className="text-xs mt-1 opacity-70">Faltam {falta} de energia.</div>}
    </button>
  )
}

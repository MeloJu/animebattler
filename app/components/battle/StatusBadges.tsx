import { describeEffect } from '@/app/lib/battle/presentation'
import type { DotFlavor, StatusEffectInstance } from '@/app/lib/battle/types'

/**
 * Como cada natureza de dano contínuo se apresenta.
 *
 * Mecanicamente as quatro são a mesma coisa — dano por rodada —, e é a tela
 * que as separa. Antes todas usavam o mesmo 🔥, então tomar veneno e tomar
 * fogo eram indistinguíveis olhando a carta.
 *
 * A animação é diferente em cada uma porque a leitura periférica importa mais
 * que o ícone: queimadura tremula, veneno pulsa devagar, sangramento pisca em
 * batidas, maldição respira. Dá para saber o que está acontecendo sem ler.
 */
const DOT: Record<DotFlavor, { icone: string; rotulo: string; classe: string }> = {
  queimadura: {
    icone: '🔥',
    rotulo: 'Queimadura',
    classe: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 animate-[tremular_1.1s_ease-in-out_infinite]',
  },
  veneno: {
    icone: '☠️',
    rotulo: 'Veneno',
    classe: 'bg-green-600/15 text-green-700 dark:text-green-400 animate-[pulsar_2s_ease-in-out_infinite]',
  },
  sangramento: {
    icone: '🩸',
    rotulo: 'Sangramento',
    classe: 'bg-red-600/15 text-red-600 dark:text-red-400 animate-[bater_1.6s_ease-in-out_infinite]',
  },
  maldicao: {
    icone: '🟣',
    rotulo: 'Maldição',
    classe: 'bg-purple-600/15 text-purple-600 dark:text-purple-400 animate-[respirar_2.4s_ease-in-out_infinite]',
  },
}

const GENERICO = { icone: '🔥', rotulo: 'Dano contínuo', classe: 'bg-background-alt' }

export function StatusBadges({ effects }: { effects: StatusEffectInstance[] }) {
  if (effects.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1">
      {effects.map((e) => {
        const dot = e.type === 'DOT' ? (e.flavor ? DOT[e.flavor] : GENERICO) : null

        if (dot) {
          return (
            <span
              key={e.id}
              // O título traz a origem: duas queimaduras de habilidades
              // diferentes empilham, e sem isso pareceriam a mesma coisa.
              title={`${dot.rotulo} · ${e.sourceSkillName}`}
              className={`text-xs rounded-full px-2 py-0.5 font-medium ${dot.classe}`}
            >
              {dot.icone} {e.magnitude}/rodada ({e.remainingRounds})
            </span>
          )
        }

        return (
          <span key={e.id} title={e.sourceSkillName} className="text-xs rounded-full bg-background-alt px-2 py-0.5">
            {describeEffect(e)} ({e.remainingRounds})
          </span>
        )
      })}
    </div>
  )
}

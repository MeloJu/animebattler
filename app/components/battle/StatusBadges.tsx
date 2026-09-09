import { DOT_GENERICO, DOT_SABOR, describeEffect } from '@/app/lib/battle/presentation'
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
const ANIMACAO: Record<DotFlavor, string> = {
  queimadura: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 animate-[tremular_1.1s_ease-in-out_infinite]',
  veneno: 'bg-green-600/15 text-green-700 dark:text-green-400 animate-[pulsar_2s_ease-in-out_infinite]',
  sangramento: 'bg-red-600/15 text-red-600 dark:text-red-400 animate-[bater_1.6s_ease-in-out_infinite]',
  maldicao: 'bg-purple-600/15 text-purple-600 dark:text-purple-400 animate-[respirar_2.4s_ease-in-out_infinite]',
  congelamento: 'bg-sky-500/15 text-sky-600 dark:text-sky-300 animate-[cintilar_3s_ease-in-out_infinite]',
  espiritual: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 animate-[respirar_2.4s_ease-in-out_infinite]',
}

const CLASSE_GENERICA = 'bg-background-alt'

export function StatusBadges({ effects }: { effects: StatusEffectInstance[] }) {
  // NÃO devolve null quando vazio, e o espaço é reservado de propósito: sem
  // isto o card cresce no instante em que o primeiro efeito aparece, e empurra
  // para baixo tudo o que vem depois — inclusive a barra de ações, cujo botão
  // some de debaixo do cursor no meio da luta. Uma faixa vazia de uma linha
  // custa 28 pixels e compra uma tela que não se mexe.
  return (
    <div className="flex flex-wrap gap-1 min-h-7 content-start">
      {effects.map((e) => {
        const dot =
          e.type === 'DOT'
            ? {
                ...(e.flavor ? DOT_SABOR[e.flavor] : DOT_GENERICO),
                classe: e.flavor ? ANIMACAO[e.flavor] : CLASSE_GENERICA,
              }
            : null

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

        // O domínio não é um debuff a mais: é um estado que muda as regras
        // enquanto dura. Misturado aos outros badges ele passaria batido — daí
        // a borda e o nome próprio da técnica em vez do rótulo genérico.
        if (e.type === 'DOMAIN') {
          return (
            <span
              key={e.id}
              title={`${e.sourceSkillName} · os golpes atravessam escudo e counter · ${e.magnitude} de energia por rodada`}
              className="text-xs rounded-full px-2 py-0.5 font-medium border border-purple-500/60 bg-purple-500/15 text-purple-700 dark:text-purple-300 animate-[respirar_2.4s_ease-in-out_infinite]"
            >
              🌌 {e.sourceSkillName} ({e.remainingRounds})
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

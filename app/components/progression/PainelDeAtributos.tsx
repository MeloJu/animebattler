import {
  ATRIBUTOS,
  ATRIBUTO_AJUDA,
  ATRIBUTO_LABEL,
  ATRIBUTO_POR_PONTO,
  type Atributo,
} from '@/app/lib/progression/atributos'
import { ATRIBUTO_NEUTRO } from '@/app/lib/battle/constants'
import { alocarAtributo } from '@/app/lib/progression/actions'
import type { BaseStats } from '@/app/lib/battle/types'

/**
 * Painel de atributos com alocação de pontos.
 *
 * POR QUE EXISTE: o ponto de nível não tinha para onde ir. Ele só comprava nó
 * de árvore de habilidade, e 39 dos 52 personagens não têm nó nenhum — quem
 * jogasse com qualquer um deles via "Pontos disponíveis" crescer para sempre
 * sem nada para fazer com eles.
 *
 * Cada atributo mostra o VALOR EFETIVO (já com nível, equipamento, árvore e
 * pontos), quantos pontos foram investidos ali, e quanto o próximo ponto
 * daria. Mostrar o ganho antes de gastar é o que torna a escolha uma decisão
 * em vez de um chute — principalmente porque velocidade rende metade dos
 * outros de propósito, e sem o número na tela isso pareceria bug.
 *
 * A explicação de cada atributo fica no title, que é o hover nativo: a
 * página é um Server Component e uma dica de ferramenta própria exigiria
 * estado no cliente para algo que o navegador já faz.
 */
export function PainelDeAtributos({
  stats,
  alocado,
  pontosDisponiveis,
}: {
  stats: BaseStats
  alocado: Record<Atributo, number>
  pontosDisponiveis: number
}) {
  const valorAtual: Record<Atributo, number> = {
    hp: stats.hp,
    attack: stats.attack,
    defense: stats.defense,
    speed: stats.speed,
    energy: stats.energy,
    stamina: stats.stamina,
    // Os três novos são opcionais em BaseStats porque batalhas gravadas antes
    // deles não os têm — ver ATRIBUTO_NEUTRO.
    accuracy: stats.accuracy ?? ATRIBUTO_NEUTRO,
    agility: stats.agility ?? ATRIBUTO_NEUTRO,
    intelligence: stats.intelligence ?? ATRIBUTO_NEUTRO,
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {ATRIBUTOS.map((attr) => {
        const investido = alocado[attr]
        const ganho = ATRIBUTO_POR_PONTO[attr]
        return (
          <div
            key={attr}
            className="rounded-md border border-border p-3 flex items-center justify-between gap-3"
            title={ATRIBUTO_AJUDA[attr]}
          >
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sm opacity-70">{ATRIBUTO_LABEL[attr]}</span>
                <span className="font-semibold tabular-nums">{valorAtual[attr]}</span>
              </div>
              <div className="text-xs opacity-50 mt-0.5">
                {investido > 0 && <span className="mr-2">{investido} ponto{investido > 1 ? 's' : ''}</span>}
                <span>+{ganho} por ponto</span>
              </div>
            </div>

            <form action={alocarAtributo.bind(null, attr)}>
              <button
                type="submit"
                disabled={pontosDisponiveis < 1}
                className="h-8 w-8 shrink-0 rounded-md border border-border text-lg leading-none disabled:opacity-30 enabled:hover:border-accent enabled:hover:text-accent transition-colors"
                aria-label={`Investir um ponto em ${ATRIBUTO_LABEL[attr]}`}
              >
                +
              </button>
            </form>
          </div>
        )
      })}
    </div>
  )
}

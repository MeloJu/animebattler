import Link from 'next/link'
import { Swords, GitBranch, BookOpen, Shield } from 'lucide-react'

/**
 * Só entra aqui o que já existe e é jogável hoje.
 *
 * A versão anterior anunciava "Global Rankings" e "leaderboards competitivos"
 * — PvP nem começou. Prometer o que não existe é o jeito mais rápido de
 * frustrar quem clica.
 */
const features = [
  {
    icon: Swords,
    title: 'Combate por turnos',
    description:
      'Energia, cooldown, crítico por velocidade, escudo, contra-ataque, dano ao longo do tempo e atordoamento.',
  },
  {
    icon: GitBranch,
    title: 'Árvore de habilidades',
    description:
      'Cada personagem tem sua própria árvore. Suba de nível, ganhe pontos e escolha o que desbloquear.',
  },
  {
    icon: BookOpen,
    title: 'Modo História',
    description:
      'O Arco Soul Society, tenente por tenente até Aizen. Progressão travada: cada estágio libera o próximo.',
  },
  {
    icon: Shield,
    title: 'Equipamentos',
    description:
      'Compre Zanpakutō, trajes e acessórios com as moedas da história. Os melhores concedem habilidades próprias.',
  },
]

export default function QuickFeatures({ authed }: { authed: boolean }) {
  return (
    <section className="relative py-20">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <div className="kicker">O que já dá pra jogar</div>
          <h2 className="heading mt-3 text-3xl sm:text-4xl">
            Um RPG de turnos completo, não uma tela de login bonita
          </h2>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="card card-accent p-5 pl-6">
              <div
                className="flex h-10 w-10 items-center justify-center bg-accent text-background"
                style={{ borderRadius: '2px 8px 2px 8px' }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="heading mt-4 text-lg">{title}</h3>
              <p className="mt-1.5 text-sm text-muted leading-relaxed">{description}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="heading text-lg">Em construção</div>
            <p className="text-sm text-muted mt-1">
              PvP entre jogadores e novos arcos de história ainda não existem — o resto acima já funciona.
            </p>
          </div>
          {!authed && (
            <Link href="/register" className="btn-primary px-6 py-3 text-sm whitespace-nowrap">
              Começar agora
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}

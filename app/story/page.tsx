import Link from 'next/link'
import { prisma } from '@/app/lib/prisma'
import { redirect } from 'next/navigation'
import { requireUser } from '@/app/lib/session'
import { getSelectedCharacter } from '@/app/lib/progression/queries'
import { getStoryChapters } from '@/app/lib/story/queries'
import { resolveErrorMessage } from '@/app/lib/error-messages'

const STORY_ERRORS: Record<string, string> = {
  not_found: 'Estágio não encontrado.',
  locked: 'Você precisa concluir o estágio anterior primeiro.',
}

export default async function StoryPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser()

  const { error } = await searchParams
  const errorMessage = resolveErrorMessage(STORY_ERRORS, error, 'Ocorreu um erro.')
  const userCharacter = await getSelectedCharacter(user.id)
  if (!userCharacter) redirect('/select')

  const [chapters, wallet] = await Promise.all([
    getStoryChapters(userCharacter.id),
    prisma.user.findUnique({ where: { id: user.id }, select: { coins: true } }),
  ])

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="flex items-baseline justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Modo História</h1>
          {/* O progresso é por personagem, então dizer de quem ele é deixou de
              ser detalhe: sem isto, trocar de personagem parece perda de save. */}
          <p className="text-sm opacity-70 mt-0.5">
            Progresso de <span className="font-medium">{userCharacter.character.name}</span> · nível {userCharacter.level}
          </p>
        </div>
        <span className="text-sm opacity-70 shrink-0">{wallet?.coins ?? 0} moedas</span>
      </div>

      {errorMessage && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">{errorMessage}</div>
      )}

      {chapters.length === 0 && <div className="card p-6 opacity-70">Nenhum capítulo disponível ainda.</div>}

      {chapters.map((chapter) => (
        <section key={chapter.id} className="card p-6 mb-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-semibold">{chapter.title}</h2>
            <span className="text-sm opacity-60 shrink-0">
              {chapter.completedCount}/{chapter.stages.length}
            </span>
          </div>
          {chapter.description && <p className="text-sm opacity-70 mt-1">{chapter.description}</p>}

          <ol className="mt-4 space-y-2">
            {chapter.stages.map((stage) => {
              const enemyName = stage.enemyCharacter?.name ?? stage.enemyMonster?.name ?? '???'
              const content = (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-xs opacity-50 tabular-nums">{String(stage.order).padStart(2, '0')}</span>
                    <span className="font-medium">{stage.locked ? '???' : stage.title}</span>
                    {stage.completed && <span className="text-xs text-green-700">✔ concluído</span>}
                  </div>
                  <div className="text-sm opacity-70 mt-0.5">
                    {stage.locked ? 'Bloqueado' : `vs ${enemyName} · Lv ${stage.enemyLevel}`}
                  </div>
                </>
              )

              return (
                <li key={stage.id}>
                  {stage.locked ? (
                    <div className="rounded-md border border-border p-3 opacity-50">{content}</div>
                  ) : (
                    <Link
                      href={`/story/${stage.id}`}
                      className="block rounded-md border border-border p-3 hover:border-border transition-colors"
                    >
                      {content}
                    </Link>
                  )}
                </li>
              )
            })}
          </ol>
        </section>
      ))}
    </main>
  )
}

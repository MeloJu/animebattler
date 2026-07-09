import Link from 'next/link'
import { prisma } from '@/app/lib/prisma'
import { getCurrentUser } from '@/app/lib/session'
import { unlockSkillNode } from '@/app/lib/progression/actions'

const STATUS_ERROR_MESSAGES: Record<string, string> = {
  not_found: 'Personagem não encontrado.',
  invalid_node: 'Nó inválido para esse personagem.',
  insufficient_points: 'Pontos insuficientes.',
  missing_prerequisite: 'Pré-requisito ainda não desbloqueado.',
}

export default async function StatusPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const errorMessage = error ? STATUS_ERROR_MESSAGES[error] ?? 'Ocorreu um erro.' : null

  const user = await getCurrentUser()
  if (!user) return <main className="mx-auto max-w-3xl p-6">No user.</main>

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { selectedCharacter: { include: { character: true } } },
  })
  const selected = dbUser?.selectedCharacter

  if (!selected) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold mb-4">Status</h1>
        <div className="card p-6 space-y-3">
          <p className="opacity-70">Você precisa selecionar um personagem primeiro.</p>
          <Link href="/select" className="btn-primary inline-block rounded-md px-4 py-2 text-sm">Selecionar Personagem</Link>
        </div>
      </main>
    )
  }

  const [nodes, unlocks] = await Promise.all([
    prisma.skillTreeNode.findMany({
      where: { characterId: selected.characterId },
      include: { skill: true, prerequisites: true },
      orderBy: { tier: 'asc' },
    }),
    prisma.userSkillUnlock.findMany({ where: { userCharacterId: selected.id }, select: { nodeId: true } }),
  ])
  const unlockedIds = new Set(unlocks.map((u) => u.nodeId))

  const nodesByTier = new Map<number, typeof nodes>()
  for (const node of nodes) {
    const list = nodesByTier.get(node.tier) ?? []
    list.push(node)
    nodesByTier.set(node.tier, list)
  }
  const tiers = Array.from(nodesByTier.keys()).sort((a, b) => a - b)

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Status — {selected.nickname}</h1>
        <div className="text-sm opacity-70">
          Pontos disponíveis: <span className="font-semibold">{selected.pointsAvailable}</span>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">{errorMessage}</div>
      )}

      {nodes.length === 0 && <div className="card p-6 opacity-70">Esse personagem ainda não tem árvore de habilidades.</div>}

      {tiers.map((tier) => (
        <div key={tier} className="card p-4 space-y-3">
          <h2 className="font-semibold">Tier {tier}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {nodesByTier.get(tier)!.map((node) => {
              const isUnlocked = unlockedIds.has(node.id)
              const prereqsMet = node.prerequisites.every((p) => unlockedIds.has(p.id))
              const canUnlock = !isUnlocked && prereqsMet && selected.pointsAvailable >= node.pointCost
              return (
                <div key={node.id} className={`rounded-md border p-3 ${isUnlocked ? 'border-accent/40 bg-accent/5' : 'border-black/10'}`}>
                  <div className="font-medium">{node.name}</div>
                  {node.description && <div className="text-xs opacity-70 mt-0.5">{node.description}</div>}
                  {node.skill && <div className="text-xs opacity-70 mt-0.5">Desbloqueia: {node.skill.name}</div>}
                  <div className="text-xs opacity-60 mt-1">Custo: {node.pointCost} ponto{node.pointCost !== 1 ? 's' : ''}</div>
                  {isUnlocked ? (
                    <div className="text-xs text-accent mt-2 font-medium">Desbloqueado</div>
                  ) : (
                    <form action={unlockSkillNode.bind(null, selected.id, node.id)} className="mt-2">
                      <button
                        type="submit"
                        disabled={!canUnlock}
                        className={`rounded-md px-3 py-1.5 text-xs border ${canUnlock ? 'border-black/10 hover:bg-black/5' : 'border-black/5 opacity-40 cursor-not-allowed'}`}
                      >
                        {prereqsMet ? 'Desbloquear' : 'Pré-requisito bloqueado'}
                      </button>
                    </form>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </main>
  )
}

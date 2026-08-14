import Link from 'next/link'
import { prisma } from '@/app/lib/prisma'
import { requireUser } from '@/app/lib/session'
import { startRaidBattle } from '@/app/lib/battle/actions'
import { battleErrorMessage } from '@/app/lib/battle/presentation'
import { getSelectedCharacter } from '@/app/lib/progression/queries'

export default async function BattleRaidPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const errorMessage = battleErrorMessage(error)

  const user = await requireUser()

  const selected = await getSelectedCharacter(user.id)

  if (!selected) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold mb-4">Raid</h1>
        <div className="card p-6 space-y-3">
          <p className="opacity-70">Você precisa selecionar um personagem antes de entrar na raid.</p>
          <Link href="/select" className="btn-primary inline-block rounded-md px-4 py-2 text-sm">Selecionar Personagem</Link>
        </div>
      </main>
    )
  }

  const [activeBattle, hollow] = await Promise.all([
    prisma.battle.findFirst({
      where: { userId: user.id, playerCharacterId: selected.id, status: 'ACTIVE', enemyMonsterId: { not: null } },
      select: { id: true },
    }),
    prisma.monster.findFirst({ where: { name: 'Hollow' } }),
  ])

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Raid</h1>
      {errorMessage && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">{errorMessage}</div>
      )}
      <div className="card p-6 space-y-4">
        <div>
          <div className="font-semibold">{selected.nickname}</div>
          <div className="text-sm opacity-70">{selected.character.name} · Lv {selected.level}</div>
        </div>
        {hollow && (
          <div className="rounded-md border border-black/10 p-3">
            <div className="font-semibold">{hollow.name} <span className="text-xs opacity-60">(Tier {hollow.tier})</span></div>
            {hollow.description && <div className="text-sm opacity-70 mt-1">{hollow.description}</div>}
          </div>
        )}
        {activeBattle ? (
          <Link href={`/battle/ai/${activeBattle.id}`} className="btn-primary inline-block rounded-md px-4 py-2 text-sm">
            Retomar Raid
          </Link>
        ) : (
          <form action={startRaidBattle.bind(null, selected.id)}>
            <button type="submit" className="btn-primary rounded-md px-4 py-2 text-sm" disabled={!hollow}>Começar Raid</button>
          </form>
        )}
      </div>
    </main>
  )
}

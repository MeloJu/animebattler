import Link from 'next/link'
import { requireUser } from '@/app/lib/session'
import { getDashboardUser } from '@/app/lib/progression/queries'
import { CharacterImage } from '@/app/components/CharacterImage'
import { StatGrid } from '@/app/components/StatGrid'

export default async function DashboardPage() {
  const user = await requireUser()

  const data = await getDashboardUser(user.id)

  if (!data?.selectedCharacter) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <div className="card p-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">No character selected</h1>
            <p className="opacity-70">Pick one of your created characters to continue.</p>
          </div>
          <Link className="btn-primary rounded-md px-4 py-2 text-sm" href="/select">Select Character</Link>
        </div>
      </main>
    )
  }

  const uc = data.selectedCharacter
  const base = uc.character

  return (
    <main className="mx-auto max-w-7xl p-6 space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Avatar Card */}
        <div className="card p-6 flex items-center gap-4 md:w-1/2">
          <CharacterImage
            src={base.imageUrl}
            alt={uc.nickname}
            containerClassName="h-28 w-28 rounded-lg overflow-hidden bg-background-alt relative flex-shrink-0"
            sizes="112px"
          />
          <div>
            <div className="text-xl font-semibold">{uc.nickname}</div>
            <div className="text-sm opacity-70">{base.name}</div>
            <div className="mt-2 flex flex-wrap gap-3 text-sm opacity-80">
              <span>Lv {uc.level}</span>
              <span>EXP {uc.experience}</span>
              <span>Points {uc.pointsAvailable}</span>
            </div>
          </div>
        </div>

        {/* Wins & Links */}
        <div className="card p-6 md:flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-md bg-[color:var(--ring)]/20 p-4">
              <div className="text-sm opacity-70">PvP Wins</div>
              <div className="text-2xl font-semibold">{uc.pvpWins}</div>
            </div>
            <div className="rounded-md bg-[color:var(--ring)]/20 p-4">
              <div className="text-sm opacity-70">NPC Wins</div>
              <div className="text-2xl font-semibold">{uc.npcWins}</div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/battle/ai" className="btn-primary rounded-md px-4 py-2 text-sm">Battle VS AI</Link>
            <Link href="/battle/pvp" className="rounded-md px-4 py-2 text-sm border border-border bg-surface hover:bg-surface-raised">Battle VS Player</Link>
            <Link href="/equipment" className="rounded-md px-4 py-2 text-sm border border-border bg-surface hover:bg-surface-raised">Equipment</Link>
            <Link href="/status" className="rounded-md px-4 py-2 text-sm border border-border bg-surface hover:bg-surface-raised">Status</Link>
            <Link href="/characters" className="rounded-md px-4 py-2 text-sm border border-border bg-surface hover:bg-surface-raised">Browse Characters</Link>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-3">Stats</h2>
        <StatGrid
          gridClassName="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-sm"
          stats={[
            { label: 'HP', value: base.hp },
            { label: 'ATK', value: base.attack },
            { label: 'DEF', value: base.defense },
            { label: 'SPD', value: base.speed },
            { label: 'EN', value: base.energy },
          ]}
        />
      </div>
    </main>
  )
}

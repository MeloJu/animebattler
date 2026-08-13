import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/app/lib/prisma'
import { getCurrentUser } from '@/app/lib/session'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const data = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      selectedCharacter: {
        include: {
          character: true,
        }
      }
    }
  })

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
          <div className="h-28 w-28 rounded-lg overflow-hidden bg-gray-200 relative flex-shrink-0">
            {base.imageUrl ? (
              <Image src={base.imageUrl} alt={uc.nickname} fill className="object-cover" sizes="112px" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-sm text-gray-500">No Image</div>
            )}
          </div>
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
            <Link href="/battle/pvp" className="rounded-md px-4 py-2 text-sm border border-black/10 bg-white hover:bg-black/5">Battle VS Player</Link>
            <Link href="/equipment" className="rounded-md px-4 py-2 text-sm border border-black/10 bg-white hover:bg-black/5">Equipment</Link>
            <Link href="/status" className="rounded-md px-4 py-2 text-sm border border-black/10 bg-white hover:bg-black/5">Status</Link>
            <Link href="/characters" className="rounded-md px-4 py-2 text-sm border border-black/10 bg-white hover:bg-black/5">Browse Characters</Link>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-3">Stats</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-sm">
          <div className="rounded-md border border-black/10 p-3">HP <span className="font-semibold">{base.hp}</span></div>
          <div className="rounded-md border border-black/10 p-3">ATK <span className="font-semibold">{base.attack}</span></div>
          <div className="rounded-md border border-black/10 p-3">DEF <span className="font-semibold">{base.defense}</span></div>
          <div className="rounded-md border border-black/10 p-3">SPD <span className="font-semibold">{base.speed}</span></div>
          <div className="rounded-md border border-black/10 p-3">EN <span className="font-semibold">{base.energy}</span></div>
        </div>
      </div>
    </main>
  )
}

import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/app/lib/prisma'

export default async function CharacterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id || typeof id !== 'string') return notFound()

  const c = await prisma.character.findUnique({
    where: { id },
    include: {
      anime: true,
      affiliation: true,
      characterSkills: { include: { skill: true }, orderBy: { skill: { name: 'asc' } } },
    }
  })
  if (!c) return notFound()

  return (
    <main className="relative mx-auto max-w-6xl p-6 space-y-6">
      <div className="pointer-events-none absolute -top-10 -left-14 h-56 w-56 rounded-full bg-gradient-to-br from-[#4f46e5]/40 via-[#60a5fa]/30 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-20 h-64 w-64 rounded-full bg-gradient-to-br from-[#0ea5e9]/30 via-[#818cf8]/30 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-gradient-to-br from-[#facc15]/20 via-[#fb7185]/20 to-transparent blur-3xl" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{c.name}</h1>
          <div className="text-sm opacity-70">{c.anime.name}{c.affiliation ? ` • ${c.affiliation.name}` : ''}</div>
        </div>
        <Link href="/characters" className="text-sm underline">Back to list</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Portrait */}
        <div className="card p-4">
          <div className="relative w-full aspect-[4/3] rounded-md overflow-hidden bg-gray-100">
            {c.imageUrl ? (
              <Image src={c.imageUrl} alt={c.name} fill className="object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-gray-500">No Image</div>
            )}
          </div>
          {c.imageUrl && (
            <div className="text-xs opacity-60 mt-2">Image source: {c.imageUrl}</div>
          )}
        </div>

        {/* Stats */}
        <div className="md:col-span-2 card p-6">
          <h2 className="text-lg font-semibold mb-3">Stats</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
            <div className="rounded-md border border-white/10 p-3 bg-white/10">HP <span className="font-semibold">{c.hp}</span></div>
            <div className="rounded-md border border-white/10 p-3 bg-white/10">ATK <span className="font-semibold">{c.attack}</span></div>
            <div className="rounded-md border border-white/10 p-3 bg-white/10">DEF <span className="font-semibold">{c.defense}</span></div>
            <div className="rounded-md border border-white/10 p-3 bg-white/10">SPD <span className="font-semibold">{c.speed}</span></div>
            <div className="rounded-md border border-white/10 p-3 bg-white/10">EN <span className="font-semibold">{c.energy}</span></div>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Skills</h2>
        </div>
        {c.characterSkills.length === 0 ? (
          <div className="text-sm opacity-70">No skills linked yet.</div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {c.characterSkills.map(cs => (
              <li key={cs.skillId} className="rounded-md border border-white/10 p-3 bg-white/10">
                <div className="font-medium">{cs.skill.name}</div>
                <div className="text-xs opacity-70 mt-0.5">Power {cs.skill.power} • Cost {cs.skill.energyCost} • CD {cs.skill.cooldown}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Placeholder for future sections */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-2">Skill Tree (coming soon)</h2>
        <p className="text-sm opacity-70">We will render the full tree here with unlock previews and prerequisites.</p>
      </div>
    </main>
  )
}

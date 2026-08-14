import Link from "next/link";
import { prisma } from '@/app/lib/prisma'
import { requireUser } from '@/app/lib/session'
import { redirect } from 'next/navigation'

export default async function SelectCharacterPage() {
  const user = await requireUser()
  const userId = user.id

  async function setSelected(formData: FormData) {
    "use server"
    const userCharacterId = String(formData.get('userCharacterId'))
    await prisma.user.update({ where: { id: userId }, data: { selectedCharacterId: userCharacterId } })
    redirect('/dashboard')
  }

  const list = await prisma.userCharacter.findMany({
    where: { userId },
    include: { character: true },
  })

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Select Character</h1>
        <Link href="/create" className="btn-primary rounded-md px-4 py-2 text-sm">Create New</Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {list.map((uc) => (
          <form key={uc.id} action={setSelected} className="card p-5 flex flex-col gap-3">
            <input type="hidden" name="userCharacterId" value={uc.id} />
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{uc.nickname}</div>
                <div className="text-sm opacity-70">{uc.character.name}</div>
              </div>
              <button type="submit" className="btn-primary rounded-md px-3 py-1.5 text-sm">Select</button>
            </div>
            <div className="text-sm flex gap-3 opacity-80">
              <span>Lv {uc.level}</span>
              <span>PvP {uc.pvpWins}</span>
              <span>NPC {uc.npcWins}</span>
            </div>
          </form>
        ))}
      </div>
    </main>
  )
}

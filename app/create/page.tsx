import { prisma } from '@/app/lib/prisma'
import { getCurrentUser } from '@/app/lib/session'
import { redirect } from 'next/navigation'

export default async function CreateCharacterPage() {
  const user = await getCurrentUser()
  if (!user) return <main className="mx-auto max-w-7xl p-6">No user.</main>
  const userId = user.id

  const characters = await prisma.character.findMany({ orderBy: { name: 'asc' } })

  async function createAction(formData: FormData) {
    "use server"
    const characterId = String(formData.get('characterId'))
    const nickname = String(formData.get('nickname') || '').trim() || 'Hero'
    const created = await prisma.userCharacter.create({
      data: { userId, characterId, nickname },
      select: { id: true }
    })
    await prisma.user.update({ where: { id: userId }, data: { selectedCharacterId: created.id } })
    redirect('/dashboard')
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Create Character</h1>
      <form action={createAction} className="card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nickname</label>
          <input name="nickname" className="w-full rounded-md border border-black/10 px-3 py-2 bg-white" placeholder="Your character nickname" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Base Character</label>
          <select name="characterId" className="w-full rounded-md border border-black/10 px-3 py-2 bg-white">
            {characters.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="pt-2">
          <button type="submit" className="btn-primary rounded-md px-4 py-2 text-sm">Create</button>
        </div>
      </form>
    </main>
  )
}

import { requireUser } from '@/app/lib/session'
import { listCharacterChoices } from '@/app/lib/characters/queries'
import { createCharacter } from '@/app/lib/progression/actions'

export default async function CreateCharacterPage() {
  await requireUser()

  const characters = await listCharacterChoices()

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Create Character</h1>
      <form action={createCharacter} className="card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nickname</label>
          <input name="nickname" className="w-full rounded-md border border-border px-3 py-2 bg-surface" placeholder="Your character nickname" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Base Character</label>
          <select name="characterId" className="w-full rounded-md border border-border px-3 py-2 bg-surface">
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

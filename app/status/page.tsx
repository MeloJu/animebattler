import Link from 'next/link'
import { requireUser } from '@/app/lib/session'
import { equipSkill, unequipSkill, unlockSkillNode } from '@/app/lib/progression/actions'
import { getLoadoutSlotCount } from '@/app/lib/progression/constants'
import { computeBaseStats } from '@/app/lib/battle/engine'
import { getEligiblePlayerSkills, getTreeBonus } from '@/app/lib/battle/queries'
import { getEquippedSkillRows, getSelectedCharacter, getSkillTree, getUnlockedNodeIds } from '@/app/lib/progression/queries'
import { describeEffect } from '@/app/lib/battle/presentation'
import { XP_PER_LEVEL } from '@/app/lib/battle/constants'
import { resolveErrorMessage } from '@/app/lib/error-messages'
import { StatGrid } from '@/app/components/StatGrid'
import type { SkillEffect } from '@/app/lib/battle/types'

const STATUS_ERROR_MESSAGES: Record<string, string> = {
  not_found: 'Personagem não encontrado.',
  invalid_node: 'Nó inválido para esse personagem.',
  insufficient_points: 'Pontos insuficientes.',
  missing_prerequisite: 'Pré-requisito ainda não desbloqueado.',
  invalid_skill: 'Essa skill não está disponível pra equipar.',
  invalid_slot: 'Slot de loadout inválido.',
}

function parseEffects(json: unknown): SkillEffect[] {
  return Array.isArray(json) ? (json as SkillEffect[]) : []
}

export default async function StatusPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const errorMessage = resolveErrorMessage(STATUS_ERROR_MESSAGES, error, 'Ocorreu um erro.')

  const user = await requireUser()

  const selected = await getSelectedCharacter(user.id)

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

  const [nodes, unlockedIds, treeBonus, eligibleSkills, equippedRows] = await Promise.all([
    getSkillTree(selected.characterId),
    getUnlockedNodeIds(selected.id),
    getTreeBonus(selected.id),
    getEligiblePlayerSkills(selected.id, selected.characterId, selected.level),
    getEquippedSkillRows(selected.id),
  ])
  const effectiveStats = computeBaseStats(selected.character, treeBonus)
  const xpForNextLevel = selected.level * XP_PER_LEVEL
  const slotCount = getLoadoutSlotCount(selected.level)

  const equippedBySlot = new Map(equippedRows.map((r) => [r.slot, r]))
  const equippedSkillIds = new Set(equippedRows.map((r) => r.skillId))
  const unequippedEligible = Object.values(eligibleSkills).filter((s) => !equippedSkillIds.has(s.id))

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

      <div className="card p-4 space-y-3">
        <h2 className="font-semibold">Atributos</h2>
        <div className="text-sm opacity-70">Nível {selected.level} · EXP {selected.experience} / {xpForNextLevel}</div>
        <StatGrid
          stats={[
            { label: 'HP', value: effectiveStats.hp },
            { label: 'ATK', value: effectiveStats.attack },
            { label: 'DEF', value: effectiveStats.defense },
            { label: 'SPD', value: effectiveStats.speed },
            { label: 'EN', value: effectiveStats.energy },
          ]}
        />
      </div>

      <div className="card p-4 space-y-3">
        <h2 className="font-semibold">Loadout ({equippedRows.length}/{slotCount})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: slotCount }, (_, slot) => {
            const row = equippedBySlot.get(slot)
            if (row) {
              const effects = parseEffects(row.skill.effects)
              return (
                <div key={slot} className="rounded-md border border-accent/40 bg-accent/5 p-3">
                  <div className="font-medium">{row.skill.name}</div>
                  {effects.length > 0 && <div className="text-xs opacity-70 mt-0.5">{effects.map(describeEffect).join(' · ')}</div>}
                  <form action={unequipSkill.bind(null, selected.id, slot)} className="mt-2">
                    <button type="submit" className="rounded-md px-3 py-1.5 text-xs border border-black/10 hover:bg-black/5">Desequipar</button>
                  </form>
                </div>
              )
            }
            return (
              <div key={slot} className="rounded-md border border-dashed border-black/20 p-3">
                <div className="text-sm opacity-60 mb-2">Slot vazio</div>
                {unequippedEligible.length > 0 ? (
                  <form action={equipSkill.bind(null, selected.id, slot)} className="flex gap-2">
                    <select name="skillId" className="flex-1 rounded-md border border-black/10 px-2 py-1 text-sm bg-white">
                      {unequippedEligible.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <button type="submit" className="rounded-md px-3 py-1.5 text-xs border border-black/10 hover:bg-black/5">Equipar</button>
                  </form>
                ) : (
                  <div className="text-xs opacity-50">Nenhuma skill disponível pra equipar</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

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

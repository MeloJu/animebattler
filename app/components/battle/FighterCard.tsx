import Image from 'next/image'
import { StatBar } from './StatBar'
import { StatusBadges } from './StatusBadges'
import type { CombatantState } from '@/app/lib/battle/types'

export function FighterCard({
  name,
  imageUrl,
  levelBadge,
  transformationName,
  combatant,
}: {
  name: string
  imageUrl: string | null
  levelBadge?: number
  transformationName?: string
  combatant: CombatantState
}) {
  return (
    <div className="card p-4 space-y-3">
      <div className="relative h-40 w-full rounded-lg overflow-hidden bg-gray-200">
        {imageUrl ? (
          <Image src={imageUrl} alt={name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 320px" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-sm text-gray-500">No Image</div>
        )}
        {levelBadge !== undefined && (
          <span className="absolute top-2 right-2 rounded-full bg-accent text-white text-xs font-semibold px-2 py-1">Lv.{levelBadge}</span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="font-semibold">{name}</div>
        {transformationName && (
          <span className="text-xs rounded-full bg-accent/20 text-accent px-2 py-0.5">{transformationName}</span>
        )}
      </div>
      <StatBar label="HP" current={combatant.currentHp} max={combatant.maxHp} colorClass="bg-green-500" />
      <StatBar label="Energia" current={combatant.currentEnergy} max={combatant.maxEnergy} colorClass="bg-blue-500" />
      <StatusBadges effects={combatant.statusEffects} />
    </div>
  )
}

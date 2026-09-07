import Image from 'next/image'
import { CharacterMonogram } from '@/app/components/CharacterImage'
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
      <div className="relative h-40 w-full rounded-lg overflow-hidden bg-background-alt">
        {imageUrl ? (
          <Image src={imageUrl} alt={name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 320px" />
        ) : (
          <CharacterMonogram name={name} />
        )}
        {levelBadge !== undefined && (
          <span className="absolute top-2 right-2 rounded-full bg-accent text-background text-xs font-semibold px-2 py-1">Lv.{levelBadge}</span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="font-semibold">{name}</div>
        {transformationName && (
          <span className="text-xs rounded-full bg-accent/20 text-accent px-2 py-0.5">{transformationName}</span>
        )}
      </div>
      <StatBar label="HP" current={combatant.currentHp} max={combatant.maxHp} colorClass="bg-green-500" />
      <StatBar label="Energia" current={combatant.currentEnergy} max={combatant.maxEnergy} colorClass="bg-spirit" />
      {/* Só aparece para quem tem reserva: batalha antiga foi gravada antes da
          stamina existir, e uma barra zerada ali seria informação falsa. */}
      {(combatant.maxStamina ?? 0) > 0 && (
        <StatBar
          label="Stamina"
          current={combatant.currentStamina ?? 0}
          max={combatant.maxStamina ?? 0}
          colorClass="bg-amber-500"
        />
      )}
      <StatusBadges effects={combatant.statusEffects} />
    </div>
  )
}

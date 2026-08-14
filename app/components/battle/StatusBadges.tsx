import { describeEffect } from '@/app/lib/battle/presentation'
import type { StatusEffectInstance } from '@/app/lib/battle/types'

export function StatusBadges({ effects }: { effects: StatusEffectInstance[] }) {
  if (effects.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1">
      {effects.map((e) => (
        <span key={e.id} title={e.sourceSkillName} className="text-xs rounded-full bg-black/5 px-2 py-0.5">
          {describeEffect(e)} ({e.remainingRounds})
        </span>
      ))}
    </div>
  )
}

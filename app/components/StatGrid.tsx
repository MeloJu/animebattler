// Covers the HP/ATK/DEF/SPD/EN grid in dashboard, status, and
// characters/[id]. The three aren't visually identical (different grid
// breakpoints, light vs dark item styling), so the wrapper's and each
// item's classes are passthrough props rather than baked in — this dedupes
// the repeated "5 stats mapped to bordered boxes" structure without
// silently changing any of the three layouts.
export function StatGrid({
  stats,
  gridClassName = 'grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm',
  itemClassName = 'rounded-md border border-black/10 p-3',
}: {
  stats: { label: string; value: number | string }[]
  gridClassName?: string
  itemClassName?: string
}) {
  return (
    <div className={gridClassName}>
      {stats.map((s) => (
        <div key={s.label} className={itemClassName}>
          {s.label} <span className="font-semibold">{s.value}</span>
        </div>
      ))}
    </div>
  )
}

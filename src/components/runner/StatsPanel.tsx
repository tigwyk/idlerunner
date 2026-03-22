import type { Runner } from '@/types'
import { STAT_NAMES } from '@/game/config'
import { calculateTotalStats } from '@/game/runner/RunnerUtils'

interface StatsPanelProps {
  runner: Runner
}

export default function StatsPanel({ runner }: StatsPanelProps) {
  const stats = calculateTotalStats(runner)

  return (
    <div className="space-y-2">
      {(Object.keys(stats) as Array<keyof typeof stats>).map((stat) => (
        <div key={stat} className="flex justify-between text-sm">
          <span className="text-gray-500">{STAT_NAMES[stat]}</span>
          <div className="text-right">
            <span className="text-gray-300">{runner.baseStats[stat]}</span>
            {stats[stat] > runner.baseStats[stat] && (
              <span className="text-success-400 ml-1">
                +{stats[stat] - runner.baseStats[stat]}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

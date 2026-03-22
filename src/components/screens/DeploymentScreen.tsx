import { useGameStore } from '@/store/gameStore'
import { SECTOR_NAMES, SECTOR_DESCRIPTIONS } from '@/game/config'
import { getSectorConfig } from '@/game/sectors/SectorGenerator'

export default function DeploymentScreen() {
  const { runner, activeRun, startRun } = useGameStore()

  if (activeRun) {
    return (
      <div className="card">
        <p className="text-gray-400">Run in progress. Return to overview to monitor.</p>
      </div>
    )
  }

  const sectors: Array<'residential' | 'industrial' | 'research'> = ['residential', 'industrial', 'research']

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-300 mb-2">Deployment</h2>
        <p className="text-sm text-gray-500">Select a sector to deploy your runner.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sectors.map((sector) => {
          const config = getSectorConfig(sector)
          const isLocked = 
            (sector === 'industrial' && runner.level < 5) ||
            (sector === 'research' && runner.level < 10)

          return (
            <SectorDeploymentCard
              key={sector}
              type={sector}
              config={config}
              locked={isLocked}
              lockReason={
                sector === 'industrial' ? 'Requires Level 5' :
                sector === 'research' ? 'Requires Level 10' : undefined
              }
              onDeploy={() => startRun(sector)}
            />
          )
        })}
      </div>

      <div className="card">
        <h3 className="font-medium text-gray-300 mb-3">Deployment Info</h3>
        <div className="text-sm text-gray-500 space-y-2">
          <p>• Your runner will automatically navigate through rooms in the sector.</p>
          <p>• Combat encounters are resolved automatically based on your stats.</p>
          <p>• Collect resources and equipment along the way.</p>
          <p>• Reach the extraction point before time runs out to secure your loot.</p>
          <p>• Failed extractions result in losing all collected loot.</p>
        </div>
      </div>
    </div>
  )
}

interface SectorDeploymentCardProps {
  type: 'residential' | 'industrial' | 'research'
  config: ReturnType<typeof getSectorConfig>
  locked: boolean
  lockReason?: string
  onDeploy: () => void
}

function SectorDeploymentCard({ type, config, locked, lockReason, onDeploy }: SectorDeploymentCardProps) {
  const difficultyStars = '★'.repeat(config.difficulty) + '☆'.repeat(3 - config.difficulty)

  return (
    <div className={`card ${locked ? 'opacity-50' : ''}`}>
      <div className="mb-4">
        <h3 className="font-semibold text-gray-200">{SECTOR_NAMES[type]}</h3>
        <p className="text-xs text-gray-500 mt-1">{SECTOR_DESCRIPTIONS[type]}</p>
      </div>

      <div className="space-y-2 text-sm mb-4">
        <div className="flex justify-between">
          <span className="text-gray-500">Difficulty</span>
          <span className="text-warning-400">{difficultyStars}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Rooms</span>
          <span className="text-gray-300">{config.roomCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Time Limit</span>
          <span className="text-gray-300">{config.maxExtractionTime}s</span>
        </div>
      </div>

      <button
        onClick={onDeploy}
        disabled={locked}
        className={`
          w-full py-2 rounded font-medium text-sm transition-colors
          ${locked 
            ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
            : 'bg-primary-600 hover:bg-primary-500 text-white'
          }
        `}
      >
        {locked ? (lockReason || 'Locked') : 'Deploy'}
      </button>
    </div>
  )
}

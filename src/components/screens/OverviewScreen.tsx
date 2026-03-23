import { useGameStore } from '@/store/gameStore'
import { useEconomyStore } from '@/store/economyStore'
import { SECTOR_NAMES, SECTOR_DESCRIPTIONS } from '@/game/config'
import ActiveRunPanel from '../run/ActiveRunPanel'
import StatsPanel from '../runner/StatsPanel'

export default function OverviewScreen() {
  const { runner, activeRun, runsCompleted, runsFailed, setCurrentScreen } = useGameStore()
  const resources = useEconomyStore((state) => state.resources)

  if (activeRun) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-300">Active Run</h2>
        <ActiveRunPanel />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-300 mb-4">Runner Status</h2>
          <StatsPanel runner={runner} />
          
          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Health</span>
              <span className={runner.health < runner.maxHealth * 0.3 ? 'text-danger-400' : 'text-gray-300'}>
                {runner.health} / {runner.maxHealth}
              </span>
            </div>
            <div className="stat-bar mt-2">
              <div 
                className={`stat-bar-fill ${
                  runner.health < runner.maxHealth * 0.3 ? 'bg-danger-500' : 'bg-success-500'
                }`}
                style={{ width: `${(runner.health / runner.maxHealth) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-300 mb-4">Statistics</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <StatItem label="Runs Completed" value={runsCompleted} />
            <StatItem label="Runs Failed" value={runsFailed} />
            <StatItem label="Success Rate" value={`${runsCompleted + runsFailed > 0 
              ? Math.round((runsCompleted / (runsCompleted + runsFailed)) * 100) 
              : 0}%`} />
            <StatItem label="Runner Level" value={runner.level} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-300 mb-4">Available Sectors</h2>
          <div className="space-y-3">
            <SectorCard 
              type="residential" 
              onClick={() => setCurrentScreen('deployment')}
            />
            <SectorCard 
              type="industrial" 
              onClick={() => setCurrentScreen('deployment')}
              locked={runner.level < 5}
            />
            <SectorCard 
              type="research" 
              onClick={() => setCurrentScreen('deployment')}
              locked={runner.level < 10}
            />
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-300 mb-4">Resources</h2>
          <div className="grid grid-cols-2 gap-3">
            <ResourceItem type="credits" amount={resources.credits} />
            <ResourceItem type="metals" amount={resources.metals} />
            <ResourceItem type="electronics" amount={resources.electronics} />
            <ResourceItem type="data" amount={resources.data} />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-200">{value}</span>
    </div>
  )
}

function SectorCard({ 
  type, 
  onClick, 
  locked = false 
}: { 
  type: 'residential' | 'industrial' | 'research'
  onClick: () => void
  locked?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={locked}
      className={`
        w-full text-left p-4 rounded border transition-colors
        ${locked 
          ? 'bg-gray-900 border-gray-800 opacity-50 cursor-not-allowed' 
          : 'bg-gray-800 border-gray-700 hover:border-primary-500 hover:bg-gray-750'
        }
      `}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-200">{SECTOR_NAMES[type]}</h3>
          <p className="text-xs text-gray-500 mt-1">{SECTOR_DESCRIPTIONS[type]}</p>
        </div>
        {locked && <span className="text-xs text-gray-500">Lv.5 Required</span>}
      </div>
    </button>
  )
}

function ResourceItem({ type, amount }: { type: string; amount: number }) {
  const colors: Record<string, string> = {
    credits: 'border-yellow-500/30',
    metals: 'border-gray-500/30',
    electronics: 'border-blue-500/30',
    data: 'border-purple-500/30',
  }
  
  return (
    <div className={`p-3 rounded bg-gray-800 border ${colors[type] || 'border-gray-700'}`}>
      <div className="text-xs text-gray-500 capitalize">{type}</div>
      <div className="text-lg font-medium text-gray-200">{formatNumber(amount)}</div>
    </div>
  )
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

import { useGameStore } from '@/store/gameStore'

export default function Header() {
  const { runner, resources, activeRun } = useGameStore()

  return (
    <header className="bg-gray-900 border-b border-gray-800 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-primary-400">MARATHON IDLE</h1>
          <span className="text-xs text-gray-500">v0.1.0</span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-sm">
            <span className="text-gray-500">Runner: </span>
            <span className="text-white">{runner.name}</span>
            <span className="text-gray-500 ml-2">Lv.{runner.level}</span>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <ResourceDisplay type="credits" amount={resources.credits} />
            <ResourceDisplay type="metals" amount={resources.metals} />
            <ResourceDisplay type="electronics" amount={resources.electronics} />
            <ResourceDisplay type="data" amount={resources.data} />
          </div>
          
          <div className="text-sm">
            <span className="text-gray-500">Status: </span>
            <span className={activeRun ? 'text-warning-400' : 'text-success-400'}>
              {activeRun ? 'ACTIVE' : 'IDLE'}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

function ResourceDisplay({ type, amount }: { type: string; amount: number }) {
  return (
    <div className="flex items-center gap-1">
      <ResourceIcon type={type} />
      <span className="text-gray-300">{formatNumber(amount)}</span>
    </div>
  )
}

function ResourceIcon({ type }: { type: string }) {
  const colors: Record<string, string> = {
    credits: 'text-yellow-400',
    metals: 'text-gray-400',
    electronics: 'text-blue-400',
    data: 'text-purple-400',
  }
  
  const icons: Record<string, string> = {
    credits: '¢',
    metals: '◆',
    electronics: '◈',
    data: '◇',
  }
  
  return <span className={colors[type] || 'text-gray-400'}>{icons[type] || '?'}</span>
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

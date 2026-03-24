import { useGameStore } from '@/store/gameStore'
import { useEconomyStore } from '@/store/economyStore'
import { useAuthStore } from '@/store/authStore'
import { useMultiplayerStore } from '@/store/multiplayerStore'

export default function Header() {
  const { runner, activeRun, prestigeLevel } = useGameStore()
  const resources = useEconomyStore((state) => state.resources)
  const authStatus = useAuthStore((state) => state.status)
  const multiplayerStatus = useMultiplayerStore((state) => state.backendHealth?.status ?? 'offline')

  return (
    <header className="bg-surface-dark border-b border-white/5 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-display font-bold text-accent-yellow tracking-widest-custom uppercase">
            MARATHON IDLE
          </h1>
          <span className="text-2xs text-text-muted font-mono">v0.1.0</span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-xs font-caption flex items-center gap-1">
            <span className="text-text-muted">Runner: </span>
            <span className="text-text-primary">{runner.name}</span>
            <span className="text-accent-lime ml-1">LV.{runner.level}</span>
            {prestigeLevel > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded text-2xs bg-accent-yellow/20 text-accent-yellow font-bold leading-none">
                P{prestigeLevel}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-xs font-mono">
            <ResourceDisplay type="credits" amount={resources.credits} />
            <ResourceDisplay type="metals" amount={resources.metals} />
            <ResourceDisplay type="electronics" amount={resources.electronics} />
            <ResourceDisplay type="data" amount={resources.data} />
          </div>
          
          <div className="text-xs font-label uppercase tracking-wide-custom">
            <span className="text-text-muted">Status: </span>
            <span className={activeRun ? 'text-accent-yellow accent-glow' : 'text-accent-lime'}>
              {activeRun ? 'ACTIVE' : 'IDLE'}
            </span>
          </div>

          <div className="text-xs font-label uppercase tracking-wide-custom">
            <span className="text-text-muted">Account: </span>
            <span className={authStatus === 'authenticated' ? 'text-accent-lime' : 'text-text-secondary'}>
              {authStatus}
            </span>
          </div>

          <div className="text-xs font-label uppercase tracking-wide-custom">
            <span className="text-text-muted">MP: </span>
            <span className={multiplayerStatus === 'online' ? 'text-accent-lime' : 'text-accent-yellow'}>
              {multiplayerStatus}
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
      <span className="text-text-secondary">{formatNumber(amount)}</span>
    </div>
  )
}

function ResourceIcon({ type }: { type: string }) {
  const colors: Record<string, string> = {
    credits: 'text-accent-yellow',
    metals: 'text-text-muted',
    electronics: 'text-primary-400',
    data: 'text-purple-400',
  }
  
  const icons: Record<string, string> = {
    credits: '¢',
    metals: '◆',
    electronics: '◈',
    data: '◇',
  }
  
  return <span className={colors[type] || 'text-text-muted'}>{icons[type] || '?'}</span>
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

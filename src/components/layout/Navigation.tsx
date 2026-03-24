import { useGameStore } from '@/store/gameStore'
import type { GameScreen } from '@/types'

const NAV_ITEMS: { id: GameScreen; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'deployment', label: 'Deploy' },
  { id: 'runner', label: 'Runner' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'skills', label: 'Skills' },
  { id: 'vendor', label: 'Vendor' },
  { id: 'log', label: 'Log' },
  { id: 'multiplayer', label: 'Multiplayer' },
  { id: 'settings', label: 'Settings' },
]

export default function Navigation() {
  const { currentScreen, setCurrentScreen, activeRun } = useGameStore()

  return (
    <nav className="bg-surface-dark border-b border-white/5">
      <div className="max-w-6xl mx-auto flex">
        {NAV_ITEMS.map((item) => {
          const isActive = currentScreen === item.id
          const isDeploy = item.id === 'deployment'
          const isDisabled = isDeploy && !!activeRun
          
          return (
            <button
              key={item.id}
              onClick={() => !isDisabled && setCurrentScreen(item.id)}
              disabled={isDisabled}
              className={`
                px-6 py-3 text-xs font-label uppercase tracking-wide-custom transition-colors relative
                ${isActive 
                  ? 'text-accent-yellow bg-surface-raised' 
                  : 'text-text-muted hover:text-text-secondary hover:bg-surface-raised/50'
                }
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {item.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-px bg-accent-yellow" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

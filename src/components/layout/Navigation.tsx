import { useGameStore } from '@/store/gameStore'
import type { GameScreen } from '@/types'

const NAV_ITEMS: { id: GameScreen; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'deployment', label: 'Deploy' },
  { id: 'runner', label: 'Runner' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'skills', label: 'Skills' },
  { id: 'log', label: 'Log' },
]

export default function Navigation() {
  const { currentScreen, setCurrentScreen, activeRun } = useGameStore()

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
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
                px-6 py-3 text-sm font-medium transition-colors relative
                ${isActive 
                  ? 'text-primary-400 bg-gray-800/50' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
                }
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {item.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-400" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

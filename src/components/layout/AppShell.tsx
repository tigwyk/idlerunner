import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import Header from './Header'
import Navigation from './Navigation'
import OverviewScreen from '@/components/screens/OverviewScreen'
import DeploymentScreen from '@/components/screens/DeploymentScreen'
import MultiplayerScreen from '@/components/screens/MultiplayerScreen'
import RunnerScreen from '@/components/screens/RunnerScreen'
import InventoryScreen from '@/components/screens/InventoryScreen'
import SkillsScreen from '@/components/screens/SkillsScreen'
import LogScreen from '@/components/screens/LogScreen'
import { useAuthStore } from '@/store/authStore'
import { useMultiplayerStore } from '@/store/multiplayerStore'

export default function AppShell() {
  const { currentScreen, tick, initializeGame } = useGameStore()
  const initializeAuth = useAuthStore((state) => state.initializeAuth)
  const initializeMultiplayer = useMultiplayerStore((state) => state.initializeMultiplayer)

  useEffect(() => {
    initializeGame()
    void initializeAuth()
    void initializeMultiplayer()
    
    const interval = setInterval(() => {
      tick()
    }, 1000)

    return () => clearInterval(interval)
  }, [tick, initializeGame, initializeAuth, initializeMultiplayer])

  const renderScreen = () => {
    switch (currentScreen) {
      case 'overview':
        return <OverviewScreen />
      case 'deployment':
        return <DeploymentScreen />
      case 'multiplayer':
        return <MultiplayerScreen />
      case 'runner':
        return <RunnerScreen />
      case 'inventory':
        return <InventoryScreen />
      case 'skills':
        return <SkillsScreen />
      case 'log':
        return <LogScreen />
      default:
        return <OverviewScreen />
    }
  }

  return (
    <div className="min-h-screen bg-surface text-text-primary flex flex-col">
      <Header />
      <Navigation />
      <main className="flex-1 p-4 max-w-6xl mx-auto w-full">
        {renderScreen()}
      </main>
    </div>
  )
}

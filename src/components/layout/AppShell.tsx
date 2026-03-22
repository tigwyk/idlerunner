import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import Header from './Header'
import Navigation from './Navigation'
import OverviewScreen from '@/components/screens/OverviewScreen'
import DeploymentScreen from '@/components/screens/DeploymentScreen'
import RunnerScreen from '@/components/screens/RunnerScreen'
import InventoryScreen from '@/components/screens/InventoryScreen'
import SkillsScreen from '@/components/screens/SkillsScreen'
import LogScreen from '@/components/screens/LogScreen'

export default function AppShell() {
  const { currentScreen, tick, initializeGame } = useGameStore()

  useEffect(() => {
    initializeGame()
    
    const interval = setInterval(() => {
      tick()
    }, 1000)

    return () => clearInterval(interval)
  }, [tick, initializeGame])

  const renderScreen = () => {
    switch (currentScreen) {
      case 'overview':
        return <OverviewScreen />
      case 'deployment':
        return <DeploymentScreen />
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
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <Header />
      <Navigation />
      <main className="flex-1 p-4 max-w-6xl mx-auto w-full">
        {renderScreen()}
      </main>
    </div>
  )
}

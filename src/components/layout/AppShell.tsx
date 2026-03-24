import { useEffect, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'
import Header from './Header'
import Navigation from './Navigation'
import ToastStack from './ToastStack'
import OverviewScreen from '@/components/screens/OverviewScreen'
import DeploymentScreen from '@/components/screens/DeploymentScreen'
import MultiplayerScreen from '@/components/screens/MultiplayerScreen'
import RunnerScreen from '@/components/screens/RunnerScreen'
import InventoryScreen from '@/components/screens/InventoryScreen'
import SkillsScreen from '@/components/screens/SkillsScreen'
import LogScreen from '@/components/screens/LogScreen'
import VendorScreen from '@/components/screens/VendorScreen'
import { useAuthStore } from '@/store/authStore'
import { useMultiplayerStore } from '@/store/multiplayerStore'
import { PvpEventBanner } from '@/components/run/ActiveRunPanel'

export default function AppShell() {
  const { currentScreen, tick, initializeGame, activeRun } = useGameStore()
  const { initializeAuth, profile } = useAuthStore()
  const { initializeMultiplayer, endMultiplayerRun, pvpEvent, clearPvpEvent } = useMultiplayerStore()

  useEffect(() => {
    initializeGame()
    void initializeAuth()
    void initializeMultiplayer()
    
    const interval = setInterval(() => {
      tick()
    }, 1000)

    return () => clearInterval(interval)
  }, [tick, initializeGame, initializeAuth, initializeMultiplayer])

  // Global cleanup: when the run ends (on any screen), tear down the multiplayer session.
  // Always call endMultiplayerRun() unconditionally — it clears queueState, activeRunSession,
  // and stops polling regardless of whether a WebSocket session was established. Without this,
  // a stale queueState with status 'matched' can cause DeploymentScreen to auto-start a new
  // run the next time it mounts.
  const prevActiveRun = useRef(activeRun)
  useEffect(() => {
    const runJustEnded = prevActiveRun.current !== null && activeRun === null
    prevActiveRun.current = activeRun
    if (runJustEnded) {
      endMultiplayerRun()
      void initializeAuth() // refresh MMR
    }
  }, [activeRun]) // eslint-disable-line react-hooks/exhaustive-deps

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
      case 'vendor':
        return <VendorScreen />
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
        {/* Global PvP event banner — visible on any screen during a multiplayer run */}
        {pvpEvent && currentScreen !== 'overview' && (
          <div className="mb-4">
            <PvpEventBanner
              event={pvpEvent}
              myUserId={profile?.id ?? ''}
              onDismiss={clearPvpEvent}
            />
          </div>
        )}
        {renderScreen()}
      </main>
      <ToastStack />
    </div>
  )
}

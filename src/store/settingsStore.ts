import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Settings } from '@/types'

interface SettingsStore extends Settings {
  setAutoSaveInterval: (interval: number) => void
  setShowDamageNumbers: (show: boolean) => void
  setShowLootNotifications: (show: boolean) => void
  setCompactMode: (compact: boolean) => void
  setTheme: (theme: 'dark' | 'light') => void
  resetSettings: () => void
}

const defaultSettings: Settings = {
  autoSaveInterval: 60000,
  showDamageNumbers: true,
  showLootNotifications: true,
  compactMode: false,
  theme: 'dark',
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setAutoSaveInterval: (interval) => set({ autoSaveInterval: interval }),
      setShowDamageNumbers: (show) => set({ showDamageNumbers: show }),
      setShowLootNotifications: (show) => set({ showLootNotifications: show }),
      setCompactMode: (compact) => set({ compactMode: compact }),
      setTheme: (theme) => set({ theme: theme }),
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'marathon-idle-settings',
      version: 1,
    }
  )
)

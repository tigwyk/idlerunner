import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { 
  GameState, 
  ResourceType, 
  Equipment, 
  ActiveRun,
  LogEntry,
  SkillType,
  GameScreen,
  LoadoutType,
  AllEquipmentSlot
} from '@/types'
import { 
  createInitialRunner, 
  calculateXpToLevel,
  addSkillXp,
  createInitialEquipment
} from '@/game/runner/RunnerUtils'
import { GAME_CONFIG } from '@/game/config'
import { generateSector } from '@/game/sectors/SectorGenerator'
import { processTick } from '@/game/engine/GameLoop'
import { calculateOfflineProgress } from '@/game/engine/OfflineCalculator'
import { getKitEquipment } from '@/game/data/kits'
import { useEconomyStore } from '@/store/economyStore'
import { ACHIEVEMENTS, type AchievementCounters } from '@/game/data/achievements'
import { notify } from '@/store/notificationStore'

export interface GameStore extends GameState {
  setCurrentScreen: (screen: GameScreen) => void
  startRun: (sectorType: ActiveRun['sector'], loadoutType: LoadoutType, kitId?: string) => void
  updateResources: (resources: Partial<Record<ResourceType, number>>) => void
  addToInventory: (equipment: Equipment) => void
  removeFromInventory: (equipmentId: string) => void
  equipItem: (equipment: Equipment) => void
  unequipItem: (slot: AllEquipmentSlot) => void
  addLog: (type: LogEntry['type'], message: string) => void
  tick: () => void
  initializeGame: () => void
  resetGame: () => void
  healRunner: (amount: number) => void
  addRunnerXp: (amount: number) => void
  addSkillXp: (skill: SkillType, amount: number) => void
  completeRun: (success: boolean) => void
  updateActiveRun: (updates: Partial<ActiveRun>) => void
  prestigeGame: () => boolean
  checkAchievements: () => void
  incrementBossesKilled: () => void
  incrementEnemiesKilled: (count: number) => void
}

const initialState: GameState = {
  runner: createInitialRunner(),
  resources: {
    metals: 0,
    electronics: 0,
    data: 0,
    credits: 100,
  },
  inventory: [],
  activeRun: null,
  currentScreen: 'overview',
  lastTick: Date.now(),
  lastSave: Date.now(),
  totalPlayTime: 0,
  runsCompleted: 0,
  runsFailed: 0,
  log: [],
  prestigeLevel: 0,
  prestigeTokens: 0,
  unlockedAchievements: [],
  bossesKilled: 0,
  totalEnemiesKilled: 0,
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentScreen: (screen) => set({ currentScreen: screen }),

      startRun: (sectorType, loadoutType, kitId) => {
        const sector = generateSector(sectorType)
        const state = get()
        
        let equipment: Partial<Record<AllEquipmentSlot, Equipment>> = {}
        let customGearAtRisk: Equipment[] = []
        
        if (loadoutType === 'kit' && kitId) {
          equipment = getKitEquipment(kitId)
        } else {
          equipment = { ...state.runner.equipment }
          customGearAtRisk = Object.values(state.runner.equipment).filter((e): e is Equipment => e !== undefined)
        }
        
        const activeRun: ActiveRun = {
          sector: sectorType,
          rooms: sector.rooms,
          currentRoom: 0,
          roomProgress: 0,
          extractionTimer: sector.maxExtractionTime,
          maxExtractionTime: sector.maxExtractionTime,
          startTime: Date.now(),
          enemiesDefeated: 0,
          resourcesCollected: {},
          equipmentCollected: [],
          skillsUsed: {},
          loadoutType,
          kitId: kitId || null,
          customGearAtRisk,
        }
        
        set((s) => ({
          activeRun,
          currentScreen: 'overview',
          runner: {
            ...s.runner,
            status: 'active',
            currentSector: sectorType,
            currentRoom: 0,
            equipment,
            activeKitId: kitId || null,
            activeEffects: [],
          },
        }))
        
        get().addLog('info', `Deployed to ${sector.name}${loadoutType === 'kit' ? ' with kit' : ' with custom loadout'}`)
      },

      updateResources: (resources) => set((state) => ({
        resources: {
          ...state.resources,
          ...Object.fromEntries(
            Object.entries(resources).map(([key, value]) => [
              key,
              Math.max(0, (state.resources[key as ResourceType] || 0) + (value || 0))
            ])
          ),
        },
      })),

      addToInventory: (equipment) => set((state) => ({
        inventory: [...state.inventory, equipment],
      })),

      removeFromInventory: (equipmentId) => set((state) => ({
        inventory: state.inventory.filter((e) => e.id !== equipmentId),
      })),

      equipItem: (equipment) => set((state) => {
        const currentEquipped = state.runner.equipment[equipment.slot]
        const newInventory = state.inventory.filter((e) => e.id !== equipment.id)
        
        if (currentEquipped) {
          newInventory.push(currentEquipped)
        }

        return {
          inventory: newInventory,
          runner: {
            ...state.runner,
            equipment: {
              ...state.runner.equipment,
              [equipment.slot]: equipment,
            },
          },
        }
      }),

      unequipItem: (slot) => set((state) => {
        const equipped = state.runner.equipment[slot]
        if (!equipped) return state

        const newEquipment = { ...state.runner.equipment }
        delete newEquipment[slot]

        return {
          inventory: [...state.inventory, equipped],
          runner: {
            ...state.runner,
            equipment: newEquipment,
          },
        }
      }),

      addLog: (type, message) => {
        const entry: LogEntry = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          type,
          message,
        }
        set((state) => ({
          log: [...state.log.slice(-99), entry],
        }))
      },

      tick: () => {
        const state = get()
        const now = Date.now()
        const deltaMs = now - state.lastTick
        const deltaTicks = Math.floor(deltaMs / GAME_CONFIG.tickInterval)

        if (deltaTicks < 1) return

        if (state.activeRun) {
          for (let i = 0; i < deltaTicks; i++) {
            processTick(get())
          }
        }

        set({
          lastTick: now,
          totalPlayTime: state.totalPlayTime + deltaMs,
        })
      },

      initializeGame: () => {
        const state = get()
        const now = Date.now()
        const offlineMs = now - state.lastTick

        if (offlineMs > GAME_CONFIG.tickInterval * 2 && state.activeRun) {
          const offlineResults = calculateOfflineProgress(state, offlineMs)
          if (offlineResults) {
            set((s) => ({
              resources: {
                ...s.resources,
                ...offlineResults.resources,
              },
              inventory: [...s.inventory, ...offlineResults.equipment],
              runner: {
                ...s.runner,
                skills: offlineResults.updatedSkills,
              },
              runsCompleted: s.runsCompleted + offlineResults.runsCompleted,
              runsFailed: s.runsFailed + offlineResults.runsFailed,
              activeRun: offlineResults.activeRun,
            }))
          }
        }

        set({ lastTick: now })
      },

      resetGame: () => {
        set({
          ...initialState,
          runner: createInitialRunner(),
          lastTick: Date.now(),
          lastSave: Date.now(),
        })
      },

      healRunner: (amount) => set((state) => ({
        runner: {
          ...state.runner,
          health: Math.min(state.runner.maxHealth, state.runner.health + amount),
        },
      })),

      addRunnerXp: (amount) => set((state) => {
        let newXp = state.runner.xp + amount
        let newLevel = state.runner.level
        let xpToNext = state.runner.xpToNext
        const oldLevel = state.runner.level

        while (newXp >= xpToNext && newLevel < 50) {
          newXp -= xpToNext
          newLevel++
          xpToNext = calculateXpToLevel(newLevel)
        }

        if (newLevel > oldLevel) {
          notify.success(`Level Up! → ${newLevel}`, 'Runner stats improved.')
        }

        return {
          runner: {
            ...state.runner,
            xp: newXp,
            level: newLevel,
            xpToNext,
          },
        }
      }),

      addSkillXp: (skill, amount) => set((state) => {
        const updatedSkills = { ...state.runner.skills }
        updatedSkills[skill] = addSkillXp(updatedSkills[skill], amount)
        return {
          runner: {
            ...state.runner,
            skills: updatedSkills,
          },
        }
      }),

      completeRun: (success) => {
        const state = get()
        const run = state.activeRun
        
        if (!run) return

        if (success) {
          const earned = run.resourcesCollected
          useEconomyStore.getState().reportRunEarnings(
            {
              credits:     earned.credits     ?? 0,
              metals:      earned.metals      ?? 0,
              electronics: earned.electronics ?? 0,
              data:        earned.data        ?? 0,
            },
            run.sector,
            run.currentRoom,
          )
          get().updateResources(run.resourcesCollected)
          run.equipmentCollected.forEach((e) => get().addToInventory(e))
          get().addRunnerXp(run.currentRoom * 10)
          
          Object.entries(run.skillsUsed).forEach(([skill, xp]) => {
            get().addSkillXp(skill as SkillType, xp)
          })

          set((s) => ({
            activeRun: null,
            runner: {
              ...s.runner,
              status: 'idle',
              currentSector: null,
              currentRoom: 0,
              health: s.runner.maxHealth,
              activeKitId: null,
              activeEffects: [],
            },
            runsCompleted: s.runsCompleted + 1,
          }))

          const lootMsg = run.loadoutType === 'kit' 
            ? `Extraction successful! ${run.currentRoom} rooms cleared. Kit items kept.`
            : `Extraction successful! ${run.currentRoom} rooms cleared.`
          get().addLog('success', lootMsg)
          notify.success('Extraction Complete', `${run.currentRoom} rooms cleared.`)
          get().checkAchievements()
        } else {
          const lostGearIds = run.customGearAtRisk.map(e => e.id)
          const newInventory = state.inventory.filter(
            (item) => !lostGearIds.includes(item.id)
          )
          
          set((s) => ({
            activeRun: null,
            inventory: newInventory,
            runner: {
              ...s.runner,
              status: 'idle',
              currentSector: null,
              currentRoom: 0,
              health: s.runner.maxHealth,
              equipment: createInitialEquipment(),
              activeKitId: null,
              activeEffects: [],
            },
            runsFailed: s.runsFailed + 1,
          }))
          
          const failMsg = run.loadoutType === 'kit'
            ? 'Extraction failed. Lost all loot and kit. Get a new kit from a vendor.'
            : 'Extraction failed. Lost all loot and equipped gear.'
          get().addLog('danger', failMsg)
          notify.error('Extraction Failed', run.loadoutType === 'kit' ? 'Lost all loot and kit.' : 'Lost all loot and gear.')
        }
      },

      updateActiveRun: (updates) => set((state) => ({
        activeRun: state.activeRun 
          ? { ...state.activeRun, ...updates }
          : null,
      })),

      checkAchievements: () => {
        const state = get()
        const counters: AchievementCounters = {
          bossesKilled: state.bossesKilled,
          totalEnemiesKilled: state.totalEnemiesKilled,
        }
        const fullState = { ...state, ...counters }
        const newlyUnlocked: string[] = []
        for (const achievement of ACHIEVEMENTS) {
          if (!state.unlockedAchievements.includes(achievement.id) && achievement.check(fullState)) {
            newlyUnlocked.push(achievement.id)
          }
        }
        if (newlyUnlocked.length > 0) {
          set((s) => ({ unlockedAchievements: [...s.unlockedAchievements, ...newlyUnlocked] }))
          for (const id of newlyUnlocked) {
            const a = ACHIEVEMENTS.find((x) => x.id === id)!
            notify.achievement(`${a.icon} ${a.title}`, a.description)
          }
        }
      },

      incrementBossesKilled: () => {
        set((s) => ({ bossesKilled: s.bossesKilled + 1 }))
        get().checkAchievements()
      },

      incrementEnemiesKilled: (count) => {
        set((s) => ({ totalEnemiesKilled: s.totalEnemiesKilled + count }))
        // Achievement check handled by completeRun to avoid per-tick overhead
      },

      prestigeGame: () => {
        const state = get()
        const PRESTIGE_MIN_LEVEL = 50
        const PRESTIGE_MIN_RUNS = 10
        if (state.runner.level < PRESTIGE_MIN_LEVEL || state.runsCompleted < PRESTIGE_MIN_RUNS) {
          return false
        }
        // Reset economy to local defaults (server will be updated on next auth sync)
        useEconomyStore.setState({
          resources: { credits: 100, metals: 0, electronics: 0, data: 0 },
          statUpgrades: {},
          isSynced: false,
        })
        set((s) => ({
          ...initialState,
          runner: createInitialRunner(),
          // Preserve run history and prestige progression
          runsCompleted: s.runsCompleted,
          runsFailed: s.runsFailed,
          prestigeLevel: s.prestigeLevel + 1,
          prestigeTokens: s.prestigeTokens + 1,
          currentScreen: 'overview' as GameScreen,
          lastTick: Date.now(),
          lastSave: Date.now(),
        }))
        get().addLog('success', `⭐ Prestige ${get().prestigeLevel} achieved! Bonuses: +${get().prestigeLevel * 15}% XP, +${get().prestigeLevel * 10}% resources.`)
        notify.achievement(`Prestige ${get().prestigeLevel} Achieved!`, `+${get().prestigeLevel * 15}% XP, +${get().prestigeLevel * 10}% resources.`)
        get().checkAchievements()
        return true
      },
    }),
    {
      name: 'marathon-idle-save',
      version: 6,
      migrate(persistedState: unknown, version: number) {
        const state = persistedState as GameState & { runner?: { activeEffects?: unknown[] } }
        if (version < 3 && state.runner) {
          state.runner.activeEffects = state.runner.activeEffects ?? []
        }
        if (version < 5) {
          (state as GameState).prestigeLevel  = (state as GameState).prestigeLevel  ?? 0
          ;(state as GameState).prestigeTokens = (state as GameState).prestigeTokens ?? 0
        }
        if (version < 6) {
          (state as GameState).unlockedAchievements = (state as GameState).unlockedAchievements ?? []
          ;(state as GameState).bossesKilled        = (state as GameState).bossesKilled        ?? 0
          ;(state as GameState).totalEnemiesKilled  = (state as GameState).totalEnemiesKilled  ?? 0
        }
        return state as unknown as GameStore
      },
      partialize: (state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { resources: _resources, ...rest } = state as GameStore
        return rest
      },
    }
  )
)

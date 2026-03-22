import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { 
  GameState, 
  ResourceType, 
  Equipment, 
  ActiveRun,
  LogEntry,
  SkillType,
  EquipmentSlot,
  GameScreen
} from '@/types'
import { 
  createInitialRunner, 
  calculateXpToLevel,
  addSkillXp
} from '@/game/runner/RunnerUtils'
import { GAME_CONFIG } from '@/game/config'
import { generateSector } from '@/game/sectors/SectorGenerator'
import { processTick } from '@/game/engine/GameLoop'
import { calculateOfflineProgress } from '@/game/engine/OfflineCalculator'

export interface GameStore extends GameState {
  setCurrentScreen: (screen: GameScreen) => void
  startRun: (sectorType: ActiveRun['sector']) => void
  updateResources: (resources: Partial<Record<ResourceType, number>>) => void
  addToInventory: (equipment: Equipment) => void
  removeFromInventory: (equipmentId: string) => void
  equipItem: (equipment: Equipment) => void
  unequipItem: (slot: EquipmentSlot) => void
  addLog: (type: LogEntry['type'], message: string) => void
  tick: () => void
  initializeGame: () => void
  resetGame: () => void
  healRunner: (amount: number) => void
  addRunnerXp: (amount: number) => void
  addSkillXp: (skill: SkillType, amount: number) => void
  completeRun: (success: boolean) => void
  updateActiveRun: (updates: Partial<ActiveRun>) => void
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
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentScreen: (screen) => set({ currentScreen: screen }),

      startRun: (sectorType) => {
        const sector = generateSector(sectorType)
        const activeRun: ActiveRun = {
          sector: sectorType,
          currentRoom: 0,
          roomProgress: 0,
          extractionTimer: sector.maxExtractionTime,
          startTime: Date.now(),
          enemiesDefeated: 0,
          resourcesCollected: {},
          equipmentCollected: [],
          skillsUsed: {},
        }
        
        set((state) => ({
          activeRun,
          runner: {
            ...state.runner,
            status: 'active',
            currentSector: sectorType,
            currentRoom: 0,
          },
        }))
        
        get().addLog('info', `Deployed to ${sector.name}`)
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

        return {
          inventory: [...state.inventory, equipped],
          runner: {
            ...state.runner,
            equipment: {
              ...state.runner.equipment,
              [slot]: null,
            },
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

        while (newXp >= xpToNext && newLevel < 50) {
          newXp -= xpToNext
          newLevel++
          xpToNext = calculateXpToLevel(newLevel)
        }

        return {
          runner: {
            ...state.runner,
            xp: newXp,
            level: newLevel,
            xpToNext,
            maxHealth: 100 + newLevel * 10,
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
            },
            runsCompleted: s.runsCompleted + 1,
          }))

          get().addLog('success', `Extraction successful! ${run.currentRoom} rooms cleared.`)
        } else {
          set((s) => ({
            activeRun: null,
            runner: {
              ...s.runner,
              status: 'idle',
              currentSector: null,
              currentRoom: 0,
              health: Math.floor(s.runner.maxHealth * 0.25),
            },
            runsFailed: s.runsFailed + 1,
          }))

          get().addLog('danger', 'Extraction failed. Runner escaped but lost all loot.')
        }
      },

      updateActiveRun: (updates) => set((state) => ({
        activeRun: state.activeRun 
          ? { ...state.activeRun, ...updates }
          : null,
      })),
    }),
    {
      name: 'marathon-idle-save',
      version: 1,
    }
  )
)

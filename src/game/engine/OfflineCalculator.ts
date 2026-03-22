import type { GameState, ActiveRun, Skill, SkillType } from '@/types'
import { addSkillXp } from '@/game/runner/RunnerUtils'

interface OfflineResult {
  resources: Partial<Record<string, number>>
  equipment: import('@/types').Equipment[]
  updatedSkills: Record<SkillType, Skill>
  runsCompleted: number
  runsFailed: number
  activeRun: ActiveRun | null
}

export function calculateOfflineProgress(
  state: GameState,
  offlineMs: number
): OfflineResult | null {
  if (!state.activeRun) return null

  const cappedMs = Math.min(offlineMs, 86400000) // 24 hour cap
  const ticksToProcess = Math.floor(cappedMs / 1000)
  
  const avgRoomTime = 8 // seconds per room on average
  const roomsPerTick = 1 / avgRoomTime
  const totalRoomsProgress = Math.floor(ticksToProcess * roomsPerTick)
  
  let currentRoom = state.activeRun.currentRoom
  let roomsCompleted = 0
  let runsCompleted = 0
  let runsFailed = 0
  
  const resources: Partial<Record<string, number>> = {}
  const equipment: import('@/types').Equipment[] = []
  const skills = { ...state.runner.skills }

  // Simulate progress through rooms
  while (roomsCompleted < totalRoomsProgress && runsCompleted + runsFailed < 10) {
    currentRoom++
    roomsCompleted++
    
    // Random resource gain per room
    if (Math.random() < 0.7) {
      const resourceType = ['metals', 'electronics', 'data', 'credits'][Math.floor(Math.random() * 4)]
      const amount = Math.floor(Math.random() * 20) + 5
      resources[resourceType] = (resources[resourceType] || 0) + amount
    }
    
    // Random equipment (rare)
    if (Math.random() < 0.1) {
      equipment.push({
        id: `offline-equip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: 'Salvaged Equipment',
        slot: ['primary', 'secondary', 'armor', 'utility'][Math.floor(Math.random() * 4)] as any,
        rarity: 'common',
        description: 'Found during offline run',
      })
    }
    
    // Add skill XP
    skills.scavenging = addSkillXp(skills.scavenging, 10)
    if (Math.random() < 0.5) {
      skills.combat = addSkillXp(skills.combat, 15)
    }
    
    // Check if extraction room reached
    if (currentRoom >= 5) { // Assuming 5 rooms per sector
      // 80% base success rate for offline
      if (Math.random() < 0.8) {
        runsCompleted++
        currentRoom = 0
      } else {
        runsFailed++
        currentRoom = 0
        // Lose loot on failure
        Object.keys(resources).forEach(k => {
          resources[k] = Math.floor((resources[k] || 0) * 0.25)
        })
        equipment.length = 0
      }
    }
  }
  
  const newActiveRun: ActiveRun = {
    ...state.activeRun,
    currentRoom: currentRoom,
    roomProgress: 0,
    extractionTimer: Math.max(0, state.activeRun.extractionTimer - ticksToProcess),
    resourcesCollected: {
      ...state.activeRun.resourcesCollected,
      ...resources,
    },
    equipmentCollected: [...state.activeRun.equipmentCollected, ...equipment],
    enemiesDefeated: state.activeRun.enemiesDefeated + Math.floor(roomsCompleted * 0.3),
    skillsUsed: {
      scavenging: (state.activeRun.skillsUsed.scavenging || 0) + roomsCompleted * 10,
      combat: (state.activeRun.skillsUsed.combat || 0) + Math.floor(roomsCompleted * 5),
    },
  }

  return {
    resources,
    equipment,
    updatedSkills: skills,
    runsCompleted,
    runsFailed,
    activeRun: runsCompleted + runsFailed > 0 ? null : newActiveRun,
  }
}

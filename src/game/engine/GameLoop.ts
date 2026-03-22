import type { GameStore } from '@/store/gameStore'
import { 
  calculateDamage, 
  calculateAccuracy, 
  calculateEvasion,
  calculateArmor,
  getSkillBonus 
} from '@/game/runner/RunnerUtils'
import { generateLoot } from '@/game/loot/LootGenerator'
import { GAME_CONFIG } from '@/game/config'
import { ALL_SLOTS } from '@/types'

export function processTick(store: GameStore): void {
  const { activeRun, runner } = store
  if (!activeRun) return

  const currentRoomData = activeRun.rooms[activeRun.currentRoom]

  if (!currentRoomData) {
    store.completeRun(false)
    return
  }

  switch (currentRoomData.type) {
    case 'combat':
      processCombatRoom(store, currentRoomData)
      break
    case 'resource':
      processResourceRoom(store, currentRoomData)
      break
    case 'loot':
      processLootRoom(store, currentRoomData)
      break
    case 'extraction':
      processExtractionRoom(store)
      break
    default:
      advanceRoom(store)
  }

  store.updateActiveRun({
    extractionTimer: activeRun.extractionTimer - 1,
  })

  if (activeRun.extractionTimer <= 0) {
    const extractChance = calculateExtractionChance(runner.skills.combat.level, activeRun.currentRoom)
    if (Math.random() < extractChance) {
      store.completeRun(true)
    } else {
      store.completeRun(false)
    }
  }
}

function processCombatRoom(store: GameStore, room: import('@/types').Room): void {
  if (!room.enemy) {
    advanceRoom(store)
    return
  }

  const { runner, activeRun } = store
  if (!activeRun) return

  const enemy = room.enemy
  const damage = calculateDamage(runner)
  const accuracy = calculateAccuracy(runner)
  const evasion = calculateEvasion(runner)
  const armor = calculateArmor(runner)

  if (enemy.health <= 0) {
    const loot = generateLoot(enemy.lootTable, runner.skills.scavenging.level)
    
    const equipmentUpdate: Partial<import('@/types').ActiveRun> = {
      enemiesDefeated: activeRun.enemiesDefeated + 1,
      resourcesCollected: mergeResources(activeRun.resourcesCollected, loot.resources),
      skillsUsed: {
        ...activeRun.skillsUsed,
        combat: (activeRun.skillsUsed.combat || 0) + enemy.xpReward,
        scavenging: (activeRun.skillsUsed.scavenging || 0) + Math.floor(enemy.xpReward * 0.5),
      },
    }
    
    if (Math.random() < 0.15) {
      const equipment = generateEquipmentLoot(runner.level)
      if (equipment) {
        equipmentUpdate.equipmentCollected = [...activeRun.equipmentCollected, equipment]
        store.addLog('loot', `Found ${equipment.name}!`)
      }
    }
    
    store.updateActiveRun(equipmentUpdate)
    
    store.addLog('combat', `Defeated ${enemy.name}`)
    advanceRoom(store)
    return
  }

  if (Math.random() * 100 < accuracy) {
    const actualDamage = Math.max(1, damage - enemy.armor * 0.5)
    enemy.health -= actualDamage
    store.addLog('combat', `Dealt ${Math.floor(actualDamage)} damage to ${enemy.name}`)
  }

  if (enemy.health > 0 && Math.random() * 100 > evasion) {
    const enemyDamage = Math.max(1, enemy.damage - armor * 0.3)
    const newHealth = runner.health - enemyDamage
    
    if (newHealth <= 0) {
      store.completeRun(false)
      return
    }
    
    store.healRunner(-enemyDamage)
    store.addLog('danger', `Took ${Math.floor(enemyDamage)} damage from ${enemy.name}`)
  }

  if (enemy.health <= 0) {
    const loot = generateLoot(enemy.lootTable, runner.skills.scavenging.level)
    
    const equipmentUpdate: Partial<import('@/types').ActiveRun> = {
      enemiesDefeated: activeRun.enemiesDefeated + 1,
      resourcesCollected: mergeResources(activeRun.resourcesCollected, loot.resources),
      skillsUsed: {
        ...activeRun.skillsUsed,
        combat: (activeRun.skillsUsed.combat || 0) + enemy.xpReward,
      },
    }
    
    if (Math.random() < 0.15) {
      const equipment = generateEquipmentLoot(runner.level)
      if (equipment) {
        equipmentUpdate.equipmentCollected = [...activeRun.equipmentCollected, equipment]
        store.addLog('loot', `Found ${equipment.name}!`)
      }
    }
    
    store.updateActiveRun(equipmentUpdate)
    
    store.addLog('combat', `Defeated ${enemy.name}`)
    advanceRoom(store)
  }
}

function processResourceRoom(store: GameStore, room: import('@/types').Room): void {
  const { runner, activeRun } = store
  if (!activeRun || !room.resources) {
    advanceRoom(store)
    return
  }

  const scavengingBonus = getSkillBonus(runner.skills.scavenging)
  const collected: Partial<Record<string, number>> = {}
  
  for (const [resource, amount] of Object.entries(room.resources)) {
    const bonus = Math.floor((amount as number) * scavengingBonus)
    collected[resource] = bonus
  }

  store.updateActiveRun({
    resourcesCollected: mergeResources(activeRun.resourcesCollected, collected),
    skillsUsed: {
      ...activeRun.skillsUsed,
      scavenging: (activeRun.skillsUsed.scavenging || 0) + 15,
    },
  })

  store.addLog('loot', `Collected resources from ${room.name}`)
  advanceRoom(store)
}

function processLootRoom(store: GameStore, room: import('@/types').Room): void {
  const { runner, activeRun } = store
  if (!activeRun) return

  if (room.isLocked) {
    const hackChance = 50 + runner.skills.hacking.level * 3
    if (Math.random() * 100 > hackChance) {
      store.addLog('warning', `Failed to hack ${room.name}, moving on...`)
      advanceRoom(store)
      return
    }
    store.addLog('info', `Hacked into ${room.name}!`)
    store.updateActiveRun({
      skillsUsed: {
        ...activeRun.skillsUsed,
        hacking: (activeRun.skillsUsed.hacking || 0) + 25,
      },
    })
  }

  if (room.hasLoot) {
    const equipment = generateEquipmentLoot(runner.level)
    if (equipment) {
      store.updateActiveRun({
        equipmentCollected: [...activeRun.equipmentCollected, equipment],
      })
      store.addLog('loot', `Found ${equipment.name}!`)
    }
  }

  advanceRoom(store)
}

function processExtractionRoom(store: GameStore): void {
  store.completeRun(true)
}

function advanceRoom(store: GameStore): void {
  const { activeRun } = store
  if (!activeRun) return

  store.updateActiveRun({
    currentRoom: activeRun.currentRoom + 1,
    roomProgress: 0,
  })
}

function mergeResources(
  current: Partial<Record<string, number>>,
  add: Partial<Record<string, number>>
): Partial<Record<string, number>> {
  const result = { ...current }
  for (const [key, value] of Object.entries(add)) {
    result[key] = (result[key] || 0) + (value || 0)
  }
  return result
}

function calculateExtractionChance(combatLevel: number, roomsCleared: number): number {
  const base = GAME_CONFIG.baseExtractChance
  const penalty = roomsCleared * 0.03
  const bonus = combatLevel * 0.01
  return Math.max(0.3, Math.min(0.99, base - penalty + bonus))
}

function generateEquipmentLoot(runnerLevel: number): import('@/types').Equipment | null {
  if (Math.random() > 0.6) return null

  const slot = ALL_SLOTS[Math.floor(Math.random() * ALL_SLOTS.length)]
  
  const rarities: import('@/types').ItemRarity[] = ['common', 'uncommon', 'rare']
  const rarityWeights = [60, 30, 10]
  const rarityRoll = Math.random() * 100
  let rarityIndex = 0
  let cumulative = 0
  
  for (let i = 0; i < rarityWeights.length; i++) {
    cumulative += rarityWeights[i]
    if (rarityRoll < cumulative) {
      rarityIndex = i
      break
    }
  }

  const rarity = rarities[rarityIndex]
  const baseValue = rarityIndex * 3 + runnerLevel
  
  const itemNames: Record<import('@/types').AllEquipmentSlot, string[]> = {
    weapon1: ['Pulse Rifle', 'Plasma Carbine', 'Railgun', 'Laser Rifle'],
    weapon2: ['Holdout Blaster', 'Combat Knife', 'Sawed-Off Shotgun', 'Heavy Pistol'],
    equipment: ['EMP Grenade', 'Flashbang', 'C4 Charge', 'Smoke Grenade'],
    shield: ['Barrier Projector', 'Deflector Array', 'Hard Light Shield'],
    core1: ['Targeting Core', 'Speed Core', 'Stealth Core'],
    core2: ['Combat Core', 'Shield Core', 'Hacking Core'],
    implantHead: ['Neural Enhancer', 'Targeting Optics', 'Threat Detection'],
    implantChest: ['Reinforced Plating', 'Vital Systems', 'Trauma Kit'],
    implantLegs: ['Speed Augment', 'Jump Jets', 'Stabilizers'],
  }

  const names = itemNames[slot] || ['Unknown']
  const name = names[Math.floor(Math.random() * names.length)]
  
  const item: import('@/types').Equipment = {
    id: `equip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: `${rarity.charAt(0).toUpperCase() + rarity.slice(1)} ${name}`,
    slot,
    rarity,
    description: `A ${rarity} quality ${slot} item.`,
  }
  
  if (slot === 'weapon1' || slot === 'weapon2') {
    item.damage = 8 + baseValue
    item.accuracy = 5 + rarityIndex * 3
  } else if (slot === 'equipment') {
    item.damage = 3 + rarityIndex * 2
    item.hackBonus = 5 + rarityIndex * 3
  } else if (slot === 'shield') {
    item.shield = 15 + baseValue
    item.armor = 3 + rarityIndex * 2
  } else if (slot === 'core1' || slot === 'core2') {
    item.damage = 2 + rarityIndex
    item.accuracy = 2 + rarityIndex
    item.speed = 2 + rarityIndex
  } else if (slot === 'implantHead') {
    item.perception = 2 + rarityIndex
    item.accuracy = 3 + rarityIndex * 2
    item.hackBonus = 5 + rarityIndex * 2
  } else if (slot === 'implantChest') {
    item.healthBonus = 10 + baseValue
    item.armor = 2 + rarityIndex
    item.endurance = 1 + rarityIndex
  } else if (slot === 'implantLegs') {
    item.speed = 3 + rarityIndex * 2
    item.evasion = 2 + rarityIndex
    item.agility = 1 + rarityIndex
  }

  return item
}

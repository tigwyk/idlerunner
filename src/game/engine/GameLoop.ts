import type { GameStore } from '@/store/gameStore'
import { 
  calculateDamage, 
  calculateAccuracy, 
  calculateEvasion,
  calculateArmor,
  calculateCritChance,
  calculateCritDamage,
  getSkillBonus,
  getMasteryBonus,
} from '@/game/runner/RunnerUtils'
import { generateLoot } from '@/game/loot/LootGenerator'
import { GAME_CONFIG } from '@/game/config'
import { ALL_SLOTS, SLOT_INFO } from '@/types'
import type { StatusEffectType, EnemyType, SectorType } from '@/types'
import { notify } from '@/store/notificationStore'
import { useSettingsStore } from '@/store/settingsStore'

function notifyLoot(name: string, rarity: string) {
  if (!useSettingsStore.getState().showLootNotifications) return
  const rare = ['uncommon', 'rare', 'epic', 'legendary']
  if (rare.includes(rarity)) {
    notify.info(`Found: ${name}`, rarity.charAt(0).toUpperCase() + rarity.slice(1))
  }
}

const ENEMY_STATUS_EFFECT: Record<EnemyType, StatusEffectType | null> = {
  scavenger: 'burning',
  drone: 'emp',
  turret: 'slow',
  security: 'stun',
  boss: 'corrosive',
}

// Hazard effect per sector: what status the environment applies
const HAZARD_SECTOR_EFFECT: Record<SectorType, { effect: StatusEffectType; damage: { min: number; max: number }; label: string }> = {
  residential: { effect: 'burning',  damage: { min: 5, max: 15 },  label: 'fire damage' },
  industrial:  { effect: 'emp',      damage: { min: 10, max: 25 }, label: 'electrical surge' },
  research:    { effect: 'corrosive', damage: { min: 20, max: 40 }, label: 'acid exposure' },
}

export function processTick(store: GameStore): void {
  const { activeRun, runner } = store
  if (!activeRun) return

  // Process runner status effects first (DoT, debuffs)
  processStatusEffects(store)

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
    case 'hazard':
      processHazardRoom(store, currentRoomData)
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
    const prestigeXpMult = 1 + store.prestigeLevel * 0.15
    
    const equipmentUpdate: Partial<import('@/types').ActiveRun> = {
      enemiesDefeated: activeRun.enemiesDefeated + 1,
      resourcesCollected: mergeResources(activeRun.resourcesCollected, loot.resources),
      skillsUsed: {
        ...activeRun.skillsUsed,
        combat: (activeRun.skillsUsed.combat || 0) + Math.floor(enemy.xpReward * prestigeXpMult),
        scavenging: (activeRun.skillsUsed.scavenging || 0) + Math.floor(enemy.xpReward * 0.5 * prestigeXpMult),
      },
    }
    
    if (Math.random() < 0.15) {
      const equipment = generateEquipmentLoot(runner.level)
      if (equipment) {
        equipmentUpdate.equipmentCollected = [...activeRun.equipmentCollected, equipment]
        store.addLog('loot', `Found ${equipment.name}!`)
        notifyLoot(equipment.name, equipment.rarity)
      }
    }
    
    store.updateActiveRun(equipmentUpdate)
    
    store.addLog('combat', `Defeated ${enemy.name}`)
    store.incrementEnemiesKilled(1)
    advanceRoom(store)
    return
  }

  // Check boss enrage at ≤50% HP
  if (enemy.type === 'boss' && !enemy.enraged && enemy.health <= enemy.maxHealth * 0.5) {
    enemy.enraged = true
    enemy.damage = Math.floor(enemy.damage * 2)
    const enrageEffect = enemy.type === 'boss' ? ('burning' as import('@/types').StatusEffectType) : null
    if (enrageEffect) applyStatusEffect(store, enrageEffect, 4, 15)
    store.addLog('danger', `⚠️ ${enemy.name} ENRAGES! Damage doubled!`)
  }

  const combatMasteryBonus = getMasteryBonus(runner.skills.combat)
  if (Math.random() * 100 < accuracy) {
    let actualDamage = Math.max(1, (damage * combatMasteryBonus) - enemy.armor * 0.5)
    const critRoll = Math.random() * 100
    const isCrit = critRoll < calculateCritChance(runner)
    if (isCrit) {
      actualDamage *= calculateCritDamage(runner)
      store.addLog('combat', `Critical hit! Dealt ${Math.floor(actualDamage)} damage to ${enemy.name}`)
    } else {
      store.addLog('combat', `Dealt ${Math.floor(actualDamage)} damage to ${enemy.name}`)
    }
    enemy.health -= actualDamage
  }

  if (enemy.health > 0 && Math.random() * 100 > evasion) {
    const fragileMultiplier = activeRun.modifiers.includes('fragile') ? 1.5 : 1
    const enemyDamage = Math.max(1, (enemy.damage - armor * 0.3) * fragileMultiplier)
    const newHealth = runner.health - enemyDamage
    
    if (newHealth <= 0) {
      store.completeRun(false)
      return
    }
    
    store.healRunner(-enemyDamage)
    store.addLog('danger', `Took ${Math.floor(enemyDamage)} damage from ${enemy.name}`)

    // Enemy may apply a status effect on hit (~12% chance)
    if (Math.random() < 0.12) {
      const effectType = ENEMY_STATUS_EFFECT[enemy.type]
      if (effectType) {
        applyStatusEffect(store, effectType, 3, 10)
      }
    }
  }

  if (enemy.health <= 0) {
    const loot = generateLoot(enemy.lootTable, runner.skills.scavenging.level)
    const prestigeXpMult = 1 + store.prestigeLevel * 0.15
    
    const equipmentUpdate: Partial<import('@/types').ActiveRun> = {
      enemiesDefeated: activeRun.enemiesDefeated + 1,
      resourcesCollected: mergeResources(activeRun.resourcesCollected, loot.resources),
      skillsUsed: {
        ...activeRun.skillsUsed,
        combat: (activeRun.skillsUsed.combat || 0) + Math.floor(enemy.xpReward * prestigeXpMult),
      },
    }
    
    const randomDrop = Math.random() < 0.15 ? generateEquipmentLoot(runner.level) : null
    const bossDrop = enemy.type === 'boss' ? generateBossLoot(runner.level) : null
    
    const newEquipment = [...activeRun.equipmentCollected]
    if (randomDrop) {
      newEquipment.push(randomDrop)
      store.addLog('loot', `Found ${randomDrop.name}!`)
      notifyLoot(randomDrop.name, randomDrop.rarity)
    }
    if (bossDrop) {
      newEquipment.push(bossDrop)
      store.addLog('loot', `[BOSS DROP] ${bossDrop.name}!`)
      notifyLoot(bossDrop.name, bossDrop.rarity)
    }
    if (newEquipment.length > activeRun.equipmentCollected.length) {
      equipmentUpdate.equipmentCollected = newEquipment
    }
    
    store.updateActiveRun(equipmentUpdate)
    
    const isBoss = enemy.type === 'boss'
    store.addLog('combat', isBoss ? `☠️ Eliminated ${enemy.name}!` : `Defeated ${enemy.name}`)
    store.incrementEnemiesKilled(1)
    if (isBoss) store.incrementBossesKilled()
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
  const scavMasteryBonus = getMasteryBonus(runner.skills.scavenging)
  const prestigeResourceMult = 1 + store.prestigeLevel * 0.10
  const bonusLootMult = activeRun.modifiers.includes('bonus_loot') ? 1.5 : 1
  const collected: Partial<Record<string, number>> = {}
  
  for (const [resource, amount] of Object.entries(room.resources)) {
    const bonus = Math.floor((amount as number) * scavengingBonus * scavMasteryBonus * prestigeResourceMult * bonusLootMult)
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
    const hackMasteryBonus = runner.skills.hacking.masteryLevel * 5
    const hackChance = 50 + runner.skills.hacking.level * 3 + hackMasteryBonus
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
      notifyLoot(equipment.name, equipment.rarity)
    }
  }

  advanceRoom(store)
}

function processExtractionRoom(store: GameStore): void {
  store.completeRun(true)
}

function processHazardRoom(store: GameStore, room: import('@/types').Room): void {
  const { activeRun, runner } = store
  if (!activeRun) return

  const sector = activeRun.sector as SectorType
  const config = HAZARD_SECTOR_EFFECT[sector]
  if (!config) {
    advanceRoom(store)
    return
  }

  const { min, max } = config.damage
  let rawDamage = Math.floor(min + Math.random() * (max - min))
  // Endurance reduces hazard damage 2% per point above 10
  const enduranceReduction = Math.max(0, (runner.baseStats.endurance - 10) * 0.02)
  const finalDamage = Math.max(1, Math.floor(rawDamage * (1 - enduranceReduction)))

  store.healRunner(-finalDamage)
  store.addLog('danger', `${room.name}: ${config.label} — took ${finalDamage} damage`)

  // Apply sector hazard status effect
  applyStatusEffect(store, config.effect, 3, 8)

  if (runner.health - finalDamage <= 0) {
    store.completeRun(false)
    return
  }

  advanceRoom(store)
}

/** Apply or refresh a status effect on the runner. */
function applyStatusEffect(
  store: GameStore,
  type: StatusEffectType,
  duration: number,
  strength: number
): void {
  const runner = store.runner
  const existing = runner.activeEffects.find(e => e.type === type)
  if (existing) {
    existing.duration = Math.max(existing.duration, duration)
    existing.strength = Math.max(existing.strength, strength)
  } else {
    runner.activeEffects.push({ type, duration, strength })
  }
  const effectLabel: Record<StatusEffectType, string> = {
    burning: '🔥 Burning',
    corrosive: '🧪 Corrosive',
    emp: '⚡ EMP',
    slow: '🐌 Slowed',
    stun: '💫 Stunned',
  }
  store.addLog('danger', `Status: ${effectLabel[type]} applied`)
}

/** Process all active runner status effects and tick them down. */
function processStatusEffects(store: GameStore): void {
  const runner = store.runner
  if (!runner.activeEffects || runner.activeEffects.length === 0) return

  const toRemove: number[] = []

  runner.activeEffects.forEach((effect, i) => {
    switch (effect.type) {
      case 'burning': {
        // Endurance reduces burn damage 2%/point above 10
        const reduction = Math.max(0, (runner.baseStats.endurance - 10) * 0.02)
        const dmg = Math.max(1, Math.floor(effect.strength * (1 - reduction)))
        if (runner.health - dmg <= 0) {
          store.completeRun(false)
          return
        }
        store.healRunner(-dmg)
        store.addLog('danger', `🔥 Burning: ${dmg} damage`)
        break
      }
      case 'corrosive':
        // Armor debuff is applied at damage calc time (see calculateArmor calls); just log
        store.addLog('danger', `🧪 Corrosive: armor reduced by ${effect.strength}%`)
        break
      case 'emp':
        store.addLog('warning', `⚡ EMP: accuracy and hacking reduced by ${effect.strength}%`)
        break
      case 'slow':
        store.addLog('warning', `🐌 Slowed: evasion reduced by ${effect.strength}%`)
        break
      case 'stun':
        store.addLog('warning', `💫 Stunned: action skipped`)
        break
    }

    effect.duration -= 1
    if (effect.duration <= 0) toRemove.push(i)
  })

  // Remove expired effects (reverse order to preserve indices)
  for (let i = toRemove.length - 1; i >= 0; i--) {
    const idx = toRemove[i]
    const expiredType = runner.activeEffects[idx].type
    runner.activeEffects.splice(idx, 1)
    store.addLog('info', `Status effect ${expiredType} expired`)
  }
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

function generateBossLoot(runnerLevel: number): import('@/types').Equipment {
  const slot = ALL_SLOTS[Math.floor(Math.random() * ALL_SLOTS.length)]
  // Bosses drop uncommon or rare (no common)
  const rarities: import('@/types').ItemRarity[] = ['uncommon', 'rare']
  const rarityWeights = [65, 35]
  const rarityRoll = Math.random() * 100
  let rarityIndex = 0
  let cumulative = 0
  for (let i = 0; i < rarityWeights.length; i++) {
    cumulative += rarityWeights[i]
    if (rarityRoll < cumulative) { rarityIndex = i; break }
  }
  const rarity = rarities[rarityIndex]
  const baseValue = rarityIndex * 3 + runnerLevel + 3

  // Reuse the same slot-specific stat logic with elevated baseValue
  const equipment = generateEquipmentLoot(runnerLevel)
  if (!equipment) {
    // Fallback — directly build a simple item
    return {
      id: `boss-equip-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: `${rarity.charAt(0).toUpperCase() + rarity.slice(1)} Boss Trophy`,
      slot,
      rarity,
      damage: slot === 'weapon1' || slot === 'weapon2' ? 10 + baseValue : undefined,
      armor: 5 + rarityIndex * 3,
      description: 'Salvaged from a defeated boss enemy.',
    }
  }
  // Override rarity and boost stats
  return {
    ...equipment,
    id: `boss-equip-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    rarity,
    name: `${rarity.charAt(0).toUpperCase() + rarity.slice(1)} ${equipment.name.split(' ').slice(1).join(' ')}`,
    damage:      equipment.damage      ? equipment.damage      + rarityIndex * 3 + 3 : equipment.damage,
    armor:       equipment.armor       ? equipment.armor       + rarityIndex * 2 + 2 : equipment.armor,
    shield:      equipment.shield      ? equipment.shield      + rarityIndex * 5 + 5 : equipment.shield,
    healthBonus: equipment.healthBonus ? equipment.healthBonus + rarityIndex * 5 + 5 : equipment.healthBonus,
  }
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
  
  const descriptions: Record<string, string> = {
    'Pulse Rifle': 'Standard issue energy weapon. Reliable and accurate.',
    'Plasma Carbine': 'Compact plasma weapon with moderate damage output.',
    'Railgun': 'High-velocity projectile weapon. Excellent armor penetration.',
    'Laser Rifle': 'Precision laser weapon with high accuracy.',
    'Holdout Blaster': 'Small caliber backup weapon. Easy to conceal.',
    'Combat Knife': 'Military-grade melee weapon. Silent and deadly.',
    'Sawed-Off Shotgun': 'Modified shotgun. Devastating at close range.',
    'Heavy Pistol': 'Large caliber sidearm. High damage, slow rate of fire.',
    'EMP Grenade': 'Electromagnetic pulse device. Disables electronics.',
    'Flashbang': 'Stun grenade. Disorients enemies briefly.',
    'C4 Charge': 'Plastic explosive. Remote detonation capable.',
    'Smoke Grenade': 'Tactical smoke screen. Provides visual cover.',
    'Barrier Projector': 'Deploys a temporary energy barrier.',
    'Deflector Array': 'Deflects incoming projectiles at angles.',
    'Hard Light Shield': 'Solid light construct. Blocks most damage types.',
    'Targeting Core': 'Enhances targeting systems. Improves accuracy.',
    'Speed Core': 'Neural accelerator. Improves reaction time.',
    'Stealth Core': 'Light-bending module. Reduces visibility.',
    'Combat Core': 'Combat enhancement. Boosts damage output.',
    'Shield Core': 'Shield amplifier. Increases shield capacity.',
    'Hacking Core': 'Encryption breaker. Enhanced hacking capability.',
    'Neural Enhancer': 'Brain implant. Improves cognitive function.',
    'Targeting Optics': 'Optical implant. Enhanced visual targeting.',
    'Threat Detection': 'Sensor suite. Detects nearby threats.',
    'Reinforced Plating': 'Subdermal armor. Reduces physical damage.',
    'Vital Systems': 'Organ reinforcement. Increases survivability.',
    'Trauma Kit': 'Emergency medical implant. Auto-stabilizes wounds.',
    'Speed Augment': 'Leg actuators. Enhanced movement speed.',
    'Jump Jets': 'Micro-thrusters. Enables rapid repositioning.',
    'Stabilizers': 'Gyroscopic stabilizers. Improves weapon handling.',
  }
  
  const item: import('@/types').Equipment = {
    id: `equip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: `${rarity.charAt(0).toUpperCase() + rarity.slice(1)} ${name}`,
    slot,
    rarity,
    description: descriptions[name] || `A ${rarity} quality ${SLOT_INFO[slot]?.name || slot}.`,
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

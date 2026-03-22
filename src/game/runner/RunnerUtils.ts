import type { Runner, RunnerStats, Skill, SkillType, Equipment, AllEquipmentSlot } from '@/types'
import { ALL_SLOTS } from '@/types'

export function createInitialStats(): RunnerStats {
  return {
    agility: 10,
    strength: 10,
    endurance: 10,
    intelligence: 10,
    perception: 10,
    cyberAffinity: 10,
  }
}

export function createInitialSkill(type: SkillType): Skill {
  return {
    type,
    level: 1,
    xp: 0,
    xpToNext: 100,
    masteryXp: 0,
    masteryLevel: 0,
  }
}

export function createInitialEquipment(): Partial<Record<AllEquipmentSlot, Equipment>> {
  return {}
}

export function createInitialRunner(): Runner {
  return {
    id: 'runner-1',
    name: 'Runner Alpha',
    level: 1,
    xp: 0,
    xpToNext: 100,
    status: 'idle',
    currentSector: null,
    currentRoom: 0,
    health: 100,
    maxHealth: 100,
    baseStats: createInitialStats(),
    equipment: createInitialEquipment(),
    skills: {
      scavenging: createInitialSkill('scavenging'),
      combat: createInitialSkill('combat'),
      hacking: createInitialSkill('hacking'),
    },
    activeKitId: null,
  }
}

export function calculateXpToLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.15, level - 1))
}

export function addSkillXp(skill: Skill, amount: number): Skill {
  let newXp = skill.xp + amount
  let newLevel = skill.level
  let xpToNext = skill.xpToNext
  let masteryXp = skill.masteryXp

  while (newXp >= xpToNext && newLevel < 99) {
    newXp -= xpToNext
    newLevel++
    xpToNext = Math.floor(100 * Math.pow(1.1, newLevel - 1))
    
    if (newLevel % 10 === 0) {
      masteryXp += 100
    }
  }

  return {
    ...skill,
    xp: newXp,
    level: newLevel,
    xpToNext,
    masteryXp,
  }
}

export function getSkillBonus(skill: Skill): number {
  return 1 + (skill.level - 1) * 0.05
}

export function getMasteryBonus(skill: Skill): number {
  return 1 + skill.masteryLevel * 0.1
}

export function calculateTotalStats(runner: Runner): RunnerStats {
  const stats = { ...runner.baseStats }
  
  Object.values(runner.equipment).forEach((equip) => {
    if (!equip) return
    if (equip.speed) stats.agility += Math.floor(equip.speed / 2)
  })

  stats.agility += Math.floor((runner.level - 1) * 0.5)
  stats.endurance += Math.floor((runner.level - 1) * 0.5)

  return stats
}

export function calculateDamage(runner: Runner): number {
  const weapon1 = runner.equipment.weapon1
  const weapon2 = runner.equipment.weapon2
  const primaryDamage = weapon1?.damage || 5
  const secondaryDamage = weapon2?.damage || 0
  const baseDamage = primaryDamage + Math.floor(secondaryDamage * 0.5)
  const combatBonus = getSkillBonus(runner.skills.combat)
  const stats = calculateTotalStats(runner)
  
  return Math.floor(baseDamage * combatBonus * (1 + stats.strength * 0.02))
}

export function calculateAccuracy(runner: Runner): number {
  const stats = calculateTotalStats(runner)
  const combatBonus = runner.skills.combat.level * 2
  let acc = 75 + stats.perception + combatBonus
  
  ALL_SLOTS.forEach(slot => {
    const item = runner.equipment[slot]
    if (item?.accuracy) acc += item.accuracy
  })
  
  return Math.min(99, acc)
}

export function calculateEvasion(runner: Runner): number {
  const stats = calculateTotalStats(runner)
  let evasion = 5 + Math.floor(stats.agility * 0.5)
  
  ALL_SLOTS.forEach(slot => {
    const item = runner.equipment[slot]
    if (item?.evasion) evasion += item.evasion
  })
  
  return Math.min(75, evasion)
}

export function calculateArmor(runner: Runner): number {
  const stats = calculateTotalStats(runner)
  let armor = Math.floor(stats.endurance * 0.3)
  
  ALL_SLOTS.forEach(slot => {
    const item = runner.equipment[slot]
    if (item?.armor) armor += item.armor
  })
  
  return armor
}

export function calculateShield(runner: Runner): number {
  let shield = 0
  const shieldItem = runner.equipment.shield
  if (shieldItem?.shield) shield = shieldItem.shield
  return shield
}

export function calculateHealth(runner: Runner): number {
  const stats = calculateTotalStats(runner)
  let health = 100 + (runner.level * 10) + (stats.endurance * 2)
  
  ALL_SLOTS.forEach(slot => {
    const item = runner.equipment[slot]
    if (item?.healthBonus) health += item.healthBonus
  })
  
  return health
}

export function calculateHackChance(runner: Runner): number {
  const stats = calculateTotalStats(runner)
  const hackBonus = getSkillBonus(runner.skills.hacking)
  let chance = 50 + stats.intelligence + (hackBonus - 1) * 50
  
  ALL_SLOTS.forEach(slot => {
    const item = runner.equipment[slot]
    if (item?.hackBonus) chance += item.hackBonus
  })
  
  return Math.min(95, chance)
}

export function calculateCritChance(runner: Runner): number {
  let crit = 5
  ALL_SLOTS.forEach(slot => {
    const item = runner.equipment[slot]
    if (item?.critChance) crit += item.critChance
  })
  return Math.min(50, crit)
}

export function calculateCritDamage(runner: Runner): number {
  let critDmg = 1.5
  ALL_SLOTS.forEach(slot => {
    const item = runner.equipment[slot]
    if (item?.critDamage) critDmg += item.critDamage
  })
  return critDmg
}

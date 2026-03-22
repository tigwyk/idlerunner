import type { Runner, RunnerStats, Skill, SkillType, EquipmentSlot, Equipment } from '@/types'

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

export function createInitialEquipment(): Record<EquipmentSlot, Equipment | null> {
  return {
    primary: null,
    secondary: null,
    armor: null,
    utility: null,
  }
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
    // Equipment bonuses would be applied here
  })

  stats.agility += Math.floor((runner.level - 1) * 0.5)
  stats.endurance += Math.floor((runner.level - 1) * 0.5)

  return stats
}

export function calculateDamage(runner: Runner): number {
  const primary = runner.equipment.primary
  const baseDamage = primary?.damage || 5
  const combatBonus = getSkillBonus(runner.skills.combat)
  const stats = calculateTotalStats(runner)
  
  return Math.floor(baseDamage * combatBonus * (1 + stats.strength * 0.02))
}

export function calculateAccuracy(runner: Runner): number {
  const stats = calculateTotalStats(runner)
  const combatBonus = runner.skills.combat.level * 2
  return 75 + stats.perception + combatBonus
}

export function calculateEvasion(runner: Runner): number {
  const stats = calculateTotalStats(runner)
  return 5 + Math.floor(stats.agility * 0.5)
}

export function calculateArmor(runner: Runner): number {
  const armor = runner.equipment.armor
  const baseArmor = armor?.armor || 0
  const stats = calculateTotalStats(runner)
  return baseArmor + Math.floor(stats.endurance * 0.3)
}

export function calculateHealth(runner: Runner): number {
  const stats = calculateTotalStats(runner)
  return 100 + (runner.level * 10) + (stats.endurance * 2)
}

export function calculateHackChance(runner: Runner): number {
  const stats = calculateTotalStats(runner)
  const hackBonus = getSkillBonus(runner.skills.hacking)
  return Math.min(95, 50 + stats.intelligence + (hackBonus - 1) * 50)
}

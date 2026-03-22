import type { GameConfig } from '@/types'

export const GAME_CONFIG: GameConfig = {
  tickInterval: 1000,
  baseActionTime: 5,
  baseExtractChance: 0.9,
  offlineProgressCap: 86400000,
}

export const XP_CURVE = {
  base: 100,
  multiplier: 1.15,
}

export const SKILL_XP_MULTIPLIERS = {
  scavenging: 1.0,
  combat: 1.2,
  hacking: 1.1,
}

export const STAT_NAMES = {
  agility: 'Agility',
  strength: 'Strength',
  endurance: 'Endurance',
  intelligence: 'Intelligence',
  perception: 'Perception',
  cyberAffinity: 'Cyber Affinity',
} as const

export const RESOURCE_NAMES = {
  metals: 'Metals',
  electronics: 'Electronics',
  data: 'Data Cores',
  credits: 'Credits',
} as const

export const SKILL_NAMES = {
  scavenging: 'Scavenging',
  combat: 'Combat',
  hacking: 'Hacking',
} as const

export const SECTOR_NAMES = {
  residential: 'Residential Deck',
  industrial: 'Industrial Sector',
  research: 'Research Wing',
} as const

export const SECTOR_DESCRIPTIONS = {
  residential: 'Abandoned crew quarters. Low threat, basic supplies.',
  industrial: 'Old manufacturing bays. Moderate danger, valuable components.',
  research: 'Classified laboratories. High risk, rare technology.',
} as const

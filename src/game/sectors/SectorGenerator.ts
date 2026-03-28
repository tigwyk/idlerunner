import type { Sector, Room, NodeType, SectorType, Enemy } from '@/types'

const ROOM_NAMES: Record<NodeType, string[]> = {
  resource: ['Supply Cache', 'Material Storage', 'Resource Bay', 'Cargo Hold'],
  combat: ['Security Checkpoint', 'Blocked Corridor', 'Ambush Point', 'Patrol Route'],
  loot: ['Armory', 'Safe Room', 'Quartermaster', 'Vault'],
  hazard: ['Reactor Access', 'Damaged Section', 'Unstable Zone', 'Hull Breach'],
  extraction: ['Landing Pad', 'Evac Point', 'Drop Zone', 'Extraction Bay'],
}

const ENEMY_TEMPLATES: Record<SectorType, Partial<Record<string, Omit<Enemy, 'health' | 'maxHealth' | 'activeEffects'>>>> = {
  residential: {
    scavenger: {
      type: 'scavenger',
      name: 'Salvage Scavenger',
      damage: 8,
      armor: 2,
      evasion: 10,
      xpReward: 15,
      lootTable: [
        { type: 'resource', resourceType: 'metals', minAmount: 5, maxAmount: 15, weight: 60 },
        { type: 'resource', resourceType: 'credits', minAmount: 10, maxAmount: 30, weight: 40 },
      ],
    },
    drone: {
      type: 'drone',
      name: 'Malfunctioning Drone',
      damage: 12,
      armor: 5,
      evasion: 15,
      xpReward: 25,
      lootTable: [
        { type: 'resource', resourceType: 'electronics', minAmount: 3, maxAmount: 8, weight: 50 },
        { type: 'resource', resourceType: 'metals', minAmount: 8, maxAmount: 20, weight: 50 },
      ],
    },
    boss: {
      type: 'boss',
      name: 'Security Chief',
      damage: 20,
      armor: 15,
      evasion: 5,
      xpReward: 150,
      lootTable: [
        { type: 'resource', resourceType: 'credits', minAmount: 80, maxAmount: 150, weight: 50 },
        { type: 'resource', resourceType: 'metals', minAmount: 20, maxAmount: 40, weight: 30 },
        { type: 'resource', resourceType: 'electronics', minAmount: 5, maxAmount: 15, weight: 20 },
      ],
    },
  },
  industrial: {
    drone: {
      type: 'drone',
      name: 'Security Drone',
      damage: 15,
      armor: 8,
      evasion: 12,
      xpReward: 35,
      lootTable: [
        { type: 'resource', resourceType: 'electronics', minAmount: 8, maxAmount: 20, weight: 60 },
        { type: 'resource', resourceType: 'metals', minAmount: 15, maxAmount: 30, weight: 40 },
      ],
    },
    turret: {
      type: 'turret',
      name: 'Defense Turret',
      damage: 20,
      armor: 15,
      evasion: 0,
      xpReward: 45,
      lootTable: [
        { type: 'resource', resourceType: 'electronics', minAmount: 10, maxAmount: 25, weight: 70 },
        { type: 'resource', resourceType: 'data', minAmount: 2, maxAmount: 5, weight: 30 },
      ],
    },
    security: {
      type: 'security',
      name: 'Industrial Guard',
      damage: 18,
      armor: 12,
      evasion: 8,
      xpReward: 50,
      lootTable: [
        { type: 'resource', resourceType: 'credits', minAmount: 30, maxAmount: 60, weight: 50 },
        { type: 'resource', resourceType: 'electronics', minAmount: 5, maxAmount: 15, weight: 50 },
      ],
    },
    boss: {
      type: 'boss',
      name: 'Mech Sentinel',
      damage: 28,
      armor: 20,
      evasion: 3,
      xpReward: 180,
      lootTable: [
        { type: 'resource', resourceType: 'metals', minAmount: 30, maxAmount: 60, weight: 40 },
        { type: 'resource', resourceType: 'electronics', minAmount: 15, maxAmount: 30, weight: 35 },
        { type: 'resource', resourceType: 'credits', minAmount: 60, maxAmount: 120, weight: 25 },
      ],
    },
  },
  research: {
    security: {
      type: 'security',
      name: 'Research Security',
      damage: 22,
      armor: 10,
      evasion: 15,
      xpReward: 60,
      lootTable: [
        { type: 'resource', resourceType: 'data', minAmount: 5, maxAmount: 12, weight: 60 },
        { type: 'resource', resourceType: 'electronics', minAmount: 8, maxAmount: 18, weight: 40 },
      ],
    },
    boss: {
      type: 'boss',
      name: 'AI Overseer',
      damage: 35,
      armor: 25,
      evasion: 10,
      xpReward: 200,
      lootTable: [
        { type: 'resource', resourceType: 'data', minAmount: 15, maxAmount: 30, weight: 40 },
        { type: 'resource', resourceType: 'credits', minAmount: 100, maxAmount: 200, weight: 30 },
        { type: 'resource', resourceType: 'electronics', minAmount: 20, maxAmount: 40, weight: 30 },
      ],
    },
  },
}

const SECTOR_CONFIG: Record<SectorType, {
  name: string
  description: string
  difficulty: number
  roomCount: number
  maxExtractionTime: number
  nodeDistribution: Record<NodeType, number>
  bossHealth: number
  bossChance: number
}> = {
  residential: {
    name: 'Residential Deck',
    description: 'Abandoned crew quarters. Low threat, basic supplies.',
    difficulty: 1,
    roomCount: 5,
    maxExtractionTime: 120,
    bossHealth: 120,
    bossChance: 0.33,
    nodeDistribution: {
      resource: 30,
      combat: 25,
      loot: 30,
      hazard: 5,
      extraction: 10,
    },
  },
  industrial: {
    name: 'Industrial Sector',
    description: 'Old manufacturing bays. Moderate danger, valuable components.',
    difficulty: 2,
    roomCount: 7,
    maxExtractionTime: 180,
    bossHealth: 180,
    bossChance: 0.66,
    nodeDistribution: {
      resource: 20,
      combat: 30,
      loot: 30,
      hazard: 10,
      extraction: 10,
    },
  },
  research: {
    name: 'Research Wing',
    description: 'Classified laboratories. High risk, rare technology.',
    difficulty: 3,
    roomCount: 8,
    maxExtractionTime: 240,
    bossHealth: 150,
    bossChance: 1.0,
    nodeDistribution: {
      resource: 15,
      combat: 25,
      loot: 35,
      hazard: 15,
      extraction: 10,
    },
  },
}

function getRandomNodeType(distribution: Record<NodeType, number>): NodeType {
  const roll = Math.random() * 100
  let cumulative = 0
  
  for (const [type, weight] of Object.entries(distribution)) {
    cumulative += weight
    if (roll < cumulative) return type as NodeType
  }
  
  return 'resource'
}

function generateEnemy(sectorType: SectorType, difficulty: number, isBoss = false): Enemy | undefined {
  const templates = ENEMY_TEMPLATES[sectorType]
  const config = SECTOR_CONFIG[sectorType]
  
  if (isBoss) {
    const bossTemplate = templates['boss']
    if (!bossTemplate) return undefined
    const health = Math.floor(config.bossHealth * (1 + difficulty * 0.2))
    return { ...bossTemplate, health, maxHealth: health, activeEffects: [] } as Enemy
  }

  // Regular enemy generation — exclude boss from random pool
  const enemyTypes = (Object.keys(templates) as string[]).filter(t => t !== 'boss')
  
  if (enemyTypes.length === 0) return undefined
  if (Math.random() > 0.6) return undefined
  
  const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)]
  const template = templates[enemyType]
  
  if (!template) return undefined
  
  const baseHealth = enemyType === 'security' ? 80 : 50
  const health = Math.floor(baseHealth * (1 + difficulty * 0.2))
  
  return {
    ...template,
    health,
    maxHealth: health,
    activeEffects: [],
  } as Enemy
}

function generateRoomResources(sectorType: SectorType): Partial<Record<string, number>> {
  const resources: Partial<Record<string, number>> = {}
  
  const resourceDistribution: Record<SectorType, Record<string, { min: number; max: number; chance: number }>> = {
    residential: {
      metals: { min: 5, max: 15, chance: 0.7 },
      credits: { min: 10, max: 30, chance: 0.5 },
    },
    industrial: {
      metals: { min: 10, max: 25, chance: 0.6 },
      electronics: { min: 5, max: 15, chance: 0.5 },
      credits: { min: 20, max: 40, chance: 0.4 },
    },
    research: {
      electronics: { min: 8, max: 20, chance: 0.5 },
      data: { min: 3, max: 10, chance: 0.6 },
      credits: { min: 25, max: 50, chance: 0.4 },
    },
  }
  
  const dist = resourceDistribution[sectorType]
  
  for (const [resource, config] of Object.entries(dist)) {
    if (Math.random() < config.chance) {
      resources[resource] = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min
    }
  }
  
  return resources
}

export function generateSector(sectorType: SectorType): Sector {
  const config = SECTOR_CONFIG[sectorType]
  const rooms: Room[] = []
  let extractionRoom = -1
  
  // Boss spawns second-to-last room before extraction, scaled by sector difficulty
  const bossRoomIndex = config.roomCount - 2
  const hasBoss = Math.random() < config.bossChance

  for (let i = 0; i < config.roomCount; i++) {
    let nodeType: NodeType
    
    if (i === 0) {
      nodeType = 'resource'
    } else if (i === config.roomCount - 1) {
      nodeType = 'extraction'
      extractionRoom = i
    } else if (i === bossRoomIndex && hasBoss) {
      nodeType = 'combat'
    } else {
      nodeType = getRandomNodeType(config.nodeDistribution)
    }
    
    const names = ROOM_NAMES[nodeType]
    const name = names[Math.floor(Math.random() * names.length)]
    
    const room: Room = {
      id: `room-${i}`,
      name: `${name} ${i + 1}`,
      type: nodeType,
      hasLoot: nodeType === 'loot',
      isLocked: nodeType === 'loot' && Math.random() < 0.3,
      isVisited: false,
    }
    
    if (nodeType === 'combat') {
      const isBoss = i === bossRoomIndex && hasBoss
      room.enemy = generateEnemy(sectorType, config.difficulty, isBoss)
      if (isBoss) {
        room.name = `[BOSS] ${room.enemy?.name ?? 'Boss Encounter'}`
      }
    } else if (nodeType === 'resource') {
      room.resources = generateRoomResources(sectorType)
    }
    
    rooms.push(room)
  }
  
  if (extractionRoom === -1) {
    extractionRoom = config.roomCount - 1
  }
  
  return {
    type: sectorType,
    name: config.name,
    description: config.description,
    difficulty: config.difficulty,
    rooms,
    extractionRoom,
    maxExtractionTime: config.maxExtractionTime,
  }
}

export function getSectorConfig(sectorType: SectorType) {
  return SECTOR_CONFIG[sectorType]
}

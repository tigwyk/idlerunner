export type SkillType = 'scavenging' | 'combat' | 'hacking';
export type StatType = 'agility' | 'strength' | 'endurance' | 'intelligence' | 'perception' | 'cyberAffinity';
export type ResourceType = 'metals' | 'electronics' | 'data' | 'credits';
export type SectorType = 'residential' | 'industrial' | 'research';
export type NodeType = 'resource' | 'combat' | 'loot' | 'hazard' | 'extraction';
export type EnemyType = 'scavenger' | 'drone' | 'turret' | 'security' | 'boss';
export type EquipmentSlot = 'primary' | 'secondary' | 'armor' | 'utility';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type RunnerStatus = 'idle' | 'deploying' | 'active' | 'extracting' | 'returning';
export type GameScreen = 'overview' | 'deployment' | 'runner' | 'inventory' | 'skills' | 'log';

export interface RunnerStats {
  agility: number;
  strength: number;
  endurance: number;
  intelligence: number;
  perception: number;
  cyberAffinity: number;
}

export interface Skill {
  type: SkillType;
  level: number;
  xp: number;
  xpToNext: number;
  masteryXp: number;
  masteryLevel: number;
}

export interface Equipment {
  id: string;
  name: string;
  slot: EquipmentSlot;
  rarity: ItemRarity;
  damage?: number;
  armor?: number;
  accuracy?: number;
  speed?: number;
  hackBonus?: number;
  description: string;
}

export interface Runner {
  id: string;
  name: string;
  level: number;
  xp: number;
  xpToNext: number;
  status: RunnerStatus;
  currentSector: SectorType | null;
  currentRoom: number;
  health: number;
  maxHealth: number;
  baseStats: RunnerStats;
  equipment: Record<EquipmentSlot, Equipment | null>;
  skills: Record<SkillType, Skill>;
}

export interface Enemy {
  type: EnemyType;
  name: string;
  health: number;
  maxHealth: number;
  damage: number;
  armor: number;
  evasion: number;
  xpReward: number;
  lootTable: LootEntry[];
}

export interface LootEntry {
  type: 'resource' | 'equipment' | 'credits';
  resourceType?: ResourceType;
  equipmentId?: string;
  minAmount: number;
  maxAmount: number;
  weight: number;
}

export interface Room {
  id: string;
  name: string;
  type: NodeType;
  enemy?: Enemy;
  resources?: Partial<Record<ResourceType, number>>;
  hasLoot: boolean;
  isLocked: boolean;
  isVisited: boolean;
}

export interface Sector {
  type: SectorType;
  name: string;
  description: string;
  difficulty: number;
  rooms: Room[];
  extractionRoom: number;
  maxExtractionTime: number;
}

export interface ExtractionResult {
  success: boolean;
  resources: Partial<Record<ResourceType, number>>;
  equipment: Equipment[];
  xpGained: {
    runner: number;
    skills: Partial<Record<SkillType, number>>;
  };
  roomsCleared: number;
  enemiesDefeated: number;
  timeElapsed: number;
}

export interface ActiveRun {
  sector: SectorType;
  currentRoom: number;
  roomProgress: number;
  extractionTimer: number;
  startTime: number;
  enemiesDefeated: number;
  resourcesCollected: Partial<Record<ResourceType, number>>;
  equipmentCollected: Equipment[];
  skillsUsed: Partial<Record<SkillType, number>>;
}

export interface GameState {
  runner: Runner;
  resources: Record<ResourceType, number>;
  inventory: Equipment[];
  activeRun: ActiveRun | null;
  currentScreen: GameScreen;
  lastTick: number;
  lastSave: number;
  totalPlayTime: number;
  runsCompleted: number;
  runsFailed: number;
  log: LogEntry[];
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'info' | 'combat' | 'loot' | 'success' | 'danger' | 'warning';
  message: string;
}

export interface Settings {
  autoSaveInterval: number;
  showDamageNumbers: boolean;
  showLootNotifications: boolean;
  compactMode: boolean;
  theme: 'dark' | 'light';
}

export interface GameConfig {
  tickInterval: number;
  baseActionTime: number;
  baseExtractChance: number;
  offlineProgressCap: number;
}

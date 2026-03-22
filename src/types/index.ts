export type SkillType = 'scavenging' | 'combat' | 'hacking';
export type StatType = 'agility' | 'strength' | 'endurance' | 'intelligence' | 'perception' | 'cyberAffinity';
export type ResourceType = 'metals' | 'electronics' | 'data' | 'credits';
export type SectorType = 'residential' | 'industrial' | 'research';
export type NodeType = 'resource' | 'combat' | 'loot' | 'hazard' | 'extraction';
export type EnemyType = 'scavenger' | 'drone' | 'turret' | 'security' | 'boss';

export type WeaponSlot = 'weapon1' | 'weapon2';
export type EquipmentSlot = 'equipment';
export type ShieldSlot = 'shield';
export type CoreSlot = 'core1' | 'core2';
export type ImplantSlot = 'implantHead' | 'implantChest' | 'implantLegs';
export type AllEquipmentSlot = WeaponSlot | EquipmentSlot | ShieldSlot | CoreSlot | ImplantSlot;

export type SlotCategory = 'weapons' | 'defense' | 'core' | 'implants';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type RunnerStatus = 'idle' | 'deploying' | 'active' | 'extracting' | 'returning';
export type GameScreen = 'overview' | 'deployment' | 'runner' | 'inventory' | 'skills' | 'log' | 'multiplayer';
export type LoadoutType = 'kit' | 'custom';

export interface Kit {
  id: string;
  name: string;
  description: string;
  faction: string;
  equipment: Partial<Record<AllEquipmentSlot, Equipment>>;
  bonusStats?: Partial<RunnerStats>;
}

export const SLOT_INFO: Record<AllEquipmentSlot, { name: string; category: SlotCategory }> = {
  weapon1: { name: 'Primary Weapon', category: 'weapons' },
  weapon2: { name: 'Secondary Weapon', category: 'weapons' },
  equipment: { name: 'Equipment', category: 'weapons' },
  shield: { name: 'Shield', category: 'defense' },
  core1: { name: 'Core Slot 1', category: 'core' },
  core2: { name: 'Core Slot 2', category: 'core' },
  implantHead: { name: 'Head Implant', category: 'implants' },
  implantChest: { name: 'Chest Implant', category: 'implants' },
  implantLegs: { name: 'Leg Implant', category: 'implants' },
}

export const SLOTS_BY_CATEGORY: Record<SlotCategory, AllEquipmentSlot[]> = {
  weapons: ['weapon1', 'weapon2', 'equipment'],
  defense: ['shield'],
  core: ['core1', 'core2'],
  implants: ['implantHead', 'implantChest', 'implantLegs'],
}

export const ALL_SLOTS: AllEquipmentSlot[] = [
  'weapon1', 'weapon2', 'equipment', 'shield', 'core1', 'core2',
  'implantHead', 'implantChest', 'implantLegs'
]

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
  slot: AllEquipmentSlot;
  rarity: ItemRarity;
  damage?: number;
  armor?: number;
  shield?: number;
  accuracy?: number;
  speed?: number;
  hackBonus?: number;
  healthBonus?: number;
  evasion?: number;
  critChance?: number;
  critDamage?: number;
  perception?: number;
  agility?: number;
  strength?: number;
  endurance?: number;
  intelligence?: number;
  cyberAffinity?: number;
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
  equipment: Partial<Record<AllEquipmentSlot, Equipment>>;
  skills: Record<SkillType, Skill>;
  activeKitId: string | null;
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
  rooms: Room[];
  currentRoom: number;
  roomProgress: number;
  extractionTimer: number;
  maxExtractionTime: number;
  startTime: number;
  enemiesDefeated: number;
  resourcesCollected: Partial<Record<ResourceType, number>>;
  equipmentCollected: Equipment[];
  skillsUsed: Partial<Record<SkillType, number>>;
  loadoutType: LoadoutType;
  kitId: string | null;
  customGearAtRisk: Equipment[];
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

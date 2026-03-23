/**
 * Vendor catalog — hard-coded rotating shop items and stat upgrade config.
 *
 * STAT_BASE_COSTS must match server/src/routes/economy.ts exactly so the
 * client can display accurate costs without an extra round-trip.
 */
import type { Equipment, AllEquipmentSlot, ItemRarity, StatType, ResourceType } from '@/types'

export interface VendorItem extends Equipment {
  creditCost: number
}

export interface StatUpgradeConfig {
  stat: StatType
  label: string
  resource: Exclude<ResourceType, 'credits'>
  base: number
  description: string
}

// ─── Stat upgrade cost formula (mirrors server/src/routes/economy.ts) ────────
// cost = (currentLevel² × base) or base when level is 0
export function getUpgradeCost(stat: StatType, currentLevel: number): number {
  const config = STAT_UPGRADE_CONFIG.find((c) => c.stat === stat)
  if (!config) return Infinity
  return (currentLevel ** 2) * config.base || config.base
}

export const STAT_UPGRADE_CONFIG: StatUpgradeConfig[] = [
  {
    stat: 'strength',
    label: 'Strength',
    resource: 'metals',
    base: 20,
    description: '+1 STR → more melee damage',
  },
  {
    stat: 'agility',
    label: 'Agility',
    resource: 'metals',
    base: 15,
    description: '+1 AGI → faster room traversal',
  },
  {
    stat: 'endurance',
    label: 'Endurance',
    resource: 'electronics',
    base: 20,
    description: '+1 END → more max health',
  },
  {
    stat: 'intelligence',
    label: 'Intelligence',
    resource: 'data',
    base: 15,
    description: '+1 INT → better hack rewards',
  },
  {
    stat: 'perception',
    label: 'Perception',
    resource: 'data',
    base: 10,
    description: '+1 PER → improved crit chance',
  },
  {
    stat: 'cyberAffinity',
    label: 'Cyber Affinity',
    resource: 'electronics',
    base: 25,
    description: '+1 CYB → better implant synergy',
  },
]

export const MAX_UPGRADE_LEVEL = 10

// ─── Hard-coded vendor catalog ─────────────────────────────────────────────────

const mkItem = (
  id: string,
  name: string,
  slot: AllEquipmentSlot,
  rarity: ItemRarity,
  creditCost: number,
  stats: Partial<Omit<Equipment, 'id' | 'name' | 'slot' | 'rarity' | 'description'>>,
  description: string,
): VendorItem => ({
  id,
  name,
  slot,
  rarity,
  creditCost,
  description,
  ...stats,
})

export const VENDOR_CATALOG: VendorItem[] = [
  // Weapons
  mkItem('v-shard-pistol',   'Shard Pistol',       'weapon1',      'common',   100, { damage: 8,  accuracy: 5  }, 'A reliable sidearm firing ceramic shards.'),
  mkItem('v-plasma-cutter',  'Plasma Cutter',       'weapon1',      'uncommon', 250, { damage: 14, accuracy: 3, critChance: 5 }, 'Industrial cutter repurposed for combat.'),
  mkItem('v-arc-rifle',      'Arc Rifle',           'weapon2',      'common',   100, { damage: 6,  accuracy: 8  }, 'Long-range shock weapon with high accuracy.'),
  mkItem('v-neural-disruptor','Neural Disruptor',   'weapon2',      'rare',     500, { damage: 18, hackBonus: 8, critDamage: 0.3 }, 'Fires targeted EMP pulses to disrupt neural interfaces.'),

  // Equipment
  mkItem('v-breach-kit',     'Breach Kit',          'equipment',    'common',   100, { hackBonus: 6, speed: 2 }, 'Standard-issue forced-entry toolkit.'),
  mkItem('v-stim-pack',      'Stim Pack',           'equipment',    'uncommon', 250, { healthBonus: 20, speed: 4 }, 'Combat stimulant that accelerates healing.'),

  // Shield / Defense
  mkItem('v-riot-buckler',   'Riot Buckler',        'shield',       'common',   100, { armor: 6,  shield: 10   }, 'Compact ballistic shield used by Sec forces.'),
  mkItem('v-phase-barrier',  'Phase Barrier',       'shield',       'uncommon', 250, { armor: 4,  shield: 20, evasion: 5 }, 'Experimental energy barrier with dodge synergy.'),

  // Core modules
  mkItem('v-boost-core',     'Boost Core',          'core1',        'common',   100, { speed: 5, agility: 1 }, 'Overclocked CPU slice that improves reaction time.'),
  mkItem('v-reflex-matrix',  'Reflex Matrix',       'core2',        'uncommon', 250, { evasion: 8, critChance: 4 }, 'Predictive combat analytics module.'),

  // Implants
  mkItem('v-optic-implant',  'Optic Implant',       'implantHead',  'common',   100, { perception: 1, accuracy: 4 }, 'Enhanced retinal overlay for target acquisition.'),
  mkItem('v-nano-weave',     'Nano Weave',          'implantChest', 'uncommon', 250, { armor: 8, endurance: 1 }, 'Sub-dermal carbon-nano armour layer.'),
  mkItem('v-servo-legs',     'Servo Legs',          'implantLegs',  'common',   100, { speed: 6, agility: 1 }, 'Hydraulic leg braces for rapid traversal.'),
  mkItem('v-cyber-spine',    'Cyber Spine',         'implantChest', 'rare',     500, { strength: 2, endurance: 1, armor: 10 }, 'Full spinal replacement chassis — brutal and efficient.'),
  mkItem('v-ghost-implant',  'Ghost Implant',       'implantHead',  'rare',     500, { evasion: 12, critChance: 6, intelligence: 1 }, 'Military-grade neural stealth co-processor.'),
]

/**
 * Returns 6 rotating items seeded from `runCount mod 10`.
 * Every 10 runs the shop cycles to a new set.
 */
export function getVendorItems(runCount: number): VendorItem[] {
  const seed = runCount % 10
  const total = VENDOR_CATALOG.length
  const items: VendorItem[] = []
  for (let i = 0; i < 6; i++) {
    items.push(VENDOR_CATALOG[(seed * 6 + i) % total])
  }
  return items
}

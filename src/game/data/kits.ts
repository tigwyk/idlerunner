import type { Kit, Equipment } from '@/types'

export const STARTER_KITS: Kit[] = [
  {
    id: 'kit-collective',
    name: 'Collective Starter',
    description: 'A balanced kit from The Collective. Good for intel gathering.',
    faction: 'The Collective',
    bonusStats: {
      intelligence: 2,
      perception: 2,
    },
    equipment: {
      weapon1: {
        id: 'kit-collective-weapon1',
        name: 'Data Rifle',
        slot: 'weapon1',
        rarity: 'common',
        damage: 10,
        hackBonus: 5,
        description: 'Modified for interfacing with data terminals.',
      },
      equipment: {
        id: 'kit-collective-equipment',
        name: 'Hacking Module',
        slot: 'equipment',
        rarity: 'common',
        hackBonus: 10,
        description: 'Basic hacking enhancement tool.',
      },
      implantHead: {
        id: 'kit-collective-head',
        name: 'Analyst Chip',
        slot: 'implantHead',
        rarity: 'common',
        perception: 3,
        hackBonus: 5,
        description: 'Neural enhancement for data processing.',
      },
    },
  },
  {
    id: 'kit-voidrunners',
    name: 'Void Runners Starter',
    description: 'Fast and efficient. Optimized for quick extractions.',
    faction: 'Void Runners',
    bonusStats: {
      agility: 3,
      perception: 1,
    },
    equipment: {
      weapon1: {
        id: 'kit-voidrunners-weapon1',
        name: 'Salvage Carbine',
        slot: 'weapon1',
        rarity: 'common',
        damage: 14,
        speed: 2,
        description: 'Lightweight, reliable, easy to maintain.',
      },
      weapon2: {
        id: 'kit-voidrunners-weapon2',
        name: 'Quick-Draw Pistol',
        slot: 'weapon2',
        rarity: 'common',
        damage: 8,
        speed: 3,
        description: 'For when you need a backup fast.',
      },
      implantLegs: {
        id: 'kit-voidrunners-legs',
        name: 'Speed Augment',
        slot: 'implantLegs',
        rarity: 'common',
        speed: 5,
        evasion: 3,
        description: 'Enhanced leg actuators for quick movement.',
      },
    },
  },
  {
    id: 'kit-ironpact',
    name: 'Iron Pact Starter',
    description: 'Heavy combat focus. When you need to fight through.',
    faction: 'Iron Pact',
    bonusStats: {
      strength: 2,
      endurance: 2,
    },
    equipment: {
      weapon1: {
        id: 'kit-ironpact-weapon1',
        name: 'Assault Rifle',
        slot: 'weapon1',
        rarity: 'common',
        damage: 16,
        accuracy: 5,
        description: 'Military surplus, still reliable.',
      },
      weapon2: {
        id: 'kit-ironpact-weapon2',
        name: 'Combat Knife',
        slot: 'weapon2',
        rarity: 'common',
        damage: 6,
        description: 'For close quarters.',
      },
      shield: {
        id: 'kit-ironpact-shield',
        name: 'Combat Shield',
        slot: 'shield',
        rarity: 'common',
        shield: 25,
        armor: 5,
        description: 'Deployable cover when you need it.',
      },
      implantChest: {
        id: 'kit-ironpact-chest',
        name: 'Reinforced Plating',
        slot: 'implantChest',
        rarity: 'common',
        armor: 8,
        healthBonus: 15,
        description: 'Subdermal armor weave.',
      },
    },
  },
  {
    id: 'kit-silenthand',
    name: 'Silent Hand Starter',
    description: 'Stealth and precision. Get in, get out, unseen.',
    faction: 'Silent Hand',
    bonusStats: {
      agility: 2,
      cyberAffinity: 2,
    },
    equipment: {
      weapon1: {
        id: 'kit-silenthand-weapon1',
        name: 'Suppressed SMG',
        slot: 'weapon1',
        rarity: 'common',
        damage: 12,
        accuracy: 8,
        description: 'Quiet and effective at close range.',
      },
      weapon2: {
        id: 'kit-silenthand-weapon2',
        name: 'Tactical Knife',
        slot: 'weapon2',
        rarity: 'common',
        damage: 8,
        speed: 4,
        description: 'Silent takedowns.',
      },
      equipment: {
        id: 'kit-silenthand-equipment',
        name: 'EMP Charge',
        slot: 'equipment',
        rarity: 'common',
        hackBonus: 15,
        description: 'Disable electronic locks and cameras.',
      },
      implantHead: {
        id: 'kit-silenthand-head',
        name: 'Low-Vis Optics',
        slot: 'implantHead',
        rarity: 'common',
        accuracy: 5,
        evasion: 3,
        description: 'Enhanced vision in low light.',
      },
    },
  },
  {
    id: 'kit-caretakers',
    name: 'Caretakers Starter',
    description: 'Support and survivability. Keep yourself in the fight.',
    faction: 'Caretakers',
    bonusStats: {
      endurance: 3,
      cyberAffinity: 1,
    },
    equipment: {
      weapon1: {
        id: 'kit-caretakers-weapon1',
        name: 'Defensive Carbine',
        slot: 'weapon1',
        rarity: 'common',
        damage: 11,
        description: 'Reliable defensive weapon.',
      },
      equipment: {
        id: 'kit-caretakers-equipment',
        name: 'Medi-Injector',
        slot: 'equipment',
        rarity: 'common',
        healthBonus: 20,
        description: 'Quick healing in combat.',
      },
      shield: {
        id: 'kit-caretakers-shield',
        name: 'Barrier Projector',
        slot: 'shield',
        rarity: 'common',
        shield: 30,
        description: 'Personal energy barrier.',
      },
      implantChest: {
        id: 'kit-caretakers-chest',
        name: 'Regen Node',
        slot: 'implantChest',
        rarity: 'common',
        healthBonus: 25,
        description: 'Accelerated tissue regeneration.',
      },
    },
  },
]

export function getKitById(id: string): Kit | undefined {
  return STARTER_KITS.find(kit => kit.id === id)
}

export function getKitEquipment(kitId: string): Partial<Record<string, Equipment>> {
  const kit = getKitById(kitId)
  if (!kit) return {}
  
  const equipment: Partial<Record<string, Equipment>> = {}
  for (const [slot, item] of Object.entries(kit.equipment)) {
    if (item) {
      equipment[slot] = { ...item, id: `${item.id}-${Date.now()}` }
    }
  }
  return equipment
}

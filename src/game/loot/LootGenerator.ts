import type { LootEntry, ResourceType } from '@/types'

interface LootResult {
  resources: Partial<Record<ResourceType, number>>
}

export function generateLoot(
  lootTable: LootEntry[],
  scavengingLevel: number
): LootResult {
  const result: LootResult = { resources: {} }
  const bonus = 1 + (scavengingLevel - 1) * 0.05

  for (const entry of lootTable) {
    const roll = Math.random() * 100
    
    if (roll < entry.weight) {
      const baseAmount = Math.floor(
        Math.random() * (entry.maxAmount - entry.minAmount + 1) + entry.minAmount
      )
      const finalAmount = Math.floor(baseAmount * bonus)
      
      if (entry.type === 'resource' && entry.resourceType) {
        result.resources[entry.resourceType] = 
          (result.resources[entry.resourceType] || 0) + finalAmount
      } else if (entry.type === 'credits') {
        result.resources.credits = (result.resources.credits || 0) + finalAmount
      }
    }
  }

  return result
}

export function rollForEquipment(
  luckBonus: number = 0
): boolean {
  const baseChance = 0.05
  return Math.random() < baseChance + luckBonus * 0.01
}

export function determineRarity(
  luckBonus: number = 0
): import('@/types').ItemRarity {
  const roll = Math.random() * 100
  const bonus = luckBonus * 0.5
  
  if (roll < 1 + bonus) return 'legendary'
  if (roll < 5 + bonus * 2) return 'epic'
  if (roll < 15 + bonus * 3) return 'rare'
  if (roll < 40 + bonus * 4) return 'uncommon'
  return 'common'
}

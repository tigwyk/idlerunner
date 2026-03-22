import { useGameStore } from '@/store/gameStore'
import { SLOT_INFO } from '@/types'
import type { Equipment, AllEquipmentSlot } from '@/types'

export default function InventoryScreen() {
  const { inventory, runner, equipItem, removeFromInventory } = useGameStore()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-300 mb-2">Inventory</h2>
        <p className="text-sm text-gray-500">{inventory.length} items</p>
      </div>

      {inventory.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-500">No items in inventory.</p>
          <p className="text-sm text-gray-600 mt-2">Complete runs to find equipment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {inventory.map((item) => (
            <InventoryItem 
              key={item.id} 
              item={item}
              equippedItem={runner.equipment[item.slot]}
              onEquip={() => equipItem(item)}
              onDrop={() => removeFromInventory(item.id)}
              isEquipped={isEquipped(item.slot, item.id)}
            />
          ))}
        </div>
      )}
    </div>
  )

  function isEquipped(slot: AllEquipmentSlot, id: string): boolean {
    return runner.equipment[slot]?.id === id
  }
}

interface InventoryItemProps {
  item: Equipment
  equippedItem: Equipment | undefined
  onEquip: () => void
  onDrop: () => void
  isEquipped: boolean
}

function InventoryItem({ item, equippedItem, onEquip, onDrop, isEquipped }: InventoryItemProps) {
  const comparison = getComparison(item, equippedItem)
  const hasEquippedItem = equippedItem !== undefined

  return (
    <div className="card">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className={`font-medium rarity-${item.rarity}`}>{item.name}</h3>
          <p className="text-xs text-gray-500">{SLOT_INFO[item.slot]?.name || item.slot}</p>
        </div>
        <RarityBadge rarity={item.rarity} />
      </div>

      <div className="space-y-1 text-sm mb-3">
        <StatLine label="Damage" value={item.damage} diff={comparison.damage} />
        <StatLine label="Armor" value={item.armor} diff={comparison.armor} />
        <StatLine label="Shield" value={item.shield} diff={comparison.shield} />
        <StatLine label="Accuracy" value={item.accuracy} diff={comparison.accuracy} />
        <StatLine label="Speed" value={item.speed} diff={comparison.speed} />
        <StatLine label="Hack" value={item.hackBonus} diff={comparison.hackBonus} />
        <StatLine label="Health" value={item.healthBonus} diff={comparison.healthBonus} />
        <StatLine label="Evasion" value={item.evasion} diff={comparison.evasion} />
      </div>

      {hasEquippedItem && !isEquipped && (
        <div className="mb-3 p-2 bg-surface-dark rounded border border-white/5">
          <div className="text-xs text-text-muted mb-1">
            Currently equipped: <span className={`rarity-${equippedItem.rarity}`}>{equippedItem.name}</span>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {comparison.damage !== 0 && (
              <span className={comparison.damage > 0 ? 'text-success-400' : 'text-danger-400'}>
                DMG {comparison.damage > 0 ? '+' : ''}{comparison.damage}
              </span>
            )}
            {comparison.armor !== 0 && (
              <span className={comparison.armor > 0 ? 'text-success-400' : 'text-danger-400'}>
                ARM {comparison.armor > 0 ? '+' : ''}{comparison.armor}
              </span>
            )}
            {comparison.shield !== 0 && (
              <span className={comparison.shield > 0 ? 'text-success-400' : 'text-danger-400'}>
                SHD {comparison.shield > 0 ? '+' : ''}{comparison.shield}
              </span>
            )}
            {comparison.accuracy !== 0 && (
              <span className={comparison.accuracy > 0 ? 'text-success-400' : 'text-danger-400'}>
                ACC {comparison.accuracy > 0 ? '+' : ''}{comparison.accuracy}
              </span>
            )}
            {comparison.speed !== 0 && (
              <span className={comparison.speed > 0 ? 'text-success-400' : 'text-danger-400'}>
                SPD {comparison.speed > 0 ? '+' : ''}{comparison.speed}
              </span>
            )}
            {comparison.hackBonus !== 0 && (
              <span className={comparison.hackBonus > 0 ? 'text-success-400' : 'text-danger-400'}>
                HACK {comparison.hackBonus > 0 ? '+' : ''}{comparison.hackBonus}
              </span>
            )}
            {comparison.healthBonus !== 0 && (
              <span className={comparison.healthBonus > 0 ? 'text-success-400' : 'text-danger-400'}>
                HP {comparison.healthBonus > 0 ? '+' : ''}{comparison.healthBonus}
              </span>
            )}
            {comparison.evasion !== 0 && (
              <span className={comparison.evasion > 0 ? 'text-success-400' : 'text-danger-400'}>
                EVD {comparison.evasion > 0 ? '+' : ''}{comparison.evasion}
              </span>
            )}
            {Object.values(comparison).every(v => v === 0) && (
              <span className="text-text-muted">No stat change</span>
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 mb-3">{item.description}</p>

      <div className="flex gap-2">
        <button
          onClick={onEquip}
          disabled={isEquipped}
          className={`
            flex-1 py-1.5 rounded text-xs font-medium transition-colors
            ${isEquipped 
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
              : 'bg-primary-600 hover:bg-primary-500 text-white'
            }
          `}
        >
          {isEquipped 
            ? 'Equipped' 
            : hasEquippedItem 
              ? isUpgrade(comparison)
                ? <>Equip <span className="text-success-300">↑</span></>
                : <>Equip <span className="text-danger-300">↓</span></>
              : 'Equip'}
        </button>
        <button
          onClick={onDrop}
          className="px-3 py-1.5 rounded text-xs font-medium bg-gray-800 hover:bg-danger-600 text-gray-400 hover:text-white transition-colors"
        >
          Drop
        </button>
      </div>
    </div>
  )
}

interface ComparisonResult {
  damage: number
  armor: number
  shield: number
  accuracy: number
  speed: number
  hackBonus: number
  healthBonus: number
  evasion: number
}

function getComparison(newItem: Equipment, currentItem?: Equipment): ComparisonResult {
  return {
    damage: (newItem.damage || 0) - (currentItem?.damage || 0),
    armor: (newItem.armor || 0) - (currentItem?.armor || 0),
    shield: (newItem.shield || 0) - (currentItem?.shield || 0),
    accuracy: (newItem.accuracy || 0) - (currentItem?.accuracy || 0),
    speed: (newItem.speed || 0) - (currentItem?.speed || 0),
    hackBonus: (newItem.hackBonus || 0) - (currentItem?.hackBonus || 0),
    healthBonus: (newItem.healthBonus || 0) - (currentItem?.healthBonus || 0),
    evasion: (newItem.evasion || 0) - (currentItem?.evasion || 0),
  }
}

function isUpgrade(comparison: ComparisonResult): boolean {
  const positive = Object.values(comparison).filter(v => v > 0).length
  const negative = Object.values(comparison).filter(v => v < 0).length
  return positive >= negative
}

function StatLine({ label, value, diff }: { label: string; value: number | undefined; diff: number }) {
  if (value === undefined) return null
  
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-300">
        {value}
        {diff !== 0 && (
          <span className={diff > 0 ? 'text-success-400 ml-1' : 'text-danger-400 ml-1'}>
            ({diff > 0 ? '+' : ''}{diff})
          </span>
        )}
      </span>
    </div>
  )
}

function RarityBadge({ rarity }: { rarity: string }) {
  const colors: Record<string, string> = {
    common: 'bg-gray-700 text-gray-300',
    uncommon: 'bg-green-900 text-green-300',
    rare: 'bg-blue-900 text-blue-300',
    epic: 'bg-purple-900 text-purple-300',
    legendary: 'bg-yellow-900 text-yellow-300',
  }

  return (
    <span className={`px-2 py-0.5 rounded text-xs ${colors[rarity] || colors.common}`}>
      {rarity}
    </span>
  )
}

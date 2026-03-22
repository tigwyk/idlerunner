import { useGameStore } from '@/store/gameStore'
import type { Equipment, EquipmentSlot } from '@/types'

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
              onEquip={() => equipItem(item)}
              onDrop={() => removeFromInventory(item.id)}
              isEquipped={isEquipped(item.slot, item.id)}
            />
          ))}
        </div>
      )}
    </div>
  )

  function isEquipped(slot: EquipmentSlot, id: string): boolean {
    return runner.equipment[slot]?.id === id
  }
}

interface InventoryItemProps {
  item: Equipment
  onEquip: () => void
  onDrop: () => void
  isEquipped: boolean
}

function InventoryItem({ item, onEquip, onDrop, isEquipped }: InventoryItemProps) {
  return (
    <div className="card">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className={`font-medium rarity-${item.rarity}`}>{item.name}</h3>
          <p className="text-xs text-gray-500 capitalize">{item.slot}</p>
        </div>
        <RarityBadge rarity={item.rarity} />
      </div>

      <div className="space-y-1 text-sm mb-3">
        {item.damage && <StatLine label="Damage" value={item.damage} />}
        {item.armor && <StatLine label="Armor" value={item.armor} />}
        {item.accuracy && <StatLine label="Accuracy" value={`+${item.accuracy}%`} />}
        {item.speed && <StatLine label="Speed" value={`+${item.speed}`} />}
        {item.hackBonus && <StatLine label="Hack Bonus" value={`+${item.hackBonus}%`} />}
      </div>

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
          {isEquipped ? 'Equipped' : 'Equip'}
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

function StatLine({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-300">{value}</span>
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

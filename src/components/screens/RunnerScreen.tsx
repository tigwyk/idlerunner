import { STAT_NAMES } from '@/game/config'
import { useGameStore } from '@/store/gameStore'
import { calculateTotalStats, calculateDamage, calculateAccuracy, calculateEvasion, calculateArmor, calculateHealth } from '@/game/runner/RunnerUtils'
import { SLOT_INFO, SLOTS_BY_CATEGORY } from '@/types'
import type { SlotCategory } from '@/types'

export default function RunnerScreen() {
  const { runner } = useGameStore()
  const stats = calculateTotalStats(runner)
  const maxHealth = calculateHealth(runner)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-300 mb-2">{runner.name}</h2>
        <p className="text-sm text-gray-500">Level {runner.level} Runner</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-medium text-gray-300 mb-4">Core Stats</h3>
            <div className="space-y-3">
              {(Object.keys(stats) as Array<keyof typeof stats>).map((stat) => (
                <StatBar 
                  key={stat}
                  label={STAT_NAMES[stat]}
                  value={stats[stat]}
                  base={runner.baseStats[stat]}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="card">
              <h3 className="font-medium text-gray-300 mb-4">Combat Stats</h3>
              <div className="space-y-2 text-sm">
                <CombatStat label="Health" value={`${runner.health} / ${maxHealth}`} />
                <CombatStat label="Damage" value={calculateDamage(runner).toString()} />
                <CombatStat label="Accuracy" value={`${calculateAccuracy(runner)}%`} />
                <CombatStat label="Evasion" value={`${calculateEvasion(runner)}%`} />
                <CombatStat label="Armor" value={calculateArmor(runner).toString()} />
              </div>
            </div>

            <div className="card">
              <h3 className="font-medium text-gray-300 mb-4">Status</h3>
              <div className={`text-sm font-medium ${getStatusColor()}`}>
                {runner.status.toUpperCase()}
              </div>
              {runner.currentSector && (
                <div className="text-xs text-gray-500 mt-1">
                  Current: {runner.currentSector}
                </div>
              )}
            </div>
          </div>
        </div>

        <EquipmentDisplay />
      </div>
    </div>
  )

  function getStatusColor(): string {
    switch (runner.status) {
      case 'active': return 'text-warning-400'
      case 'extracting': return 'text-primary-400'
      case 'returning': return 'text-success-400'
      default: return 'text-gray-400'
    }
  }
}

function StatBar({ label, value, base }: { label: string; value: number; base: number }) {
  const max = 100
  const percentage = Math.min(100, (value / max) * 100)
  const bonus = value - base

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-300">
          {base}
          {bonus > 0 && <span className="text-success-400"> +{bonus}</span>}
        </span>
      </div>
      <div className="stat-bar">
        <div 
          className="stat-bar-fill bg-gray-600"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

function CombatStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-300">{value}</span>
    </div>
  )
}

function EquipmentDisplay() {
  const { runner, inventory, equipItem, unequipItem } = useGameStore()
  const categories: SlotCategory[] = ['weapons', 'defense', 'core', 'implants']

  return (
    <div className="card">
      <h3 className="font-medium text-gray-300 mb-4">Equipment</h3>
      
      {categories.map((category) => (
        <div key={category} className="mb-4">
          <div className="text-xs text-text-muted uppercase tracking-wider mb-2">{category}</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {SLOTS_BY_CATEGORY[category].map((slot) => {
              const equipped = runner.equipment[slot]
              return (
                <div key={slot} className="p-3 bg-surface-dark rounded border border-white/5">
                  <div className="text-xs text-text-muted mb-1">{SLOT_INFO[slot]?.name || slot}</div>
                  {equipped ? (
                    <div>
                      <div className={`text-sm rarity-${equipped.rarity}`}>{equipped.name}</div>
                      <div className="flex gap-2 text-xs text-text-muted mt-1">
                        {equipped.damage && <span>DMG {equipped.damage}</span>}
                        {equipped.armor && <span>ARM {equipped.armor}</span>}
                        {equipped.shield && <span>SHD {equipped.shield}</span>}
                        {equipped.accuracy && <span>ACC {equipped.accuracy}</span>}
                      </div>
                      <button
                        onClick={() => unequipItem(slot)}
                        className="text-xs text-danger-400 hover:text-danger-300 mt-1"
                      >
                        Unequip
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm text-text-muted">Empty</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
      
      {inventory.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/5">
          <h4 className="text-sm text-text-secondary mb-3">Inventory ({inventory.length})</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {inventory.slice(0, 12).map((item) => (
              <button
                key={item.id}
                onClick={() => equipItem(item)}
                className="p-2 bg-surface-dark rounded border border-white/5 hover:border-primary text-left"
              >
                <div className={`text-xs rarity-${item.rarity}`}>{item.name}</div>
                <div className="text-xs text-text-muted capitalize">
                  {SLOT_INFO[item.slot]?.name || item.slot}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

import { useGameStore } from '@/store/gameStore'
import { STAT_NAMES } from '@/game/config'
import { calculateTotalStats } from '@/game/runner/RunnerUtils'

export default function RunnerScreen() {
  const { runner } = useGameStore()
  const stats = calculateTotalStats(runner)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-300 mb-2">{runner.name}</h2>
        <p className="text-sm text-gray-500">Level {runner.level} Runner</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <h3 className="font-medium text-gray-300 mb-4">Experience</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Level {runner.level}</span>
                  <span className="text-gray-400">
                    {formatNumber(runner.xp)} / {formatNumber(runner.xpToNext)}
                  </span>
                </div>
                <div className="stat-bar">
                  <div 
                    className="stat-bar-fill bg-primary-500"
                    style={{ width: `${(runner.xp / runner.xpToNext) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-medium text-gray-300 mb-4">Combat Stats</h3>
            <div className="space-y-2 text-sm">
              <CombatStat label="Health" value={`${runner.health} / ${runner.maxHealth}`} />
              <CombatStat label="Damage" value={calculateDisplayDamage()} />
              <CombatStat label="Accuracy" value={`${calculateAccuracy()}%`} />
              <CombatStat label="Evasion" value={`${calculateEvasion()}%`} />
              <CombatStat label="Armor" value={calculateArmorValue().toString()} />
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
  )

  function calculateDisplayDamage(): string {
    const primary = runner.equipment.primary
    const base = primary?.damage || 5
    const bonus = 1 + runner.skills.combat.level * 0.05
    return Math.floor(base * bonus).toString()
  }

  function calculateAccuracy(): number {
    return 75 + stats.perception + runner.skills.combat.level * 2
  }

  function calculateEvasion(): number {
    return 5 + Math.floor(stats.agility * 0.5)
  }

  function calculateArmorValue(): number {
    const armor = runner.equipment.armor
    return (armor?.armor || 0) + Math.floor(stats.endurance * 0.3)
  }

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
  const slots: Array<'primary' | 'secondary' | 'armor' | 'utility'> = ['primary', 'secondary', 'armor', 'utility']

  return (
    <div className="card">
      <h3 className="font-medium text-gray-300 mb-4">Equipment</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {slots.map((slot) => {
          const equipped = runner.equipment[slot]
          return (
            <div key={slot} className="p-3 bg-gray-800 rounded border border-gray-700">
              <div className="text-xs text-gray-500 capitalize mb-2">{slot}</div>
              {equipped ? (
                <div>
                  <div className={`text-sm rarity-${equipped.rarity}`}>{equipped.name}</div>
                  <button
                    onClick={() => unequipItem(slot)}
                    className="text-xs text-gray-500 hover:text-gray-300 mt-1"
                  >
                    Unequip
                  </button>
                </div>
              ) : (
                <div className="text-sm text-gray-600">Empty</div>
              )}
            </div>
          )
        })}
      </div>

      {inventory.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <h4 className="text-sm text-gray-400 mb-3">Inventory ({inventory.length})</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {inventory.slice(0, 8).map((item) => (
              <button
                key={item.id}
                onClick={() => equipItem(item)}
                className="p-2 bg-gray-800 rounded border border-gray-700 hover:border-primary-500 text-left"
              >
                <div className={`text-xs rarity-${item.rarity}`}>{item.name}</div>
                <div className="text-xs text-gray-500 capitalize">{item.slot}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function formatNumber(num: number): string {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

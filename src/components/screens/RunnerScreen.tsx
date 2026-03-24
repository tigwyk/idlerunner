import { useState } from 'react'
import { STAT_NAMES } from '@/game/config'
import { useGameStore } from '@/store/gameStore'
import { calculateTotalStats, calculateDamage, calculateAccuracy, calculateEvasion, calculateArmor, calculateHealth, calculateShield, calculateCritChance, calculateCritDamage } from '@/game/runner/RunnerUtils'
import { SLOT_INFO, SLOTS_BY_CATEGORY } from '@/types'
import type { SlotCategory } from '@/types'
import { ACHIEVEMENTS } from '@/game/data/achievements'

export default function RunnerScreen() {
  const { runner, runsCompleted, prestigeLevel, prestigeTokens, unlockedAchievements } = useGameStore()
  const stats = calculateTotalStats(runner)
  const maxHealth = calculateHealth(runner)
  
  const canPrestige = runner.level >= 50 && runsCompleted >= 10

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
                <CombatStat label="Shield" value={calculateShield(runner).toString()} />
                <CombatStat label="Crit Chance" value={`${calculateCritChance(runner).toFixed(1)}%`} />
                <CombatStat label="Crit Damage" value={`${calculateCritDamage(runner).toFixed(2)}×`} />
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

      <PrestigeSection
        prestigeLevel={prestigeLevel}
        prestigeTokens={prestigeTokens}
        runnerLevel={runner.level}
        runsCompleted={runsCompleted}
        canPrestige={canPrestige}
      />

      <AchievementGrid unlockedAchievements={unlockedAchievements} />
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

function PrestigeSection({
  prestigeLevel,
  prestigeTokens,
  runnerLevel,
  runsCompleted,
  canPrestige,
}: {
  prestigeLevel: number
  prestigeTokens: number
  runnerLevel: number
  runsCompleted: number
  canPrestige: boolean
}) {
  const [confirming, setConfirming] = useState(false)
  const { prestigeGame } = useGameStore()

  function handlePrestige() {
    if (prestigeGame()) setConfirming(false)
  }

  const xpBonus  = (prestigeLevel + 1) * 15
  const resBonus = (prestigeLevel + 1) * 10

  return (
    <div className="card border border-accent-yellow/10">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-300">Prestige</h3>
        {prestigeLevel > 0 && (
          <span className="px-2 py-0.5 rounded text-xs bg-accent-yellow/20 text-accent-yellow font-bold">
            P{prestigeLevel} · {prestigeTokens} token{prestigeTokens !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {prestigeLevel > 0 && (
        <div className="text-xs text-gray-500 mb-3 space-y-1">
          <div className="flex justify-between">
            <span>XP gain bonus</span>
            <span className="text-primary-400">+{prestigeLevel * 15}%</span>
          </div>
          <div className="flex justify-between">
            <span>Resource bonus</span>
            <span className="text-primary-400">+{prestigeLevel * 10}%</span>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-600 space-y-1 mb-4">
        <div className="flex justify-between">
          <span>Level requirement</span>
          <span className={runnerLevel >= 50 ? 'text-accent-green' : 'text-gray-500'}>
            {runnerLevel} / 50
          </span>
        </div>
        <div className="flex justify-between">
          <span>Runs required</span>
          <span className={runsCompleted >= 10 ? 'text-accent-green' : 'text-gray-500'}>
            {runsCompleted} / 10
          </span>
        </div>
      </div>

      {canPrestige ? (
        confirming ? (
          <div className="space-y-2">
            <p className="text-xs text-warning-400">
              ⚠️ Resets runner, skills, and inventory. Keeps run history.
              Next prestige grants +{xpBonus}% XP and +{resBonus}% resources.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handlePrestige}
                className="flex-1 py-1.5 rounded text-sm font-medium bg-accent-yellow/20 text-accent-yellow border border-accent-yellow/40 hover:bg-accent-yellow/30"
              >
                Confirm Prestige
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="px-4 py-1.5 rounded text-sm text-gray-500 hover:text-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="w-full py-1.5 rounded text-sm font-medium bg-accent-yellow/20 text-accent-yellow border border-accent-yellow/40 hover:bg-accent-yellow/30"
          >
            ⭐ Prestige {prestigeLevel > 0 ? `(×${prestigeLevel + 1})` : ''}
          </button>
        )
      ) : (
        <p className="text-xs text-gray-600 text-center">
          Reach level 50 and complete 10 runs to unlock Prestige.
        </p>
      )}
    </div>
  )
}

function AchievementGrid({ unlockedAchievements }: { unlockedAchievements: string[] }) {
  const unlocked = new Set(unlockedAchievements)
  const count = unlocked.size
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-300">Achievements</h3>
        <span className="text-xs text-gray-500">{count} / {ACHIEVEMENTS.length}</span>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {ACHIEVEMENTS.map((a) => {
          const earned = unlocked.has(a.id)
          return (
            <div
              key={a.id}
              title={earned ? `${a.title}: ${a.description}` : `??? (locked)`}
              className={`flex flex-col items-center gap-1 p-2 rounded border text-center cursor-default transition-colors
                ${earned
                  ? 'border-accent-yellow/40 bg-yellow-950/20 text-gray-200'
                  : 'border-gray-800 bg-surface text-gray-700 grayscale'}`}
            >
              <span className="text-xl leading-none">{a.icon}</span>
              <span className="text-2xs leading-tight">{earned ? a.title : '???'}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

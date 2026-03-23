import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useEconomyStore } from '@/store/economyStore'
import { useAuthStore } from '@/store/authStore'
import {
  VENDOR_CATALOG,
  STAT_UPGRADE_CONFIG,
  MAX_UPGRADE_LEVEL,
  getVendorItems,
  getUpgradeCost,
} from '@/game/data/vendor'
import type { VendorItem } from '@/game/data/vendor'
import type { StatType } from '@/types'

const RARITY_COLORS: Record<string, string> = {
  common:   'text-gray-300',
  uncommon: 'text-accent-green',
  rare:     'text-accent-blue',
  epic:     'text-purple-400',
  legendary:'text-accent-yellow',
}

const RESOURCE_LABELS: Record<string, string> = {
  metals:      'Metals',
  electronics: 'Electronics',
  data:        'Data',
}

export default function VendorScreen() {
  const [tab, setTab] = useState<'shop' | 'upgrades'>('shop')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-300">Vendor</h2>
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              tab === 'shop'
                ? 'bg-accent-yellow/20 text-accent-yellow border border-accent-yellow/40'
                : 'text-gray-500 hover:text-gray-300'
            }`}
            onClick={() => setTab('shop')}
          >
            Shop
          </button>
          <button
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              tab === 'upgrades'
                ? 'bg-accent-yellow/20 text-accent-yellow border border-accent-yellow/40'
                : 'text-gray-500 hover:text-gray-300'
            }`}
            onClick={() => setTab('upgrades')}
          >
            Upgrades
          </button>
        </div>
      </div>

      {tab === 'shop' ? <ShopTab /> : <UpgradesTab />}
    </div>
  )
}

function ShopTab() {
  const { runsCompleted, addToInventory } = useGameStore()
  const { resources, deductLocalCredits } = useEconomyStore()
  const [purchased, setPurchased] = useState<Set<string>>(new Set())

  const items = getVendorItems(runsCompleted)

  function buyItem(item: VendorItem) {
    if (resources.credits < item.creditCost) return
    deductLocalCredits(item.creditCost)
    const { creditCost: _cc, ...equipment } = item
    addToInventory({ ...equipment, id: `${item.id}-${Date.now()}` })
    setPurchased((prev) => new Set(prev).add(item.id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Shop rotates every run • {6 - purchased.size} items available
        </p>
        <span className="text-accent-yellow font-mono font-semibold">
          ¢{resources.credits.toLocaleString()}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => (
          <ShopItemCard
            key={item.id}
            item={item}
            credits={resources.credits}
            bought={purchased.has(item.id)}
            onBuy={() => buyItem(item)}
          />
        ))}
      </div>

      <p className="text-xs text-gray-600 text-center mt-2">
        Complete more runs to unlock a wider selection.
        Full catalog: {VENDOR_CATALOG.length} items.
      </p>
    </div>
  )
}

function ShopItemCard({
  item,
  credits,
  bought,
  onBuy,
}: {
  item: VendorItem
  credits: number
  bought: boolean
  onBuy: () => void
}) {
  const canAfford = credits >= item.creditCost

  const keyStats = Object.entries(item)
    .filter(([k, v]) =>
      typeof v === 'number' &&
      !['creditCost'].includes(k) &&
      v !== 0
    )
    .slice(0, 3)
    .map(([k, v]) => `${k} +${v}`)
    .join(' · ')

  return (
    <div className={`card flex flex-col gap-2 ${bought ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className={`font-semibold text-sm ${RARITY_COLORS[item.rarity] ?? 'text-gray-300'}`}>
            {item.name}
          </div>
          <div className="text-xs text-gray-500 capitalize">
            {item.rarity} · {item.slot}
          </div>
        </div>
        <span className="text-accent-yellow font-mono text-sm whitespace-nowrap">
          ¢{item.creditCost}
        </span>
      </div>

      {keyStats && (
        <p className="text-xs text-gray-400">{keyStats}</p>
      )}

      <p className="text-xs text-gray-600 flex-1">{item.description}</p>

      <button
        className={`mt-1 w-full py-1 rounded text-sm font-medium transition-colors ${
          bought
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : canAfford
            ? 'bg-accent-yellow/20 text-accent-yellow border border-accent-yellow/40 hover:bg-accent-yellow/30'
            : 'bg-gray-800 text-gray-600 cursor-not-allowed'
        }`}
        onClick={onBuy}
        disabled={bought || !canAfford}
      >
        {bought ? 'Purchased' : canAfford ? 'Buy' : 'Insufficient Credits'}
      </button>
    </div>
  )
}

function UpgradesTab() {
  const authStatus = useAuthStore((state) => state.status)
  const { resources, statUpgrades, buyStatUpgrade, isLoading } = useEconomyStore()
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ stat: string; text: string; ok: boolean } | null>(null)

  const isAuthed = authStatus === 'authenticated'

  async function handleUpgrade(stat: StatType) {
    setUpgrading(stat)
    setMessage(null)
    const result = await buyStatUpgrade(stat)
    setMessage({ stat, text: result.message, ok: result.ok })
    setUpgrading(null)
    // Clear success message after 3 s
    if (result.ok) setTimeout(() => setMessage(null), 3000)
  }

  return (
    <div className="space-y-4">
      {!isAuthed && (
        <div className="card border border-accent-yellow/20 bg-accent-yellow/5 text-sm text-accent-yellow/80 text-center py-3">
          Sign in to save upgrades permanently across sessions.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {STAT_UPGRADE_CONFIG.map((cfg) => {
          const level = statUpgrades[cfg.stat] ?? 0
          const cost  = getUpgradeCost(cfg.stat, level)
          const available = resources[cfg.resource]
          const canAfford = available >= cost
          const maxed = level >= MAX_UPGRADE_LEVEL
          const busy = upgrading === cfg.stat || isLoading

          return (
            <div key={cfg.stat} className="card flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-sm text-gray-200">{cfg.label}</div>
                  <div className="text-xs text-gray-500">{cfg.description}</div>
                </div>
                <div className="text-right text-xs text-gray-500 whitespace-nowrap">
                  <span className="text-accent-yellow font-mono">{level}</span>
                  <span className="text-gray-600">/{MAX_UPGRADE_LEVEL}</span>
                </div>
              </div>

              <div className="w-full bg-gray-800 rounded-full h-1">
                <div
                  className="bg-accent-yellow/60 h-1 rounded-full transition-all"
                  style={{ width: `${(level / MAX_UPGRADE_LEVEL) * 100}%` }}
                />
              </div>

              {!maxed && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    Next: <span className="text-gray-300">{cost} {RESOURCE_LABELS[cfg.resource]}</span>
                  </span>
                  <span className={canAfford ? 'text-accent-green' : 'text-gray-600'}>
                    Have: {available}
                  </span>
                </div>
              )}

              {message?.stat === cfg.stat && (
                <p className={`text-xs ${message.ok ? 'text-accent-green' : 'text-danger-400'}`}>
                  {message.text}
                </p>
              )}

              <button
                className={`w-full py-1 rounded text-sm font-medium transition-colors ${
                  maxed
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : !isAuthed
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : canAfford && !busy
                    ? 'bg-accent-green/20 text-accent-green border border-accent-green/40 hover:bg-accent-green/30'
                    : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                }`}
                onClick={() => handleUpgrade(cfg.stat)}
                disabled={maxed || !isAuthed || !canAfford || busy}
              >
                {maxed
                  ? 'Maxed'
                  : !isAuthed
                  ? 'Sign In Required'
                  : busy
                  ? 'Upgrading…'
                  : !canAfford
                  ? `Need ${cost - available} more ${RESOURCE_LABELS[cfg.resource]}`
                  : `Upgrade (+1 ${cfg.label})`}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

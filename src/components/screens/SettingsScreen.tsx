import { useState } from 'react'
import { useSettingsStore } from '@/store/settingsStore'
import { useGameStore } from '@/store/gameStore'

export default function SettingsScreen() {
  const settings = useSettingsStore()
  const { resetGame } = useGameStore()
  const [confirmReset, setConfirmReset] = useState(false)

  function handleReset() {
    if (!confirmReset) {
      setConfirmReset(true)
      return
    }
    resetGame()
    setConfirmReset(false)
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h2 className="text-lg font-semibold text-gray-300 mb-1">Settings</h2>
        <p className="text-sm text-gray-600">Preferences are saved automatically.</p>
      </div>

      {/* Display */}
      <div className="card space-y-4">
        <h3 className="font-medium text-gray-300">Display</h3>

        <Toggle
          label="Show Damage Numbers"
          description="Display damage values during combat."
          value={settings.showDamageNumbers}
          onChange={settings.setShowDamageNumbers}
        />

        <Toggle
          label="Loot Notifications"
          description="Toast pop-ups when rare+ items are found."
          value={settings.showLootNotifications}
          onChange={settings.setShowLootNotifications}
        />

        <Toggle
          label="Compact Mode"
          description="Reduce padding for smaller screens."
          value={settings.compactMode}
          onChange={settings.setCompactMode}
        />
      </div>

      {/* Danger zone */}
      <div className="card border-danger-500/20 space-y-3">
        <h3 className="font-medium text-danger-400">Danger Zone</h3>
        <p className="text-sm text-gray-500">
          Permanently wipes all local progress. Server-side resources and profile are kept.
        </p>

        {confirmReset ? (
          <div className="flex gap-2 items-center">
            <span className="text-sm text-danger-400">Are you sure? This cannot be undone.</span>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-xs rounded border border-danger-500 text-danger-400 hover:bg-danger-500/10 transition-colors"
            >
              Confirm Reset
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="text-xs text-gray-600 hover:text-gray-400 px-2"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="px-3 py-1.5 text-xs rounded border border-danger-500/40 text-danger-400 hover:border-danger-500 transition-colors"
          >
            Reset Local Game Data
          </button>
        )}
      </div>
    </div>
  )
}

function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string
  description: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm text-gray-200">{label}</p>
        <p className="text-xs text-gray-600">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative shrink-0 w-10 h-5 rounded-full transition-colors ${
          value ? 'bg-primary-600' : 'bg-gray-700'
        }`}
        aria-checked={value}
        role="switch"
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            value ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

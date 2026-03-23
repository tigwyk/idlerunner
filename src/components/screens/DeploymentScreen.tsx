import { useState, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useAuthStore } from '@/store/authStore'
import { useMultiplayerStore } from '@/store/multiplayerStore'
import { SECTOR_NAMES, SECTOR_DESCRIPTIONS } from '@/game/config'
import { getSectorConfig } from '@/game/sectors/SectorGenerator'
import { STARTER_KITS, getKitById } from '@/game/data/kits'
import { ALL_SLOTS, SLOT_INFO, SLOTS_BY_CATEGORY, type AllEquipmentSlot, type SlotCategory } from '@/types'

export default function DeploymentScreen() {
  const { runner, activeRun, startRun } = useGameStore()
  const { status: authStatus, profile } = useAuthStore()
  const { queueState, message: mpMessage, joinQueue, leaveQueue, startMultiplayerRun } = useMultiplayerStore()
  const [showKits, setShowKits] = useState(false)
  const [selectedKitId, setSelectedKitId] = useState<string>(STARTER_KITS[0].id)
  const [multiplayerMode, setMultiplayerMode] = useState(false)

  const isAuthenticated = authStatus === 'authenticated'
  const isQueued = queueState?.status === 'queued'
  const isMatched = queueState?.status === 'matched'

  // When matched, auto-start the run and join the session
  useEffect(() => {
    if (!isMatched || !queueState?.runSessionId || !queueState.sector || !profile) return
    // Guard: don't start a second run if one is already in progress
    if (activeRun) return

    const sector = queueState.sector
    const sessionId = queueState.runSessionId
    const userId = profile.id

    if (showKits) {
      startRun(sector, 'kit', selectedKitId)
    } else {
      startRun(sector, 'custom')
    }

    startMultiplayerRun(sessionId, userId).catch(console.error)
  }, [isMatched]) // eslint-disable-line react-hooks/exhaustive-deps

  if (activeRun) {
    return (
      <div className="card">
        <p className="text-text-secondary">Run in progress. Return to overview to monitor.</p>
      </div>
    )
  }

  const sectors: Array<'residential' | 'industrial' | 'research'> = ['residential', 'industrial', 'research']

  const hasCustomGear = Object.values(runner.equipment).some(e => e !== undefined)

  const handleDeploy = (sector: 'residential' | 'industrial' | 'research') => {
    if (multiplayerMode && isAuthenticated) {
      // Queue for multiplayer — run starts automatically when matched
      joinQueue(sector).catch(console.error)
      return
    }
    if (showKits) {
      startRun(sector, 'kit', selectedKitId)
    } else {
      startRun(sector, 'custom')
    }
  }

  const handleCancelQueue = () => {
    leaveQueue().catch(console.error)
  }

  const selectedKit = showKits ? getKitById(selectedKitId) : null

  const renderEquipmentSlot = (slot: AllEquipmentSlot, item?: { name: string; rarity: string; damage?: number; armor?: number; shield?: number; accuracy?: number; speed?: number; hackBonus?: number }) => (
    <div key={slot} className="flex justify-between items-center p-2 bg-surface-dark rounded">
      <span className="text-xs text-text-muted">{SLOT_INFO[slot].name}</span>
      {item ? (
        <div className="text-right">
          <span className={`text-sm rarity-${item.rarity}`}>{item.name}</span>
          <div className="flex gap-2 justify-end text-xs text-text-muted">
            {item.damage && <span>DMG {item.damage}</span>}
            {item.armor && <span>ARM {item.armor}</span>}
            {item.shield && <span>SHD {item.shield}</span>}
            {item.accuracy && <span>ACC +{item.accuracy}</span>}
            {item.speed && <span>SPD +{item.speed}</span>}
            {item.hackBonus && <span>HACK +{item.hackBonus}</span>}
          </div>
        </div>
      ) : (
        <span className="text-xs text-text-muted">Empty</span>
      )}
    </div>
  )

  const categories: SlotCategory[] = ['weapons', 'defense', 'core', 'implants']

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-display text-accent-yellow mb-2 uppercase tracking-wider">Deployment</h2>
        <p className="text-sm text-text-muted">Equip your gear and deploy to extract resources and loot.</p>
      </div>

      {/* Queued / Matched state banner */}
      {(isQueued || isMatched) && (
        <div className={`card border ${isMatched ? 'border-accent-lime/50' : 'border-accent-yellow/30'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-semibold ${isMatched ? 'text-accent-lime' : 'text-accent-yellow'}`}>
                {isMatched ? '⚡ Match Found!' : '⏳ Searching for a runner...'}
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                {isMatched ? 'Launching run session automatically...' : `Queued for ${queueState?.sector ?? 'a sector'}`}
              </p>
            </div>
            {isQueued && (
              <button onClick={handleCancelQueue} className="btn btn-secondary text-xs">
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="card">
            <h3 className="section-title">Your Loadout</h3>
            {hasCustomGear ? (
              <div className="space-y-4">
                {categories.map((category) => {
                  const slots = SLOTS_BY_CATEGORY[category]
                  const hasItems = slots.some(slot => runner.equipment[slot])
                  if (!hasItems) return null
                  
                  return (
                    <div key={category}>
                      <div className="text-xs text-text-muted uppercase tracking-wide mb-2">{category}</div>
                      <div className="space-y-2">
                        {slots.map(slot => renderEquipmentSlot(slot, runner.equipment[slot]))}
                      </div>
                    </div>
                  )
                })}
                <div className="mt-3 p-2 bg-danger-500/10 border border-danger-500/30 rounded">
                  <p className="text-xs text-danger-400">
                    Risk: Failed extraction = all equipped gear is permanently lost
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-text-primary text-sm mb-1">No equipment equipped</p>
                <p className="text-xs text-text-muted mb-3">Equip items from your inventory before deploying.</p>
                <button
                  onClick={() => setShowKits(true)}
                  className="text-xs text-accent-lime hover:text-accent-yellow transition-colors"
                >
                  Or use a free starter kit instead
                </button>
              </div>
            )}
          </div>

          {hasCustomGear && (
            <button
              onClick={() => setShowKits(!showKits)}
              className="text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              {showKits ? '← Use your custom loadout instead' : 'No gear to risk? Use a free starter kit →'}
            </button>
          )}

          {showKits && (
            <div className="card border-accent-lime/30">
              <h3 className="section-title text-accent-lime">Free Starter Kits</h3>
              <p className="text-xs text-text-muted mb-3">
                Kits are lost on extraction but can be replaced for free from faction vendors.
              </p>
              <div className="space-y-2">
                {STARTER_KITS.map((kit) => (
                  <button
                    key={kit.id}
                    onClick={() => setSelectedKitId(kit.id)}
                    className={`w-full p-3 rounded border text-left transition-colors ${
                      selectedKitId === kit.id
                        ? 'bg-surface-elevated border-accent-lime'
                        : 'bg-surface-dark border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm text-text-primary">{kit.name}</div>
                        <div className="text-xs text-text-muted">{kit.faction}</div>
                      </div>
                      {kit.bonusStats && (
                        <div className="text-xs text-accent-lime">
                          +{Object.values(kit.bonusStats).reduce((a, b) => a + b, 0)} stats
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {selectedKit && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <div className="text-xs text-text-muted mb-2">{selectedKit.name} Contents:</div>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_SLOTS.filter(slot => selectedKit.equipment[slot]).map((slot) => {
                      const item = selectedKit.equipment[slot]
                      if (!item) return null
                      return (
                        <div key={slot} className="p-2 bg-surface-dark rounded text-xs">
                          <div className="text-text-muted text-[10px] uppercase">{SLOT_INFO[slot].name}</div>
                          <div className={`rarity-${item.rarity}`}>{item.name}</div>
                          <div className="text-text-muted">
                            {item.damage && `DMG ${item.damage}`}
                            {item.armor && `ARM ${item.armor}`}
                            {item.shield && `SHD ${item.shield}`}
                            {item.hackBonus && `HACK +${item.hackBonus}`}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Multiplayer mode toggle */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="section-title">Run Mode</h3>
                <p className="text-xs text-text-muted mt-1">
                  {multiplayerMode
                    ? 'You may encounter other runners in the same area.'
                    : 'Standard extraction run. No other runners.'}
                </p>
              </div>
              <button
                onClick={() => setMultiplayerMode((m) => !m)}
                disabled={!isAuthenticated}
                title={!isAuthenticated ? 'Sign in to enable multiplayer runs' : undefined}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  multiplayerMode ? 'bg-accent-lime' : 'bg-surface-elevated'
                } ${!isAuthenticated ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    multiplayerMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {!isAuthenticated && (
              <p className="text-xs text-text-muted mt-2">Sign in from the Multiplayer tab to enable multiplayer runs.</p>
            )}
            {isAuthenticated && multiplayerMode && mpMessage && (
              <p className="text-xs text-accent-red mt-2">{mpMessage}</p>
            )}
          </div>

          <div className="card">
            <h3 className="section-title">Select Sector</h3>
            <div className="space-y-3">
              {sectors.map((sector) => {
                const config = getSectorConfig(sector)
                const isLocked = 
                  (sector === 'industrial' && runner.level < 5) ||
                  (sector === 'research' && runner.level < 10)
                const canDeploy = showKits || hasCustomGear
                const isCurrentlyQueued = isQueued || isMatched

                const deployLabel = () => {
                  if (!canDeploy) return 'Equip Gear or Select Kit'
                  if (multiplayerMode && isAuthenticated) return isCurrentlyQueued ? 'In Queue...' : 'Queue for Run'
                  return showKits ? 'Deploy with Kit' : 'Deploy'
                }

                return (
                  <div
                    key={sector}
                    className={`p-4 rounded border transition-colors ${
                      isLocked
                        ? 'bg-surface-raised border-white/5 opacity-50'
                        : 'bg-surface-raised border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-sm text-text-primary">{SECTOR_NAMES[sector]}</h4>
                        <p className="text-xs text-text-muted mt-0.5">{SECTOR_DESCRIPTIONS[sector]}</p>
                      </div>
                      <div className="text-accent-yellow text-xs">
                        {'★'.repeat(config.difficulty)}{'☆'.repeat(3 - config.difficulty)}
                      </div>
                    </div>

                    <div className="flex justify-between text-xs text-text-muted mb-3">
                      <span>{config.roomCount} rooms</span>
                      <span>{config.maxExtractionTime}s limit</span>
                    </div>

                    {isLocked ? (
                      <div className="text-xs text-text-muted text-center py-2">
                        {sector === 'industrial' ? 'Requires Level 5' : 'Requires Level 10'}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDeploy(sector)}
                        disabled={!canDeploy || isCurrentlyQueued}
                        className={`btn w-full ${canDeploy && !isCurrentlyQueued ? (showKits ? 'btn-secondary' : 'btn-accent') : 'opacity-50 cursor-not-allowed bg-surface-dark text-text-muted'}`}
                      >
                        {deployLabel()}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card">
            <h3 className="section-title">Intel</h3>
            <div className="text-xs text-text-muted space-y-2">
              <p>• Deploy with <span className="text-accent-yellow">your gear</span> to maximize effectiveness. Failed extraction = gear lost.</p>
              <p>• <span className="text-accent-lime">Starter kits</span> are a safe fallback. Lost on extraction but free to replace.</p>
              <p>• Combat is auto-resolved based on equipment and skills.</p>
              <p>• Reach extraction before the timer expires to bank your loot.</p>
              {multiplayerMode && (
                <p>• <span className="text-accent-lime">Multiplayer mode:</span> You may encounter another runner in the same zone. PvP is automatically resolved.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

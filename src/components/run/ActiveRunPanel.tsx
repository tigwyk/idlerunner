import { useGameStore } from '@/store/gameStore'
import { SECTOR_NAMES } from '@/game/config'

export default function ActiveRunPanel() {
  const { activeRun, runner, completeRun } = useGameStore()

  if (!activeRun) return null

  const currentRoomData = activeRun.rooms[activeRun.currentRoom]
  const extractionPercent = (activeRun.extractionTimer / activeRun.maxExtractionTime) * 100
  const roomPercent = ((activeRun.currentRoom + 1) / activeRun.rooms.length) * 100

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-gray-200">{SECTOR_NAMES[activeRun.sector]}</h3>
            <p className="text-xs text-gray-500">
              Room {activeRun.currentRoom + 1} of {activeRun.rooms.length}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">
              {formatTime(activeRun.extractionTimer)} remaining
            </div>
            <div className={`text-xs ${extractionPercent < 30 ? 'text-danger-400' : 'text-gray-500'}`}>
              Extraction window
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <ProgressBar 
            label="Room Progress" 
            percent={roomPercent} 
            color="bg-primary-500"
          />
          <ProgressBar 
            label="Extraction Timer" 
            percent={extractionPercent} 
            color={extractionPercent < 30 ? 'bg-danger-500' : 'bg-warning-500'}
          />
          <ProgressBar 
            label="Runner Health" 
            percent={(runner.health / runner.maxHealth) * 100}
            color={runner.health < runner.maxHealth * 0.3 ? 'bg-danger-500' : 'bg-success-500'}
          />
        </div>

        <div className="p-3 bg-gray-800 rounded mb-4">
          <CurrentRoomDisplay room={currentRoomData} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <StatDisplay label="Enemies Defeated" value={activeRun.enemiesDefeated} />
          <StatDisplay label="Resources" value={countResources(activeRun.resourcesCollected)} />
          <StatDisplay label="Items" value={activeRun.equipmentCollected.length} />
          <StatDisplay label="Time Elapsed" value={formatTime(activeRun.maxExtractionTime - activeRun.extractionTimer)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h4 className="text-sm font-medium text-gray-400 mb-3">Resources Collected</h4>
          <div className="grid grid-cols-2 gap-2">
            <ResourceMini type="metals" amount={activeRun.resourcesCollected.metals || 0} />
            <ResourceMini type="electronics" amount={activeRun.resourcesCollected.electronics || 0} />
            <ResourceMini type="data" amount={activeRun.resourcesCollected.data || 0} />
            <ResourceMini type="credits" amount={activeRun.resourcesCollected.credits || 0} />
          </div>
        </div>

        <div className="card">
          <h4 className="text-sm font-medium text-gray-400 mb-3">Equipment Found</h4>
          {activeRun.equipmentCollected.length === 0 ? (
            <p className="text-sm text-gray-600">No equipment found yet.</p>
          ) : (
            <div className="space-y-1">
              {activeRun.equipmentCollected.map((item) => (
                <div key={item.id} className={`text-sm rarity-${item.rarity}`}>
                  {item.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {currentRoomData?.type === 'extraction' && (
        <button
          onClick={() => completeRun(true)}
          className="btn btn-primary w-full"
        >
          Extract Now
        </button>
      )}
    </div>
  )
}

function ProgressBar({ label, percent, color }: { label: string; percent: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500">{label}</span>
        <span className="text-gray-400">{Math.round(percent)}%</span>
      </div>
      <div className="stat-bar">
        <div className={`stat-bar-fill ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

function CurrentRoomDisplay({ room }: { room: import('@/types').Room | undefined }) {
  if (!room) {
    return <div className="text-gray-500">Navigating...</div>
  }

  const typeColors: Record<string, string> = {
    resource: 'text-blue-400',
    combat: 'text-danger-400',
    loot: 'text-success-400',
    hazard: 'text-warning-400',
    extraction: 'text-primary-400',
  }

  const typeIcons: Record<string, string> = {
    resource: '◆',
    combat: '⚔',
    loot: '◈',
    hazard: '⚠',
    extraction: '◈',
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className={typeColors[room.type]}>{typeIcons[room.type]}</span>
        <span className="text-gray-200">{room.name}</span>
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {room.type === 'combat' && room.enemy && (
          <span>Engaging: {room.enemy.name} (HP: {room.enemy.health}/{room.enemy.maxHealth})</span>
        )}
        {room.type === 'resource' && <span>Collecting resources...</span>}
        {room.type === 'loot' && (room.isLocked ? 'Attempting to hack...' : 'Searching for loot...')}
        {room.type === 'extraction' && <span className="text-primary-400">Extraction point reached!</span>}
        {room.type === 'hazard' && <span className="text-warning-400">Navigating hazard zone...</span>}
      </div>
    </div>
  )
}

function StatDisplay({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-gray-500 text-xs">{label}</div>
      <div className="text-gray-200">{value}</div>
    </div>
  )
}

function ResourceMini({ type, amount }: { type: string; amount: number }) {
  const colors: Record<string, string> = {
    metals: 'text-gray-400',
    electronics: 'text-blue-400',
    data: 'text-purple-400',
    credits: 'text-yellow-400',
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={colors[type]}>●</span>
      <span className="text-gray-300 capitalize">{type}:</span>
      <span className="text-gray-400">{amount}</span>
    </div>
  )
}

function countResources(resources: Partial<Record<string, number>>): number {
  return Object.values(resources).reduce((sum: number, val) => sum + (val || 0), 0)
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

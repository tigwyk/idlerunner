import { useGameStore } from '@/store/gameStore'
import type { LogEntry } from '@/types'

export default function LogScreen() {
  const { log } = useGameStore()

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-300">Activity Log</h2>
        <span className="text-sm text-gray-500">{log.length} entries</span>
      </div>

      {log.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-500">No activity yet.</p>
          <p className="text-sm text-gray-600 mt-2">Start a run to see activity logs.</p>
        </div>
      ) : (
        <div className="card">
          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            {[...log].reverse().map((entry) => (
              <LogEntryLine key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function LogEntryLine({ entry }: { entry: LogEntry }) {
  const colors: Record<string, string> = {
    info: 'text-gray-400',
    combat: 'text-danger-400',
    loot: 'text-success-400',
    success: 'text-primary-400',
    danger: 'text-danger-400',
    warning: 'text-warning-400',
  }

  const prefixes: Record<string, string> = {
    info: 'ℹ',
    combat: '⚔',
    loot: '◆',
    success: '✓',
    danger: '✗',
    warning: '⚠',
  }

  const time = new Date(entry.timestamp).toLocaleTimeString()

  return (
    <div className="flex gap-3 py-1.5 border-b border-gray-800/50 text-sm">
      <span className="text-gray-600 text-xs w-20 flex-shrink-0">{time}</span>
      <span className={`${colors[entry.type] || 'text-gray-400'} w-4 flex-shrink-0`}>
        {prefixes[entry.type] || '•'}
      </span>
      <span className="text-gray-300">{entry.message}</span>
    </div>
  )
}

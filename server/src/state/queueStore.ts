import type { QueueRequest } from '../../../shared/src/index.js'

interface QueueEntry {
  userId: string
  queueId: string
  sector: QueueRequest['sector']
  roomProgress: number
  mmr: number
  status: 'queued' | 'matched'
  runSessionId?: string
}

const queue = new Map<string, QueueEntry>()

function generateId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function joinQueue(userId: string, request: QueueRequest, mmr: number) {
  const existing = queue.get(userId)
  if (existing) {
    queue.delete(userId)
  }

  const entry: QueueEntry = {
    userId,
    queueId: generateId('queue'),
    sector: request.sector,
    roomProgress: request.roomProgress,
    mmr,
    status: 'queued',
  }

  queue.set(userId, entry)

  const sectorQueue = [...queue.values()].filter(
    (e) => e.sector === request.sector && e.status === 'queued'
  )

  return {
    entry,
    position: sectorQueue.length,
  }
}

export function leaveQueue(userId: string) {
  const entry = queue.get(userId)
  if (!entry) return null
  queue.delete(userId)
  return entry
}

export function getQueueEntry(userId: string) {
  return queue.get(userId) ?? null
}

export function getQueuedBySector(sector: QueueRequest['sector']): QueueEntry[] {
  return [...queue.values()].filter((e) => e.sector === sector && e.status === 'queued')
}

export function markMatched(userId: string, runSessionId: string) {
  const entry = queue.get(userId)
  if (!entry) return false
  entry.status = 'matched'
  entry.runSessionId = runSessionId
  return true
}

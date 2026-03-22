import type { QueueRequest } from '../../../shared/src/index.js'

interface QueueEntry {
  userId: string
  queueId: string
  sector: QueueRequest['sector']
  roomProgress: number
}

const queue = new Map<string, QueueEntry>()

function generateId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function joinQueue(userId: string, request: QueueRequest) {
  const entry: QueueEntry = {
    userId,
    queueId: generateId('queue'),
    sector: request.sector,
    roomProgress: request.roomProgress,
  }

  queue.set(userId, entry)

  return {
    entry,
    position: Math.max(1, queue.size),
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

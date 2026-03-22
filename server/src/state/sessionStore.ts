import type { OAuthProvider, PlayerProfile, QueueRequest } from '../../../shared/src/index.js'

type SessionRecord = {
  sessionId: string
  provider: OAuthProvider
  profile: PlayerProfile
  queue: {
    queueId: string
    sector: QueueRequest['sector']
    roomProgress: number
  } | null
}

const sessions = new Map<string, SessionRecord>()

function generateId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function createProfile(provider: OAuthProvider): PlayerProfile {
  return {
    id: generateId('player'),
    runnerName: `${provider.toUpperCase()} Runner`,
    region: 'NA',
    mmr: 1200,
    rankTier: 'Silver',
    careerRuns: 12,
    careerWins: 7,
  }
}

export function createSession(provider: OAuthProvider) {
  const sessionId = generateId('session')
  const record: SessionRecord = {
    sessionId,
    provider,
    profile: createProfile(provider),
    queue: null,
  }

  sessions.set(sessionId, record)
  return record
}

export function getSession(sessionId: string | undefined) {
  if (!sessionId) return null
  return sessions.get(sessionId) ?? null
}

export function clearSession(sessionId: string | undefined) {
  if (!sessionId) return false
  return sessions.delete(sessionId)
}

export function joinQueue(sessionId: string, request: QueueRequest) {
  const session = sessions.get(sessionId)
  if (!session) return null

  session.queue = {
    queueId: generateId('queue'),
    sector: request.sector,
    roomProgress: request.roomProgress,
  }

  return {
    session,
    position: Math.max(1, sessions.size),
  }
}

export function leaveQueue(sessionId: string) {
  const session = sessions.get(sessionId)
  if (!session) return null

  const queue = session.queue
  session.queue = null
  return queue
}

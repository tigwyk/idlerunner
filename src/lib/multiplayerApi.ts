import {
  authLogoutResponseSchema,
  authProfileResponseSchema,
  backendHealthSchema,
  economyStateResponseSchema,
  economyUpgradeResponseSchema,
  joinRunResponseSchema,
  leaderboardResponseSchema,
  queueResponseSchema,
  usernameSetupResponseSchema,
  type AuthLogoutResponse,
  type AuthProfileResponse,
  type BackendHealth,
  type EconomyStateResponse,
  type EconomyUpgradeResponse,
  type JoinRunResponse,
  type LeaderboardResponse,
  type QueueResponse,
  type ResourcesState,
  type UsernameSetupResponse,
} from '@shared'
import type { SectorType } from '@/types'
import { supabase } from '@/lib/supabase'

const API_BASE_URL = import.meta.env.VITE_MULTIPLAYER_API_URL ?? 'http://localhost:3001'

async function buildHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const headers: Record<string, string> = {}
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }

  return headers
}

async function getJson<T>(path: string, parser: { parse: (value: unknown) => T }): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: await buildHeaders(),
  })
  const data = await response.json()
  return parser.parse(data)
}

async function sendJson<T>(
  path: string,
  init: RequestInit,
  parser: { parse: (value: unknown) => T }
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      ...(await buildHeaders()),
      'Content-Type': 'application/json',
    },
    ...init,
  })

  const data = await response.json()
  return parser.parse(data)
}

export function getMultiplayerApiBaseUrl() {
  return API_BASE_URL
}

export function getMultiplayerWsBaseUrl() {
  return API_BASE_URL.replace(/^http/, 'ws')
}

export function fetchBackendHealth(): Promise<BackendHealth> {
  return getJson('/api/health', backendHealthSchema)
}

export function fetchAuthProfile(accessToken?: string): Promise<AuthProfileResponse> {
  if (accessToken) {
    // Called from inside an onAuthStateChange callback where getSession() would
    // deadlock (it awaits initializePromise which hasn't resolved yet). Use the
    // token we already have from the event instead.
    return fetch(`${API_BASE_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((data) => authProfileResponseSchema.parse(data))
  }
  return getJson('/api/auth/profile', authProfileResponseSchema)
}

export function logoutProfile(): Promise<AuthLogoutResponse> {
  return sendJson('/api/auth/logout', { method: 'POST' }, authLogoutResponseSchema)
}

export function callSetupUsername(username: string): Promise<UsernameSetupResponse> {
  return sendJson(
    '/api/auth/setup',
    { method: 'POST', body: JSON.stringify({ username }) },
    usernameSetupResponseSchema
  )
}

export function fetchLeaderboard(scope: LeaderboardResponse['scope']): Promise<LeaderboardResponse> {
  return getJson(`/api/leaderboards/${scope}`, leaderboardResponseSchema)
}

export function joinQueue(sector: SectorType): Promise<QueueResponse> {
  return sendJson(
    '/api/matchmaking/queue',
    {
      method: 'POST',
      body: JSON.stringify({ sector, roomProgress: 0 }),
    },
    queueResponseSchema
  )
}

export function pollQueueStatus(): Promise<QueueResponse> {
  return getJson('/api/matchmaking/queue', queueResponseSchema)
}

export function leaveQueue(): Promise<QueueResponse> {
  return sendJson('/api/matchmaking/queue', { method: 'DELETE' }, queueResponseSchema)
}

export function joinRunSession(sessionId: string): Promise<JoinRunResponse> {
  return sendJson(`/api/runs/${sessionId}/join`, { method: 'POST' }, joinRunResponseSchema)
}

export function syncRunPosition(sessionId: string, currentRoom: number): Promise<void> {
  return sendJson(
    `/api/runs/${sessionId}/position`,
    { method: 'POST', body: JSON.stringify({ currentRoom }) },
    { parse: () => undefined }
  )
}

export function fetchEconomy(): Promise<EconomyStateResponse> {
  return getJson('/api/economy', economyStateResponseSchema)
}

export function syncRunEarnings(
  earned: ResourcesState,
  sector: SectorType,
  roomsCleared: number
): Promise<EconomyStateResponse> {
  return sendJson(
    '/api/economy/sync',
    { method: 'POST', body: JSON.stringify({ earned, sector, roomsCleared }) },
    economyStateResponseSchema
  )
}

export function purchaseUpgrade(stat: string): Promise<EconomyUpgradeResponse> {
  return sendJson(
    `/api/economy/upgrade/${stat}`,
    { method: 'POST' },
    economyUpgradeResponseSchema
  )
}

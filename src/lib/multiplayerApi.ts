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
  if (!response.ok) throw new Error(data?.error ?? `Request failed (${response.status})`)
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
  if (!response.ok) throw new Error(data?.error ?? `Request failed (${response.status})`)
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

import { z } from 'zod/v4'

const updateProfileResponseSchema = z.object({ ok: z.boolean(), runnerName: z.string().optional(), message: z.string() })
export type UpdateProfileResponse = z.infer<typeof updateProfileResponseSchema>

export function updateRunnerName(runnerName: string): Promise<UpdateProfileResponse> {
  return sendJson(
    '/api/profile',
    { method: 'PATCH', body: JSON.stringify({ runnerName }) },
    updateProfileResponseSchema
  )
}

const friendResponseSchema = z.object({ ok: z.boolean(), message: z.string() })
const friendEntrySchema = z.object({
  id: z.string(),
  runnerName: z.string(),
  mmr: z.number(),
  status: z.enum(['pending', 'accepted']),
  direction: z.enum(['sent', 'received']),
})
const friendsListSchema = z.object({ friends: z.array(friendEntrySchema) })
export type FriendEntry = z.infer<typeof friendEntrySchema>
export type FriendResponse = z.infer<typeof friendResponseSchema>

export function getFriends(): Promise<{ friends: FriendEntry[] }> {
  return getJson('/api/friends', friendsListSchema)
}

export function sendFriendRequest(runnerName: string): Promise<FriendResponse> {
  return sendJson('/api/friends/request', { method: 'POST', body: JSON.stringify({ runnerName }) }, friendResponseSchema)
}

export function acceptFriend(friendshipId: string): Promise<FriendResponse> {
  return sendJson(`/api/friends/accept/${friendshipId}`, { method: 'POST' }, friendResponseSchema)
}

export function removeFriend(friendId: string): Promise<FriendResponse> {
  return sendJson(`/api/friends/${friendId}`, { method: 'DELETE' }, friendResponseSchema)
}

// ---------------------------------------------------------------------------
// Challenges
// ---------------------------------------------------------------------------

const dailyChallengeSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  description: z.string(),
  target: z.number(),
  reward: z.object({
    credits: z.number(),
    metals: z.number(),
    electronics: z.number(),
    data: z.number(),
  }),
  requiredModifiers: z.array(z.string()),
  completed: z.boolean(),
})
const dailyChallengesResponseSchema = z.object({
  dayNumber: z.number(),
  challenges: z.array(dailyChallengeSchema),
})
const challengeCompleteResponseSchema = z.object({
  ok: z.boolean(),
  message: z.string(),
  reward: z.object({
    credits: z.number(),
    metals: z.number(),
    electronics: z.number(),
    data: z.number(),
  }).optional(),
})

export type DailyChallenge = z.infer<typeof dailyChallengeSchema>
export type DailyChallengesResponse = z.infer<typeof dailyChallengesResponseSchema>
export type ChallengeCompleteResponse = z.infer<typeof challengeCompleteResponseSchema>

export function getDailyChallenges(): Promise<DailyChallengesResponse> {
  return getJson('/api/challenges/daily', dailyChallengesResponseSchema)
}

export interface CompleteRunResult {
  success: boolean
  sector: string
  enemiesDefeated: number
  resourcesCollected: Record<string, number>
  roomsCleared: number
  modifiers: string[]
  bossDefeated?: boolean
}

export function completeChallenge(
  challengeId: string,
  runResult: CompleteRunResult
): Promise<ChallengeCompleteResponse> {
  return sendJson(
    '/api/challenges/complete',
    { method: 'POST', body: JSON.stringify({ challengeId, runResult }) },
    challengeCompleteResponseSchema
  )
}


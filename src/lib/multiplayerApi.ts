import {
  authLogoutResponseSchema,
  authProfileResponseSchema,
  backendHealthSchema,
  leaderboardResponseSchema,
  queueResponseSchema,
  usernameSetupResponseSchema,
  type AuthLogoutResponse,
  type AuthProfileResponse,
  type BackendHealth,
  type LeaderboardResponse,
  type QueueResponse,
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

export function fetchBackendHealth(): Promise<BackendHealth> {
  return getJson('/api/health', backendHealthSchema)
}

export function fetchAuthProfile(): Promise<AuthProfileResponse> {
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

export function leaveQueue(): Promise<QueueResponse> {
  return sendJson('/api/matchmaking/queue', { method: 'DELETE' }, queueResponseSchema)
}

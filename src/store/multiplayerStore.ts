import { create } from 'zustand'
import type {
  BackendHealth,
  EncounterEvent,
  LeaderboardResponse,
  QueueResponse,
} from '@shared'
import { createEncounterSocketUrl, parseEncounterEvent } from '@/lib/encounterSocket'
import { fetchBackendHealth, fetchLeaderboard, joinQueue, leaveQueue } from '@/lib/multiplayerApi'
import type { SectorType } from '@/types'

interface MultiplayerStore {
  backendHealth: BackendHealth | null
  leaderboard: LeaderboardResponse | null
  encounterPreview: EncounterEvent | null
  queueState: QueueResponse | null
  status: 'idle' | 'loading' | 'ready' | 'error'
  message: string | null
  initializeMultiplayer: () => Promise<void>
  refreshLeaderboard: (scope?: LeaderboardResponse['scope']) => Promise<void>
  connectEncounterPreview: (encounterId?: string) => void
  joinQueue: (sector: SectorType) => Promise<void>
  leaveQueue: () => Promise<void>
}

let previewSocket: WebSocket | null = null

export const useMultiplayerStore = create<MultiplayerStore>((set) => ({
  backendHealth: null,
  leaderboard: null,
  encounterPreview: null,
  queueState: null,
  status: 'idle',
  message: null,

  initializeMultiplayer: async () => {
    set({ status: 'loading', message: null })

    try {
      const [backendHealth, leaderboard] = await Promise.all([
        fetchBackendHealth(),
        fetchLeaderboard('global'),
      ])

      set({
        backendHealth,
        leaderboard,
        status: 'ready',
        message: 'Multiplayer foundation connected.',
      })
    } catch {
      set({
        status: 'error',
        message: 'Multiplayer foundation is offline. Start `npm run dev:server` to enable it.',
      })
    }
  },

  refreshLeaderboard: async (scope = 'global') => {
    try {
      const leaderboard = await fetchLeaderboard(scope)
      set({ leaderboard })
    } catch {
      set({ message: 'Unable to refresh leaderboard data.' })
    }
  },

  joinQueue: async (sector) => {
    try {
      const queueState = await joinQueue(sector)
      set({ queueState, message: queueState.message })
    } catch {
      set({ message: 'Unable to join the matchmaking queue.' })
    }
  },

  leaveQueue: async () => {
    try {
      const queueState = await leaveQueue()
      set({ queueState, message: queueState.message })
    } catch {
      set({ message: 'Unable to leave the matchmaking queue.' })
    }
  },

  connectEncounterPreview: (encounterId = 'demo') => {
    if (previewSocket) {
      previewSocket.close()
    }

    try {
      previewSocket = new WebSocket(createEncounterSocketUrl(encounterId))

      previewSocket.onopen = () => {
        previewSocket?.send(JSON.stringify({ action: 'preview-connect' }))
      }

      previewSocket.onmessage = (event) => {
        const encounterPreview = parseEncounterEvent(event.data)
        set({ encounterPreview })
      }

      previewSocket.onerror = () => {
        set({ message: 'Encounter preview socket could not connect.' })
      }
    } catch {
      set({ message: 'Encounter preview socket could not be created.' })
    }
  },
}))

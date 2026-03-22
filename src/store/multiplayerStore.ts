import { create } from 'zustand'
import type {
  BackendHealth,
  EncounterEvent,
  JoinRunResponse,
  LeaderboardResponse,
  PvpOutcome,
  QueueResponse,
  RunEvent,
} from '@shared'
import { createEncounterSocketUrl, parseEncounterEvent } from '@/lib/encounterSocket'
import {
  fetchBackendHealth,
  fetchLeaderboard,
  getMultiplayerWsBaseUrl,
  joinQueue,
  joinRunSession,
  leaveQueue,
  pollQueueStatus,
  syncRunPosition,
} from '@/lib/multiplayerApi'
import type { SectorType } from '@/types'

interface MultiplayerStore {
  backendHealth: BackendHealth | null
  leaderboard: LeaderboardResponse | null
  encounterPreview: EncounterEvent | null
  queueState: QueueResponse | null
  status: 'idle' | 'loading' | 'ready' | 'error'
  message: string | null

  // Active multiplayer run session
  activeRunSession: JoinRunResponse | null
  pvpEvent: RunEvent | null
  lastPvpOutcome: PvpOutcome | null

  initializeMultiplayer: () => Promise<void>
  refreshLeaderboard: (scope?: LeaderboardResponse['scope']) => Promise<void>
  connectEncounterPreview: (encounterId?: string) => void
  joinQueue: (sector: SectorType) => Promise<void>
  leaveQueue: () => Promise<void>
  startMultiplayerRun: (sessionId: string, userId: string) => Promise<void>
  syncPosition: (sessionId: string, currentRoom: number) => Promise<void>
  endMultiplayerRun: () => void
  clearPvpEvent: () => void
}

let previewSocket: WebSocket | null = null
let runSocket: WebSocket | null = null
let queuePollTimer: ReturnType<typeof setInterval> | null = null

function stopQueuePolling() {
  if (queuePollTimer) {
    clearInterval(queuePollTimer)
    queuePollTimer = null
  }
}

export const useMultiplayerStore = create<MultiplayerStore>((set) => ({
  backendHealth: null,
  leaderboard: null,
  encounterPreview: null,
  queueState: null,
  status: 'idle',
  message: null,
  activeRunSession: null,
  pvpEvent: null,
  lastPvpOutcome: null,

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

      // Start polling every 3s to check for a match
      stopQueuePolling()
      queuePollTimer = setInterval(async () => {
        try {
          const latest = await pollQueueStatus()
          set({ queueState: latest, message: latest.message })

          if (latest.status === 'matched' && latest.runSessionId) {
            stopQueuePolling()
            // Notify caller that a match was found — they should start the run
            // and call startMultiplayerRun
          }
        } catch {
          // silently ignore poll errors
        }
      }, 3000)
    } catch {
      set({ message: 'Unable to join the matchmaking queue.' })
    }
  },

  leaveQueue: async () => {
    stopQueuePolling()
    try {
      const queueState = await leaveQueue()
      set({ queueState, message: queueState.message })
    } catch {
      set({ message: 'Unable to leave the matchmaking queue.' })
    }
  },

  startMultiplayerRun: async (sessionId, userId) => {
    try {
      const session = await joinRunSession(sessionId)
      set({ activeRunSession: session })

      // Connect WebSocket for live run events
      if (runSocket) {
        runSocket.close()
        runSocket = null
      }

      const wsUrl = `${getMultiplayerWsBaseUrl()}/ws/run/${sessionId}?userId=${encodeURIComponent(userId)}`
      runSocket = new WebSocket(wsUrl)

      runSocket.onmessage = (event) => {
        try {
          const runEvent: RunEvent = JSON.parse(event.data as string)

          if (runEvent.type === 'pvp.encounter_started') {
            set({ pvpEvent: runEvent })
          } else if (runEvent.type === 'pvp.encounter_resolved') {
            set({
              pvpEvent: runEvent,
              lastPvpOutcome: runEvent.outcome,
            })
          }
        } catch {
          // ignore malformed events
        }
      }

      runSocket.onerror = () => {
        set({ message: 'Run session WebSocket error.' })
      }
    } catch {
      set({ message: 'Unable to join the run session.' })
    }
  },

  syncPosition: async (sessionId, currentRoom) => {
    try {
      await syncRunPosition(sessionId, currentRoom)
    } catch {
      // Non-fatal — position sync failure does not break the local run
    }
  },

  endMultiplayerRun: () => {
    if (runSocket) {
      runSocket.close()
      runSocket = null
    }
    set({ activeRunSession: null, pvpEvent: null })
    stopQueuePolling()
  },

  clearPvpEvent: () => {
    set({ pvpEvent: null })
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
        const encounterPreview = parseEncounterEvent(event.data as string)
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

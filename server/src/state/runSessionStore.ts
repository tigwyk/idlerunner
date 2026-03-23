import type { SectorType } from '../../../shared/src/index.js'
import type { WebSocket } from '@fastify/websocket'
import { calculateLootAtStake, calculatePvpMmrChange, resolvePvp, PVP_ENCOUNTER_CHANCE } from '../../../shared/src/combat.js'
import type { RunEvent, PvpOutcome } from '../../../shared/src/index.js'

// Sector room counts — bot advances through this many rooms
const SECTOR_ROOMS: Record<SectorType, number> = {
  residential: 8,
  industrial: 12,
  research: 16,
}

export interface RunPlayer {
  userId: string
  runnerName: string
  mmr: number
  currentRoom: number
  lastSync: number
}

interface RunSession {
  sessionId: string
  sector: SectorType
  players: Map<string, RunPlayer>
  sockets: Map<string, WebSocket>
  pvpActive: boolean
  createdAt: number
  botIntervals: Map<string, ReturnType<typeof setInterval>>
}

const sessions = new Map<string, RunSession>()
const botIntervals = new Map<string, ReturnType<typeof setInterval>>()

function generateId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function createSession(
  sector: SectorType,
  playerA: Omit<RunPlayer, 'currentRoom' | 'lastSync'>,
  playerB: Omit<RunPlayer, 'currentRoom' | 'lastSync'>
): string {
  const sessionId = generateId('run')
  const players = new Map<string, RunPlayer>()

  players.set(playerA.userId, { ...playerA, currentRoom: 0, lastSync: Date.now() })
  players.set(playerB.userId, { ...playerB, currentRoom: 0, lastSync: Date.now() })

  sessions.set(sessionId, {
    sessionId,
    sector,
    players,
    sockets: new Map(),
    pvpActive: false,
    createdAt: Date.now(),
    botIntervals: new Map(),
  })

  return sessionId
}

export function getSession(sessionId: string): RunSession | undefined {
  return sessions.get(sessionId)
}

export function addSocket(sessionId: string, userId: string, socket: WebSocket) {
  const session = sessions.get(sessionId)
  if (!session) return
  session.sockets.set(userId, socket)
}

export function removeSocket(sessionId: string, userId: string) {
  const session = sessions.get(sessionId)
  if (!session) return
  session.sockets.delete(userId)
}

export function broadcastToSession(sessionId: string, event: RunEvent) {
  const session = sessions.get(sessionId)
  if (!session) return

  const payload = JSON.stringify(event)
  for (const [, socket] of session.sockets) {
    try {
      if (socket.readyState === 1 /* OPEN */) {
        socket.send(payload)
      }
    } catch {
      // socket may have closed between check and send — ignore
    }
  }
}

export function sendToPlayer(sessionId: string, userId: string, event: RunEvent) {
  const session = sessions.get(sessionId)
  if (!session) return
  const socket = session.sockets.get(userId)
  if (!socket || socket.readyState !== 1) return
  try {
    socket.send(JSON.stringify(event))
  } catch {
    // ignore closed socket errors
  }
}

/**
 * Update a player's room and check for zone overlap.
 * Returns a PvpOutcome if PvP was triggered (caller must persist MMR changes),
 * or null if no encounter happened.
 */
export async function updatePosition(
  sessionId: string,
  userId: string,
  currentRoom: number
): Promise<PvpOutcome | null> {
  const session = sessions.get(sessionId)
  if (!session || session.pvpActive) return null

  const player = session.players.get(userId)
  if (!player) return null

  player.currentRoom = currentRoom
  player.lastSync = Date.now()

  // Look for a different player in the same room
  for (const [otherId, other] of session.players) {
    if (otherId === userId) continue
    if (other.currentRoom !== currentRoom) continue

    // Zone overlap detected — roll for encounter
    if (Math.random() >= PVP_ENCOUNTER_CHANCE) continue

    // Lock this session against concurrent PvP
    session.pvpActive = true

    const lootAtStake = calculateLootAtStake(session.sector, currentRoom)

    // Notify both players that a PvP encounter is starting
    broadcastToSession(sessionId, {
      type: 'pvp.encounter_started',
      opponent: {
        userId: otherId,
        runnerName: other.runnerName,
        mmr: other.mmr,
      },
      lootAtStake,
    })

    // Resolve after 5-second prep phase
    await delay(5000)

    const playerWins = resolvePvp(player.mmr, other.mmr)
    const winner = playerWins ? player : other
    const loser = playerWins ? other : player

    const mmrChange = calculatePvpMmrChange(winner.mmr, loser.mmr)

    // Update in-memory MMR
    winner.mmr += mmrChange.winner
    loser.mmr += mmrChange.loser

    const outcome: PvpOutcome = {
      winnerId: winner.userId,
      winnerName: winner.runnerName,
      loserId: loser.userId,
      loserName: loser.runnerName,
      mmrChange,
      lootTransferred: lootAtStake,
    }

    broadcastToSession(sessionId, {
      type: 'pvp.encounter_resolved',
      outcome,
    })

    session.pvpActive = false
    return outcome
  }

  return null
}

export function startBotMovement(sessionId: string, botUserId: string) {
  const session = sessions.get(sessionId)
  if (!session) return

  const maxRooms = SECTOR_ROOMS[session.sector] ?? 12

  const tick = () => {
    const s = sessions.get(sessionId)
    if (!s) return
    const bot = s.players.get(botUserId)
    if (!bot) return
    if (bot.currentRoom >= maxRooms - 1) {
      // Bot reached the end — stop moving
      const interval = s.botIntervals.get(botUserId)
      if (interval) {
        clearInterval(interval)
        s.botIntervals.delete(botUserId)
      }
      return
    }
    bot.currentRoom += 1
    bot.lastSync = Date.now()
    // Trigger overlap check for all real players in same room
    for (const [otherId, other] of s.players) {
      if (otherId === botUserId) continue
      if (other.currentRoom === bot.currentRoom && !s.pvpActive) {
        // Use the same PvP logic as a real position sync — fire and forget
        updatePosition(sessionId, botUserId, bot.currentRoom).catch(() => undefined)
        break
      }
    }
  }

  // Random interval between 8–15 seconds per room advance
  const scheduleNext = () => {
    const s = sessions.get(sessionId)
    if (!s) return
    const ms = 8000 + Math.floor(Math.random() * 7000)
    const id = setTimeout(() => {
      tick()
      scheduleNext()
    }, ms)
    // Store as a timer we can cancel — reuse botIntervals map with a dummy interval wrapper
    // We store the timeout id boxed as an interval-compatible ref
    ;(session.botIntervals as Map<string, ReturnType<typeof setTimeout>>).set(botUserId, id)
  }

  scheduleNext()
}

export function endSession(sessionId: string) {
  const session = sessions.get(sessionId)
  if (session) {
    for (const interval of session.botIntervals.values()) {
      clearInterval(interval)
    }
    session.botIntervals.clear()
  }
  sessions.delete(sessionId)
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

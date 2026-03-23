import { getQueuedBySector, markMatched } from '../state/queueStore.js'
import { createSession, getSession, startBotMovement } from '../state/runSessionStore.js'
import { createBotProfile } from '../state/botStore.js'
import { supabaseAdmin } from '../lib/supabase.js'

const SECTORS = ['residential', 'industrial', 'research'] as const
const MMR_BAND = 300
const TICK_MS = 5000
const BOT_TIMEOUT_MS = 90_000 // 90 seconds before a bot is assigned

/**
 * Attempt to pair queued players in a single sector.
 * Pass 1: pair real players within ±300 MMR.
 * Pass 2: silently match long-waiting players with a bot.
 */
async function tickSector(sector: (typeof SECTORS)[number]) {
  const entries = getQueuedBySector(sector)
  if (entries.length === 0) return

  // ── Pass 1: real player pairing ──────────────────────────────────────────
  entries.sort((a, b) => a.mmr - b.mmr)
  const paired = new Set<string>()

  for (let i = 0; i < entries.length - 1; i++) {
    const a = entries[i]
    if (paired.has(a.userId)) continue

    for (let j = i + 1; j < entries.length; j++) {
      const b = entries[j]
      if (paired.has(b.userId)) continue
      if (Math.abs(a.mmr - b.mmr) > MMR_BAND) continue

      const sessionId = createSession(
        sector,
        { userId: a.userId, runnerName: `Runner-${a.userId.slice(0, 4)}`, mmr: a.mmr },
        { userId: b.userId, runnerName: `Runner-${b.userId.slice(0, 4)}`, mmr: b.mmr }
      )

      await enrichRunnerNames(sessionId, [a.userId, b.userId])

      markMatched(a.userId, sessionId)
      markMatched(b.userId, sessionId)
      paired.add(a.userId)
      paired.add(b.userId)

      console.log(
        `[Matchmaker] Paired ${a.userId.slice(0, 8)} vs ${b.userId.slice(0, 8)} → session ${sessionId} (${sector})`
      )
      break
    }
  }

  // ── Pass 2: bot timeout ───────────────────────────────────────────────────
  const now = Date.now()
  for (const entry of entries) {
    if (paired.has(entry.userId)) continue
    if (now - entry.queuedAt < BOT_TIMEOUT_MS) continue

    const bot = createBotProfile(entry.mmr)

    const sessionId = createSession(
      sector,
      { userId: entry.userId, runnerName: `Runner-${entry.userId.slice(0, 4)}`, mmr: entry.mmr },
      { userId: bot.userId, runnerName: bot.runnerName, mmr: bot.mmr }
    )

    await enrichRunnerNames(sessionId, [entry.userId])

    // Start simulated bot movement through the sector
    startBotMovement(sessionId, bot.userId)

    markMatched(entry.userId, sessionId)

    console.log(
      `[Matchmaker] Bot match for ${entry.userId.slice(0, 8)} → session ${sessionId} (${sector}, bot: ${bot.runnerName})`
    )
  }
}

async function enrichRunnerNames(sessionId: string, userIds: string[]) {
  if (!supabaseAdmin || userIds.length === 0) return
  try {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('id, runner_name')
      .in('id', userIds)

    if (data) {
      const session = getSession(sessionId)
      for (const row of data) {
        const player = session?.players.get(row.id as string)
        if (player) player.runnerName = (row.runner_name as string) ?? player.runnerName
      }
    }
  } catch {
    // Non-fatal — names fall back to placeholder
  }
}

let timer: ReturnType<typeof setInterval> | null = null

export function startMatchmaker() {
  if (timer) return

  console.log('[Matchmaker] Worker started (tick every 5s)')

  timer = setInterval(() => {
    for (const sector of SECTORS) {
      tickSector(sector).catch(console.error)
    }
  }, TICK_MS)
}

export function stopMatchmaker() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

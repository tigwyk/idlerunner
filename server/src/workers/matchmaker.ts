import { getQueuedBySector, markMatched } from '../state/queueStore.js'
import { createSession, getSession } from '../state/runSessionStore.js'
import { supabaseAdmin } from '../lib/supabase.js'

const SECTORS = ['residential', 'industrial', 'research'] as const
const MMR_BAND = 300
const TICK_MS = 5000

/**
 * Attempt to pair queued players in a single sector.
 * Pairs closest-MMR players within ±300 MMR.
 */
async function tickSector(sector: (typeof SECTORS)[number]) {
  const entries = getQueuedBySector(sector)

  if (entries.length < 2) return

  // Sort by MMR ascending
  entries.sort((a, b) => a.mmr - b.mmr)

  const paired = new Set<string>()

  for (let i = 0; i < entries.length - 1; i++) {
    const a = entries[i]
    if (paired.has(a.userId)) continue

    for (let j = i + 1; j < entries.length; j++) {
      const b = entries[j]
      if (paired.has(b.userId)) continue
      if (Math.abs(a.mmr - b.mmr) > MMR_BAND) continue

      // Found a pair — create run session
      const sessionId = createSession(
        sector,
        { userId: a.userId, runnerName: `Runner-${a.userId.slice(0, 4)}`, mmr: a.mmr },
        { userId: b.userId, runnerName: `Runner-${b.userId.slice(0, 4)}`, mmr: b.mmr }
      )

      // Enrich runner names from Supabase if available
      if (supabaseAdmin) {
        try {
          const { data } = await supabaseAdmin
            .from('profiles')
            .select('id, runner_name')
            .in('id', [a.userId, b.userId])

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

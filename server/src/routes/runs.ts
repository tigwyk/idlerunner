import type { FastifyInstance } from 'fastify'
import { joinRunResponseSchema, runPositionSyncRequestSchema } from '../shared.js'
import { getAuthenticatedUser, supabaseAdmin } from '../lib/supabase.js'
import {
  getSession,
  addSocket,
  removeSocket,
  broadcastToSession,
  updatePosition,
} from '../state/runSessionStore.js'

export async function registerRunRoutes(app: FastifyInstance) {
  /** Join an active run session after being matched. */
  app.post('/api/runs/:sessionId/join', async (request, reply) => {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return reply.code(401).send({ message: 'Authentication required.' })
    }

    const { sessionId } = request.params as { sessionId: string }
    const session = getSession(sessionId)

    if (!session) {
      return reply.code(404).send({ message: 'Run session not found.' })
    }

    const player = session.players.get(user.id)
    if (!player) {
      return reply.code(403).send({ message: 'You are not in this run session.' })
    }

    const opponent = [...session.players.values()].find((p) => p.userId !== user.id) ?? null

    return joinRunResponseSchema.parse({
      ok: true,
      sessionId: session.sessionId,
      sector: session.sector,
      opponent: opponent
        ? { userId: opponent.userId, runnerName: opponent.runnerName, mmr: opponent.mmr }
        : null,
      message: `Joined run session in ${session.sector}.`,
    })
  })

  /** Client periodically syncs their current room; server checks for zone overlap. */
  app.post('/api/runs/:sessionId/position', async (request, reply) => {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return reply.code(401).send({ message: 'Authentication required.' })
    }

    const { sessionId } = request.params as { sessionId: string }
    const session = getSession(sessionId)

    if (!session || !session.players.has(user.id)) {
      return reply.code(404).send({ message: 'Run session not found or you are not a participant.' })
    }

    const { currentRoom } = runPositionSyncRequestSchema.parse(request.body ?? {})
    const pvpOutcome = await updatePosition(sessionId, user.id, currentRoom)

    // Persist MMR changes to Supabase after PvP resolution
    if (pvpOutcome && supabaseAdmin) {
      const winnerPlayer = session.players.get(pvpOutcome.winnerId)
      const loserPlayer = session.players.get(pvpOutcome.loserId)

      const updates: PromiseLike<unknown>[] = []

      if (winnerPlayer) {
        updates.push(
          supabaseAdmin
            .from('profiles')
            .update({ mmr: winnerPlayer.mmr })
            .eq('id', pvpOutcome.winnerId)
        )
      }

      if (loserPlayer) {
        updates.push(
          supabaseAdmin
            .from('profiles')
            .update({ mmr: Math.max(0, loserPlayer.mmr) })
            .eq('id', pvpOutcome.loserId)
        )
      }

      updates.push(
        supabaseAdmin.from('encounters').insert({
          player_a_id: pvpOutcome.winnerId,
          player_b_id: pvpOutcome.loserId,
          winner_id: pvpOutcome.winnerId,
          encounter_type: 'pvp',
          sector: session.sector,
          mmr_change_a: pvpOutcome.mmrChange.winner,
          mmr_change_b: pvpOutcome.mmrChange.loser,
        })
      )

      await Promise.allSettled(updates.map((p) => Promise.resolve(p)))
    }

    return reply.send({ ok: true, pvpTriggered: pvpOutcome !== null })
  })

  /** WebSocket — live run events pushed to both players. */
  app.get('/ws/run/:sessionId', { websocket: true }, (socket, request) => {
    const { sessionId } = request.params as { sessionId: string }
    const session = getSession(sessionId)

    if (!session) {
      socket.send(JSON.stringify({ type: 'error', message: 'Run session not found.' }))
      socket.close()
      return
    }

    // We can't verify the JWT in the WebSocket upgrade synchronously here,
    // so we extract userId from a query param (set by the client) as a best-effort.
    const userId = (request.query as Record<string, string>).userId ?? ''
    const player = session.players.get(userId)

    if (!player) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not a participant in this session.' }))
      socket.close()
      return
    }

    addSocket(sessionId, userId, socket)

    // Notify the other player that this runner joined
    broadcastToSession(sessionId, {
      type: 'run.player_joined',
      userId: player.userId,
      runnerName: player.runnerName,
    })

    socket.on('close', () => {
      removeSocket(sessionId, userId)
    })
  })
}

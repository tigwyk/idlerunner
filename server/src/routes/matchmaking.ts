import type { FastifyInstance } from 'fastify'
import { queueRequestSchema, queueResponseSchema } from '../shared.js'
import { getAuthenticatedUser, supabaseAdmin } from '../lib/supabase.js'
import { joinQueue, leaveQueue, getQueueEntry } from '../state/queueStore.js'

export async function registerMatchmakingRoutes(app: FastifyInstance) {
  // GET — poll current queue status (client polls every 3s when queued)
  app.get('/api/matchmaking/queue', async (request, reply) => {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return reply.code(401).send(
        queueResponseSchema.parse({
          status: 'idle',
          queueId: null,
          sector: null,
          position: null,
          runSessionId: null,
          message: 'Not authenticated.',
        })
      )
    }

    const entry = getQueueEntry(user.id)

    if (!entry) {
      return queueResponseSchema.parse({
        status: 'idle',
        queueId: null,
        sector: null,
        position: null,
        runSessionId: null,
        message: 'Not in queue.',
      })
    }

    return queueResponseSchema.parse({
      status: entry.status,
      queueId: entry.queueId,
      sector: entry.sector,
      position: entry.status === 'queued' ? 1 : null,
      runSessionId: entry.runSessionId ?? null,
      message:
        entry.status === 'matched'
          ? `Match found! Run session: ${entry.runSessionId}`
          : 'Waiting for a match...',
    })
  })

  app.post('/api/matchmaking/queue', async (request, reply) => {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return reply.code(401).send(
        queueResponseSchema.parse({
          status: 'idle',
          queueId: null,
          sector: null,
          position: null,
          runSessionId: null,
          message: 'Authenticate before joining the multiplayer queue.',
        })
      )
    }

    const queueRequest = queueRequestSchema.parse(request.body ?? {})

    // Fetch player's current MMR from Supabase
    let mmr = 1200
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('mmr')
        .eq('id', user.id)
        .single()
      if (data) mmr = (data.mmr as number) ?? 1200
    }

    const queued = joinQueue(user.id, queueRequest, mmr)

    return queueResponseSchema.parse({
      status: 'queued',
      queueId: queued.entry.queueId,
      sector: queued.entry.sector,
      position: queued.position,
      runSessionId: null,
      message: `Queued for ${queueRequest.sector}. Searching for an opponent...`,
    })
  })

  app.delete('/api/matchmaking/queue', async (request, reply) => {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return reply.code(401).send(
        queueResponseSchema.parse({
          status: 'idle',
          queueId: null,
          sector: null,
          position: null,
          runSessionId: null,
          message: 'No active multiplayer session.',
        })
      )
    }

    const cleared = leaveQueue(user.id)

    if (!cleared) {
      return reply.code(404).send(
        queueResponseSchema.parse({
          status: 'idle',
          queueId: null,
          sector: null,
          position: null,
          runSessionId: null,
          message: 'No queued run to clear.',
        })
      )
    }

    return queueResponseSchema.parse({
      status: 'idle',
      queueId: null,
      sector: null,
      position: null,
      runSessionId: null,
      message: 'Queue cleared.',
    })
  })
}

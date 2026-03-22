import type { FastifyInstance } from 'fastify'
import { queueRequestSchema, queueResponseSchema } from '../shared.js'
import { getAuthenticatedUser } from '../lib/supabase.js'
import { joinQueue, leaveQueue } from '../state/queueStore.js'

export async function registerMatchmakingRoutes(app: FastifyInstance) {
  app.post('/api/matchmaking/queue', async (request, reply) => {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return reply.code(401).send(
        queueResponseSchema.parse({
          status: 'idle',
          queueId: null,
          sector: null,
          position: null,
          message: 'Authenticate before joining the multiplayer queue.',
        })
      )
    }

    const queueRequest = queueRequestSchema.parse(request.body ?? {})
    const queued = joinQueue(user.id, queueRequest)

    return queueResponseSchema.parse({
      status: 'queued',
      queueId: queued.entry.queueId,
      sector: queued.entry.sector,
      position: queued.position,
      message: `Queued for ${queueRequest.sector}. Matchmaking worker not yet enabled.`,
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
          message: 'No queued run to clear.',
        })
      )
    }

    return queueResponseSchema.parse({
      status: 'idle',
      queueId: null,
      sector: null,
      position: null,
      message: 'Queue cleared.',
    })
  })
}

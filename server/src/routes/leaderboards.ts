import type { FastifyInstance } from 'fastify'
import { leaderboardResponseSchema } from '../shared.js'
import { sampleLeaderboards } from '../data/sampleData.js'

export async function registerLeaderboardRoutes(app: FastifyInstance) {
  app.get('/api/leaderboards/:scope', async (request, reply) => {
    const scope = (request.params as { scope?: string }).scope

    if (scope !== 'global' && scope !== 'regional' && scope !== 'friends') {
      return reply.code(400).send({ message: 'Unsupported leaderboard scope.' })
    }

    return leaderboardResponseSchema.parse(sampleLeaderboards[scope])
  })
}

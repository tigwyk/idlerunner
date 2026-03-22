import type { FastifyInstance } from 'fastify'

export async function registerSafetyRoutes(app: FastifyInstance) {
  app.post('/api/report', async (_, reply) => {
    return reply.code(501).send({
      message: 'Reporting will be enabled in the safety milestone.',
    })
  })

  app.post('/api/blocks', async (_, reply) => {
    return reply.code(501).send({
      message: 'Block list management is not active yet.',
    })
  })

  app.delete('/api/blocks/:playerId', async (_, reply) => {
    return reply.code(501).send({
      message: 'Block list management is not active yet.',
    })
  })
}

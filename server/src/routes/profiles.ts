import type { FastifyInstance } from 'fastify'

export async function registerProfileRoutes(app: FastifyInstance) {
  app.patch('/api/profile', async (_, reply) => {
    return reply.code(501).send({
      message: 'Profile mutation is planned for the account foundation milestone.',
    })
  })
}

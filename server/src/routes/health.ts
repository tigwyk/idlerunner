import type { FastifyInstance } from 'fastify'
import { backendHealthSchema } from '../shared.js'
import { sampleHealth } from '../data/sampleData.js'

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get('/api/health', async () => backendHealthSchema.parse(sampleHealth))
}

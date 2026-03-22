import type { FastifyInstance } from 'fastify'
import { encounterEventSchema } from '../shared.js'

export async function registerEncounterRoutes(app: FastifyInstance) {
  app.get('/ws/encounter/:id', { websocket: true }, (socket, request) => {
    const encounterId = (request.params as { id?: string }).id ?? 'demo'

    const connectedEvent = encounterEventSchema.parse({
      type: 'encounter.created',
      encounter: {
        encounterId,
        phase: 'preparing',
        opponentName: 'Simulated Rival',
        lootAtStake: 120,
        timerSeconds: 3,
      },
      message: 'Legacy encounter channel. Use /ws/run/:sessionId for live multiplayer runs.',
    })

    socket.send(JSON.stringify(connectedEvent))

    socket.on('message', () => {
      const stateEvent = encounterEventSchema.parse({
        type: 'encounter.state_updated',
        encounter: {
          encounterId,
          phase: 'active',
          opponentName: 'Simulated Rival',
          lootAtStake: 120,
          timerSeconds: 30,
        },
        message: 'Client ping received.',
      })

      socket.send(JSON.stringify(stateEvent))
    })
  })
}

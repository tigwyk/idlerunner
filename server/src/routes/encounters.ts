import type { FastifyInstance } from 'fastify'
import websocket from '@fastify/websocket'
import { encounterEventSchema } from '../shared.js'

export async function registerEncounterRoutes(app: FastifyInstance) {
  await app.register(websocket)

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
      message: 'Encounter channel connected. Real-time sync will be added in the encounter milestone.',
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
        message: 'Client ping received. Encounter state streaming is scaffolded.',
      })

      socket.send(JSON.stringify(stateEvent))
    })
  })
}

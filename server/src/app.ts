import Fastify from 'fastify'
import cors from '@fastify/cors'
import { registerAuthRoutes } from './routes/auth.js'
import { registerEncounterRoutes } from './routes/encounters.js'
import { registerHealthRoutes } from './routes/health.js'
import { registerLeaderboardRoutes } from './routes/leaderboards.js'
import { registerMatchmakingRoutes } from './routes/matchmaking.js'
import { registerProfileRoutes } from './routes/profiles.js'
import { registerSafetyRoutes } from './routes/safety.js'

export function buildServer() {
  const app = Fastify({
    logger: false,
  })

  void app.register(cors, {
    origin: true,
    credentials: true,
  })

  void app.register(registerHealthRoutes)
  void app.register(registerAuthRoutes)
  void app.register(registerProfileRoutes)
  void app.register(registerLeaderboardRoutes)
  void app.register(registerMatchmakingRoutes)
  void app.register(registerSafetyRoutes)
  void app.register(registerEncounterRoutes)

  return app
}

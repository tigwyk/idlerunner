import Fastify from 'fastify'
import cors from '@fastify/cors'
import websocket from '@fastify/websocket'
import { registerAuthRoutes } from './routes/auth.js'
import { registerEconomyRoutes } from './routes/economy.js'
import { registerEncounterRoutes } from './routes/encounters.js'
import { registerHealthRoutes } from './routes/health.js'
import { registerLeaderboardRoutes } from './routes/leaderboards.js'
import { registerMatchmakingRoutes } from './routes/matchmaking.js'
import { registerProfileRoutes } from './routes/profiles.js'
import { registerRunRoutes } from './routes/runs.js'
import { registerSafetyRoutes } from './routes/safety.js'
import { startMatchmaker } from './workers/matchmaker.js'

export function buildServer() {
  const app = Fastify({
    logger: false,
  })

  // ALLOWED_ORIGIN can be a single origin or a comma-separated list of origins.
  // e.g. "https://myapp.com,https://preview.myapp.railway.app"
  // If unset, all origins are allowed (fine for local dev, not for production).
  const rawOrigin = process.env.ALLOWED_ORIGIN
  const allowedOrigins = rawOrigin
    ? rawOrigin.split(',').map((o) => o.trim().replace(/\/$/, '')).filter(Boolean)
    : null
  void app.register(cors, {
    origin: allowedOrigins === null ? true : allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    credentials: true,
  })

  // Register WebSocket support globally so all route plugins can use { websocket: true }
  void app.register(websocket)

  void app.register(registerHealthRoutes)
  void app.register(registerAuthRoutes)
  void app.register(registerEconomyRoutes)
  void app.register(registerProfileRoutes)
  void app.register(registerLeaderboardRoutes)
  void app.register(registerMatchmakingRoutes)
  void app.register(registerSafetyRoutes)
  void app.register(registerEncounterRoutes)
  void app.register(registerRunRoutes)

  // Start matchmaking worker after server is ready
  app.addHook('onReady', () => {
    startMatchmaker()
  })

  return app
}

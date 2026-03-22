import type {
  AuthProfileResponse,
  BackendHealth,
  LeaderboardResponse,
} from '../../../shared/src/index.js'

export const sampleHealth: BackendHealth = {
  service: 'marathon-idle-multiplayer',
  status: 'online',
  version: '0.1.0-foundation',
  capabilities: ['auth', 'profiles', 'queue', 'leaderboards', 'encounters', 'reports', 'blocks'],
  websocketUrl: 'ws://localhost:3001/ws/encounter/demo',
}

export const sampleProfile: AuthProfileResponse = {
  authenticated: false,
  needsSetup: false,
  availableProviders: ['google', 'discord'],
  profile: null,
  message: 'Multiplayer foundation is online.',
}

export const sampleLeaderboards: Record<'global' | 'regional' | 'friends', LeaderboardResponse> = {
  global: {
    scope: 'global',
    season: 'Foundation Season',
    entries: [
      { playerId: 'atlas-01', runnerName: 'Atlas', mmr: 1820, tier: 'Gold', wins: 27, encounters: 41 },
      { playerId: 'ghost-17', runnerName: 'Ghostline', mmr: 1715, tier: 'Gold', wins: 21, encounters: 34 },
      { playerId: 'lyra-88', runnerName: 'Lyra', mmr: 1640, tier: 'Gold', wins: 18, encounters: 29 },
    ],
  },
  regional: {
    scope: 'regional',
    season: 'Foundation Season',
    entries: [
      { playerId: 'local-03', runnerName: 'Dockhand', mmr: 1490, tier: 'Silver', wins: 14, encounters: 24 },
      { playerId: 'local-09', runnerName: 'Signal', mmr: 1425, tier: 'Silver', wins: 12, encounters: 22 },
      { playerId: 'local-11', runnerName: 'Glassline', mmr: 1375, tier: 'Silver', wins: 10, encounters: 18 },
    ],
  },
  friends: {
    scope: 'friends',
    season: 'Foundation Season',
    entries: [],
  },
}

import { z } from 'zod'

export const oauthProviderSchema = z.enum(['google', 'discord', 'github'])
export type OAuthProvider = z.infer<typeof oauthProviderSchema>

export const multiplayerCapabilitySchema = z.enum([
  'auth',
  'profiles',
  'queue',
  'leaderboards',
  'encounters',
  'reports',
  'blocks',
])
export type MultiplayerCapability = z.infer<typeof multiplayerCapabilitySchema>

export const connectionStatusSchema = z.enum(['online', 'degraded', 'offline'])
export type ConnectionStatus = z.infer<typeof connectionStatusSchema>

export const backendHealthSchema = z.object({
  service: z.literal('marathon-idle-multiplayer'),
  status: connectionStatusSchema,
  version: z.string(),
  capabilities: z.array(multiplayerCapabilitySchema),
  websocketUrl: z.string().url(),
})
export type BackendHealth = z.infer<typeof backendHealthSchema>

export const playerProfileSchema = z.object({
  id: z.string(),
  runnerName: z.string(),
  region: z.string(),
  mmr: z.number().int().nonnegative(),
  rankTier: z.string(),
  careerRuns: z.number().int().nonnegative(),
  careerWins: z.number().int().nonnegative(),
  economyState: z.object({
    resources: z.object({
      credits: z.number().int().default(100),
      metals: z.number().int().default(0),
      electronics: z.number().int().default(0),
      data: z.number().int().default(0),
    }),
    statUpgrades: z.record(z.string(), z.number().int()).default({}),
  }).optional(),
})
export type PlayerProfile = z.infer<typeof playerProfileSchema>

export type ResourcesState = {
  credits: number
  metals: number
  electronics: number
  data: number
}

export type StatUpgradesState = Partial<Record<string, number>>

export type EconomyState = {
  resources: ResourcesState
  statUpgrades: StatUpgradesState
}

export const authProfileResponseSchema = z.object({
  authenticated: z.boolean(),
  needsSetup: z.boolean().default(false),
  availableProviders: z.array(oauthProviderSchema),
  profile: playerProfileSchema.nullable(),
  message: z.string(),
})
export type AuthProfileResponse = z.infer<typeof authProfileResponseSchema>

export const usernameSetupRequestSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters.')
    .max(20, 'Username must be 20 characters or fewer.')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores.'),
})
export type UsernameSetupRequest = z.infer<typeof usernameSetupRequestSchema>

export const usernameSetupResponseSchema = z.object({
  ok: z.boolean(),
  profile: playerProfileSchema.nullable(),
  message: z.string(),
})
export type UsernameSetupResponse = z.infer<typeof usernameSetupResponseSchema>

export const authLoginResponseSchema = z.object({
  provider: oauthProviderSchema,
  authorizationUrl: z.string().nullable(),
  sessionId: z.string().optional(),
  profile: playerProfileSchema.optional(),
  message: z.string(),
})
export type AuthLoginResponse = z.infer<typeof authLoginResponseSchema>

export const authLogoutResponseSchema = z.object({
  ok: z.boolean(),
  message: z.string(),
})
export type AuthLogoutResponse = z.infer<typeof authLogoutResponseSchema>

export const leaderboardEntrySchema = z.object({
  playerId: z.string(),
  runnerName: z.string(),
  mmr: z.number().int().nonnegative(),
  tier: z.string(),
  wins: z.number().int().nonnegative(),
  encounters: z.number().int().nonnegative(),
})
export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>

export const leaderboardResponseSchema = z.object({
  scope: z.enum(['global', 'regional', 'friends']),
  season: z.string(),
  entries: z.array(leaderboardEntrySchema),
})
export type LeaderboardResponse = z.infer<typeof leaderboardResponseSchema>

export const queueStatusSchema = z.enum(['idle', 'queued', 'matched'])
export type QueueStatus = z.infer<typeof queueStatusSchema>

export const queueRequestSchema = z.object({
  sector: z.enum(['residential', 'industrial', 'research']),
  roomProgress: z.number().int().nonnegative().default(0),
})
export type QueueRequest = z.infer<typeof queueRequestSchema>

export const queueResponseSchema = z.object({
  status: queueStatusSchema,
  queueId: z.string().nullable().default(null),
  sector: z.enum(['residential', 'industrial', 'research']).nullable().default(null),
  position: z.number().int().nonnegative().nullable().default(null),
  runSessionId: z.string().nullable().default(null),
  message: z.string(),
})
export type QueueResponse = z.infer<typeof queueResponseSchema>

export const encounterPhaseSchema = z.enum([
  'preparing',
  'active',
  'resolving',
  'completed',
])
export type EncounterPhase = z.infer<typeof encounterPhaseSchema>

export const encounterEventTypeSchema = z.enum([
  'encounter.created',
  'encounter.prep_started',
  'encounter.state_updated',
  'encounter.action_requested',
  'encounter.action_resolved',
  'encounter.player_disconnected',
  'encounter.player_reconnected',
  'encounter.finished',
])
export type EncounterEventType = z.infer<typeof encounterEventTypeSchema>

export const encounterStateSchema = z.object({
  encounterId: z.string(),
  phase: encounterPhaseSchema,
  opponentName: z.string(),
  lootAtStake: z.number().int().nonnegative(),
  timerSeconds: z.number().int().nonnegative(),
})
export type EncounterState = z.infer<typeof encounterStateSchema>

export const encounterEventSchema = z.object({
  type: encounterEventTypeSchema,
  encounter: encounterStateSchema,
  message: z.string(),
})
export type EncounterEvent = z.infer<typeof encounterEventSchema>

// ─── Run Sessions ─────────────────────────────────────────────────────────────

export const runOpponentSchema = z.object({
  userId: z.string(),
  runnerName: z.string(),
  mmr: z.number().int().nonnegative(),
})
export type RunOpponent = z.infer<typeof runOpponentSchema>

export const joinRunResponseSchema = z.object({
  ok: z.boolean(),
  sessionId: z.string(),
  sector: z.enum(['residential', 'industrial', 'research']),
  opponent: runOpponentSchema.nullable(),
  message: z.string(),
})
export type JoinRunResponse = z.infer<typeof joinRunResponseSchema>

export const runPositionSyncRequestSchema = z.object({
  currentRoom: z.number().int().nonnegative(),
})
export type RunPositionSyncRequest = z.infer<typeof runPositionSyncRequestSchema>

export const pvpOpponentSchema = z.object({
  userId: z.string(),
  runnerName: z.string(),
  mmr: z.number().int().nonnegative(),
})
export type PvpOpponent = z.infer<typeof pvpOpponentSchema>

export const pvpOutcomeSchema = z.object({
  winnerId: z.string(),
  winnerName: z.string(),
  loserId: z.string(),
  loserName: z.string(),
  mmrChange: z.object({ winner: z.number().int(), loser: z.number().int() }),
  lootTransferred: z.number().int().nonnegative(),
})
export type PvpOutcome = z.infer<typeof pvpOutcomeSchema>

export const runEventTypeSchema = z.enum([
  'run.player_joined',
  'run.position_update',
  'pvp.encounter_started',
  'pvp.encounter_resolved',
])
export type RunEventType = z.infer<typeof runEventTypeSchema>

export const runEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('run.player_joined'),
    userId: z.string(),
    runnerName: z.string(),
  }),
  z.object({
    type: z.literal('run.position_update'),
    userId: z.string(),
    currentRoom: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal('pvp.encounter_started'),
    opponent: pvpOpponentSchema,
    lootAtStake: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal('pvp.encounter_resolved'),
    outcome: pvpOutcomeSchema,
  }),
])
export type RunEvent = z.infer<typeof runEventSchema>

// ─── Economy ──────────────────────────────────────────────────────────────────

export const economyResourcesSchema = z.object({
  credits: z.number().int().default(100),
  metals: z.number().int().default(0),
  electronics: z.number().int().default(0),
  data: z.number().int().default(0),
})

export const economyStateResponseSchema = z.object({
  resources: economyResourcesSchema,
  statUpgrades: z.record(z.string(), z.number().int()).default({}),
})
export type EconomyStateResponse = z.infer<typeof economyStateResponseSchema>

export const economySyncRequestSchema = z.object({
  earned: economyResourcesSchema,
  sector: z.enum(['residential', 'industrial', 'research']),
  roomsCleared: z.number().int().nonnegative(),
})
export type EconomySyncRequest = z.infer<typeof economySyncRequestSchema>

export const economyUpgradeResponseSchema = z.object({
  ok: z.boolean(),
  stat: z.string(),
  newLevel: z.number().int(),
  economy: economyStateResponseSchema,
  message: z.string(),
})
export type EconomyUpgradeResponse = z.infer<typeof economyUpgradeResponseSchema>

import type { FastifyInstance } from 'fastify'
import { z } from 'zod/v4'
import { getAuthenticatedUser, isSupabaseConfigured, supabaseAdmin } from '../lib/supabase.js'

// ---------------------------------------------------------------------------
// Shared challenge types
// ---------------------------------------------------------------------------

export type ChallengeType =
  | 'complete_residential'
  | 'complete_industrial'
  | 'complete_research'
  | 'defeat_enemies'
  | 'defeat_boss'
  | 'no_healing_run'
  | 'fragile_run'
  | 'bonus_loot_run'
  | 'time_pressure_run'
  | 'collect_credits'
  | 'complete_5_rooms'
  | 'collect_electronics'

export interface DailyChallenge {
  id: string
  type: ChallengeType
  title: string
  description: string
  target: number
  reward: { credits: number; metals: number; electronics: number; data: number }
  /** Modifiers that must be active for this challenge to count */
  requiredModifiers: string[]
}

// ---------------------------------------------------------------------------
// Challenge pool — 12 entries seeded deterministically per day
// ---------------------------------------------------------------------------

const CHALLENGE_POOL: DailyChallenge[] = [
  {
    id: 'complete_residential',
    type: 'complete_residential',
    title: 'Residential Sweep',
    description: 'Complete a Residential sector run.',
    target: 1,
    reward: { credits: 200, metals: 30, electronics: 0, data: 0 },
    requiredModifiers: [],
  },
  {
    id: 'complete_industrial',
    type: 'complete_industrial',
    title: 'Industrial Salvage',
    description: 'Complete an Industrial sector run.',
    target: 1,
    reward: { credits: 300, metals: 50, electronics: 20, data: 0 },
    requiredModifiers: [],
  },
  {
    id: 'complete_research',
    type: 'complete_research',
    title: 'Research Dive',
    description: 'Complete a Research sector run.',
    target: 1,
    reward: { credits: 400, metals: 40, electronics: 30, data: 20 },
    requiredModifiers: [],
  },
  {
    id: 'defeat_10_enemies',
    type: 'defeat_enemies',
    title: 'Enemy Elimination',
    description: 'Defeat 10 enemies across any run.',
    target: 10,
    reward: { credits: 250, metals: 20, electronics: 0, data: 0 },
    requiredModifiers: [],
  },
  {
    id: 'defeat_boss',
    type: 'defeat_boss',
    title: 'Boss Takedown',
    description: 'Defeat the sector boss in any run.',
    target: 1,
    reward: { credits: 500, metals: 60, electronics: 30, data: 10 },
    requiredModifiers: [],
  },
  {
    id: 'no_healing_run',
    type: 'no_healing_run',
    title: 'No Mercy',
    description: 'Complete a run with the No Healing modifier.',
    target: 1,
    reward: { credits: 600, metals: 50, electronics: 40, data: 20 },
    requiredModifiers: ['no_healing'],
  },
  {
    id: 'fragile_run',
    type: 'fragile_run',
    title: 'Glass Cannon',
    description: 'Complete a run with the Fragile modifier.',
    target: 1,
    reward: { credits: 700, metals: 60, electronics: 50, data: 25 },
    requiredModifiers: ['fragile'],
  },
  {
    id: 'bonus_loot_run',
    type: 'bonus_loot_run',
    title: 'Loot Fever',
    description: 'Complete a run with the Bonus Loot modifier.',
    target: 1,
    reward: { credits: 450, metals: 80, electronics: 60, data: 30 },
    requiredModifiers: ['bonus_loot'],
  },
  {
    id: 'time_pressure_run',
    type: 'time_pressure_run',
    title: 'Against the Clock',
    description: 'Complete a run with the Time Pressure modifier.',
    target: 1,
    reward: { credits: 650, metals: 55, electronics: 45, data: 20 },
    requiredModifiers: ['time_pressure'],
  },
  {
    id: 'collect_1000_credits',
    type: 'collect_credits',
    title: 'Credit Collector',
    description: 'Collect 1,000 credits in a single run.',
    target: 1000,
    reward: { credits: 300, metals: 40, electronics: 20, data: 10 },
    requiredModifiers: [],
  },
  {
    id: 'complete_5_rooms',
    type: 'complete_5_rooms',
    title: 'Room Clearer',
    description: 'Complete 5 rooms without failing in a single run.',
    target: 5,
    reward: { credits: 200, metals: 25, electronics: 15, data: 5 },
    requiredModifiers: [],
  },
  {
    id: 'collect_electronics',
    type: 'collect_electronics',
    title: 'Tech Salvager',
    description: 'Collect 50 Electronics across any run.',
    target: 50,
    reward: { credits: 350, metals: 30, electronics: 60, data: 15 },
    requiredModifiers: [],
  },
]

// Seeded pseudo-random based on day number
function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

function getDailyChallenges(dayNumber: number): DailyChallenge[] {
  const rand = seededRandom(dayNumber * 31337)
  const pool = [...CHALLENGE_POOL]
  // Fisher-Yates shuffle with seeded RNG
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, 3)
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const dailyChallengeSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  description: z.string(),
  target: z.number(),
  reward: z.object({
    credits: z.number(),
    metals: z.number(),
    electronics: z.number(),
    data: z.number(),
  }),
  requiredModifiers: z.array(z.string()),
  completed: z.boolean(),
})

const dailyChallengesResponseSchema = z.object({
  dayNumber: z.number(),
  challenges: z.array(dailyChallengeSchema),
})

const completeBodySchema = z.object({
  challengeId: z.string(),
  runResult: z.object({
    success: z.boolean(),
    sector: z.string(),
    enemiesDefeated: z.number(),
    resourcesCollected: z.record(z.string(), z.number()),
    roomsCleared: z.number(),
    modifiers: z.array(z.string()),
    bossDefeated: z.boolean().optional(),
  }),
})

const completeResponseSchema = z.object({
  ok: z.boolean(),
  message: z.string(),
  reward: z.object({
    credits: z.number(),
    metals: z.number(),
    electronics: z.number(),
    data: z.number(),
  }).optional(),
})

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function validateChallengeCompletion(
  challenge: DailyChallenge,
  runResult: z.infer<typeof completeBodySchema>['runResult']
): { valid: boolean; reason?: string } {
  if (!runResult.success) return { valid: false, reason: 'Run did not succeed.' }

  // Check required modifiers
  for (const mod of challenge.requiredModifiers) {
    if (!runResult.modifiers.includes(mod)) {
      return { valid: false, reason: `Missing required modifier: ${mod}` }
    }
  }

  switch (challenge.type) {
    case 'complete_residential':
      if (runResult.sector !== 'residential') return { valid: false, reason: 'Wrong sector.' }
      break
    case 'complete_industrial':
      if (runResult.sector !== 'industrial') return { valid: false, reason: 'Wrong sector.' }
      break
    case 'complete_research':
      if (runResult.sector !== 'research') return { valid: false, reason: 'Wrong sector.' }
      break
    case 'defeat_enemies':
      if (runResult.enemiesDefeated < challenge.target) {
        return { valid: false, reason: `Defeated only ${runResult.enemiesDefeated}/${challenge.target} enemies.` }
      }
      break
    case 'defeat_boss':
      if (!runResult.bossDefeated) return { valid: false, reason: 'Boss not defeated.' }
      break
    case 'collect_credits':
      if ((runResult.resourcesCollected['credits'] ?? 0) < challenge.target) {
        return { valid: false, reason: `Collected only ${runResult.resourcesCollected['credits'] ?? 0}/${challenge.target} credits.` }
      }
      break
    case 'complete_5_rooms':
      if (runResult.roomsCleared < challenge.target) {
        return { valid: false, reason: `Cleared only ${runResult.roomsCleared}/${challenge.target} rooms.` }
      }
      break
    case 'collect_electronics':
      if ((runResult.resourcesCollected['electronics'] ?? 0) < challenge.target) {
        return { valid: false, reason: `Collected only ${runResult.resourcesCollected['electronics'] ?? 0}/${challenge.target} electronics.` }
      }
      break
    // modifier-gated runs are already validated above
    case 'no_healing_run':
    case 'fragile_run':
    case 'bonus_loot_run':
    case 'time_pressure_run':
      break
  }

  return { valid: true }
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function registerChallengeRoutes(app: FastifyInstance) {
  // GET /api/challenges/daily — returns today's 3 challenges + completion status
  app.get('/api/challenges/daily', async (request, reply) => {
    const dayNumber = Math.floor(Date.now() / 86400000)
    const challenges = getDailyChallenges(dayNumber)

    let completedIds: string[] = []

    if (isSupabaseConfigured()) {
      const user = await getAuthenticatedUser(request)
      if (user) {
        const { data } = await supabaseAdmin!
          .from('profiles')
          .select('challenge_completions')
          .eq('id', user.id)
          .single()

        if (data?.challenge_completions) {
          const comp = data.challenge_completions as Record<string, string[]>
          completedIds = comp[String(dayNumber)] ?? []
        }
      }
    }

    return reply.send(
      dailyChallengesResponseSchema.parse({
        dayNumber,
        challenges: challenges.map((c) => ({
          ...c,
          completed: completedIds.includes(c.id),
        })),
      })
    )
  })

  // POST /api/challenges/complete — validate + mark complete + award resources
  app.post('/api/challenges/complete', async (request, reply) => {
    if (!isSupabaseConfigured()) {
      return reply.code(503).send(
        completeResponseSchema.parse({ ok: false, message: 'Supabase not configured.' })
      )
    }

    const user = await getAuthenticatedUser(request)
    if (!user) {
      return reply.code(401).send(
        completeResponseSchema.parse({ ok: false, message: 'Authentication required.' })
      )
    }

    const body = completeBodySchema.safeParse(request.body)
    if (!body.success) {
      return reply.code(400).send(
        completeResponseSchema.parse({ ok: false, message: 'Invalid request body.' })
      )
    }

    const dayNumber = Math.floor(Date.now() / 86400000)
    const todayChallenges = getDailyChallenges(dayNumber)
    const challenge = todayChallenges.find((c) => c.id === body.data.challengeId)

    if (!challenge) {
      return reply.code(404).send(
        completeResponseSchema.parse({ ok: false, message: 'Challenge not found for today.' })
      )
    }

    // Check if already completed today
    const { data: profile } = await supabaseAdmin!
      .from('profiles')
      .select('challenge_completions, resources')
      .eq('id', user.id)
      .single()

    const existing = (profile?.challenge_completions ?? {}) as Record<string, string[]>
    const todayCompleted: string[] = existing[String(dayNumber)] ?? []

    if (todayCompleted.includes(challenge.id)) {
      return reply.code(409).send(
        completeResponseSchema.parse({ ok: false, message: 'Challenge already completed today.' })
      )
    }

    // Validate the run result server-side
    const validation = validateChallengeCompletion(challenge, body.data.runResult)
    if (!validation.valid) {
      return reply.code(400).send(
        completeResponseSchema.parse({ ok: false, message: validation.reason ?? 'Validation failed.' })
      )
    }

    // Mark complete and award resources
    const updatedCompletions = {
      ...existing,
      [String(dayNumber)]: [...todayCompleted, challenge.id],
    }

    const currentResources = (profile?.resources ?? {
      credits: 0, metals: 0, electronics: 0, data: 0,
    }) as Record<string, number>

    const updatedResources = {
      credits: (currentResources['credits'] ?? 0) + challenge.reward.credits,
      metals: (currentResources['metals'] ?? 0) + challenge.reward.metals,
      electronics: (currentResources['electronics'] ?? 0) + challenge.reward.electronics,
      data: (currentResources['data'] ?? 0) + challenge.reward.data,
    }

    await supabaseAdmin!
      .from('profiles')
      .update({
        challenge_completions: updatedCompletions,
        resources: updatedResources,
      })
      .eq('id', user.id)

    return reply.send(
      completeResponseSchema.parse({
        ok: true,
        message: `Challenge "${challenge.title}" completed!`,
        reward: challenge.reward,
      })
    )
  })
}

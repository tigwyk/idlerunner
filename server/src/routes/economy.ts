import type { FastifyInstance } from 'fastify'
import {
  economyStateResponseSchema,
  economySyncRequestSchema,
  economyUpgradeResponseSchema,
} from '../shared.js'
import { getAuthenticatedUser, isSupabaseConfigured, supabaseAdmin } from '../lib/supabase.js'

// ─── Per-sector earn caps (credits/metals/electronics/data per room) ──────────
// Server-side validation prevents clients from fabricating inflated run results.
const EARN_CAPS: Record<string, { credits: number; metals: number; electronics: number; data: number }> = {
  residential: { credits: 200, metals: 30,  electronics: 0,  data: 0  },
  industrial:  { credits: 300, metals: 50,  electronics: 20, data: 5  },
  research:    { credits: 400, metals: 60,  electronics: 40, data: 20 },
}

// ─── Per-stat upgrade cost config (matches client vendor.ts) ──────────────────
const STAT_BASE_COSTS: Record<string, { resource: 'metals' | 'electronics' | 'data'; base: number }> = {
  strength:     { resource: 'metals',      base: 20 },
  agility:      { resource: 'metals',      base: 15 },
  endurance:    { resource: 'electronics', base: 20 },
  intelligence: { resource: 'data',        base: 15 },
  perception:   { resource: 'data',        base: 10 },
  cyberAffinity:{ resource: 'electronics', base: 25 },
}

const MAX_UPGRADES = 10

function getUpgradeCost(stat: string, currentLevel: number): { resource: string; amount: number } | null {
  const config = STAT_BASE_COSTS[stat]
  if (!config) return null
  return { resource: config.resource, amount: (currentLevel ** 2) * config.base || config.base }
}

export async function registerEconomyRoutes(app: FastifyInstance) {
  // GET /api/economy
  // Returns the player's current resources and stat upgrade levels.
  app.get('/api/economy', async (request, reply) => {
    if (!isSupabaseConfigured()) {
      return reply.code(503).send({ error: 'Economy features require Supabase to be configured.' })
    }

    const user = await getAuthenticatedUser(request)
    if (!user) return reply.code(401).send({ error: 'Not authenticated.' })

    const { data: row, error } = await supabaseAdmin!
      .from('profiles')
      .select('resources, stat_upgrades')
      .eq('id', user.id)
      .single()

    if (error || !row) return reply.code(404).send({ error: 'Profile not found.' })

    return economyStateResponseSchema.parse({
      resources: row.resources ?? { credits: 100, metals: 0, electronics: 0, data: 0 },
      statUpgrades: row.stat_upgrades ?? {},
    })
  })

  // POST /api/economy/sync
  // Called by the client when a run completes. Validates and adds earned resources.
  app.post('/api/economy/sync', async (request, reply) => {
    if (!isSupabaseConfigured()) {
      return reply.code(503).send({ error: 'Economy features require Supabase to be configured.' })
    }

    const user = await getAuthenticatedUser(request)
    if (!user) return reply.code(401).send({ error: 'Not authenticated.' })

    const body = economySyncRequestSchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: 'Invalid request body.' })

    const { earned, sector, roomsCleared } = body.data
    const cap = EARN_CAPS[sector] ?? EARN_CAPS.residential

    // Cap each resource to prevent fabricated amounts
    const validated = {
      credits:     Math.min(earned.credits,     cap.credits     * roomsCleared),
      metals:      Math.min(earned.metals,      cap.metals      * roomsCleared),
      electronics: Math.min(earned.electronics, cap.electronics * roomsCleared),
      data:        Math.min(earned.data,        cap.data        * roomsCleared),
    }

    // Fetch current resources
    const { data: row, error: fetchErr } = await supabaseAdmin!
      .from('profiles')
      .select('resources')
      .eq('id', user.id)
      .single()

    if (fetchErr || !row) return reply.code(404).send({ error: 'Profile not found.' })

    const current = (row.resources as Record<string, number>) ?? { credits: 100, metals: 0, electronics: 0, data: 0 }

    const updated = {
      credits:     (current.credits     ?? 100) + validated.credits,
      metals:      (current.metals      ?? 0)   + validated.metals,
      electronics: (current.electronics ?? 0)   + validated.electronics,
      data:        (current.data        ?? 0)   + validated.data,
    }

    const { error: updateErr } = await supabaseAdmin!
      .from('profiles')
      .update({ resources: updated })
      .eq('id', user.id)

    if (updateErr) return reply.code(500).send({ error: 'Failed to update resources.' })

    return economyStateResponseSchema.parse({
      resources: updated,
      statUpgrades: {},
    })
  })

  // POST /api/economy/upgrade/:stat
  // Validates the upgrade cost server-side and applies atomically.
  app.post<{ Params: { stat: string } }>('/api/economy/upgrade/:stat', async (request, reply) => {
    if (!isSupabaseConfigured()) {
      return reply.code(503).send({ error: 'Economy features require Supabase to be configured.' })
    }

    const user = await getAuthenticatedUser(request)
    if (!user) return reply.code(401).send({ error: 'Not authenticated.' })

    const { stat } = request.params
    if (!STAT_BASE_COSTS[stat]) {
      return reply.code(400).send({ error: `Unknown stat: ${stat}` })
    }

    const { data: row, error: fetchErr } = await supabaseAdmin!
      .from('profiles')
      .select('resources, stat_upgrades')
      .eq('id', user.id)
      .single()

    if (fetchErr || !row) return reply.code(404).send({ error: 'Profile not found.' })

    const resources = (row.resources as Record<string, number>) ?? { credits: 100, metals: 0, electronics: 0, data: 0 }
    const upgrades  = (row.stat_upgrades as Record<string, number>) ?? {}
    const currentLevel = upgrades[stat] ?? 0

    if (currentLevel >= MAX_UPGRADES) {
      return reply.code(400).send({ error: `${stat} is already at max level (${MAX_UPGRADES}).` })
    }

    const cost = getUpgradeCost(stat, currentLevel)
    if (!cost) return reply.code(400).send({ error: 'Could not compute upgrade cost.' })

    const available = resources[cost.resource] ?? 0
    if (available < cost.amount) {
      return reply.code(400).send({
        error: `Insufficient ${cost.resource}. Need ${cost.amount}, have ${available}.`,
      })
    }

    // Atomic deduction + level increment
    const newResources = { ...resources, [cost.resource]: available - cost.amount }
    const newUpgrades  = { ...upgrades,  [stat]: currentLevel + 1 }

    const { error: updateErr } = await supabaseAdmin!
      .from('profiles')
      .update({ resources: newResources, stat_upgrades: newUpgrades })
      .eq('id', user.id)

    if (updateErr) return reply.code(500).send({ error: 'Failed to apply upgrade.' })

    return economyUpgradeResponseSchema.parse({
      ok: true,
      stat,
      newLevel: currentLevel + 1,
      economy: {
        resources: newResources,
        statUpgrades: newUpgrades,
      },
      message: `${stat} upgraded to level ${currentLevel + 1}.`,
    })
  })
}

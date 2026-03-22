import type { FastifyInstance } from 'fastify'
import { leaderboardResponseSchema } from '../shared.js'
import { sampleLeaderboards } from '../data/sampleData.js'
import { supabaseAdmin, isSupabaseConfigured } from '../lib/supabase.js'

function rankTier(mmr: number): string {
  if (mmr >= 2000) return 'Diamond'
  if (mmr >= 1700) return 'Platinum'
  if (mmr >= 1400) return 'Gold'
  if (mmr >= 1100) return 'Silver'
  return 'Bronze'
}

export async function registerLeaderboardRoutes(app: FastifyInstance) {
  app.get('/api/leaderboards/:scope', async (request, reply) => {
    const scope = (request.params as { scope?: string }).scope

    if (scope !== 'global' && scope !== 'regional' && scope !== 'friends') {
      return reply.code(400).send({ message: 'Unsupported leaderboard scope.' })
    }

    if (!isSupabaseConfigured()) {
      return leaderboardResponseSchema.parse(sampleLeaderboards[scope])
    }

    if (scope === 'friends') {
      // Friends system not yet implemented
      return leaderboardResponseSchema.parse({
        scope: 'friends',
        season: 'Season 1',
        entries: [],
      })
    }

    let query = supabaseAdmin!
      .from('profiles')
      .select('id, runner_name, mmr, career_runs, career_wins, region')
      .order('mmr', { ascending: false })
      .limit(10)

    if (scope === 'regional') {
      query = query.eq('region', 'NA')
    }

    const { data, error } = await query

    if (error || !data) {
      console.error('[Leaderboard] Supabase query failed:', error)
      return leaderboardResponseSchema.parse(sampleLeaderboards[scope])
    }

    return leaderboardResponseSchema.parse({
      scope,
      season: 'Season 1',
      entries: data.map((row) => ({
        playerId: row.id as string,
        runnerName: (row.runner_name as string) ?? 'Unknown',
        mmr: (row.mmr as number) ?? 1200,
        tier: rankTier((row.mmr as number) ?? 1200),
        wins: (row.career_wins as number) ?? 0,
        encounters: (row.career_runs as number) ?? 0,
      })),
    })
  })
}

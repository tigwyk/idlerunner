import type { FastifyInstance } from 'fastify'
import { leaderboardResponseSchema } from '../shared.js'
import { sampleLeaderboards } from '../data/sampleData.js'
import { supabaseAdmin, isSupabaseConfigured, getAuthenticatedUser } from '../lib/supabase.js'

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
      const user = await getAuthenticatedUser(request)
      if (!user) {
        return leaderboardResponseSchema.parse({ scope: 'friends', season: 'Season 1', entries: [] })
      }

      // Get accepted friend IDs for this user
      const { data: friendRows } = await supabaseAdmin!
        .from('friendships')
        .select('sender_id, receiver_id')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq('status', 'accepted')

      if (!friendRows || friendRows.length === 0) {
        return leaderboardResponseSchema.parse({ scope: 'friends', season: 'Season 1', entries: [] })
      }

      const friendIds = friendRows.map((r) =>
        r.sender_id === user.id ? r.receiver_id : r.sender_id
      )

      const { data, error } = await supabaseAdmin!
        .from('profiles')
        .select('id, runner_name, mmr, career_runs, career_wins')
        .in('id', friendIds)
        .order('mmr', { ascending: false })
        .limit(50)

      if (error || !data) {
        return leaderboardResponseSchema.parse({ scope: 'friends', season: 'Season 1', entries: [] })
      }

      return leaderboardResponseSchema.parse({
        scope: 'friends',
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

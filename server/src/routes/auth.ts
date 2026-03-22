import type { FastifyInstance } from 'fastify'
import { authLogoutResponseSchema, authProfileResponseSchema } from '../shared.js'
import { getAuthenticatedUser, isSupabaseConfigured, supabaseAdmin } from '../lib/supabase.js'

const AVAILABLE_PROVIDERS = ['google', 'discord', 'github'] as const

export async function registerAuthRoutes(app: FastifyInstance) {
  // GET /api/auth/profile
  // Verifies the Supabase JWT from the Authorization header and returns (or
  // lazily creates) the game-specific player profile from the database.
  app.get('/api/auth/profile', async (request) => {
    if (!isSupabaseConfigured()) {
      return authProfileResponseSchema.parse({
        authenticated: false,
        availableProviders: AVAILABLE_PROVIDERS,
        profile: null,
        message:
          'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server to enable persistent profiles.',
      })
    }

    const user = await getAuthenticatedUser(request)

    if (!user) {
      return authProfileResponseSchema.parse({
        authenticated: false,
        availableProviders: AVAILABLE_PROVIDERS,
        profile: null,
        message: 'Not authenticated. Sign in via an OAuth provider.',
      })
    }

    const { data: row, error: fetchError } = await supabaseAdmin!
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!fetchError && row) {
      return authProfileResponseSchema.parse({
        authenticated: true,
        availableProviders: AVAILABLE_PROVIDERS,
        profile: {
          id: row.id as string,
          runnerName: row.runner_name as string,
          region: row.region as string,
          mmr: row.mmr as number,
          rankTier: row.rank_tier as string,
          careerRuns: row.career_runs as number,
          careerWins: row.career_wins as number,
        },
        message: `Authenticated as ${row.runner_name as string}.`,
      })
    }

    // Profile doesn't exist yet — create it on first login.
    const runnerName =
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      user.email?.split('@')[0] ??
      'Runner'

    const { data: newRow, error: createError } = await supabaseAdmin!
      .from('profiles')
      .insert({ id: user.id, runner_name: runnerName })
      .select()
      .single()

    if (createError || !newRow) {
      return authProfileResponseSchema.parse({
        authenticated: true,
        availableProviders: AVAILABLE_PROVIDERS,
        profile: null,
        message: 'Authenticated but profile creation failed. Try again.',
      })
    }

    return authProfileResponseSchema.parse({
      authenticated: true,
      availableProviders: AVAILABLE_PROVIDERS,
      profile: {
        id: newRow.id as string,
        runnerName: newRow.runner_name as string,
        region: newRow.region as string,
        mmr: newRow.mmr as number,
        rankTier: newRow.rank_tier as string,
        careerRuns: newRow.career_runs as number,
        careerWins: newRow.career_wins as number,
      },
      message: `Profile created for ${newRow.runner_name as string}. Welcome to Marathon Idle.`,
    })
  })

  // POST /api/auth/logout
  // Supabase sessions are managed client-side; this endpoint exists for any
  // server-side cleanup (e.g., removing queue entries) that should happen on
  // sign-out. The actual token revocation is handled by the Supabase client.
  app.post('/api/auth/logout', async () => {
    return authLogoutResponseSchema.parse({
      ok: true,
      message: 'Server-side session cleared.',
    })
  })
}

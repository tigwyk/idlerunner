import type { FastifyInstance } from 'fastify'
import {
  authLogoutResponseSchema,
  authProfileResponseSchema,
  usernameSetupRequestSchema,
  usernameSetupResponseSchema,
} from '../shared.js'
import { getAuthenticatedUser, isSupabaseConfigured, supabaseAdmin } from '../lib/supabase.js'

const AVAILABLE_PROVIDERS = ['google', 'discord'] as const

function rowToProfile(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    runnerName: row.runner_name as string,
    region: row.region as string,
    mmr: row.mmr as number,
    rankTier: row.rank_tier as string,
    careerRuns: row.career_runs as number,
    careerWins: row.career_wins as number,
  }
}

export async function registerAuthRoutes(app: FastifyInstance) {
  // GET /api/auth/profile
  // Verifies the Supabase JWT and returns the player profile.
  // If the user is authenticated but has no profile row yet, returns
  // needsSetup: true so the client can show the username picker.
  app.get('/api/auth/profile', async (request) => {
    if (!isSupabaseConfigured()) {
      return authProfileResponseSchema.parse({
        authenticated: false,
        needsSetup: false,
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
        needsSetup: false,
        availableProviders: AVAILABLE_PROVIDERS,
        profile: null,
        message: 'Not authenticated. Sign in via an OAuth provider.',
      })
    }

    const { data: row, error } = await supabaseAdmin!
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!error && row) {
      return authProfileResponseSchema.parse({
        authenticated: true,
        needsSetup: false,
        availableProviders: AVAILABLE_PROVIDERS,
        profile: rowToProfile(row as Record<string, unknown>),
        message: `Authenticated as ${row.runner_name as string}.`,
      })
    }

    // Authenticated but no profile row — prompt the client to pick a username.
    return authProfileResponseSchema.parse({
      authenticated: true,
      needsSetup: true,
      availableProviders: AVAILABLE_PROVIDERS,
      profile: null,
      message: 'Choose a runner name to complete your account setup.',
    })
  })

  // POST /api/auth/setup
  // Creates the player profile with a user-chosen runner name.
  // Called once, immediately after the first OAuth sign-in.
  app.post('/api/auth/setup', async (request, reply) => {
    if (!isSupabaseConfigured()) {
      return reply.code(503).send(
        usernameSetupResponseSchema.parse({
          ok: false,
          profile: null,
          message: 'Supabase is not configured on the server.',
        })
      )
    }

    const user = await getAuthenticatedUser(request)

    if (!user) {
      return reply.code(401).send(
        usernameSetupResponseSchema.parse({
          ok: false,
          profile: null,
          message: 'Not authenticated.',
        })
      )
    }

    const parsed = usernameSetupRequestSchema.safeParse(request.body)

    if (!parsed.success) {
      return reply.code(400).send(
        usernameSetupResponseSchema.parse({
          ok: false,
          profile: null,
          message: parsed.error.issues[0]?.message ?? 'Invalid username.',
        })
      )
    }

    const { username } = parsed.data

    // Reject if a profile already exists (setup can only run once).
    const { data: existing } = await supabaseAdmin!
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (existing) {
      return reply.code(409).send(
        usernameSetupResponseSchema.parse({
          ok: false,
          profile: null,
          message: 'Profile already exists.',
        })
      )
    }

    const { data: newRow, error: createError } = await supabaseAdmin!
      .from('profiles')
      .insert({ id: user.id, runner_name: username })
      .select()
      .single()

    if (createError || !newRow) {
      // Unique constraint violation means the name is taken.
      const taken =
        (createError?.code === '23505') ||
        createError?.message?.includes('unique')

      return reply.code(taken ? 409 : 500).send(
        usernameSetupResponseSchema.parse({
          ok: false,
          profile: null,
          message: taken
            ? `"${username}" is already taken. Please choose a different name.`
            : 'Profile creation failed. Try again.',
        })
      )
    }

    return usernameSetupResponseSchema.parse({
      ok: true,
      profile: rowToProfile(newRow as Record<string, unknown>),
      message: `Welcome to Marathon Idle, ${username}!`,
    })
  })

  // POST /api/auth/logout
  app.post('/api/auth/logout', async () => {
    return authLogoutResponseSchema.parse({
      ok: true,
      message: 'Server-side session cleared.',
    })
  })
}

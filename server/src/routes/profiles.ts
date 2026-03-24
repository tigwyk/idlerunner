import type { FastifyInstance } from 'fastify'
import { z } from 'zod/v4'
import { getAuthenticatedUser, isSupabaseConfigured, supabaseAdmin } from '../lib/supabase.js'

const updateProfileBodySchema = z.object({
  runnerName: z
    .string()
    .min(3, 'Runner name must be at least 3 characters.')
    .max(20, 'Runner name cannot exceed 20 characters.')
    .regex(/^[a-zA-Z0-9_]+$/, 'Runner name may only contain letters, numbers, and underscores.'),
})

const updateProfileResponseSchema = z.object({
  ok: z.boolean(),
  runnerName: z.string().optional(),
  message: z.string(),
})

export async function registerProfileRoutes(app: FastifyInstance) {
  app.patch('/api/profile', async (request, reply) => {
    if (!isSupabaseConfigured()) {
      return reply.code(503).send(
        updateProfileResponseSchema.parse({ ok: false, message: 'Supabase is not configured on the server.' })
      )
    }

    const user = await getAuthenticatedUser(request)
    if (!user) {
      return reply.code(401).send(
        updateProfileResponseSchema.parse({ ok: false, message: 'Not authenticated.' })
      )
    }

    const parsed = updateProfileBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send(
        updateProfileResponseSchema.parse({
          ok: false,
          message: parsed.error.issues[0]?.message ?? 'Invalid input.',
        })
      )
    }

    const { runnerName } = parsed.data

    const { error } = await supabaseAdmin!
      .from('profiles')
      .update({ runner_name: runnerName })
      .eq('id', user.id)

    if (error) {
      const taken = error.code === '23505' || error.message?.includes('unique')
      return reply.code(taken ? 409 : 500).send(
        updateProfileResponseSchema.parse({
          ok: false,
          message: taken
            ? `"${runnerName}" is already taken.`
            : 'Failed to update profile.',
        })
      )
    }

    return updateProfileResponseSchema.parse({
      ok: true,
      runnerName,
      message: `Runner name updated to "${runnerName}".`,
    })
  })
}

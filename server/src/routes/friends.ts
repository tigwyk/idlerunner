import type { FastifyInstance } from 'fastify'
import { z } from 'zod/v4'
import { getAuthenticatedUser, isSupabaseConfigured, supabaseAdmin } from '../lib/supabase.js'

const friendResponseSchema = z.object({
  ok: z.boolean(),
  message: z.string(),
})

const friendEntrySchema = z.object({
  id: z.string(),
  runnerName: z.string(),
  mmr: z.number(),
  status: z.enum(['pending', 'accepted']),
  direction: z.enum(['sent', 'received']),
})

const friendsListSchema = z.object({
  friends: z.array(friendEntrySchema),
})

export type FriendEntry = z.infer<typeof friendEntrySchema>
export type FriendsList = z.infer<typeof friendsListSchema>

export async function registerFriendRoutes(app: FastifyInstance) {
  // GET /api/friends — list accepted friends + pending requests
  app.get('/api/friends', async (request, reply) => {
    if (!isSupabaseConfigured()) {
      return reply.code(503).send(friendResponseSchema.parse({ ok: false, message: 'Supabase not configured.' }))
    }

    const user = await getAuthenticatedUser(request)
    if (!user) return reply.code(401).send(friendResponseSchema.parse({ ok: false, message: 'Not authenticated.' }))

    // Fetch all friendships for this user with the other party's profile joined
    const { data: rows, error } = await supabaseAdmin!
      .from('friendships')
      .select(`
        id,
        sender_id,
        receiver_id,
        status,
        sender:profiles!friendships_sender_id_fkey(runner_name, mmr),
        receiver:profiles!friendships_receiver_id_fkey(runner_name, mmr)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)

    if (error) {
      return reply.code(500).send(friendResponseSchema.parse({ ok: false, message: 'Failed to fetch friends.' }))
    }

    const friends: FriendEntry[] = (rows ?? []).map((row) => {
      const isSender = row.sender_id === user.id
      const other = isSender
        ? (row.receiver as unknown as { runner_name: string; mmr: number })
        : (row.sender as unknown as { runner_name: string; mmr: number })
      const otherId = isSender ? row.receiver_id : row.sender_id
      return {
        id: otherId as string,
        runnerName: other.runner_name,
        mmr: other.mmr,
        status: row.status as 'pending' | 'accepted',
        direction: isSender ? 'sent' : 'received',
      }
    })

    return friendsListSchema.parse({ friends })
  })

  // POST /api/friends/request — send a friend request by runner name
  app.post('/api/friends/request', async (request, reply) => {
    if (!isSupabaseConfigured()) {
      return reply.code(503).send(friendResponseSchema.parse({ ok: false, message: 'Supabase not configured.' }))
    }

    const user = await getAuthenticatedUser(request)
    if (!user) return reply.code(401).send(friendResponseSchema.parse({ ok: false, message: 'Not authenticated.' }))

    const body = request.body as { runnerName?: string }
    const targetName = body?.runnerName?.trim()
    if (!targetName) {
      return reply.code(400).send(friendResponseSchema.parse({ ok: false, message: 'runnerName is required.' }))
    }

    // Look up target profile
    const { data: target, error: lookupError } = await supabaseAdmin!
      .from('profiles')
      .select('id, runner_name')
      .eq('runner_name', targetName)
      .single()

    if (lookupError || !target) {
      return reply.code(404).send(friendResponseSchema.parse({ ok: false, message: `Runner "${targetName}" not found.` }))
    }

    if (target.id === user.id) {
      return reply.code(400).send(friendResponseSchema.parse({ ok: false, message: "You can't add yourself." }))
    }

    // Check for existing friendship in either direction
    const { data: existing } = await supabaseAdmin!
      .from('friendships')
      .select('id, status, sender_id')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${target.id}),and(sender_id.eq.${target.id},receiver_id.eq.${user.id})`)
      .maybeSingle()

    if (existing) {
      if (existing.status === 'accepted') {
        return reply.code(409).send(friendResponseSchema.parse({ ok: false, message: 'Already friends.' }))
      }
      // If they sent us a request, accept it
      if (existing.sender_id === target.id) {
        const { error } = await supabaseAdmin!
          .from('friendships')
          .update({ status: 'accepted' })
          .eq('id', existing.id)
        if (error) return reply.code(500).send(friendResponseSchema.parse({ ok: false, message: 'Failed to accept.' }))
        return friendResponseSchema.parse({ ok: true, message: `Now friends with ${targetName}!` })
      }
      return reply.code(409).send(friendResponseSchema.parse({ ok: false, message: 'Friend request already sent.' }))
    }

    const { error } = await supabaseAdmin!
      .from('friendships')
      .insert({ sender_id: user.id, receiver_id: target.id })

    if (error) {
      return reply.code(500).send(friendResponseSchema.parse({ ok: false, message: 'Failed to send request.' }))
    }

    return friendResponseSchema.parse({ ok: true, message: `Friend request sent to ${targetName}.` })
  })

  // POST /api/friends/accept/:friendshipId — accept a pending request
  app.post('/api/friends/accept/:id', async (request, reply) => {
    if (!isSupabaseConfigured()) {
      return reply.code(503).send(friendResponseSchema.parse({ ok: false, message: 'Supabase not configured.' }))
    }

    const user = await getAuthenticatedUser(request)
    if (!user) return reply.code(401).send(friendResponseSchema.parse({ ok: false, message: 'Not authenticated.' }))

    const { id } = request.params as { id: string }

    const { error } = await supabaseAdmin!
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', id)
      .eq('receiver_id', user.id) // Only the receiver can accept

    if (error) {
      return reply.code(500).send(friendResponseSchema.parse({ ok: false, message: 'Failed to accept request.' }))
    }

    return friendResponseSchema.parse({ ok: true, message: 'Friend request accepted.' })
  })

  // DELETE /api/friends/:friendId — remove a friend or cancel a request
  app.delete('/api/friends/:friendId', async (request, reply) => {
    if (!isSupabaseConfigured()) {
      return reply.code(503).send(friendResponseSchema.parse({ ok: false, message: 'Supabase not configured.' }))
    }

    const user = await getAuthenticatedUser(request)
    if (!user) return reply.code(401).send(friendResponseSchema.parse({ ok: false, message: 'Not authenticated.' }))

    const { friendId } = request.params as { friendId: string }

    const { error } = await supabaseAdmin!
      .from('friendships')
      .delete()
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)

    if (error) {
      return reply.code(500).send(friendResponseSchema.parse({ ok: false, message: 'Failed to remove friend.' }))
    }

    return friendResponseSchema.parse({ ok: true, message: 'Friendship removed.' })
  })
}

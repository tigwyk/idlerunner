import { createClient } from '@supabase/supabase-js'
import type { FastifyRequest } from 'fastify'
import { getHeaderValue } from '../utils/headers.js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    '[Supabase] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not set. ' +
      'Player profiles will not persist. Copy .env.example to .env.local.'
  )
}

export const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null

export function isSupabaseConfigured(): boolean {
  return supabaseAdmin !== null
}

export async function getAuthenticatedUser(request: FastifyRequest) {
  if (!supabaseAdmin) return null

  const authHeader = getHeaderValue(request.headers['authorization'])
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.slice(7)
  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data.user) return null

  return data.user
}

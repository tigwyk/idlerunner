import { create } from 'zustand'
import type { OAuthProvider, PlayerProfile } from '@shared'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { fetchAuthProfile, logoutProfile } from '@/lib/multiplayerApi'

interface AuthStore {
  status: 'idle' | 'loading' | 'anonymous' | 'authenticated' | 'error'
  profile: PlayerProfile | null
  availableProviders: OAuthProvider[]
  message: string | null
  initializeAuth: () => Promise<void>
  startLogin: (provider: OAuthProvider) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  status: 'idle',
  profile: null,
  availableProviders: ['google', 'discord'],
  message: null,

  initializeAuth: async () => {
    set({ status: 'loading', message: null })

    if (!isSupabaseConfigured()) {
      set({
        status: 'anonymous',
        availableProviders: ['google', 'discord'],
        message:
          'Copy .env.example to .env.local and add your Supabase project keys to enable OAuth.',
      })
      return
    }

    // Listen for future auth state changes (e.g., after OAuth redirect returns).
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        try {
          const response = await fetchAuthProfile()
          set({
            status: response.authenticated ? 'authenticated' : 'anonymous',
            profile: response.profile,
            availableProviders: response.availableProviders,
            message: response.message,
          })
        } catch {
          set({ status: 'error', message: 'Signed in but failed to fetch profile.' })
        }
      } else if (event === 'SIGNED_OUT') {
        set({ status: 'anonymous', profile: null, message: 'Signed out.' })
      }
    })

    // Check for an existing valid session (covers page reloads and returning
    // users after an OAuth redirect).
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        const response = await fetchAuthProfile()
        set({
          status: response.authenticated ? 'authenticated' : 'anonymous',
          profile: response.profile,
          availableProviders: response.availableProviders,
          message: response.message,
        })
      } else {
        set({
          status: 'anonymous',
          availableProviders: ['google', 'discord'],
          message: 'Sign in with an OAuth provider to access multiplayer features.',
        })
      }
    } catch {
      set({
        status: 'error',
        message: 'Unable to reach the multiplayer backend.',
      })
    }
  },

  startLogin: async (provider) => {
    set({ status: 'loading', message: null })

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          // Redirect back to the app root after OAuth completes.
          redirectTo: window.location.origin,
        },
      })

      if (error) {
        set({ status: 'error', message: `OAuth redirect failed: ${error.message}` })
      }
      // On success the browser navigates to the provider.  The onAuthStateChange
      // listener handles state updates when the user returns.
    } catch {
      set({ status: 'error', message: 'Login redirect could not be started.' })
    }
  },

  logout: async () => {
    set({ status: 'loading', message: null })

    try {
      // Notify the server so it can clean up any queue entries.
      await logoutProfile()

      const { error } = await supabase.auth.signOut()
      if (error) {
        set({ status: 'error', message: `Sign out failed: ${error.message}` })
      }
      // onAuthStateChange fires SIGNED_OUT and updates state.
    } catch {
      set({ status: 'error', message: 'Logout could not be completed.' })
    }
  },
}))

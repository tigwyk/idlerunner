import { create } from 'zustand'
import type { OAuthProvider, PlayerProfile } from '@shared'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { callSetupUsername, fetchAuthProfile, logoutProfile } from '@/lib/multiplayerApi'

interface AuthStore {
  status: 'idle' | 'loading' | 'anonymous' | 'setup-required' | 'authenticated' | 'error'
  profile: PlayerProfile | null
  availableProviders: OAuthProvider[]
  message: string | null
  setupError: string | null
  initializeAuth: () => Promise<void>
  startLogin: (provider: OAuthProvider) => Promise<void>
  completeSetup: (username: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  status: 'idle',
  profile: null,
  availableProviders: ['google', 'discord'],
  message: null,
  setupError: null,

  initializeAuth: async () => {
    set({ status: 'loading', message: null, setupError: null })

    if (!isSupabaseConfigured()) {
      set({
        status: 'anonymous',
        availableProviders: ['google', 'discord'],
        message:
          'Copy .env.example to .env.local and add your Supabase project keys to enable OAuth.',
      })
      return
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        try {
          const response = await fetchAuthProfile()
          if (response.needsSetup) {
            set({
              status: 'setup-required',
              availableProviders: response.availableProviders,
              message: response.message,
              setupError: null,
            })
          } else {
            set({
              status: response.authenticated ? 'authenticated' : 'anonymous',
              profile: response.profile,
              availableProviders: response.availableProviders,
              message: response.message,
            })
          }
        } catch {
          set({ status: 'error', message: 'Signed in but failed to fetch profile.' })
        }
      } else if (event === 'SIGNED_OUT') {
        set({ status: 'anonymous', profile: null, message: 'Signed out.', setupError: null })
      }
    })

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        const response = await fetchAuthProfile()
        if (response.needsSetup) {
          set({
            status: 'setup-required',
            availableProviders: response.availableProviders,
            message: response.message,
            setupError: null,
          })
        } else {
          set({
            status: response.authenticated ? 'authenticated' : 'anonymous',
            profile: response.profile,
            availableProviders: response.availableProviders,
            message: response.message,
          })
        }
      } else {
        set({
          status: 'anonymous',
          availableProviders: ['google', 'discord'],
          message: 'Sign in with an OAuth provider to access multiplayer features.',
        })
      }
    } catch {
      set({ status: 'error', message: 'Unable to reach the multiplayer backend.' })
    }
  },

  startLogin: async (provider) => {
    set({ status: 'loading', message: null })

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin },
      })

      if (error) {
        set({ status: 'error', message: `OAuth redirect failed: ${error.message}` })
      }
    } catch {
      set({ status: 'error', message: 'Login redirect could not be started.' })
    }
  },

  completeSetup: async (username) => {
    set({ setupError: null })

    try {
      const response = await callSetupUsername(username)

      if (!response.ok || !response.profile) {
        set({ setupError: response.message })
        return
      }

      set({
        status: 'authenticated',
        profile: response.profile,
        message: response.message,
        setupError: null,
      })
    } catch {
      set({ setupError: 'Setup request failed. Please try again.' })
    }
  },

  logout: async () => {
    set({ status: 'loading', message: null })

    try {
      await logoutProfile()
      const { error } = await supabase.auth.signOut()
      if (error) {
        set({ status: 'error', message: `Sign out failed: ${error.message}` })
      }
    } catch {
      set({ status: 'error', message: 'Logout could not be completed.' })
    }
  },
}))

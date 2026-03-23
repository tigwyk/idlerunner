import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
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

// Holds the active Supabase auth subscription so re-initialization can clean it up.
let authSubscription: { unsubscribe: () => void } | null = null

async function applySession(
  session: Session | null,
  set: (partial: Partial<AuthStore>) => void,
  isInitialLoad = false
) {
  console.debug('[Auth] applySession | has session:', !!session, '| isInitialLoad:', isInitialLoad)
  if (session) {
    try {
      const response = await fetchAuthProfile()
      console.debug('[Auth] fetchAuthProfile response:', response)
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
  } else {
    set({
      status: 'anonymous',
      profile: null,
      availableProviders: ['google', 'discord'],
      message: isInitialLoad
        ? 'Sign in with an OAuth provider to access multiplayer features.'
        : 'Signed out.',
      setupError: null,
    })
  }
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

    // Remove any stale listener before registering a new one.
    authSubscription?.unsubscribe()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.debug('[Auth] onAuthStateChange event:', event, '| has session:', !!session)
      if (event === 'INITIAL_SESSION') {
        // Fired on every page load with the session from storage (or null).
        await applySession(session, set, true)
      } else if (event === 'SIGNED_IN') {
        // Fired after OAuth redirect. Clean the URL so the auth code isn't
        // re-processed (and potentially invalidated) on the next page refresh.
        if (window.location.hash || window.location.search.includes('code=')) {
          window.history.replaceState({}, '', window.location.pathname)
        }
        await applySession(session, set)
      } else if (event === 'SIGNED_OUT') {
        await applySession(null, set)
      }
      // TOKEN_REFRESHED: access token rotated silently — profile unchanged, no action needed.
    })

    authSubscription = subscription
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

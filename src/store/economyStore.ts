/**
 * economyStore — server-authoritative economy state.
 *
 * Resources (credits, metals, electronics, data) and stat upgrade levels are
 * stored in Supabase and fetched here after authentication. They are NOT
 * persisted in localStorage so they cannot be manipulated before a multiplayer
 * run. For unauthenticated players the store returns local defaults, and any
 * resource changes (e.g. from runs) are tracked locally until sign-in.
 */
import { create } from 'zustand'
import type { EconomyStateResponse, ResourcesState } from '@shared'
import type { StatType } from '@/types'
import { fetchEconomy, syncRunEarnings, purchaseUpgrade } from '@/lib/multiplayerApi'
import { notify } from '@/store/notificationStore'

export interface EconomyStore {
  resources: ResourcesState
  statUpgrades: Partial<Record<string, number>>
  isLoading: boolean
  isSynced: boolean        // true once we've successfully loaded from server
  error: string | null

  // Hydrate from server (called after auth)
  loadEconomy: () => Promise<void>
  // Report run earnings to server; updates local cache on success
  reportRunEarnings: (earned: ResourcesState, sector: string, roomsCleared: number) => Promise<void>
  // Purchase a stat upgrade via backend; updates local cache on success
  buyStatUpgrade: (stat: string) => Promise<{ ok: boolean; message: string }>
  // Add resources locally for unauthenticated play
  addLocalResources: (delta: Partial<ResourcesState>) => void
  // Deduct credits locally (for vendor item purchases, unauthenticated)
  deductLocalCredits: (amount: number) => void
}

const LOCAL_DEFAULTS: ResourcesState = {
  credits: 100,
  metals: 0,
  electronics: 0,
  data: 0,
}

export const useEconomyStore = create<EconomyStore>((set, get) => ({
  resources: { ...LOCAL_DEFAULTS },
  statUpgrades: {},
  isLoading: false,
  isSynced: false,
  error: null,

  loadEconomy: async () => {
    set({ isLoading: true, error: null })
    try {
      const economy = await fetchEconomy()
      set({
        resources: economy.resources as ResourcesState,
        statUpgrades: economy.statUpgrades as Partial<Record<StatType, number>>,
        isLoading: false,
        isSynced: true,
      })
    } catch (e) {
      set({ isLoading: false, error: 'Failed to load economy from server.' })
    }
  },

  reportRunEarnings: async (earned, sector, roomsCleared) => {
    try {
      const result = await syncRunEarnings(earned as ResourcesState, sector as import('@/types').SectorType, roomsCleared)
      set({
        resources: result.resources as ResourcesState,
        isSynced: true,
      })
    } catch {
      // Fall back to adding locally so the player doesn't lose their run rewards
      get().addLocalResources(earned)
    }
  },

  buyStatUpgrade: async (stat) => {
    set({ isLoading: true })
    try {
      const result = await purchaseUpgrade(stat)
      if (result.ok) {
        set({
          resources: result.economy.resources as ResourcesState,
          statUpgrades: result.economy.statUpgrades as Partial<Record<string, number>>,
          isLoading: false,
        })
        notify.success('Upgrade Purchased', result.message)
        return { ok: true, message: result.message }
      } else {
        set({ isLoading: false })
        return { ok: false, message: result.message }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upgrade failed.'
      set({ isLoading: false, error: msg })
      return { ok: false, message: msg }
    }
  },

  addLocalResources: (delta) => {
    set((state) => ({
      resources: {
        credits:     state.resources.credits     + (delta.credits     ?? 0),
        metals:      state.resources.metals      + (delta.metals      ?? 0),
        electronics: state.resources.electronics + (delta.electronics ?? 0),
        data:        state.resources.data        + (delta.data        ?? 0),
      },
    }))
  },

  deductLocalCredits: (amount) => {
    set((state) => ({
      resources: {
        ...state.resources,
        credits: Math.max(0, state.resources.credits - amount),
      },
    }))
  },
}))

/** Apply a server EconomyStateResponse into the store. Called from authStore after sign-in. */
export function applyEconomyState(economy: EconomyStateResponse) {
  useEconomyStore.setState({
    resources: economy.resources as ResourcesState,
    statUpgrades: economy.statUpgrades as Partial<Record<string, number>>,
    isSynced: true,
    isLoading: false,
  })
}

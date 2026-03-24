import { create } from 'zustand'
import { getDailyChallenges, completeChallenge, type DailyChallenge, type CompleteRunResult } from '@/lib/multiplayerApi'

interface ChallengeState {
  dayNumber: number
  challenges: DailyChallenge[]
  loading: boolean
  error: string | null
}

interface ChallengeActions {
  loadDailyChallenges: () => Promise<void>
  submitChallengeCompletion: (challengeId: string, runResult: CompleteRunResult) => Promise<{
    ok: boolean
    message: string
    reward?: { credits: number; metals: number; electronics: number; data: number }
  }>
  markLocalCompleted: (challengeId: string) => void
}

export type ChallengeStore = ChallengeState & ChallengeActions

export const useChallengeStore = create<ChallengeStore>()((set, get) => ({
  dayNumber: 0,
  challenges: [],
  loading: false,
  error: null,

  loadDailyChallenges: async () => {
    set({ loading: true, error: null })
    try {
      const result = await getDailyChallenges()
      set({ dayNumber: result.dayNumber, challenges: result.challenges, loading: false })
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : 'Failed to load challenges' })
    }
  },

  submitChallengeCompletion: async (challengeId, runResult) => {
    try {
      const result = await completeChallenge(challengeId, runResult)
      if (result.ok) {
        get().markLocalCompleted(challengeId)
      }
      return result
    } catch {
      return { ok: false, message: 'Failed to submit challenge completion.' }
    }
  },

  markLocalCompleted: (challengeId) => {
    set((state) => ({
      challenges: state.challenges.map((c) =>
        c.id === challengeId ? { ...c, completed: true } : c
      ),
    }))
  },
}))

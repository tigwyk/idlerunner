import type { GameState } from '@/types'

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  /** Check whether this achievement is earned given current game state + extra counters */
  check: (state: GameState & AchievementCounters) => boolean
}

/** Extra counters tracked alongside GameState for achievement purposes */
export interface AchievementCounters {
  bossesKilled: number
  totalEnemiesKilled: number
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_run',
    title: 'First Steps',
    description: 'Complete your first extraction.',
    icon: '🏃',
    check: (s) => s.runsCompleted >= 1,
  },
  {
    id: 'ten_runs',
    title: 'Seasoned Runner',
    description: 'Complete 10 extractions.',
    icon: '📦',
    check: (s) => s.runsCompleted >= 10,
  },
  {
    id: 'fifty_runs',
    title: 'Marathon Runner',
    description: 'Complete 50 extractions.',
    icon: '🎯',
    check: (s) => s.runsCompleted >= 50,
  },
  {
    id: 'level_10',
    title: 'Getting Started',
    description: 'Reach runner level 10.',
    icon: '⬆',
    check: (s) => s.runner.level >= 10,
  },
  {
    id: 'level_25',
    title: 'Veteran',
    description: 'Reach runner level 25.',
    icon: '💪',
    check: (s) => s.runner.level >= 25,
  },
  {
    id: 'level_50',
    title: 'Elite Runner',
    description: 'Reach runner level 50.',
    icon: '👑',
    check: (s) => s.runner.level >= 50,
  },
  {
    id: 'first_boss',
    title: 'Boss Slayer',
    description: 'Defeat your first sector boss.',
    icon: '💀',
    check: (s) => s.bossesKilled >= 1,
  },
  {
    id: 'ten_bosses',
    title: 'Boss Hunter',
    description: 'Defeat 10 sector bosses.',
    icon: '🗡',
    check: (s) => s.bossesKilled >= 10,
  },
  {
    id: 'hundred_enemies',
    title: 'Combat Tested',
    description: 'Defeat 100 enemies.',
    icon: '⚔',
    check: (s) => s.totalEnemiesKilled >= 100,
  },
  {
    id: 'first_prestige',
    title: 'Transcendence',
    description: 'Achieve your first prestige.',
    icon: '⭐',
    check: (s) => s.prestigeLevel >= 1,
  },
  {
    id: 'resilient',
    title: 'Resilient',
    description: 'Survive 25 failed extractions.',
    icon: '🛡',
    check: (s) => s.runsFailed >= 25,
  },
  {
    id: 'hoarder',
    title: 'Hoarder',
    description: 'Have 20 items in your inventory at once.',
    icon: '🎒',
    check: (s) => s.inventory.length >= 20,
  },
]

export const ACHIEVEMENT_MAP = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]))

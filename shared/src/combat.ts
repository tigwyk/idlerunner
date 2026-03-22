// Shared PvP resolution logic — runs on both client (display) and server (authoritative)

export type SectorType = 'residential' | 'industrial' | 'research'

/** Returns true if the "attacker" (first arg) wins this PvP roll. */
export function resolvePvp(attackerMmr: number, defenderMmr: number): boolean {
  const winChance = attackerMmr >= defenderMmr ? 0.6 : 0.4
  return Math.random() < winChance
}

/** MMR delta for winner and loser after a PvP encounter. */
export function calculatePvpMmrChange(
  winnerMmr: number,
  loserMmr: number
): { winner: number; loser: number } {
  const base = 25
  const underdogBonus = winnerMmr < loserMmr ? 10 : 0
  return { winner: base + underdogBonus, loser: -base }
}

/** Credits at stake for a PvP encounter based on sector and run depth. */
export function calculateLootAtStake(sector: SectorType, currentRoom: number): number {
  const base: Record<SectorType, number> = { residential: 50, industrial: 100, research: 200 }
  return base[sector] + currentRoom * 10
}

/** Encounter chance per position-sync event when two players share a room. */
export const PVP_ENCOUNTER_CHANCE = 0.2

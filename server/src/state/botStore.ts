const BOT_NAMES = [
  'Vex_7', 'Null_Runner', 'Ghost_Kael', 'Static_9', 'Cipher_X',
  'Raze_Null', 'Wraith_3', 'Echo_Burn', 'Shard_99', 'Flicker_Z',
  'Lumen_0', 'Fray_8', 'Specter_12', 'Pulse_Void', 'Hex_Runner',
  'Ash_Drift', 'Neon_Fang', 'Crux_7', 'Delta_Rho', 'Void_Sev',
  'Thorn_IX', 'Arc_Bleed', 'Zinc_Ghost', 'Sable_Run', 'Razor_0',
  'Dusk_Null', 'Kira_Hex', 'Ion_Fray', 'Phantom_6', 'Grit_Zero',
  'Haze_5', 'Flux_Rend', 'Crypt_8', 'Blaze_Null', 'Wire_Ghost',
  'Static_Kael', 'Rogue_Ix', 'Shade_77', 'Venom_3', 'Rift_Echo',
  'Pulse_9', 'Torn_Signal', 'Nyx_Runner', 'Ember_Null', 'Glitch_X',
  'Scorch_7', 'Fuse_Zero', 'Trace_Void', 'Warp_Null', 'Hex_Bleed',
]

const usedNames = new Set<string>()

function pickName(): string {
  const available = BOT_NAMES.filter((n) => !usedNames.has(n))
  const pool = available.length > 0 ? available : BOT_NAMES
  const name = pool[Math.floor(Math.random() * pool.length)]
  usedNames.add(name)
  // Release name back after 10 minutes so the pool doesn't exhaust
  setTimeout(() => usedNames.delete(name), 10 * 60 * 1000)
  return name
}

export interface BotProfile {
  userId: string
  runnerName: string
  mmr: number
}

export function createBotProfile(playerMmr: number): BotProfile {
  const variance = Math.floor((Math.random() - 0.5) * 100) // ±50
  const mmr = Math.max(100, playerMmr + variance)
  const id = Math.random().toString(36).slice(2, 10)
  return {
    userId: `bot_${id}`,
    runnerName: pickName(),
    mmr,
  }
}

export function isBot(userId: string): boolean {
  return userId.startsWith('bot_')
}

# Tau Ceti Idle

`Tau Ceti Idle` is a browser-based idle extraction game with optional co-op multiplayer, built with React, TypeScript, Zustand, Tailwind CSS, Vite, and a Fastify/Bun backend.

**[Play live →](https://tau-ceti-idle.lee-0db.workers.dev/)**

The game is playable right now — deploy a runner into hostile sectors, collect loot and equipment, and grow through levels and skills. Sign in with Google or Discord to persist your economy server-side, unlock co-op mode, and compete on the global leaderboard.

## Current game state

### Singleplayer (no sign-in required)

- A 1-second game loop that advances active runs automatically.
- Three deployable sectors with different room counts, danger levels, and level-gated unlock requirements.
- Procedural run generation: 5–7 rooms per run drawn from combat, resource, loot, hazard, and extraction room types.
- A single runner with six base stats, level progression up to 50, health, nine equipment slots, and three trainable skills.
- Five faction starter kits (Collective, Void Runners, Iron Pact, Silent Hand, Caretakers) as a free gear fallback.
- Selectable run modifiers that adjust challenge difficulty.
- Inventory and equipment management with rarity-based loot drops and item comparison.
- Status effects in combat: burning, EMP, corrosive, slow, stun — per sector and enemy type.
- Run logging, success/failure tracking, and persistent saves via local storage.
- Offline progress simulation for active runs when the player returns (capped at 24 hours).
- Prestige system: reset at level 50 with 10+ completed runs for permanent XP and resource bonuses.
- 14 achievements tracked across run milestones, boss kills, prestige, and more.

### Multiplayer (sign in with Google or Discord)

- OAuth login with username selection on first sign-in.
- **Server-authoritative economy**: resources and stat upgrades are stored in Supabase and validated server-side.
- **Stat upgrades** on the Vendor screen: permanently boost six runner stats using harvested resources (max 10 levels each).
- **Daily challenges**: 12 server-seeded challenges per day rewarding credits, metals, electronics, and data.
- **Co-op mode** on the Deployment screen: opt in to share a run with another player.
- Matchmaking pairs players in the same sector within ±300 MMR every 5 seconds.
- Zone overlap detection — when both players reach the same room, a PvP encounter may trigger (20% chance).
- Server-authoritative PvP resolution: MMR-weighted 60/40 odds, ±25 MMR change, +10 underdog bonus.
- Encounter outcomes persisted to Supabase; MMR delta shown as an overlay during the run.
- Live global, regional, and friends leaderboards ranked by MMR.
- Friends system: add by runner name, accept/reject requests, view friend MMR.

## Core loop

1. Start from the Overview or Deployment screens.
2. Deploy the runner into a sector (choose a starter kit or your own gear; enable Co-op to queue for a shared run).
3. Let the run resolve automatically as rooms are cleared on the global tick.
4. Survive to extraction to bank resources, equipment, runner XP, and skill XP.
5. Re-equip from inventory, spend resources on stat upgrades at the Vendor, and push into harder sectors.

Failed runs end the deployment and forfeit collected loot, but the runner escapes and can be redeployed.

## Playable systems

### Runner progression

- Runner level progression with exponential XP scaling (base 100 × 1.15^level) and a level cap of 50.
- Six base stats: `Agility`, `Strength`, `Endurance`, `Intelligence`, `Perception`, `Cyber Affinity`.
- Three skills: `Scavenging`, `Combat`, and `Hacking` — each with XP, level, and a mastery track (0–10).
- Full combat stat sheet: Damage, Accuracy, Evasion, Armor, Shield, Crit Chance, Crit Damage.
- Prestige at level 50: resets runner progress and grants +15% XP / +10% resource bonuses per prestige level.

### Resources

Four resource types power the economy:

| Resource | Primary use |
|---|---|
| `Credits` | Vendor shop purchases |
| `Metals` | Strength and Agility stat upgrades |
| `Electronics` | Endurance and Cyber Affinity upgrades |
| `Data` | Intelligence and Perception upgrades |

New saves start with 100 credits and no other materials.

### Equipment and inventory

Looted and purchased equipment fills nine slots across four categories:

| Category | Slots |
|---|---|
| Weapons | `Weapon 1`, `Weapon 2`, `Equipment` |
| Defense | `Shield` |
| Core | `Core Slot 1`, `Core Slot 2` |
| Implants | `Implant Head`, `Implant Chest`, `Implant Legs` |

Equipment drops support six rarity tiers (Common → Legendary) and per-slot stat rolls. The inventory screen shows stat deltas when comparing items against equipped gear.

### Vendor

The Vendor screen has two tabs:

- **Shop** — a rotating selection of up to 6 items per run, purchasable with credits.
- **Upgrades** — permanently boost any of the six runner stats using sector resources (server-persisted for signed-in players, scaling cost: level² × base).

### Sectors

| Sector | Threat | Resource focus |
|---|---|---|
| `Residential Deck` | Low | Credits, metals |
| `Industrial Sector` | Medium | Metals, electronics |
| `Research Wing` | High | Electronics, data |

Each sector has its own enemy roster, hazard type (burning / EMP / corrosive), and earn caps validated server-side.

### Offline progress

If the player leaves during an active run, the game simulates capped offline progress on the next load (~1 room per 8 s, max 24 hours). Resources, skill XP, and possible equipment drops are calculated and applied on return.

## Screens in the current UI

| Screen | What it does |
|---|---|
| `Overview` | Run status, resources, runner stats, sector list |
| `Deployment` | Sector selection, starter kit or custom loadout, run modifiers, Co-op queue |
| `Runner` | Stats, combat sheet, equipment management, prestige, achievements |
| `Inventory` | Equip, compare, and drop found gear |
| `Skills` | Skill levels, XP progress, mastery bars, and bonus breakdowns |
| `Vendor` | Buy equipment (Shop) and purchase permanent stat upgrades (Upgrades) |
| `Log` | Timestamped, color-coded run event history |
| `Multiplayer` | Backend status, OAuth login/setup, leaderboard, queue, friends |
| `Settings` | Display toggles (damage numbers, loot notifications, compact mode), local reset |

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Zustand, Tailwind CSS, Vite |
| Backend | Fastify 5, Bun runtime |
| Auth / DB | Supabase (Google + Discord OAuth, PostgreSQL) |
| Shared contracts | Zod v4 |
| Hosting (client) | Cloudflare Workers (static assets) |
| Hosting (server) | Railway (Railpack + Bun) |
| CI | GitHub Actions (build + type-check on every push) |

## Local development

Copy the example env file and fill in your Supabase project values:

```bash
cp .env.example .env.local
```

Install dependencies:

```bash
npm install
```

Start the client dev server:

```bash
npm run dev
```

Start the multiplayer backend (requires Bun):

```bash
npm run dev:server
```

Create a production build:

```bash
npm run build
```

## Save data

Singleplayer state is persisted in browser local storage via Zustand persistence.

Current storage keys:

- `marathon-idle-save`
- `marathon-idle-settings`

If you need a clean reset during development, clear those keys in the browser.

## Project structure

```text
src/           React client (game UI, stores, engine)
server/        Fastify multiplayer backend
shared/        Shared Zod schemas and pure formulas (used by both)
supabase/      DB migrations
```


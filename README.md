# Tau Ceti Idle

`Tau Ceti Idle` is a browser-based idle extraction game with optional co-op multiplayer, built with React, TypeScript, Zustand, Tailwind CSS, Vite, and a Fastify/Bun backend.

**[Play live →](https://tau-ceti-idle.lee-0db.workers.dev/)**

The game is playable right now — deploy a runner into hostile sectors, collect loot and equipment, and grow through levels and skills. Sign in with Google or Discord to unlock co-op mode and compete on the global leaderboard.

## Current game state

### Singleplayer (no sign-in required)

- A 1-second game loop that advances active runs automatically.
- Three deployable sectors with different room counts, danger levels, and unlock requirements.
- Procedural run generation with combat, resource, loot, and extraction rooms.
- A single runner with stats, level progression, health, equipment slots, and three trainable skills.
- Inventory and equipment management with rarity-based loot drops.
- Run logging, success/failure tracking, and persistent saves via local storage.
- Offline progress simulation for active runs when the player returns later.

### Multiplayer (sign in with Google or Discord)

- OAuth login with username selection on first sign-in.
- **Co-op mode** on the Deployment screen: opt in to share a run with another player.
- Matchmaking worker pairs players in the same sector within ±300 MMR every 5 seconds.
- Zone overlap detection — when both players reach the same room, a PvP encounter may trigger (20% chance).
- Server-authoritative PvP resolution: MMR-weighted 60/40 odds, ±25 MMR change, +10 underdog bonus.
- Encounter outcomes persisted to Supabase; MMR delta shown as an overlay during the run.
- Live global and regional leaderboards ranked by MMR.

## Core loop

1. Start from the overview or deployment screens.
2. Deploy the runner into a sector (enable Co-op mode to queue for a shared run).
3. Let the run resolve automatically as rooms are cleared on the global tick.
4. Survive to extraction to bank resources, equipment, runner XP, and skill XP.
5. Re-equip from inventory and push into harder sectors.

Failed runs end the deployment and cost the run's collected loot, but the runner escapes and can be sent out again.

## Playable systems

### Runner progression

- Runner level progression with scaling XP requirements and a level cap of 50.
- Three skills: `Scavenging`, `Combat`, and `Hacking`.
- Skill XP and mastery-style progression for repeated play.
- Health, base stats, and equipment that influence run performance.

### Resources

The current economy uses four resource types:

- `Credits`
- `Metals`
- `Electronics`
- `Data Cores`

The save starts with `100` credits and no gathered materials.

### Equipment and inventory

Looted equipment can be stored and equipped into four slots:

- `Primary`
- `Secondary`
- `Armor`
- `Utility`

Equipment drops currently support rarity tiers and stat rolls, giving the runner stronger combat or utility performance over time.

### Sectors

The current prototype includes:

- `Residential Deck` - low threat, early-game supplies.
- `Industrial Sector` - mid-tier danger and better components.
- `Research Wing` - high risk with better technology-focused rewards.

Sector access is gated by runner level, giving the game a simple progression path.

### Offline progress

If the player leaves during an active run, the game can simulate capped offline progress on the next load. This allows ongoing deployments to continue resolving while preserving the idle-game feel.

## Screens in the current UI

- `Overview` - high-level run status and account progress.
- `Deployment` - choose a sector, launch runs, and toggle Co-op mode.
- `Runner` - inspect level, stats, equipment, and skills.
- `Inventory` - equip or remove found gear.
- `Skills` - review skill levels and progression.
- `Log` - inspect recent events from runs.
- `Multiplayer` - leaderboard, queue status, and account info.

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


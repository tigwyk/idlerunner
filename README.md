# Marathon Idle

`Marathon Idle` is a browser-based idle extraction prototype built with React, TypeScript, Zustand, Tailwind CSS, and Vite.

The current build is already playable as a lightweight management loop: you deploy a runner into hostile sectors, let runs resolve on a real-time tick, collect resources and equipment, and grow the runner through levels and skill XP.

## Current game state

The game is in an early but functional prototype state.

Implemented right now:

- A 1-second game loop that advances active runs automatically.
- Three deployable sectors with different room counts, danger levels, and unlock requirements.
- Procedural run generation with combat, resource, loot, and extraction rooms.
- A single runner with stats, level progression, health, equipment slots, and three trainable skills.
- Inventory and equipment management with rarity-based loot drops.
- Run logging, success/failure tracking, and persistent saves via local storage.
- Offline progress simulation for active runs when the player returns later.

Still missing or only partially implemented:

- Permanent meta-progression beyond levels, skills, and equipment.
- A complete use of all equipment modifiers in combat calculations.
- Fully implemented settings-driven UI behavior such as theme switching and compact mode.
- Unique mechanics for hazard rooms and deeper sector-specific events.

## Core loop

1. Start from the overview or deployment screens.
2. Deploy the runner into a sector.
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
- `Deployment` - choose a sector and launch runs.
- `Runner` - inspect level, stats, equipment, and skills.
- `Inventory` - equip or remove found gear.
- `Skills` - review skill levels and progression.
- `Log` - inspect recent events from runs.

## Tech stack

- React 18
- TypeScript
- Zustand with persisted state
- Tailwind CSS
- Vite
- Vitest

## Local development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

## Save data

The prototype persists game state in browser local storage using Zustand persistence.

Current storage keys:

- `marathon-idle-save`
- `marathon-idle-settings`

If you need a clean reset during development, clear those keys in the browser.

## Project structure

```text
src/
  components/   UI shell, navigation, and screens
  game/         game loop, offline sim, sector generation, runner and loot logic
  store/        Zustand game and settings stores
  types/        shared game types
```

## Notes for the next iteration

The prototype already has a solid idle-extraction foundation. The most valuable next steps are a real upgrade economy, better encounter variety, fuller use of equipment and settings systems, and more distinct sector mechanics.

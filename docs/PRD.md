# PRD: Marathon Idle

A deep idle game combining Marathon's sci-fi extraction shooter theme with Melvor Idle's comprehensive progression systems.

---

## 1. Executive Summary

**Marathon Idle** is a browser-based idle game where players deploy Runners into the derelict colony ship **Tau Ceti IV** to scavenge resources, extract loot, and upgrade their cybernetic capabilities. The game features deep multi-system progression, permanent upgrades, and meaningful offline advancement.

---

## 2. Core Concept

### 2.1 Fantasy
"You are a handler managing a stable of cybernetic Runners, extracting wealth and technology from a mysterious abandoned colony while competing syndicates and rogue AI attempt to claim it first."

### 2.2 Core Loop
```
Deploy Runner → Scavenge Sectors → Extract Loot → Upgrade Systems → Unlock New Sectors → Repeat
```

---

## 3. Core Gameplay Systems

### 3.1 Sector Exploration

#### 3.1.1 Sector Structure
- **Decks**: Multiple deck levels with increasing difficulty
- **Sectors**: Named areas within decks (5-10 rooms each)
- **Rooms**: Individual nodes with encounters
- **Extraction Points**: Special rooms for run completion

### 3.1.2 Scavenging Mechanics
- **Sector Navigation**: Sectors have rooms with specific node types
- **Node Types**: Resource, Combat, Loot, Hazard, Extraction Point
- **Pathfinding AI**: Runner automatically navigates based on equipped protocols
- **Encounter Resolution**: Combat and hazard checks happen automatically

### 3.1.3 Extraction System
- **Extraction Timer**: Limited window to reach extraction point
- **Risk Multiplier**: Longer runs = better loot but higher extraction failure chance
- **Insurance System**: Backup protocols to preserve gear on failed extraction

---

## 4. Skills & Progression Systems

### 4.1 Core Skills (Melvor-style depth)

| Skill | Description | Training Method | Max Level |
|-------|-------------|-----------------|-----------|
| **Scavenging** | Resource gathering efficiency | Successful extractions with resources | 120 |
| **Combat** | Damage, accuracy, evasion | Killing hostiles | 120 |
| **Hacking** | Bypassing security, accessing locked areas | Hacking nodes | 120 |
| **Engineering** | Gear repair, modification efficiency | Repairing/modding equipment | 120 |
| **Biotech** | Cybernetic enhancement, healing | Installing augments | 120 |
| **Intel Analysis** | Mission intel, loot quality | Analyzing data fragments | 120 |
| **Piloting** | Extraction speed, evasion | Successful extractions | 120 |
| **Syndicate Relations** | Faction reputation, special contracts | Completing contracts | 99 |
| **AI Synchronization** | Companion drone effectiveness | Using drone abilities | 120 |
| **Nanofabrication** | Crafting advanced components | Crafting items | 120 |

### 4.2 Skill Mastery System
- Each skill has mastery XP per action
- Mastery levels unlock special abilities and synergies
- Global mastery pool provides bonuses across all skills

### 4.3 Skill Synergies
```
Scavenging + Intel Analysis → Better loot identification
Combat + Engineering → Weapon modification
Hacking + AI Sync → Advanced drone hacking
```

---

## 5. Equipment & Gear System

### 5.1 Equipment Slots
- Primary Weapon
- Secondary Weapon
- Helmet
- Body Armor
- Leg Armor
- Augment Slots (3-6 depending on chassis)
- Drone Companion
- Utility Module
- Consumables (3 slots)

### 5.2 Gear Tiers
| Tier | Source | Power Range |
|------|--------|-------------|
| Salvaged | Basic sectors | 1-50 |
| Military | Security sectors | 51-150 |
| Prototype | Research sectors | 151-300 |
| Experimental | Restricted zones | 301-500 |
| Transcendent | Raid zones | 501-800 |
| Paracausal | Endgame | 801+ |

### 5.3 Gear Modification
- **Barrels, Sights, Stocks, Magazines** (weapon mods)
- **Armor Plating, Shield Emitters, Mobility Systems** (armor mods)
- **Software Updates, Firmware Patches** (equipment upgrades)
- Modification success rate based on Engineering skill

### 5.4 Durability & Maintenance
- Gear degrades with use
- Repairing requires materials and Engineering skill
- Critical failures can destroy items (can be prevented)

---

## 6. Runner Management

### 6.1 Runner Creation
- Select Chassis Type (Light/Medium/Heavy)
- Choose Starting Specialty
- Allocate initial stat points

### 6.2 Runner Stats
| Stat | Effect |
|------|--------|
| Agility | Movement speed, evasion |
| Strength | Melee damage, carry capacity |
| Endurance | Health, resistance |
| Intelligence | Hacking, intel analysis |
| Perception | Detection range, accuracy |
| Cyber-affinity | Augment compatibility |

### 6.3 Runner Specializations
- **Infiltrator**: Stealth, hacking, evasion
- **Bruiser**: Combat, durability, intimidation
- **Technician**: Engineering, drones, support
- **Scout**: Speed, perception, intel
- **Medic**: Biotech, healing, augmentation

### 6.4 Runner Relationships
- Runners develop quirks and preferences
- Trauma system affects performance
- Rest and recovery mechanics
- Runner permadeath optional (separate mode)

### 6.5 Runner Progression
- Level up through experience
- Unlock abilities at milestones
- Augment slots increase with level
- Specialization trees

---

## 7. Augmentation System

### 7.1 Augment Categories
- **Neural**: Intelligence, perception, hacking
- **Skeletal**: Strength, durability
- **Muscular**: Agility, speed
- **Optical**: Vision modes, targeting
- **Dermal**: Armor, environmental protection
- **Internal**: Health, stamina, resistance
- **Interface**: AI sync, drone control

### 7.2 Augment Rarity
- Common → Uncommon → Rare → Epic → Legendary → Exotic

### 7.3 Augment Conflicts
- Some augments are incompatible
- Stress system limits total augment load
- High-level augments require special chassis

### 7.4 Augment Crafting
- Collect schematics from sectors
- Combine materials to create augments
- Experimental augments with random stats

---

## 8. World Structure

### 8.1 The Colony Ship
- **Decks**: 5 major deck areas
- **Sectors**: 50+ unique sectors
- **Rooms**: Procedural generation within sectors

### 8.2 Deck Progression

| Deck | Theme | Enemy Types | Resource Focus |
|------|-------|-------------|----------------|
| **Residential** | Abandoned quarters | Scavengers, drones | Basic materials |
| **Industrial** | Factories, storage | Security bots | Manufacturing components |
| **Research** | Labs, servers | AI defenses | Tech, data |
| **Command** | Bridge, officers | Elite guards | High-value loot |
| **Engineering** | Reactors, engines | Environmental hazards | Rare materials |
| **The Deep** | Unknown | ??? | Paracausal items |

### 8.3 Zone Types
- **Safe Zones**: No combat, basic resources
- **Standard Zones**: Balanced risk/reward
- **Hazard Zones**: Environmental dangers
- **High-Sec Zones**: Tough enemies, great loot
- **Raid Zones**: Boss encounters, unique drops
- **Dark Zones**: Permadeath enabled, best rewards

### 8.4 Dynamic Events
- AI Uprisings (temporary zone difficulty increase)
- Supply Drops (high-value loot spawns)
- Breach Events (new areas temporarily accessible)
- Syndicate Wars (choose sides, reap rewards)

---

## 9. Combat System

### 9.1 Combat Resolution
- Automatic combat based on stats and equipment
- Damage formula: `(Weapon Damage × Multipliers) - (Armor × Mitigation)`
- Hit chance: `Base Accuracy + Perception - Enemy Evasion`
- Critical hits, status effects, special abilities

### 9.2 Enemy Types
| Category | Examples | Behavior |
|----------|----------|----------|
| Scavengers | Raiders, Thieves | Aggressive, low coordination |
| Security | Drones, Turrets | Defensive, patrol patterns |
| AI | Malware, Constructs | Unpredictable, hacking attacks |
| Biological | Mutants, Specimens | Swarm tactics, biological attacks |
| Bosses | Sector Guardians | Complex mechanics, phases |

### 9.3 Combat Abilities
- Unlock through skill progression
- Active (auto-triggered) and passive abilities
- Ability cooldowns and resource costs
- Synergies between abilities

### 9.4 Status Effects
- Burning, Corrosive, EMP, Slow, Stun
- Buffs: Shielded, Hasted, Amplified
- Management through equipment and skills

---

## 10. Crafting & Economy

### 10.1 Crafting Skills
- **Nanofabrication**: Create components and basic items
- **Engineering**: Modify and repair equipment
- **Biotech**: Craft medical items and augments

### 10.2 Material Types
- Metals (Common, Rare, Exotic)
- Electronics (Circuits, Processors, Quantum)
- Biological (Samples, Organs, Synthetics)
- Data (Fragments, Encrypted, Decoded)
- Energy (Cells, Cores, Paracausal)

### 10.3 Crafting Recipes
- Unlock through blueprints found in sectors
- Mastery system for each recipe
- Experimentation for discovering new recipes

### 10.4 Economy Systems
- **Credits**: Universal currency
- **Reputation Tokens**: Faction-specific
- **Barter**: Direct item exchange
- **Black Market**: Risky high-value transactions

### 10.5 Market Features
- Buy/sell with vendors
- Dynamic pricing based on supply/demand
- Auction house for rare items
- Market speculation minigame

---

## 11. Syndicates (Factions)

### 11.1 Major Syndicates

| Syndicate | Philosophy | Bonuses | Specialization |
|-----------|------------|---------|----------------|
| **The Collective** | Knowledge preservation | +Intel, +Hacking | Technicians |
| **Void Runners** | Profit above all | +Credits, +Loot | Scouts |
| **Iron Pact** | Strength through force | +Combat, +Armor | Bruisers |
| **Silent Hand** | Secrecy, assassination | +Stealth, +Crit | Infiltrators |
| **Caretakers** | Protection, healing | +Healing, +Support | Medics |

### 11.2 Reputation System
- Complete contracts to gain reputation
- Higher reputation = better rewards, exclusive items
- Reputation decay if inactive
- Can lose reputation with rival syndicates

### 11.3 Contracts
- Daily contracts for each syndicate
- Weekly challenges with major rewards
- Special storyline contracts
- Cross-syndicate conflicts

### 11.4 Syndicate Perks
- Unique equipment at reputation tiers
- Special abilities unlocked
- Access to syndicate-only zones
- Ally NPCs in certain areas

---

## 12. Drone Companion System

### 12.1 Drone Types
- **Combat Drone**: Damage support
- **Shield Drone**: Defensive bubble
- **Sensor Drone**: Intel and detection
- **Repair Drone**: Heal and maintain
- **Hack Drone**: Electronic warfare
- **Scavenger Drone**: Loot collection

### 12.2 Drone Customization
- Equip drone modules
- Upgrade drone AI level
- Name and cosmetic customization

### 12.3 Drone Skills
- Separate progression tree
- Drone-specific abilities
- Synergy with Runner skills

---

## 13. Progression Milestones

### 13.1 Early Game (0-20 hours)
- Basic sector exploration
- First runner development
- Core skill training
- Simple crafting
- Syndicate introduction

### 13.2 Mid Game (20-100 hours)
- Multiple runners
- Advanced sectors unlocked
- Skill synergies active
- Augmentation system active
- Syndicate reputation building

### 13.3 Late Game (100-500 hours)
- All decks accessible
- Runner stable management
- High-level augments
- Raid zone completion
- Syndicate leadership

### 13.4 Endgame (500+ hours)
- Paracausal content
- Leaderboards
- Prestige systems
- Perfect optimization
- Collection completion

---

## 14. Offline Progression

### 14.1 Offline Mechanics
- Runners continue missions while offline
- Resource accumulation at reduced rate
- Skill training continues
- Crafting queues process

### 14.2 Offline Limits
- Maximum offline duration: 24 hours (upgradable)
- Storage limits on collected resources
- Queue limits on crafting

### 14.3 Offline Bonuses
- Premium/subscription increases offline gains
- Special equipment enhances offline efficiency

---

## 15. Meta Progression

### 15.1 Account-Level Unlocks
- **Clearances**: Unlock new zone tiers
- **Protocols**: Permanent bonuses
- **Schematics**: Crafting recipes
- **Augment Blueprints**: New augment types

### 15.2 Prestige System: "New Cycle"
- Reset progress for permanent bonuses
- Each cycle unlocks new content
- Cycle-specific challenges and rewards

### 15.3 Account Statistics
- Total resources collected
- Runners lost/retired
- Sectors cleared
- Enemies defeated

---

## 16. Game Modes

### 16.1 Standard Mode
- Normal progression
- No permadeath
- Full save system

### 16.2 Hardcore Mode
- Permadeath enabled
- Increased rewards
- Separate leaderboards

### 16.3 Daily Challenges
- Modified rules
- Unique rewards
- Competitive rankings

### 16.4 Custom Modes
- Adjustable difficulty sliders
- Modifier selection
- Experimental rules

---

## 17. Social Features

### 17.1 Clans (Syndicate Chapters)
- Group up with other players
- Shared resources and bonuses
- Clan challenges and wars

### 17.2 Trading
- Direct player-to-player trading
- Market listings
- Trade restrictions on certain items

### 17.3 Leaderboards
- Speed categories
- Resource collection
- Combat efficiency
- Faction reputation

### 17.4 Seasonal Events
- Special limited-time content
- Exclusive rewards
- Community goals

---

## 18. Monetization (Optional)

### 18.1 Free-to-Play Model
- Full game access
- Reasonable progression pace
- No paywalls on content

### 18.2 Premium Options
- **Cosmetic Packs**: Skins, effects
- **Convenience**: Bank space, queue slots
- **Supporter Pack**: One-time, significant perks

### 18.3 Subscription (Optional)
- Increased offline gains
- Daily bonus rewards
- Exclusive cosmetic

---

## 19. Technical Requirements

### 19.1 Platform
- Browser-based (Web)
- Mobile-responsive design
- Save to cloud/local

### 19.2 Performance
- Lightweight JavaScript/TypeScript
- Efficient save file management
- Offline-capable (PWA)

### 19.3 Save System
- Auto-save every 60 seconds
- Manual save option
- Import/export saves
- Cloud sync (optional)

---

## 20. Development Priorities

### Phase 1: Core Systems
- Basic idle loop
- Single runner
- 3 skills
- 5 sectors

### Phase 2: Expansion
- Multiple runners
- Full skill roster
- All deck levels
- Combat system

### Phase 3: Depth
- Augmentation
- Syndicates
- Crafting
- Drones

### Phase 4: Polish
- Meta progression
- Endgame
- Social features
- Monetization

---

## 21. Success Metrics

| Metric | Target |
|--------|--------|
| Average Session | 15+ minutes |
| Day 7 Retention | 30%+ |
| Average Playtime | 100+ hours |
| Daily Active Actions | 20+ |
| Premium Conversion | 5%+ |

---

## 22. Appendix: Key Inspirations

- **Marathon (Bungie)**: Setting, atmosphere, AI themes
- **Melvor Idle**: Skill depth, mastery system, offline progression
- **Escape from Tarkov**: Extraction mechanics, loot economy
- **Risk of Rain**: Item synergies, scaling
- **Cultist Simulator**: Layered progression, discovery

---

## 23. Multiplayer System

### 23.1 Overview
Optional multiplayer mode where registered players can encounter other runners during their extractions, creating emergent gameplay moments and competitive dynamics.

### 23.2 Account System

#### 23.2.1 Registration
- **OAuth providers**: Google, Discord, GitHub
- **Anonymous mode**: Single-player remains fully functional without account
- **Account benefits**:
  - Cross-device sync
  - Ranked leaderboards
  - Multiplayer encounters
  - Persistent identity

#### 23.2.2 Profile Data
- Runner name and appearance
- Season rank and MMR
- Career statistics
- Achievement badges
- Syndicate affiliations

### 23.3 Matchmaking System

#### 23.3.1 Queue System
```
1. Player selects sector and deploys
2. Server queues player for matchmaking
3. System finds compatible runners (similar MMR, same sector)
4. Encounter chance rolled at each room transition
5. If match found, both runners enter same encounter
```

#### 23.3.2 Matchmaking Parameters
| Parameter | Weight | Description |
|-----------|--------|-------------|
| MMR Range | High | ±100 points of player |
| Sector | Required | Same sector type |
| Room Progress | Medium | Similar room number |
| Wait Time | Low | Expands range over time |

#### 23.3.3 Encounter Frequency
- Base encounter chance: 15% per room
- Modified by sector danger level
- Modified by player activity (more active = more encounters)
- Maximum 1 encounter per run

### 23.4 Encounter Types

#### 23.4.1 Hostile Encounter (PvP)
- Both runners want the same loot
- Fight until one escapes or is downed
- Winner takes loser's collected loot
- Loser extracts with nothing (survives)

#### 23.4.2 Cooperative Encounter
- Both runners can choose to cooperate
- Split loot 50/50
- Bonus loot spawns for cooperators
- Betrayal option (coop → attack mid-run)

#### 23.4.3 Race Encounter
- Both runners race to extraction
- First to extract gets bonus loot
- Both keep their collected items
- No combat, pure speed

### 23.5 Server Architecture

#### 23.5.1 Client-Server Model
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client A  │────▶│   Server    │◀────│   Client B  │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │   Database  │
                    └─────────────┘
```

#### 23.5.2 Server Responsibilities
- **Matchmaking**: Queue management, pairing logic
- **Game State Verification**: Validate all client actions
- **Combat Resolution**: Authoritative combat calculations
- **Loot Distribution**: Server-side loot generation and assignment
- **Anti-Cheat**: Detect impossible actions, modified clients
- **Leaderboards**: Ranked MMR calculations

#### 23.5.3 Data Protection
- All combat rolls performed server-side
- Equipment stats validated against database
- Movement/progress rate-limited to legitimate values
- Checksums on critical game state
- Server-authoritative extraction results

### 23.6 Anti-Cheat Measures

#### 23.6.1 Client-Side Detection
- Speed hack detection (action rate limits)
- Memory manipulation detection
- Modified client detection (hash verification)

#### 23.6.2 Server-Side Validation
- Statistical anomaly detection
- Impossible action rejection
- Cross-client verification in encounters
- Replay analysis for suspicious patterns

#### 23.6.3 Penalties
| Violation | Penalty |
|-----------|---------|
| First offense | 7-day ranked ban |
| Second offense | 30-day ranked ban |
| Third offense | Permanent ranked ban |
| Severe (speedhacks, etc.) | Permanent account ban |

### 23.7 Ranked System

#### 23.7.1 Tiers
| Tier | MMR Range | Rewards |
|------|-----------|---------|
| Bronze | 0-999 | Basic season rewards |
| Silver | 1000-1499 | +10% credit bonus |
| Gold | 1500-1999 | +20% credit bonus, exclusive skin |
| Platinum | 2000-2499 | +30% credit bonus, title |
| Diamond | 2500-2999 | +40% credit bonus, legendary item |
| Onyx | 3000+ | +50% credit bonus, unique cosmetics |

#### 23.7.2 Season Structure
- Season duration: 3 months
- Soft reset at season start (-25% MMR)
- Season-exclusive rewards
- Season leaderboards (global, regional, friends)

#### 23.7.3 MMR Calculation
```
Base MMR change: ±25
Modifiers:
  - Underdog bonus: +10 if opponent MMR higher
  - Streak bonus: +5 per consecutive win (max +25)
  - Early surrender: -15 (reduced loss)
  - Betrayal: +5 bonus, flagged for revenge matching
```

### 23.8 Encounters in Detail

#### 23.8.1 Encounter Flow
```
1. Server determines encounter trigger
2. Both clients receive encounter notification
3. 3-second preparation phase
4. Encounter begins (type determined by sector + context)
5. Real-time synced combat/navigation
6. Encounter resolution
7. Both clients receive results
8. Continue/extract based on outcome
```

#### 23.8.2 Encounter UI Elements
- Opponent health bar and name
- Encounter timer
- Action log (combat events)
- Loot at stake indicator
- Surrender/betrayal buttons

#### 23.8.3 Connection Handling
- Graceful disconnect: Run paused, can reconnect
- Timeout (60s): Auto-surrender, minimal penalty
- Malicious disconnect: Loss recorded, MMR penalty

### 23.9 Technical Requirements

#### 23.9.1 Server Stack
- **API**: Node.js/Fastify or Go
- **Database**: PostgreSQL (accounts, MMR) + Redis (queues, sessions)
- **Real-time**: WebSocket for encounters
- **Matchmaking**: Separate microservice
- **CDN**: Static assets, replay storage

#### 23.9.2 API Endpoints
```
POST   /auth/login          - OAuth callback
GET    /auth/profile        - User profile
POST   /matchmaking/queue   - Join queue
DELETE /matchmaking/queue   - Leave queue
WS     /encounter/:id       - Encounter real-time
GET    /leaderboard/:type   - Leaderboards
POST   /report              - Report player
```

#### 23.9.3 Scalability
- Horizontal scaling for matchmaking servers
- Regional matchmaking instances
- Encounter servers scale on demand
- Database read replicas for leaderboards

### 23.10 Privacy & Safety

#### 23.10.1 Data Collection
- Minimum required for operation
- No unnecessary personal data
- Encrypted at rest and in transit
- GDPR compliant

#### 23.10.2 Player Safety
- Block list (prevent encounters with specific players)
- Report system for toxic behavior
- Chat disabled by default (opt-in for encounters only)
- No real names shown (runner names only)

### 23.11 Implementation Phases

#### Phase 1: Foundation (2-3 months)
- [ ] OAuth integration
- [ ] Account database schema
- [ ] Basic API structure
- [ ] Client-server communication layer

#### Phase 2: Matchmaking (1-2 months)
- [ ] Queue system
- [ ] Matchmaking algorithm
- [ ] MMR system
- [ ] Leaderboards

#### Phase 3: Encounters (2-3 months)
- [ ] Real-time encounter infrastructure
- [ ] Combat synchronization
- [ ] Anti-cheat basics
- [ ] Encounter UI

#### Phase 4: Polish (1-2 months)
- [ ] Advanced anti-cheat
- [ ] Reconnection handling
- [ ] Spectator mode (friends can watch)
- [ ] Season system

### 23.12 Opt-In Philosophy
- **Single-player is complete**: All content accessible offline
- **Multiplayer is bonus**: Extra rewards, social features
- **No FOMO**: Season rewards are cosmetic or minor bonuses
- **No pay-to-win**: Monetization does not affect PvP balance

---

## 24. MVP Implementation Status

The following features have been implemented in the initial MVP:

### Completed
- [x] React + TypeScript + Vite + Zustand + Tailwind setup
- [x] Game state management with persistence
- [x] Runner stats and progression system
- [x] 3 Skills (Scavenging, Combat, Hacking)
- [x] 3 Sectors (Residential, Industrial, Research)
- [x] Procedural sector generation
- [x] Combat auto-resolution
- [x] Resource collection system
- [x] Equipment system (9 slots: weapons, defense, core, implants)
- [x] Faction starter kits
- [x] Item comparison UI
- [x] Extraction timer and risk mechanics
- [x] Offline progress calculation
- [x] Activity log
- [x] Basic UI with navigation
- [x] Tauceti.gg design tokens

### Pending (Future Phases)
- [ ] Multiple runners
- [ ] Full skill roster (10 skills)
- [ ] Augmentation system
- [ ] Syndicate reputation
- [ ] Drone companions
- [ ] Crafting system
- [ ] Gear modification
- [ ] Boss encounters
- [ ] Meta progression/Prestige
- [ ] Social features
- [ ] Multiplayer system (accounts, matchmaking, encounters)

---

*Document Version: 1.2*
*Last Updated: March 2026*

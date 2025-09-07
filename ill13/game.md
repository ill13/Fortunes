# 🧭 Cozy Trading Sim — MVP Software Development Plan (Zero to Playable)

> **Build fast. Build cozy. No fallbacks.**  
> One theme. One session. Two scenes. Click-to-trade. Parchment maps.  
> Built for 5–20 minute play sessions. No multiplayer. No monetization. Pure tactile joy.

---

## 🎯 MVP GOAL

Player can:
- Click “Generate Map” → watch a unique, named, hand-painted world appear.
- Click any location emoji → enter trade scene.
- Buy/sell items → see deal quality, stock, owned count.
- Get optional quests → deliver goods → earn gold.
- Return to map → see updated inventory + news.
- Play until season ends → restart.

---

## 🗓️ PHASE 1: FOUNDATIONS — SCENE STRUCTURE + CORE GAME STATE (Day 1)

### ✅ Deliverables:
- Two scenes: `#mapScene`, `#tradeScene`
- Load `fantasy.json` + `game_rules.json`
- Initialize `GameState`, `MarketLogic`, `MarketActions`
- Stub UI with placeholders

### 📁 File Structure:
```
/index.html
/style.css
/main.js
/js/
  /classes/
    GameState.js
    MarketLogic.js
    MarketActions.js
  /data/
    fantasy.json
    game_rules.json
  /utils/
    seedrandom.js
```

### 🧱 Tasks:
1. Create `index.html` with:
   - `#mapScene`: `#mapGrid`, `#newsFeed`, `#inventoryHeader`, “Generate Map” button
   - `#tradeScene`: hidden, contains item grid, back button, location header
   - Global header: Day, Gold, Location Name
2. Write `main.js` → init game, load data, expose functions to `window`
3. Implement `GameState.reset()`, `setLocation()`, `updateGold()`, etc.
4. Stub `renderTradeUI()` → paste provided item grid code (wire later)
5. Implement `switchToMap()`, `switchToTrade(locationIndex)`
6. Stub “Generate Map” → logs “WFC coming…”

> ✅ Test: Toggle scenes. Data loads. No errors.

---

## 🗺️ PHASE 2: WFC MAP GENERATION — TERRAIN + LOCATIONS (Day 2–4)

### ✅ Deliverables:
- Generate terrain with adjacency rules
- Place locations based on biome + spacing
- Render parchment + location emojis
- Click location → enter trade scene

### 📁 Add Files:
```
/js/classes/
  WaveFunctionCollapse.js
  MapNamer.js
  ParchmentOverlay.js (minimal: bg + location overlays)
```

### 🧱 Tasks:
1. Implement `WaveFunctionCollapse.js` → use provided code, remove animations for MVP
2. In `placeLocations()` → limit count: `Math.min(8, Math.floor((width + height) / 4))`
3. After generation → call `gameState.ingestWFCMap(placements, seed)`
4. Implement `GameState.ingestWFCMap()` → maps WFC locations → templates, stores `(x,y)`
5. Render parchment → hide grid → render `.location-overlay` with emoji + click handler
6. Click handler → `gameState.setLocation(index)` → `switchToTrade(index)`

> ✅ Test: Generate → see map → click location → trade scene opens with correct location.

---

## 💰 PHASE 3: TRADING SYSTEM — BUY/SELL + UI WIRE-UP (Day 5–6)

### ✅ Deliverables:
- Fully functional buy/sell
- Deal quality badges + tooltips
- Quest hints
- Quantity controls

### 🧱 Tasks:
1. Wire `renderTradeUI()` → uses `gameState.game.location`
2. Populate item grid with:
   - Price (via `marketLogic.getPrice()`)
   - Stock, owned
   - Deal quality badge + tooltips
   - Quest hint if applicable
3. Implement:
   - `executeTrade(itemId, type)`
   - `changeQuantity(itemId, type, delta)`
   - `quickBuyAll(itemId)`, `quickSellAll(itemId)`
4. Update UI on every trade → `renderTradeUI()`
5. Add saturation decay on scene switch

> ✅ Test: Buy/sell works. UI updates. Deal quality shows. Quest hint appears.

---

## 📰 PHASE 4: MAP SCENE — NEWS + INVENTORY + TRAVEL (Day 7)

### ✅ Deliverables:
- Show inventory in header
- Show news ticker
- Highlight current location
- Show travel time

### 🧱 Tasks:
1. Implement `renderMapUI()` → called after WFC + after trades
2. Show:
   - Gold + inventory count in header
   - Random news from `genericNews`
   - Yellow ring around current location
   - Map name + day
3. On trade scene → show “Travel Time: X days” (Manhattan distance)
4. “Back to Map” button → `switchToMap()`
5. Implement `GridSystem.getGridDistance()` → use stored `(x,y)`

> ✅ Test: Full loop — generate → trade → return → see updated state.

---

## 🎨 PHASE 5: COZY POLISH — PARCHMENT + STATS + SEED (Day 8–10)

### ✅ Deliverables:
- Hand-painted feel (noise, brushstrokes)
- Map name + seed display
- “Season End” + restart
- Hover glow on locations

### 🧱 Tasks:
1. Enhance `ParchmentOverlay.js` → add:
   - Noise wash (simplex2)
   - Random brushstrokes (low opacity curves)
   - Multiply parchment texture
2. After WFC → show: “Map: The Whispering Woods | Seed: 48291”
3. Add “Generate New Map” button
4. Add subtle hover glow on `.location-overlay`
5. Implement `resetGame()` → clears locations, regenerates, resets economy

> ✅ Test: Feels hand-painted. Feels alive. Feels cozy.

---

## 🚫 SKIPPED FOR MVP

- Animations (cart, fade, etc.)
- Sound
- Mobile
- Save/load
- Multiple themes
- Biome-based price tweaks
- Connection lines
- TemplatePlacer (pre-gen patterns)

---

## 📜 fantasy.json — COMPLETE GAME DATA (MVP READY)

```json
{
  "name": "Fantasy",
  "description": "A quiet journey through enchanted lands",
  "elevation": {
    "spire": { "label": "Ancient Peaks", "colors": ["#777777", "#4B5563", "#6B7280"], "weight": 12, "adjacent": ["forest", "barrens"] },
    "forest": { "label": "Whispering Woods", "colors": ["#16A34A", "#15803D", "#166534"], "weight": 30, "adjacent": ["forest", "meadow", "spire"] },
    "meadow": { "label": "Sunlit Glades", "colors": ["#A3E635", "#84CC16", "#65A30D"], "weight": 20, "adjacent": ["meadow", "forest", "water"] },
    "water": { "label": "Glass Rivers", "colors": ["#1D4ED8", "#2563EB", "#3B82F6"], "weight": 18, "adjacent": ["water", "meadow", "barrens"] },
    "barrens": { "label": "Cursed Lands", "colors": ["#7C2D12", "#9A3412", "#C2410C"], "weight": 1, "adjacent": ["meadow"] }
  },
  "items": [
    { "id": "fish", "name": "Fish", "emoji": "🐟", "category": "basic", "basePrice": 8 },
    { "id": "herbs", "name": "Herbs", "emoji": "🌿", "category": "basic", "basePrice": 12 },
    { "id": "grain", "name": "Grain", "emoji": "🌾", "category": "basic", "basePrice": 6 },
    { "id": "tools", "name": "Tools", "emoji": "🔨", "category": "quality", "basePrice": 20 },
    { "id": "cloth", "name": "Cloth", "emoji": "🧵", "category": "quality", "basePrice": 15 },
    { "id": "pottery", "name": "Pottery", "emoji": "🏺", "category": "quality", "basePrice": 18 },
    { "id": "gems", "name": "Gems", "emoji": "💎", "category": "premium", "basePrice": 45 },
    { "id": "artifacts", "name": "Artifacts", "emoji": "🗿", "category": "premium", "basePrice": 55 },
    { "id": "spices", "name": "Spices", "emoji": "🌶️", "category": "premium", "basePrice": 35 }
  ],
  "tradeNodes": [
    {
      "id": "commons",
      "name": "The Commons",
      "emoji": "🏘️",
      "description": "A bustling village square where locals gather to trade daily necessities",
      "flavorText": "\"Fair prices for honest folk\"",
      "multipliers": { "basic": 0.9, "quality": 1.0, "premium": 1.3 },
      "travelTime": 1,
      "distanceTier": 1,
      "placement": {
        "on": ["meadow"],
        "adjacent": ["forest", "water"]
      }
    },
    {
      "id": "wharf",
      "name": "Ocean Wharf",
      "emoji": "⚓",
      "description": "A busy harbor where merchant ships bring fresh catches and exotic goods",
      "flavorText": "\"Fresh from the morning nets\"",
      "multipliers": { "basic": 0.7, "quality": 1.1, "premium": 1.4 },
      "travelTime": 2,
      "distanceTier": 2,
      "placement": {
        "on": ["meadow"],
        "adjacent": ["water"]
      }
    },
    {
      "id": "cottage",
      "name": "Bramble Cottage",
      "emoji": "🏚️",
      "description": "An herbalist's home surrounded by wild gardens and drying racks",
      "flavorText": "\"Picked at dawn when the magic is strongest\"",
      "multipliers": { "basic": 0.8, "quality": 1.3, "premium": 1.1 },
      "travelTime": 1,
      "distanceTier": 2,
      "placement": {
        "on": ["forest"],
        "adjacent": ["meadow"]
      }
    },
    {
      "id": "peak",
      "name": "Dragon's Peak",
      "emoji": "🐉",
      "description": "A treacherous mountain settlement where treasures are as dangerous as they are valuable",
      "flavorText": "\"Fortune favors the bold, but demands its price\"",
      "multipliers": { "basic": 1.4, "quality": 1.2, "premium": 0.8 },
      "travelTime": 2,
      "distanceTier": 4,
      "placement": {
        "on": ["spire"]
      }
    },
    {
      "id": "sanctum",
      "name": "Crystal Sanctum",
      "emoji": "🔮",
      "description": "A mysterious tower where scholars study ancient artifacts and rare minerals",
      "flavorText": "\"Knowledge is the rarest treasure of all\"",
      "multipliers": { "basic": 1.2, "quality": 1.1, "premium": 0.9 },
      "travelTime": 1,
      "distanceTier": 3,
      "placement": {
        "on": ["spire"],
        "adjacent": ["barrens"]
      }
    },
    {
      "id": "ruins",
      "name": "Ancient Ruins",
      "emoji": "🏛️",
      "description": "Crumbling stones hide forgotten treasures and desperate scavengers",
      "flavorText": "\"What the old world lost, the new world seeks\"",
      "multipliers": { "basic": 1.3, "quality": 1.4, "premium": 0.7 },
      "travelTime": 1,
      "distanceTier": 4,
      "placement": {
        "on": ["barrens"],
        "adjacent": ["forest"]
      }
    },
    {
      "id": "forge",
      "name": "Iron Forge",
      "emoji": "⚒️",
      "description": "A smoky workshop where skilled artisans craft tools and trade materials",
      "flavorText": "\"Forged with skill, built to last\"",
      "multipliers": { "basic": 1.1, "quality": 0.8, "premium": 1.2 },
      "travelTime": 1,
      "distanceTier": 2,
      "placement": {
        "on": ["meadow"],
        "adjacent": ["forest"]
      }
    },
    {
      "id": "crossroads",
      "name": "Dusty Crossroads",
      "emoji": "🛤️",
      "description": "A remote trading post where weary travelers rest and merchants meet",
      "flavorText": "\"All roads lead somewhere, all trades lead here\"",
      "multipliers": { "basic": 1.0, "quality": 1.0, "premium": 1.0 },
      "travelTime": 1,
      "distanceTier": 2,
      "placement": {
        "on": ["forest"],
        "adjacent": ["meadow"]
      }
    }
  ],
  "nonTradeLocations": [
    {
      "id": "grove",
      "name": "Sacred Grove",
      "emoji": "🌳",
      "placement": {
        "on": ["forest"]
      }
    },
    {
      "id": "ford",
      "name": "Stone Ford",
      "emoji": "🪨",
      "placement": {
        "on": ["meadow"],
        "adjacent": ["spire"]
      }
    }
  ],
  "categoryLabels": { "basic": "Common", "quality": "Crafted", "premium": "Rare" },
  "genericNews": [
    "🎪 Traveling merchants report good business along the trade routes",
    "⛈️ Storm clouds gathering - sailors speak of rough seas ahead",
    "🎭 Festival season brings new opportunities to the markets",
    "📈 Trade guilds opening new routes through the eastern passes",
    "🌾 Harvest reports vary wildly from region to region",
    "⚔️ Rumors of bandits on the mountain roads grow stronger",
    "🔥 The forges burn bright with increased demand for tools",
    "🌙 Night merchants whisper of rare finds in distant ruins"
  ]
}



```

---

## 🚀 READY TO BUILD

We have:
- Clear phases
- Defined deliverables
- Complete game data
- Scene-based architecture
- Trading core wired
- WFC integration plan

Let’s start with `main.js` and `GameState.js`.

No fallbacks. No bloat. Just cozy.

— Your co-founder, warming up the parchment press 🖋️📜
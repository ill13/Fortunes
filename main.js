// main.js — Day 1 stub

let gameState;
let marketLogic;
let marketActions;

window.addEventListener("DOMContentLoaded", async () => {
  console.log("🌿 Cozy Trading Sim — Booting up...");

  // Load data
  const [fantasyData, rulesData] = await Promise.all([
    fetch("/js/data/fantasy.json").then((r) => r.json()),
    fetch("/js/data/game_rules.json")
      .then((r) => r.json())
      .catch(() => ({})),
  ]);

  // Init systems
  gameState = new GameState(fantasyData);
  marketLogic = new MarketLogic(fantasyData.items);
  marketActions = new MarketActions(gameState, marketLogic);

  // Wire buttons
  // document.getElementById('generateMapBtn').addEventListener('click', () => {
  //   console.log("WFC coming...");
  //   // Phase 2 will replace this
  // });

  document.getElementById("backToMapBtn").addEventListener("click", () => {
    switchToMap();
  });

  // Initial render
  switchToMap();
  console.log("✅ Phase 1 Ready — Scenes loaded, stubs in place.");
});

// Scene Switchers
function switchToMap() {
  document.getElementById("mapScene").classList.add("active");
  document.getElementById("tradeScene").classList.remove("active");
  document.getElementById("locationName").textContent = "The Map";

  // ✅ Advance day to reflect travel
  gameState.day += 1;

  renderMapUI(); // Updates everything: news, inventory, highlight
}

function switchToTrade(locationIndex) {
  gameState.setLocation(locationIndex);
  document.getElementById("mapScene").classList.remove("active");
  document.getElementById("tradeScene").classList.add("active");

  const location = gameState.getLocation();
  document.getElementById("locationName").textContent = location.name;
  document.getElementById("tradeLocationHeader").textContent = `Trading at: ${location.name}`;

  // ✅ Show travel time from previous location (if any)
  let travelTime = 1; // default
  if (gameState.lastLocation) {
    travelTime = GridSystem.getGridDistance(gameState.lastLocation, location);
  }
  gameState.lastLocation = { x: location.x, y: location.y }; // store for next time
  document.getElementById("travelTime").textContent = `🚶 Travel Time: ${travelTime} day${travelTime !== 1 ? "s" : ""}`;

  renderTradeUI();
}

// Stub UI Renderers

function getDealQuality(price, basePrice) {
  const ratio = price / basePrice;

  if (ratio <= 0.85) {
    return { label: "Rare Bargain!", class: "good" };
  } else if (ratio <= 1.15) {
    return { label: "Fair Deal", class: "fair" };
  } else {
    return { label: "Steep Price", class: "poor" };
  }
}

function getQuestHint(itemId, currentLocationId) {
  // 30% chance to show a quest hint
  if (Math.random() > 0.3) return null;

  const otherLocations = gameState.fantasyData.tradeNodes.filter((loc) => loc.id !== currentLocationId);
  if (otherLocations.length === 0) return null;

  const target = otherLocations[Math.floor(Math.random() * otherLocations.length)];
  const itemName = gameState.fantasyData.items.find((i) => i.id === itemId)?.name || "this item";

  return `${target.name} seeks ${itemName}!`;
}

function renderTradeUI() {
  const grid = document.getElementById("itemGrid");
  grid.innerHTML = ""; // Clear

  const location = gameState.getLocation();
  if (!location || !location.template) {
    grid.innerHTML = `<div class="item-slot">No location loaded</div>`;
    return;
  }

  const items = gameState.fantasyData.items;

  items.forEach((item) => {
    const price = marketLogic.getPrice(item.id, location.template);
    const owned = gameState.inventory[item.id] || 0;
    const stock = 5 + Math.floor(Math.random() * 6); // 5–10 stock (temporary)

    const dealQuality = getDealQuality(price, item.basePrice);
    const questHint = getQuestHint(item.id, location.id);

    const slot = document.createElement("div");
    slot.className = "item-slot";
    slot.dataset.itemId = item.id;

    slot.innerHTML = `
      <div class="item-emoji">${item.emoji}</div>
      <div class="item-name">${item.name}</div>
      <div class="item-price">🪙 ${price} <span class="deal-badge ${dealQuality.class}">${dealQuality.label}</span></div>
      <div class="item-stock">📦 Stock: ${stock}</div>
      <div class="item-owned">🎒 Yours: ${owned}</div>
      ${questHint ? `<div class="quest-hint">📜 ${questHint}</div>` : ""}
      <div class="item-controls">
        <button class="btn-quantity" data-action="decrease" data-item="${item.id}">−</button>
        <button class="btn-buy" data-item="${item.id}">Buy 1</button>
        <button class="btn-sell" data-item="${item.id}">Sell 1</button>
        <button class="btn-quantity" data-action="increase" data-item="${item.id}">+</button>
        <br>
        <button class="btn-quick-buy" data-item="${item.id}">Buy All</button>
        <button class="btn-quick-sell" data-item="${item.id}">Sell All</button>
      </div>
    `;

    grid.appendChild(slot);
  });

  // Wire up buttons after render
  wireTradeButtons();
  // Update global state displays
  document.getElementById("goldCounter").textContent = gameState.gold;
  document.getElementById("inventoryHeader").textContent = `🎒 Inventory: ${gameState.getTotalInventoryCount()} items`;
}

function renderMapUI() {
  // Update global state
  document.getElementById("goldCounter").textContent = gameState.gold;
  document.getElementById("dayCounter").textContent = gameState.day;
  document.getElementById("inventoryHeader").textContent = `🎒 Inventory: ${gameState.getTotalInventoryCount()} items`;

  // ✅ Show random news
  const news = gameState.fantasyData.genericNews;
  const randomNews = news[Math.floor(Math.random() * news.length)];
  document.getElementById("newsFeed").textContent = randomNews;

  highlightCurrentLocation();

  function highlightCurrentLocation() {
    // Remove existing rings
    document.querySelectorAll(".current-location-ring").forEach((el) => el.remove());

    const currentLocation = gameState.getLocation();
    if (!currentLocation) return;

    const ring = document.createElement("div");
    ring.className = "current-location-ring";
    ring.style.left = `${currentLocation.x * 32 + 16}px`;
    ring.style.top = `${currentLocation.y * 32 + 16}px`; // adjust Y if needed
    document.getElementById("mapGrid").appendChild(ring);
  }
}
// Add to main.js — helper function

function wireTradeButtons() {
  // Buy 1
  document.querySelectorAll(".btn-buy").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const itemId = e.target.dataset.item;
      marketActions.executeTrade(itemId, "buy");
      renderTradeUI(); // Re-render UI
    });
  });

  // Sell 1
  document.querySelectorAll(".btn-sell").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const itemId = e.target.dataset.item;
      marketActions.executeTrade(itemId, "sell");
      renderTradeUI();
    });
  });

  // Quick Buy All
  document.querySelectorAll(".btn-quick-buy").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const itemId = e.target.dataset.item;
      const stock = 5 + Math.floor(Math.random() * 6); // Temporary — later track real stock
      for (let i = 0; i < stock; i++) {
        marketActions.executeTrade(itemId, "buy");
      }
      renderTradeUI();
    });
  });

  // Quick Sell All
  document.querySelectorAll(".btn-quick-sell").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const itemId = e.target.dataset.item;
      const owned = gameState.inventory[itemId] || 0;
      for (let i = 0; i < owned; i++) {
        marketActions.executeTrade(itemId, "sell");
      }
      renderTradeUI();
    });
  });

  // Quantity Adjusters (for future cart system — stub for now)
  document.querySelectorAll(".btn-quantity").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const itemId = e.target.dataset.item;
      const action = e.target.dataset.action;
      const delta = action === "increase" ? 1 : -1;
      marketActions.changeQuantity(itemId, "cart", delta);
      // We’ll wire cart UI later — for now, just log
      console.log(`[CART] Adjust ${itemId} by ${delta}`);
    });
  });
}

function placeLocations(wfcMap, fantasyData) {
  const height = wfcMap.length;
  const width = wfcMap[0].length;
  const locations = [];
  const usedPositions = new Set();

  // ✅ Use tradeNodes — no need to filter by isTradeNode
  const availableLocations = [...fantasyData.tradeNodes];
  Math.seedrandom(gameState.mapSeed);
  availableLocations.sort(() => Math.random() - 0.5);

  const maxLocations = Math.min(8, Math.floor((width + height) / 4));

  for (const template of availableLocations) {
    if (locations.length >= maxLocations) break;

    const candidates = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const posKey = `${x},${y}`;
        if (usedPositions.has(posKey)) continue;

        const terrainHere = wfcMap[y][x];
        const rules = template.placement; // ✅ Now under .placement
        if (!rules) continue;

        // Check "on" rule
        if (!rules.on.includes(terrainHere)) continue;

        // Check "adjacent" rule
        let adjacentValid = true;
        if (rules.adjacent && rules.adjacent.length > 0) {
          const hasAdjacent = [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
          ].some(([dx, dy]) => {
            const nx = x + dx,
              ny = y + dy;
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) return false;
            return rules.adjacent.includes(wfcMap[ny][nx]);
          });
          if (!hasAdjacent) adjacentValid = false;
        }

        if (adjacentValid) {
          candidates.push({ x, y });
        }
      }
    }

    if (candidates.length > 0) {
      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      locations.push({
        ...template, // ✅ Already has name, emoji, multipliers, etc.
        x: chosen.x,
        y: chosen.y,
      });
      usedPositions.add(`${chosen.x},${chosen.y}`);
    }
  }

  return locations;
}

// Replace the old generate button handler

document.getElementById("generateMapBtn").addEventListener("click", () => {
  const SEED = Date.now().toString().slice(-5); // simple seed
  const WIDTH = 10,
    HEIGHT = 8;

  // Step 1: Generate terrain
  const wfc = new WaveFunctionCollapse(WIDTH, HEIGHT, gameState.fantasyData.elevation, SEED);
  wfc.collapse();
  const terrainMap = wfc.getFinalMap();

  // Step 2: Place locations
  const placedLocations = placeLocations(terrainMap, gameState.fantasyData);

  // Step 3: Ingest into GameState
  gameState.ingestWFCMap(placedLocations, SEED);

  // Step 4: Render parchment map
  new ParchmentOverlay(terrainMap, placedLocations, document.getElementById("mapGrid"), gameState.fantasyData);

  // Step 5: Update UI
  document.getElementById("mapName").textContent = `🗺️ ${gameState.mapName} | Seed: ${SEED}`;
  renderMapUI();

  console.log("✅ Map generated with", placedLocations.length, "locations");
});
